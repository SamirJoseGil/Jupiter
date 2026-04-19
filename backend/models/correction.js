const pool = require('../config/database');

class Correction {
  static async create({
    pqrId,
    originalClassification,
    correctedClassification,
    confidenceBefore,
    confidenceAfter,
    adminNotes,
    adminId
  }) {
    const query = `
      INSERT INTO corrections (
        pqr_id,
        original_classification,
        corrected_classification,
        confidence_before,
        confidence_after,
        admin_notes,
        admin_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;

    const values = [
      pqrId,
      originalClassification || null,
      correctedClassification,
      confidenceBefore ?? null,
      confidenceAfter ?? null,
      adminNotes || null,
      adminId || null
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async countAll() {
    const result = await pool.query('SELECT COUNT(*)::int AS total FROM corrections;');
    return result.rows[0].total;
  }
}

module.exports = Correction;
