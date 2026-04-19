const pool = require('../config/database');

const ALLOWED_TABLES = new Set(['pqrs', 'pqrsdf']);

const normalize = (text = '') =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenize = (text = '') => {
  const tokens = normalize(text).split(' ').filter((t) => t.length > 2);
  return Array.from(new Set(tokens));
};

const jaccard = (a, b) => {
  if (!a.length || !b.length) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection += 1;
  }
  const union = new Set([...setA, ...setB]).size;
  return union ? intersection / union : 0;
};

class PqrRelation {
  static ensureTableName(tableName) {
    const normalized = String(tableName || '').toLowerCase();
    if (!ALLOWED_TABLES.has(normalized)) {
      throw new Error('Invalid PQR table name for relations');
    }
    return normalized;
  }

  static async listByPqr(sourcePqrId, tableName) {
    const safeTable = this.ensureTableName(tableName);
    const query = `
      SELECT r.source_pqr_id, r.related_pqr_id, r.score, r.created_at, p.status, p.classification, p.created_at AS related_created_at
      FROM pqr_relations r
      JOIN ${safeTable} p ON p.id = r.related_pqr_id
      WHERE r.source_pqr_id = $1
      ORDER BY r.score DESC, r.created_at DESC;
    `;

    const result = await pool.query(query, [sourcePqrId]);
    return result.rows;
  }

  static async deleteRelation(sourcePqrId, relatedPqrId) {
    const result = await pool.query(
      'DELETE FROM pqr_relations WHERE source_pqr_id = $1 AND related_pqr_id = $2 RETURNING *;',
      [sourcePqrId, relatedPqrId]
    );

    return result.rows[0] || null;
  }

  static async rebuildForPqr(sourcePqrId, tableName) {
    const safeTable = this.ensureTableName(tableName);

    const sourceResult = await pool.query(`SELECT id, content, classification FROM ${safeTable} WHERE id = $1 LIMIT 1;`, [sourcePqrId]);
    const source = sourceResult.rows[0];

    if (!source) {
      throw new Error('Source PQR not found');
    }

    const candidatesResult = await pool.query(
      `
        SELECT id, content, classification, created_at
        FROM ${safeTable}
        WHERE id <> $1
        ORDER BY created_at DESC
        LIMIT 300;
      `,
      [sourcePqrId]
    );

    const sourceTokens = tokenize(source.content || '');

    const ranked = candidatesResult.rows
      .map((row) => {
        const scoreBase = jaccard(sourceTokens, tokenize(row.content || ''));
        const sameClassificationBonus =
          source.classification && row.classification && source.classification === row.classification ? 0.15 : 0;
        const score = Math.min(1, scoreBase + sameClassificationBonus);
        return { ...row, score };
      })
      .filter((row) => row.score >= 0.1)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    await pool.query('DELETE FROM pqr_relations WHERE source_pqr_id = $1;', [sourcePqrId]);

    for (const item of ranked) {
      await pool.query(
        `
          INSERT INTO pqr_relations (source_pqr_id, related_pqr_id, score, created_at)
          VALUES ($1, $2, $3, NOW())
          ON CONFLICT (source_pqr_id, related_pqr_id)
          DO UPDATE SET score = EXCLUDED.score, created_at = NOW();
        `,
        [sourcePqrId, item.id, Number(item.score.toFixed(4))]
      );
    }

    return ranked.map((item) => ({
      related_pqr_id: item.id,
      score: Number(item.score.toFixed(4)),
      classification: item.classification,
      status: item.status,
    }));
  }
}

module.exports = PqrRelation;
