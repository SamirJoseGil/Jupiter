const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      department: user.department,
      role: 'admin'
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Registra un administrador
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/LoginRequest'
 *               - type: object
 *                 properties:
 *                   department:
 *                     type: string
 *                     example: Infraestructura
 *     responses:
 *       201:
 *         description: Usuario creado
 *       400:
 *         description: Error de validacion
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, department } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: {
          status: 400,
          message: 'Email and password required'
        }
      });
    }

    const user = await User.create(email, password, department);
    const token = generateToken(user);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(400).json({
      error: {
        status: 400,
        message: error.message
      }
    });
  }
});

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Inicia sesion de administrador
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Credenciales invalidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: {
          status: 400,
          message: 'Email and password required'
        }
      });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: {
          status: 401,
          message: 'Invalid credentials'
        }
      });
    }

    const isPasswordValid = await User.verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: {
          status: 401,
          message: 'Invalid credentials'
        }
      });
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        department: user.department
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: {
        status: 500,
        message: 'Server error'
      }
    });
  }
});

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Obtiene el usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usuario autenticado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Token invalido o ausente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        error: {
          status: 404,
          message: 'User not found'
        }
      });
    }

    res.json({ user });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({
      error: {
        status: 500,
        message: 'Server error'
      }
    });
  }
});

module.exports = router;
