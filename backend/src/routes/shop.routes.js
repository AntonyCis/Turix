const express = require('express');
const router = express.Router();
const { checkout, getOrders, getAdminOrders } = require('../controllers/shop.controller');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Todas las rutas de shop requieren autenticación
router.post('/checkout', authenticateToken, checkout);
router.get('/orders', authenticateToken, getOrders);
router.get('/admin/orders', authenticateToken, requireAdmin, getAdminOrders);

module.exports = router;
