const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getWritePool, getReadConnection } = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');
const { validateRegister } = require('../utils/validators');

const SALT_ROUNDS = 10;

/**
 * POST /api/auth/register
 */
async function register(req, res, next) {
  try {
    const { email, password, full_name } = req.body;

    // Validar campos
    const errors = validateRegister({ email, password, full_name });
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const pool = getWritePool();

    // Verificar email duplicado
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    // Hash de contraseña
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // Insertar usuario
    const [result] = await pool.query(
      'INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
      [email, password_hash, full_name.trim(), 'user']
    );

    // Generar token
    const token = jwt.sign(
      { id: result.insertId, email, role: 'user' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: { id: result.insertId, email, full_name: full_name.trim(), role: 'user' }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const readPool = await getReadConnection();
    const [rows] = await readPool.query('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 */
async function getProfile(req, res, next) {
  try {
    const readPool = await getReadConnection();
    const [rows] = await readPool.query(
      'SELECT id, email, full_name, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ user: rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getProfile };
