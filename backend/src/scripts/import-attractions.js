const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const datasetPath = path.join(__dirname, '..', '..', 'data', 'atractivos_tur.json');
const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
const version = crypto.createHash('sha256').update(JSON.stringify(dataset.features)).digest('hex');

function titleCase(value) {
  const lowercaseWords = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'a', 'en', 'al']);
  return String(value || '').toLocaleLowerCase('es-EC').split(/\s+/).map((word, index) => {
    if (index > 0 && lowercaseWords.has(word)) return word;
    return word.charAt(0).toLocaleUpperCase('es-EC') + word.slice(1);
  }).join(' ');
}

function cleanDescription(properties) {
  return ['desc_', 'desc2', 'desc3'].map((key) => String(properties[key] || '').trim()).filter(Boolean).join(' ').replace(/\s+/g, ' ');
}

async function addColumn(connection, column, definition) {
  const [rows] = await connection.query(
    `SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'trips' AND column_name = ?`,
    [column]
  );
  if (rows.length === 0) await connection.query(`ALTER TABLE trips ADD COLUMN ${column} ${definition}`);
}

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_MASTER_HOST || 'db_master',
    user: process.env.DB_USER || 'turix_user',
    password: process.env.DB_PASSWORD || 'turix_secret',
    database: process.env.DB_NAME || 'turix_db',
    multipleStatements: true
  });

  await addColumn(connection, 'latitude', 'DECIMAL(10,7) NULL AFTER destination');
  await addColumn(connection, 'longitude', 'DECIMAL(10,7) NULL AFTER latitude');
  await addColumn(connection, 'source_id', 'VARCHAR(40) NULL AFTER code');
  await addColumn(connection, 'province', 'VARCHAR(100) NULL AFTER destination');
  await addColumn(connection, 'canton', 'VARCHAR(150) NULL AFTER province');
  await addColumn(connection, 'parish', 'VARCHAR(150) NULL AFTER canton');
  await addColumn(connection, 'attraction_type', 'VARCHAR(150) NULL AFTER parish');
  await addColumn(connection, 'attraction_subtype', 'VARCHAR(255) NULL AFTER attraction_type');
  await addColumn(connection, 'hierarchy', 'VARCHAR(10) NULL AFTER attraction_subtype');
  await addColumn(connection, 'source_image', 'VARCHAR(500) NULL AFTER image_url');
  await addColumn(connection, 'source_pdf', 'VARCHAR(500) NULL AFTER source_image');
  await addColumn(connection, 'is_bookable', 'BOOLEAN NOT NULL DEFAULT FALSE AFTER is_active');
  await connection.query('CREATE TABLE IF NOT EXISTS dataset_imports (dataset_key VARCHAR(80) PRIMARY KEY, dataset_version CHAR(64) NOT NULL, imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)');

  const [imports] = await connection.query('SELECT dataset_version FROM dataset_imports WHERE dataset_key = ?', ['atractivos_tur']);
  if (imports[0]?.dataset_version === version) {
    console.log('Dataset de atractivos ya esta actualizado.');
    await connection.end();
    return;
  }

  await connection.beginTransaction();
  try {
    await connection.query('DELETE FROM order_items');
    await connection.query('DELETE FROM orders');
    await connection.query('DELETE FROM trips');
    await connection.query('DELETE FROM categories');
    await connection.query(`INSERT INTO categories (name, description, icon) VALUES
      ('ATRACTIVOS NATURALES', 'Paisajes, ecosistemas y espacios naturales del Ecuador', '✦'),
      ('MANIFESTACIONES CULTURALES', 'Patrimonio, gastronomía, arquitectura y tradiciones vivas', '◈')`);
    const [categories] = await connection.query('SELECT id, name FROM categories');
    const categoryIds = new Map(categories.map((category) => [category.name, category.id]));
    const rows = dataset.features.map(({ properties }) => [
      `ATR-${properties.ogc_fid}`,
      String(properties.ogc_fid),
      titleCase(properties.nombre),
      cleanDescription(properties),
      `${titleCase(properties.canton)}, ${titleCase(properties.provincia)}`,
      Number(properties.lat),
      Number(properties.lon),
      titleCase(properties.provincia),
      titleCase(properties.canton),
      titleCase(properties.parroquia),
      categoryIds.get(properties.categoria),
      titleCase(properties.tipo),
      titleCase(properties.subtipo),
      properties.jerarquia,
      0,
      0,
      1,
      null,
      properties.img || null,
      properties.pdf || null,
      true,
      false
    ]);
    const columns = 'code, source_id, name, description, destination, latitude, longitude, province, canton, parish, category_id, attraction_type, attraction_subtype, hierarchy, available_slots, price, duration_days, image_url, source_image, source_pdf, is_active, is_bookable';
    for (let index = 0; index < rows.length; index += 100) {
      const batch = rows.slice(index, index + 100);
      const placeholders = `(${new Array(rows[0].length).fill('?').join(', ')})`;
      await connection.query(`INSERT INTO trips (${columns}) VALUES ${batch.map(() => placeholders).join(', ')}`, batch.flat());
    }
    await connection.query('INSERT INTO dataset_imports (dataset_key, dataset_version) VALUES (?, ?) ON DUPLICATE KEY UPDATE dataset_version = VALUES(dataset_version)', ['atractivos_tur', version]);
    await connection.commit();
    console.log(`Importados ${rows.length} atractivos turisticos.`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
