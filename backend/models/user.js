const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(email, password, department = null) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
    
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    try {
      const result = await pool.query(
        'INSERT INTO users (email, password_hash, department, is_active) VALUES ($1, $2, $3, $4) RETURNING id, email, department, avatar_base64, avatar_mime_type, role, is_active',
        [email.toLowerCase(), hashedPassword, department, true]
      );
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Email already exists');
      }
      throw error;
    }
  }

  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT id, email, password_hash, department, avatar_base64, avatar_mime_type, role, is_active FROM users WHERE email = $1 AND is_active = true',
      [email.toLowerCase()]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT id, email, department, avatar_base64, avatar_mime_type, role, is_active FROM users WHERE id = $1 AND is_active = true',
      [id]
    );
    return result.rows[0];
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updateDepartment(userId, department) {
    const result = await pool.query(
      'UPDATE users SET department = $1 WHERE id = $2 RETURNING id, email, department',
      [department, userId]
    );
    return result.rows[0];
  }

  static async updateProfile(userId, { department = null, avatarBase64 = null, avatarMimeType = null }) {
    const result = await pool.query(
      `UPDATE users
       SET department = COALESCE($2, department),
           avatar_base64 = COALESCE($3, avatar_base64),
           avatar_mime_type = COALESCE($4, avatar_mime_type),
           avatar_updated_at = CASE WHEN $3 IS NOT NULL THEN NOW() ELSE avatar_updated_at END
       WHERE id = $1 AND is_active = true
       RETURNING id, email, department, avatar_base64, avatar_mime_type, role, is_active`,
      [userId, department, avatarBase64, avatarMimeType]
    );
    return result.rows[0];
  }

  static async deactivate(userId) {
    const result = await pool.query(
      'UPDATE users SET is_active = false WHERE id = $1 RETURNING id, email',
      [userId]
    );
    return result.rows[0];
  }
}

module.exports = User;
