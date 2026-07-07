const { getWritePool, getReadConnection } = require('../config/db');
const { validateTrip } = require('../utils/validators');

/**
 * GET /api/trips
 * Listar viajes con filtros opcionales (lee de slave).
 */
async function listTrips(req, res, next) {
  try {
    const { category, search, page = 1, limit = 12, active } = req.query;
    const readPool = await getReadConnection();

    let query = `
      SELECT t.*, c.name AS category_name, c.icon AS category_icon
      FROM trips t
      JOIN categories c ON t.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    // Filtro por estado activo (por defecto solo activos para usuarios)
    if (active !== 'all') {
      query += ' AND t.is_active = TRUE';
    }

    // Filtro por categoría
    if (category) {
      query += ' AND t.category_id = ?';
      params.push(parseInt(category));
    }

    // Búsqueda por nombre o destino
    if (search) {
      query += ' AND (t.name LIKE ? OR t.destination LIKE ? OR t.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Contar total
    const countQuery = query.replace(/SELECT .+ FROM/, 'SELECT COUNT(*) as total FROM');
    const [countRows] = await readPool.query(countQuery, params);
    const total = countRows[0].total;

    // Paginación
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [rows] = await readPool.query(query, params);

    res.json({
      trips: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/trips/categories
 * Listar todas las categorías.
 */
async function listCategories(req, res, next) {
  try {
    const readPool = await getReadConnection();
    const [rows] = await readPool.query('SELECT * FROM categories ORDER BY name');
    res.json({ categories: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/trips/:id
 * Detalle de un viaje (lee de slave).
 */
async function getTripById(req, res, next) {
  try {
    const readPool = await getReadConnection();
    const [rows] = await readPool.query(
      `SELECT t.*, c.name AS category_name, c.icon AS category_icon
       FROM trips t
       JOIN categories c ON t.category_id = c.id
       WHERE t.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Viaje no encontrado' });
    }

    res.json({ trip: rows[0] });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/trips
 * Crear viaje (admin, escribe en master).
 */
async function createTrip(req, res, next) {
  try {
    const errors = validateTrip(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const pool = getWritePool();
    const { code, name, description, destination, available_slots, category_id, price, duration_days, image_url } = req.body;

    // Validar código único en master (no en slave por posible lag)
    const [existing] = await pool.query('SELECT id FROM trips WHERE code = ?', [code.trim().toUpperCase()]);
    if (existing.length > 0) {
      return res.status(409).json({ error: `El código de viaje "${code}" ya existe` });
    }

    const [result] = await pool.query(
      `INSERT INTO trips (code, name, description, destination, available_slots, category_id, price, duration_days, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [code.trim().toUpperCase(), name.trim(), description.trim(), destination.trim(),
       parseInt(available_slots), parseInt(category_id), parseFloat(price),
       parseInt(duration_days || 1), image_url || null]
    );

    res.status(201).json({
      message: 'Viaje creado exitosamente',
      trip: { id: result.insertId, code: code.trim().toUpperCase() }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/trips/:id
 * Actualizar viaje (admin, escribe en master).
 */
async function updateTrip(req, res, next) {
  try {
    const errors = validateTrip(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const pool = getWritePool();
    const { code, name, description, destination, available_slots, category_id, price, duration_days, image_url, is_active } = req.body;

    // Verificar código único (excluir el registro actual)
    const [existing] = await pool.query(
      'SELECT id FROM trips WHERE code = ? AND id != ?',
      [code.trim().toUpperCase(), req.params.id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: `El código de viaje "${code}" ya está en uso` });
    }

    const [result] = await pool.query(
      `UPDATE trips SET code=?, name=?, description=?, destination=?, available_slots=?,
       category_id=?, price=?, duration_days=?, image_url=?, is_active=?
       WHERE id=?`,
      [code.trim().toUpperCase(), name.trim(), description.trim(), destination.trim(),
       parseInt(available_slots), parseInt(category_id), parseFloat(price),
       parseInt(duration_days || 1), image_url || null,
       is_active !== undefined ? is_active : true,
       req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Viaje no encontrado' });
    }

    res.json({ message: 'Viaje actualizado exitosamente' });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/trips/:id
 * Soft delete de viaje (admin, escribe en master).
 */
async function deleteTrip(req, res, next) {
  try {
    const pool = getWritePool();
    const [result] = await pool.query(
      'UPDATE trips SET is_active = FALSE WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Viaje no encontrado' });
    }

    res.json({ message: 'Viaje eliminado exitosamente' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listTrips, listCategories, getTripById, createTrip, updateTrip, deleteTrip };
