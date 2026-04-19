const pool = require('../config/database');

class FAQ {
  static async listAll() {
    const result = await pool.query(`
      SELECT id, question, answer, keywords, usage_count, created_at, updated_at
      FROM faq_entries
      ORDER BY usage_count DESC, updated_at DESC;
    `);

    return result.rows;
  }

  static async getById(id) {
    const result = await pool.query(
      `
        SELECT id, question, answer, keywords, usage_count, created_at, updated_at
        FROM faq_entries
        WHERE id = $1;
      `,
      [id]
    );

    return result.rows[0] || null;
  }

  static async create({ question, answer, keywords = [] }) {
    const result = await pool.query(
      `
        INSERT INTO faq_entries (question, answer, keywords)
        VALUES ($1, $2, $3::jsonb)
        RETURNING id, question, answer, keywords, usage_count, created_at, updated_at;
      `,
      [question, answer, JSON.stringify(keywords)]
    );

    return result.rows[0];
  }

  static async touchUsage(id) {
    const result = await pool.query(
      `
        UPDATE faq_entries
        SET usage_count = usage_count + 1,
            updated_at = NOW()
        WHERE id = $1
        RETURNING id, question, answer, keywords, usage_count, created_at, updated_at;
      `,
      [id]
    );

    return result.rows[0] || null;
  }

  static async update(id, { question, answer, keywords = [] }) {
    const result = await pool.query(
      `
        UPDATE faq_entries
        SET question = $2,
            answer = $3,
            keywords = $4::jsonb,
            updated_at = NOW()
        WHERE id = $1
        RETURNING id, question, answer, keywords, usage_count, created_at, updated_at;
      `,
      [id, question, answer, JSON.stringify(keywords)]
    );

    return result.rows[0] || null;
  }

  static async delete(id) {
    const result = await pool.query(
      `
        DELETE FROM faq_entries
        WHERE id = $1
        RETURNING id, question, answer, keywords, usage_count, created_at, updated_at;
      `,
      [id]
    );

    return result.rows[0] || null;
  }

  static async getMetrics() {
    const summaryResult = await pool.query(`
      SELECT
        COUNT(*)::int AS total_faqs,
        COALESCE(SUM(usage_count), 0)::int AS total_usage,
        COALESCE(AVG(usage_count), 0)::numeric(10,2) AS avg_usage
      FROM faq_entries;
    `);

    const topFaqs = await pool.query(`
      SELECT id, question, usage_count
      FROM faq_entries
      ORDER BY usage_count DESC, updated_at DESC
      LIMIT 5;
    `);

    return {
      total_faqs: summaryResult.rows[0].total_faqs || 0,
      total_usage: summaryResult.rows[0].total_usage || 0,
      avg_usage: Number(summaryResult.rows[0].avg_usage || 0),
      top_faqs: topFaqs.rows,
    };
  }
}

module.exports = FAQ;
