const pool = require('../config/database');

class EmailIngestion {
  static async create({ externalMessageId, senderEmail, subject, content, rawPayload }) {
    const query = `
      INSERT INTO email_ingestions (
        external_message_id,
        sender_email,
        subject,
        content,
        raw_payload,
        status,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, 'received', NOW(), NOW())
      RETURNING *;
    `;

    const values = [
      externalMessageId || null,
      senderEmail,
      subject,
      content,
      rawPayload ? JSON.stringify(rawPayload) : null,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async getByExternalMessageId(externalMessageId) {
    if (!externalMessageId) return null;

    const query = 'SELECT * FROM email_ingestions WHERE external_message_id = $1 LIMIT 1;';
    const result = await pool.query(query, [externalMessageId]);
    return result.rows[0] || null;
  }

  static async markProcessed(id, pqrId) {
    const query = `
      UPDATE email_ingestions
      SET status = 'processed',
          processed_at = NOW(),
          pqr_id = $1,
          updated_at = NOW()
      WHERE id = $2
      RETURNING *;
    `;

    const result = await pool.query(query, [pqrId, id]);
    return result.rows[0];
  }

  static async markFailed(id, errorMessage) {
    const query = `
      UPDATE email_ingestions
      SET status = 'failed',
          last_error = $1,
          updated_at = NOW()
      WHERE id = $2
      RETURNING *;
    `;

    const result = await pool.query(query, [errorMessage, id]);
    return result.rows[0];
  }
}

module.exports = EmailIngestion;
