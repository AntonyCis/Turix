const { getWritePool, getReadConnection } = require('../config/db');
const { validateCheckout } = require('../utils/validators');

/**
 * POST /api/shop/checkout
 * Confirmar compra del carrito. Transacción atómica con control de cupos.
 */
async function checkout(req, res, next) {
  const pool = getWritePool();
  const connection = await pool.getConnection();

  try {
    const { items } = req.body;

    // Validar items
    const errors = validateCheckout(items);
    if (errors.length > 0) {
      connection.release();
      return res.status(400).json({ errors });
    }

    await connection.beginTransaction();

    let totalAmount = 0;
    const orderItems = [];

    // Verificar disponibilidad y reservar cupos atómicamente
    for (const item of items) {
      // Obtener el viaje actual (con bloqueo FOR UPDATE)
      const [trips] = await connection.query(
        'SELECT id, name, code, price, available_slots FROM trips WHERE id = ? AND is_active = TRUE FOR UPDATE',
        [item.trip_id]
      );

      if (trips.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ error: `Viaje con ID ${item.trip_id} no encontrado o inactivo` });
      }

      const trip = trips[0];

      if (trip.available_slots < item.quantity) {
        await connection.rollback();
        connection.release();
        return res.status(409).json({
          error: `Cupos insuficientes para "${trip.name}". Disponibles: ${trip.available_slots}, Solicitados: ${item.quantity}`
        });
      }

      // Decrementar cupos atómicamente
      const [updateResult] = await connection.query(
        'UPDATE trips SET available_slots = available_slots - ? WHERE id = ? AND available_slots >= ?',
        [item.quantity, item.trip_id, item.quantity]
      );

      if (updateResult.affectedRows === 0) {
        await connection.rollback();
        connection.release();
        return res.status(409).json({
          error: `No se pudo reservar cupos para "${trip.name}". Conflicto de concurrencia.`
        });
      }

      const subtotal = trip.price * item.quantity;
      totalAmount += subtotal;

      orderItems.push({
        trip_id: item.trip_id,
        quantity: item.quantity,
        unit_price: trip.price,
        trip_name: trip.name,
        trip_code: trip.code
      });
    }

    // Crear la orden
    const [orderResult] = await connection.query(
      'INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)',
      [req.user.id, totalAmount, 'confirmed']
    );

    const orderId = orderResult.insertId;

    // Insertar los items de la orden
    for (const item of orderItems) {
      await connection.query(
        'INSERT INTO order_items (order_id, trip_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [orderId, item.trip_id, item.quantity, item.unit_price]
      );
    }

    await connection.commit();
    connection.release();

    res.status(201).json({
      message: 'Compra realizada exitosamente',
      order: {
        id: orderId,
        total_amount: totalAmount,
        status: 'confirmed',
        items: orderItems
      }
    });
  } catch (err) {
    await connection.rollback();
    connection.release();
    next(err);
  }
}

/**
 * GET /api/shop/orders
 * Historial de órdenes del usuario autenticado.
 */
async function getOrders(req, res, next) {
  try {
    const readPool = await getReadConnection();

    const [orders] = await readPool.query(
      `SELECT o.*, 
              JSON_ARRAYAGG(
                JSON_OBJECT(
                  'trip_id', oi.trip_id,
                  'trip_name', t.name,
                  'trip_code', t.code,
                  'quantity', oi.quantity,
                  'unit_price', oi.unit_price
                )
              ) AS items
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       JOIN trips t ON oi.trip_id = t.id
       WHERE o.user_id = ?
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    // Parse items JSON string
    const parsedOrders = orders.map(order => ({
      ...order,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items
    }));

    res.json({ orders: parsedOrders });
  } catch (err) {
    next(err);
  }
}

module.exports = { checkout, getOrders };
