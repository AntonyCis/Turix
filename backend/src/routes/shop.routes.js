const express = require('express');
const router = express.Router();
const { checkout, getOrders } = require('../controllers/shop.controller');
const { authenticateToken } = require('../middleware/auth');

// Todas las rutas de shop requieren autenticación
router.post('/checkout', authenticateToken, checkout);
router.get('/orders', authenticateToken, getOrders);

module.exports = router;
