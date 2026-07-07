const express = require('express');
const cors = require('cors');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth.routes');
const tripsRoutes = require('./routes/trips.routes');
const shopRoutes = require('./routes/shop.routes');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ID = process.env.NODE_ID || 'node-unknown';

// =============================================
// MIDDLEWARE GLOBAL
// =============================================
app.use(cors());
app.use(express.json());

// Header X-Served-By en cada respuesta
app.use((req, res, next) => {
  res.setHeader('X-Served-By', NODE_ID);
  next();
});

// =============================================
// SERVIR FRONTEND ESTÁTICO (React build)
// =============================================
app.use(express.static(path.join(__dirname, '..', 'public')));

// =============================================
// RUTAS API
// =============================================
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripsRoutes);
app.use('/api/shop', shopRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    node_id: NODE_ID,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// =============================================
// FALLBACK: React Router (SPA)
// =============================================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// =============================================
// ERROR HANDLER
// =============================================
app.use(errorHandler);

// =============================================
// START
// =============================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [${NODE_ID}] Turix server running on port ${PORT}`);
});
