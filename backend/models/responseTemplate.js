const pool = require('../config/database');

class ResponseTemplate {
  static async getActive() {
    const result = await pool.query(`
      SELECT id, name, body, is_active, updated_at, created_at
      FROM response_templates
      WHERE is_active = TRUE
      ORDER BY updated_at DESC
      LIMIT 1;
    `);

    return result.rows[0] || null;
  }

  static async listAll() {
    const result = await pool.query(`
      SELECT id, name, body, is_active, updated_at, created_at
      FROM response_templates
      ORDER BY updated_at DESC;
    `);

    return result.rows;
  }

  static async upsertActive({ name, body }) {
    const existing = await this.getActive();

    if (existing) {
      const result = await pool.query(
        `
          UPDATE response_templates
          SET name = $1,
              body = $2,
              updated_at = NOW()
          WHERE id = $3
          RETURNING id, name, body, is_active, updated_at, created_at;
        `,
        [name, body, existing.id]
      );
      return result.rows[0];
    }

    const result = await pool.query(
      `
        INSERT INTO response_templates (name, body, is_active, created_at, updated_at)
        VALUES ($1, $2, TRUE, NOW(), NOW())
        RETURNING id, name, body, is_active, updated_at, created_at;
      `,
      [name, body]
    );

    return result.rows[0];
  }
}

module.exports = ResponseTemplate;
