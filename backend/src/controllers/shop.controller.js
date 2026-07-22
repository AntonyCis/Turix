const { getWritePool, getReadConnection } = require('../config/db');
const { validateCheckout } = require('../utils/validators');

async function checkout(req, res, next) {
  const connection = await getWritePool().getConnection();
  let inTransaction = false;
  try {
    const errors = validateCheckout(req.body.items);
    if (errors.length > 0) return res.status(400).json({ errors });
    await connection.beginTransaction();
    inTransaction = true;
    let totalAmount = 0;
    const orderItems = [];

    for (const item of req.body.items) {
      const [trips] = await connection.query(
        'SELECT id, name, code, price, available_slots, is_bookable FROM trips WHERE id = ? AND is_active = TRUE FOR UPDATE',
        [item.trip_id]
      );
      if (trips.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: `Viaje con ID ${item.trip_id} no encontrado o inactivo` });
      }
      const trip = trips[0];
      if (!trip.is_bookable) {
        await connection.rollback();
        return res.status(400).json({ error: `"${trip.name}" es un atractivo de exploracion y no esta disponible para reserva.` });
      }
      if (trip.available_slots < item.quantity) {
        await connection.rollback();
        return res.status(409).json({ error: `Cupos insuficientes para "${trip.name}". Disponibles: ${trip.available_slots}` });
      }
      const [updateResult] = await connection.query(
        'UPDATE trips SET available_slots = available_slots - ? WHERE id = ? AND available_slots >= ?',
        [item.quantity, item.trip_id, item.quantity]
      );
      if (updateResult.affectedRows === 0) {
        await connection.rollback();
        return res.status(409).json({ error: `No se pudo reservar cupos para "${trip.name}". Conflicto de concurrencia.` });
      }
      const subtotal = Number(trip.price) * item.quantity;
      totalAmount += subtotal;
      orderItems.push({ trip_id: item.trip_id, quantity: item.quantity, unit_price: trip.price, trip_name: trip.name, trip_code: trip.code });
    }

    const [orderResult] = await connection.query('INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)', [req.user.id, totalAmount, 'confirmed']);
    for (const item of orderItems) await connection.query('INSERT INTO order_items (order_id, trip_id, quantity, unit_price) VALUES (?, ?, ?, ?)', [orderResult.insertId, item.trip_id, item.quantity, item.unit_price]);
    await connection.commit();
    inTransaction = false;
    res.status(201).json({ message: 'Compra realizada exitosamente', order: { id: orderResult.insertId, total_amount: totalAmount, status: 'confirmed', items: orderItems } });
  } catch (err) {
    if (inTransaction) await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
}

function parseOrders(orders) {
  return orders.map((order) => ({ ...order, items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items }));
}

async function getOrders(req, res, next) {
  try {
    const readPool = await getReadConnection();
    const [orders] = await readPool.query(`SELECT o.*, JSON_ARRAYAGG(JSON_OBJECT('trip_id', oi.trip_id, 'trip_name', t.name, 'trip_code', t.code, 'quantity', oi.quantity, 'unit_price', oi.unit_price)) AS items FROM orders o JOIN order_items oi ON o.id = oi.order_id JOIN trips t ON oi.trip_id = t.id WHERE o.user_id = ? GROUP BY o.id ORDER BY o.created_at DESC`, [req.user.id]);
    res.json({ orders: parseOrders(orders) });
  } catch (err) { next(err); }
}

async function getAdminOrders(req, res, next) {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const readPool = await getReadConnection();
    const where = [];
    const params = [];
    if (['pending', 'confirmed', 'cancelled'].includes(status)) { where.push('o.status = ?'); params.push(status); }
    if (search) {
      const term = `%${search.trim()}%`;
      where.push('(u.full_name LIKE ? OR u.email LIKE ? OR t.name LIKE ? OR t.code LIKE ? OR CAST(o.id AS CHAR) LIKE ?)');
      params.push(term, term, term, term, term);
    }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const from = 'FROM orders o JOIN users u ON o.user_id = u.id JOIN order_items oi ON o.id = oi.order_id JOIN trips t ON oi.trip_id = t.id LEFT JOIN users creator ON t.created_by_user_id = creator.id';
    const [countRows] = await readPool.query(`SELECT COUNT(DISTINCT o.id) AS total ${from} ${clause}`, params);
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
    const total = countRows[0].total;
    const pages = Math.max(1, Math.ceil(total / safeLimit));
    const safePage = Math.min(Math.max(Number(page) || 1, 1), pages);
    const [orders] = await readPool.query(`SELECT o.id, o.total_amount, o.status, o.created_at, u.full_name AS buyer_name, u.email AS buyer_email, JSON_ARRAYAGG(JSON_OBJECT('trip_id', t.id, 'trip_name', t.name, 'trip_code', t.code, 'quantity', oi.quantity, 'unit_price', oi.unit_price, 'creator_name', creator.full_name)) AS items ${from} ${clause} GROUP BY o.id, u.id ORDER BY o.created_at DESC LIMIT ? OFFSET ?`, [...params, safeLimit, (safePage - 1) * safeLimit]);
    const [summaryRows] = await readPool.query(`SELECT COUNT(*) AS total_orders, COUNT(DISTINCT user_id) AS buyers, SUM(status = 'confirmed') AS confirmed, COALESCE(SUM(CASE WHEN status = 'confirmed' THEN total_amount ELSE 0 END), 0) AS confirmed_revenue FROM orders`);
    res.json({ orders: parseOrders(orders), pagination: { page: safePage, limit: safeLimit, total, pages }, summary: summaryRows[0] });
  } catch (err) { next(err); }
}

module.exports = { checkout, getOrders, getAdminOrders };
