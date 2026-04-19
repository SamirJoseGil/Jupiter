const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
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

const sanitizeUser = (user) => ({
  id: user.id,
  email: user.email,
  department: user.department,
  role: user.role,
  avatarBase64: user.avatar_base64 || null,
  avatarMimeType: user.avatar_mime_type || null,
});

const getRawAvatarSize = (avatarBase64) => {
  if (!avatarBase64 || typeof avatarBase64 !== 'string') {
    return 0;
  }

  const base64 = avatarBase64.includes('base64,')
    ? avatarBase64.split('base64,')[1]
    : avatarBase64;

  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
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
      user: sanitizeUser(user)
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

    res.json({ user: sanitizeUser(user) });
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

router.put('/me/profile', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { department, avatarBase64, avatarMimeType } = req.body;

    if (avatarBase64) {
      if (typeof avatarBase64 !== 'string') {
        return res.status(400).json({
          error: {
            status: 400,
            message: 'Invalid avatar data'
          }
        });
      }

      if (!avatarMimeType || typeof avatarMimeType !== 'string' || !avatarMimeType.startsWith('image/')) {
        return res.status(400).json({
          error: {
            status: 400,
            message: 'Avatar must be an image'
          }
        });
      }

      const avatarSize = getRawAvatarSize(avatarBase64);
      const maxAvatarSize = 20 * 1024 * 1024;
      if (avatarSize > maxAvatarSize) {
        return res.status(413).json({
          error: {
            status: 413,
            message: 'Avatar exceeds 20MB limit'
          }
        });
      }
    }

    const updatedUser = await User.updateProfile(req.user.id, {
      department: typeof department === 'string' ? department : null,
      avatarBase64: avatarBase64 || null,
      avatarMimeType: avatarMimeType || null,
    });

    if (!updatedUser) {
      return res.status(404).json({
        error: {
          status: 404,
          message: 'User not found'
        }
      });
    }

    res.json({
      message: 'Profile updated successfully',
      user: sanitizeUser(updatedUser)
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: {
        status: 500,
        message: 'Server error'
      }
    });
  }
});

module.exports = router;
