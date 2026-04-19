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
      VALUES ($1, $2, $3, $4::varchar, CASE WHEN $4::varchar = 'sent'::varchar THEN NOW() ELSE NULL END)
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

  static async getMetrics(pqrTableName) {
    const totalsResult = await pool.query(`
      SELECT
        COUNT(*)::int AS total_responses,
        COUNT(*) FILTER (WHERE status = 'draft')::int AS total_drafts,
        COUNT(*) FILTER (WHERE status = 'sent')::int AS total_sent
      FROM responses;
    `);

    const timingResult = await pool.query(`
      SELECT AVG(EXTRACT(EPOCH FROM (r.sent_at - p.created_at)) / 3600.0)::numeric(10,2) AS avg_response_hours
      FROM responses r
      JOIN ${pqrTableName} p ON p.id = r.pqr_id
      WHERE r.status = 'sent' AND r.sent_at IS NOT NULL;
    `);

    const coverageResult = await pool.query(`
      SELECT COUNT(*)::int AS pending_without_response
      FROM ${pqrTableName} p
      LEFT JOIN responses r ON r.pqr_id = p.id
      WHERE p.status IN ('pending', 'analyzed', 'assigned')
        AND r.id IS NULL;
    `);

    const totals = totalsResult.rows[0];
    const sent = totals.total_sent || 0;
    const drafts = totals.total_drafts || 0;

    return {
      total_responses: totals.total_responses || 0,
      total_drafts: drafts,
      total_sent: sent,
      draft_to_sent_ratio: sent === 0 ? Number(drafts.toFixed(2)) : Number((drafts / sent).toFixed(2)),
      avg_response_hours: Number(timingResult.rows[0].avg_response_hours || 0),
      pending_without_response: coverageResult.rows[0].pending_without_response || 0,
    };
  }
}

module.exports = Response;
