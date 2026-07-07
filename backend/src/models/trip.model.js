const { getWritePool, getReadConnection } = require('../config/db');

async function findAll({ category, search, page = 1, limit = 12, activeOnly = true }) {
  const readPool = await getReadConnection();
  
  let query = `
    SELECT t.*, c.name AS category_name, c.icon AS category_icon
    FROM trips t
    JOIN categories c ON t.category_id = c.id
    WHERE 1=1
  `;
  const params = [];
  
  if (activeOnly) {
    query += ' AND t.is_active = TRUE';
  }
  
  if (category) {
    query += ' AND t.category_id = ?';
    params.push(parseInt(category));
  }
  
  if (search) {
    query += ' AND (t.name LIKE ? OR t.destination LIKE ? OR t.description LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }
  
  const countQuery = query.replace(/SELECT .+ FROM/, 'SELECT COUNT(*) as total FROM');
  const [countRows] = await readPool.query(countQuery, params);
  const total = countRows[0].total;
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);
  
  const [rows] = await readPool.query(query, params);
  
  return {
    trips: rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  };
}

async function findById(id) {
  const readPool = await getReadConnection();
  const [rows] = await readPool.query(
    `SELECT t.*, c.name AS category_name, c.icon AS category_icon
     FROM trips t
     JOIN categories c ON t.category_id = c.id
     WHERE t.id = ?`,
    [id]
  );
  return rows[0];
}

async function findByCode(code) {
  const pool = getWritePool();
  const [rows] = await pool.query('SELECT * FROM trips WHERE code = ?', [code]);
  return rows[0];
}

async function create(tripData) {
  const pool = getWritePool();
  const [result] = await pool.query(
    `INSERT INTO trips (code, name, description, destination, available_slots, category_id, price, duration_days, image_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [tripData.code, tripData.name, tripData.description, tripData.destination,
     tripData.available_slots, tripData.category_id, tripData.price, tripData.duration_days, tripData.image_url]
  );
  return { id: result.insertId, ...tripData };
}

async function update(id, tripData) {
  const pool = getWritePool();
  const [result] = await pool.query(
    `UPDATE trips SET code=?, name=?, description=?, destination=?, available_slots=?,
     category_id=?, price=?, duration_days=?, image_url=?, is_active=?
     WHERE id=?`,
    [tripData.code, tripData.name, tripData.description, tripData.destination,
     tripData.available_slots, tripData.category_id, tripData.price, tripData.duration_days,
     tripData.image_url, tripData.is_active, id]
  );
  return result.affectedRows > 0;
}

async function softDelete(id) {
  const pool = getWritePool();
  const [result] = await pool.query('UPDATE trips SET is_active = FALSE WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

async function findCategories() {
  const readPool = await getReadConnection();
  const [rows] = await readPool.query('SELECT * FROM categories ORDER BY name');
  return rows;
}

async function reserveSlots(connection, tripId, quantity) {
  const [result] = await connection.query(
    'UPDATE trips SET available_slots = available_slots - ? WHERE id = ? AND available_slots >= ?',
    [quantity, tripId, quantity]
  );
  return result.affectedRows > 0;
}

async function getTripWithLock(connection, tripId) {
  const [rows] = await connection.query(
    'SELECT id, name, code, price, available_slots FROM trips WHERE id = ? AND is_active = TRUE FOR UPDATE',
    [tripId]
  );
  return rows[0];
}

module.exports = {
  findAll,
  findById,
  findByCode,
  create,
  update,
  softDelete,
  findCategories,
  reserveSlots,
  getTripWithLock
};