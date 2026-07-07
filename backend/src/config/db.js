const mysql = require('mysql2/promise');

// =============================================
// DUAL POOL: Master (writes) + Slave (reads)
// Con fallback automático de slave → master
// =============================================

const masterPool = mysql.createPool({
  host: process.env.DB_MASTER_HOST || 'db_master',
  port: parseInt(process.env.DB_MASTER_PORT || '3306'),
  database: process.env.DB_NAME || 'turix_db',
  user: process.env.DB_USER || 'turix_user',
  password: process.env.DB_PASSWORD || 'turix_secret',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const slavePool = mysql.createPool({
  host: process.env.DB_SLAVE_HOST || 'db_slave',
  port: parseInt(process.env.DB_SLAVE_PORT || '3306'),
  database: process.env.DB_NAME || 'turix_db',
  user: process.env.DB_USER || 'turix_user',
  password: process.env.DB_PASSWORD || 'turix_secret',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

/**
 * Obtiene una conexión de lectura (slave con fallback a master).
 */
async function getReadConnection() {
  try {
    const conn = await slavePool.getConnection();
    conn.release();
    return slavePool;
  } catch (err) {
    console.warn(`⚠️  Slave no disponible, usando Master para lectura: ${err.message}`);
    return masterPool;
  }
}

/**
 * Pool de escritura (siempre master).
 */
function getWritePool() {
  return masterPool;
}

module.exports = { masterPool, slavePool, getReadConnection, getWritePool };
