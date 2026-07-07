const { getWritePool, getReadConnection } = require('../config/db');

async function findByEmail(email) {
  const readPool = await getReadConnection();
  const [rows] = await readPool.query(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );
  return rows[0];
}

async function findById(id) {
  const readPool = await getReadConnection();
  const [rows] = await readPool.query(
    'SELECT id, email, full_name, role, created_at FROM users WHERE id = ?',
    [id]
  );
  return rows[0];
}

async function create(userData) {
  const pool = getWritePool();
  const [result] = await pool.query(
    'INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
    [userData.email, userData.password_hash, userData.full_name, userData.role || 'user']
  );
  return { id: result.insertId, ...userData };
}

module.exports = { findByEmail, findById, create };