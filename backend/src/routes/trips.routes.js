const express = require('express');
const router = express.Router();
const { listTrips, listCategories, getTripById, createTrip, updateTrip, deleteTrip } = require('../controllers/trips.controller');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Rutas públicas
router.get('/', listTrips);
router.get('/categories', listCategories);
router.get('/:id', getTripById);

// Rutas protegidas (admin)
router.post('/', authenticateToken, requireAdmin, createTrip);
router.put('/:id', authenticateToken, requireAdmin, updateTrip);
router.delete('/:id', authenticateToken, requireAdmin, deleteTrip);

module.exports = router;
