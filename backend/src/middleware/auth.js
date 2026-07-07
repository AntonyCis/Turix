const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'turix-dev-secret';

/**
 * Middleware: Verifica token JWT en el header Authorization.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticación requerido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
}

/**
 * Middleware: Requiere rol de administrador.
 */
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado: se requiere rol de administrador' });
  }
  next();
}

module.exports = { authenticateToken, requireAdmin, JWT_SECRET };
