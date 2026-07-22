const { getWritePool, getReadConnection } = require('../config/db');
const { validateTrip } = require('../utils/validators');

const coordinate = (value) => (value === '' || value === undefined || value === null ? null : parseFloat(value));

async function listTrips(req, res, next) {
  try {
    const { category, search, province, type, hierarchy, bookable, page = 1, limit = 12, active } = req.query;
    const readPool = await getReadConnection();
    let query = `SELECT t.*, c.name AS category_name, c.icon AS category_icon FROM trips t JOIN categories c ON t.category_id = c.id WHERE 1=1`;
    const params = [];
    if (active === 'false') query += ' AND t.is_active = FALSE';
    else if (active !== 'all') query += ' AND t.is_active = TRUE';
    if (category) { query += ' AND t.category_id = ?'; params.push(parseInt(category)); }
    if (province) { query += ' AND t.province = ?'; params.push(province); }
    if (type) { query += ' AND t.attraction_type = ?'; params.push(type); }
    if (hierarchy) { query += ' AND t.hierarchy = ?'; params.push(hierarchy); }
    if (bookable === 'true') query += ' AND t.is_bookable = TRUE';
    if (bookable === 'false') query += ' AND t.is_bookable = FALSE';
    if (search) { query += ' AND (t.code LIKE ? OR t.name LIKE ? OR t.destination LIKE ? OR t.description LIKE ?)'; const term = `%${search}%`; params.push(term, term, term, term); }
    const countQuery = query.replace(/SELECT .+ FROM/, 'SELECT COUNT(*) as total FROM');
    const [countRows] = await readPool.query(countQuery, params);
    const safeLimit = Math.min(Math.max(parseInt(limit) || 12, 1), 48);
    const totalPages = Math.max(1, Math.ceil(countRows[0].total / safeLimit));
    const safePage = Math.min(Math.max(parseInt(page) || 1, 1), totalPages);
    const offset = (safePage - 1) * safeLimit;
    query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    params.push(safeLimit, offset);
    const [rows] = await readPool.query(query, params);
    res.json({ trips: rows, pagination: { page: safePage, limit: safeLimit, total: countRows[0].total, pages: totalPages } });
  } catch (err) { next(err); }
}

async function listCategories(req, res, next) {
  try { const readPool = await getReadConnection(); const [rows] = await readPool.query('SELECT * FROM categories ORDER BY name'); res.json({ categories: rows }); } catch (err) { next(err); }
}

async function listFilters(req, res, next) {
  try {
    const readPool = await getReadConnection();
    const [provinces, types, hierarchies, reservation] = await Promise.all([
      readPool.query(`SELECT province AS value, COUNT(*) AS total FROM trips WHERE is_active = TRUE AND province IS NOT NULL GROUP BY province ORDER BY province`),
      readPool.query(`SELECT attraction_type AS value, COUNT(*) AS total FROM trips WHERE is_active = TRUE AND attraction_type IS NOT NULL GROUP BY attraction_type ORDER BY total DESC, attraction_type`),
      readPool.query(`SELECT hierarchy AS value, COUNT(*) AS total FROM trips WHERE is_active = TRUE AND hierarchy IS NOT NULL GROUP BY hierarchy ORDER BY hierarchy`),
      readPool.query(`SELECT SUM(is_bookable = TRUE) AS bookable, SUM(is_bookable = FALSE) AS exploratory FROM trips WHERE is_active = TRUE`)
    ]);
    res.json({ provinces: provinces[0], types: types[0], hierarchies: hierarchies[0], reservation: reservation[0][0] });
  } catch (err) { next(err); }
}

async function getTripById(req, res, next) {
  try {
    const readPool = await getReadConnection();
    const [rows] = await readPool.query(`SELECT t.*, c.name AS category_name, c.icon AS category_icon FROM trips t JOIN categories c ON t.category_id = c.id WHERE t.id = ?`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Viaje no encontrado' });
    res.json({ trip: rows[0] });
  } catch (err) { next(err); }
}

async function createTrip(req, res, next) {
  try {
    const errors = validateTrip(req.body);
    if (errors.length > 0) return res.status(400).json({ errors });
    const pool = getWritePool();
    const { code, name, description, destination, latitude, longitude, available_slots, category_id, price, duration_days, image_url, is_bookable } = req.body;
    const [existing] = await pool.query('SELECT id FROM trips WHERE code = ?', [code.trim().toUpperCase()]);
    if (existing.length > 0) return res.status(409).json({ error: `El codigo de viaje "${code}" ya existe` });
    const [result] = await pool.query(
      `INSERT INTO trips (code, name, description, destination, latitude, longitude, available_slots, category_id, price, duration_days, image_url, is_bookable) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [code.trim().toUpperCase(), name.trim(), description.trim(), destination.trim(), coordinate(latitude), coordinate(longitude), parseInt(available_slots), parseInt(category_id), parseFloat(price || 0), parseInt(duration_days || 1), image_url || null, is_bookable === true || is_bookable === 'true']
    );
    res.status(201).json({ message: 'Viaje creado exitosamente', trip: { id: result.insertId, code: code.trim().toUpperCase() } });
  } catch (err) { next(err); }
}

async function updateTrip(req, res, next) {
  try {
    const errors = validateTrip(req.body);
    if (errors.length > 0) return res.status(400).json({ errors });
    const pool = getWritePool();
    const { code, name, description, destination, latitude, longitude, available_slots, category_id, price, duration_days, image_url, is_active, is_bookable } = req.body;
    const [existing] = await pool.query('SELECT id FROM trips WHERE code = ? AND id != ?', [code.trim().toUpperCase(), req.params.id]);
    if (existing.length > 0) return res.status(409).json({ error: `El codigo de viaje "${code}" ya esta en uso` });
    const [result] = await pool.query(
      `UPDATE trips SET code=?, name=?, description=?, destination=?, latitude=?, longitude=?, available_slots=?, category_id=?, price=?, duration_days=?, image_url=?, is_active=?, is_bookable=? WHERE id=?`,
      [code.trim().toUpperCase(), name.trim(), description.trim(), destination.trim(), coordinate(latitude), coordinate(longitude), parseInt(available_slots), parseInt(category_id), parseFloat(price || 0), parseInt(duration_days || 1), image_url || null, is_active !== undefined ? is_active : true, is_bookable === true || is_bookable === 'true', req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Viaje no encontrado' });
    res.json({ message: 'Viaje actualizado exitosamente' });
  } catch (err) { next(err); }
}

async function deleteTrip(req, res, next) {
  try {
    const pool = getWritePool();
    const [result] = await pool.query('UPDATE trips SET is_active = FALSE WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Viaje no encontrado' });
    res.json({ message: 'Viaje eliminado exitosamente' });
  } catch (err) { next(err); }
}

module.exports = { listTrips, listCategories, listFilters, getTripById, createTrip, updateTrip, deleteTrip };
