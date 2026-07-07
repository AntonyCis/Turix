const { getWritePool, getReadConnection } = require('../config/db');

async function createOrder(connection, userId, totalAmount) {
  const [result] = await connection.query(
    'INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)',
    [userId, totalAmount, 'confirmed']
  );
  return result.insertId;
}

async function createOrderItems(connection, orderId, items) {
  for (const item of items) {
    await connection.query(
      'INSERT INTO order_items (order_id, trip_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
      [orderId, item.trip_id, item.quantity, item.unit_price]
    );
  }
}

async function findByUserId(userId) {
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
    [userId]
  );

  return orders.map(order => ({
    ...order,
    items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items
  }));
}

module.exports = { createOrder, createOrderItems, findByUserId };