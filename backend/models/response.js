const pool = require('../config/database');

class Response {
  static async upsertDraft({ pqrId, userId, responseText, send = false }) {
    if (!Number.isInteger(parseInt(pqrId))) {
      throw new Error('Invalid PQR ID');
    }

    if (!responseText || typeof responseText !== 'string' || responseText.trim().length < 10) {
      throw new Error('Response text must be at least 10 characters');
    }

    const status = send ? 'sent' : 'draft';
    const query = `
      INSERT INTO responses (pqr_id, created_by_user_id, response_text, status, sent_at)
      VALUES ($1, $2, $3, $4, CASE WHEN $4 = 'sent' THEN NOW() ELSE NULL END)
      ON CONFLICT (pqr_id)
      DO UPDATE SET
        response_text = EXCLUDED.response_text,
        status = EXCLUDED.status,
        sent_at = CASE WHEN EXCLUDED.status = 'sent' THEN NOW() ELSE responses.sent_at END
      RETURNING *;
    `;

    const result = await pool.query(query, [pqrId, userId || null, responseText.trim(), status]);
    return result.rows[0];
  }

  static async getByPqrId(pqrId) {
    if (!Number.isInteger(parseInt(pqrId))) {
      throw new Error('Invalid PQR ID');
    }

    const query = 'SELECT * FROM responses WHERE pqr_id = $1 LIMIT 1;';
    const result = await pool.query(query, [pqrId]);
    return result.rows[0] || null;
  }
}

module.exports = Response;
