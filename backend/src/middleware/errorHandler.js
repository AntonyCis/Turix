/**
 * Middleware centralizado de manejo de errores.
 */
function errorHandler(err, req, res, next) {
  console.error(`❌ [ERROR] ${req.method} ${req.path}:`, err.message);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'El registro ya existe (valor duplicado)' });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor'
  });
}

module.exports = errorHandler;
