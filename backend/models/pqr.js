const pool = require('../config/database');

const VALID_CHANNELS = ['web', 'email', 'chat', 'phone', 'social'];
const VALID_STATUSES = ['pending', 'analyzed', 'assigned', 'resolved'];
const TABLE_CANDIDATES = ['pqrs', 'pqrsdf'];

let resolvedTableName;

const getPreferredTable = async () => {
  if (resolvedTableName) {
    return resolvedTableName;
  }

  const explicitTable = (process.env.PQR_TABLE || '').trim().toLowerCase();

  const tablesResult = await pool.query(
    `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY($1::text[])
    `,
    [TABLE_CANDIDATES]
  );

  const existingTables = tablesResult.rows.map((row) => row.table_name);

  if (explicitTable && existingTables.includes(explicitTable)) {
    resolvedTableName = explicitTable;
    return resolvedTableName;
  }

  if (existingTables.length === 0) {
    throw new Error('No PQR table found (expected pqrs or pqrsdf)');
  }

  if (existingTables.length === 1) {
    resolvedTableName = existingTables[0];
    return resolvedTableName;
  }

  const counts = await Promise.all(
    existingTables.map(async (tableName) => {
      const countResult = await pool.query(`SELECT COUNT(*)::int AS total FROM ${tableName}`);
      return { tableName, total: countResult.rows[0].total };
    })
  );

  counts.sort((a, b) => {
    if (b.total !== a.total) {
      return b.total - a.total;
    }
    if (a.tableName === 'pqrs') {
      return -1;
    }
    if (b.tableName === 'pqrs') {
      return 1;
    }
    return 0;
  });

  resolvedTableName = counts[0].tableName;
  return resolvedTableName;
};

class PQR {
  static async getTableName() {
    return getPreferredTable();
  }

  static async create({ content, channel, assignedDepartment = null, citizenId = null, neighborhood = null }) {
    const tableName = await this.getTableName();

    // Validation
    if (!content || typeof content !== 'string') {
      throw new Error('Content is required and must be a string');
    }
    
    if (content.trim().length < 20 || content.trim().length > 5000) {
      throw new Error('Content must be between 20 and 5000 characters');
    }

    if (!channel || !VALID_CHANNELS.includes(channel)) {
      throw new Error(`Invalid channel. Must be one of: ${VALID_CHANNELS.join(', ')}`);
    }

    if (citizenId && String(citizenId).length > 30) {
      throw new Error('Citizen ID is too long');
    }

    if (neighborhood && String(neighborhood).length > 120) {
      throw new Error('Neighborhood is too long');
    }

    const query = `
      INSERT INTO ${tableName} (content, channel, assigned_department, citizen_id, neighborhood, status, created_at)
      VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
      RETURNING *;
    `;
    
    try {
      const result = await pool.query(query, [
        content.trim(),
        channel,
        assignedDepartment,
        citizenId ? String(citizenId).trim() : null,
        neighborhood ? String(neighborhood).trim() : null,
      ]);
      return result.rows[0];
    } catch (error) {
      console.error('Create PQR error:', error);
      throw error;
    }
  }

  static async getAll(filters = {}) {
    const tableName = await this.getTableName();
    let query = `SELECT * FROM ${tableName} WHERE 1=1`;
    let params = [];
    let paramIndex = 1;

    if (filters.status && VALID_STATUSES.includes(filters.status)) {
      query += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.department) {
      query += ` AND assigned_department = $${paramIndex}`;
      params.push(filters.department);
      paramIndex++;
    }

    if (filters.userId) {
      query += ` AND assigned_to_user_id = $${paramIndex}`;
      params.push(filters.userId);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';
    
    if (filters.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(Math.min(filters.limit, 1000));
    }

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async getAllPaginated(filters = {}) {
    const tableName = await this.getTableName();
    const page = Math.max(1, parseInt(filters.page) || 1);
    const limit = Math.min(parseInt(filters.limit) || 25, 100);
    const offset = (page - 1) * limit;

    let countQuery = `SELECT COUNT(*)::int AS total FROM ${tableName} WHERE 1=1`;
    let dataQuery = `SELECT * FROM ${tableName} WHERE 1=1`;
    let params = [];
    let paramIndex = 1;

    // Apply filters to both queries
    if (filters.status && VALID_STATUSES.includes(filters.status)) {
      const condition = ` AND status = $${paramIndex}`;
      countQuery += condition;
      dataQuery += condition;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.department) {
      const condition = ` AND assigned_department = $${paramIndex}`;
      countQuery += condition;
      dataQuery += condition;
      params.push(filters.department);
      paramIndex++;
    }

    if (filters.userId) {
      const condition = ` AND assigned_to_user_id = $${paramIndex}`;
      countQuery += condition;
      dataQuery += condition;
      params.push(filters.userId);
      paramIndex++;
    }

    dataQuery += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, params.slice(0, paramIndex - 1)),
      pool.query(dataQuery, params)
    ]);

    const total = countResult.rows[0].total;

    return {
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit)
      }
    };
  }

  static async getById(id) {
    const tableName = await this.getTableName();

    if (!Number.isInteger(parseInt(id))) {
      throw new Error('Invalid PQR ID');
    }

    const query = `SELECT * FROM ${tableName} WHERE id = $1;`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async attachEvidence(id, { images = [], documents = [] }) {
    const tableName = await this.getTableName();

    if (!Number.isInteger(parseInt(id))) {
      throw new Error('Invalid PQR ID');
    }

    const query = `
      UPDATE ${tableName}
      SET evidence_images = COALESCE(evidence_images, '[]'::jsonb) || $1::jsonb,
          evidence_documents = COALESCE(evidence_documents, '[]'::jsonb) || $2::jsonb,
          updated_at = NOW()
      WHERE id = $3
      RETURNING *;
    `;

    const result = await pool.query(query, [
      JSON.stringify(images || []),
      JSON.stringify(documents || []),
      id,
    ]);

    return result.rows[0];
  }

  static async getPublicStatusById(id, citizenId = null) {
    const tableName = await this.getTableName();

    if (!Number.isInteger(parseInt(id))) {
      throw new Error('Invalid PQR ID');
    }

    let query = `
      SELECT id, status, classification, assigned_department, created_at, updated_at, channel
      FROM ${tableName}
      WHERE id = $1
    `;
    const params = [id];

    if (citizenId) {
      query += ' AND citizen_id = $2';
      params.push(String(citizenId).trim());
    }

    query += ' LIMIT 1;';

    const result = await pool.query(query, params);
    return result.rows[0] || null;
  }

  static async updateAnalysis(id, { classification, confidence, summary, topics, multi_dependency, assignedDepartment }) {
    const tableName = await this.getTableName();

    if (!Number.isInteger(parseInt(id))) {
      throw new Error('Invalid PQR ID');
    }

    if (confidence < 0 || confidence > 100) {
      throw new Error('Confidence must be between 0 and 100');
    }

    if (!classification || typeof classification !== 'string') {
      throw new Error('Classification is required');
    }

    const query = `
      UPDATE ${tableName}
      SET classification = $1, 
          confidence = $2, 
          summary = $3, 
          topics = $4, 
          multi_dependency = $5,
          assigned_department = $6,
          status = 'analyzed',
          updated_at = NOW()
      WHERE id = $7
      RETURNING *;
    `;
    
    const values = [
      classification,
      confidence,
      summary,
      JSON.stringify(topics || []),
      multi_dependency || false,
      assignedDepartment,
      id
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async updateStatus(id, status) {
    const tableName = await this.getTableName();

    if (!Number.isInteger(parseInt(id))) {
      throw new Error('Invalid PQR ID');
    }

    if (!VALID_STATUSES.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    const query = `UPDATE ${tableName} SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *;`;
    const result = await pool.query(query, [status, id]);
    return result.rows[0];
  }

  static async assignToUser(id, userId, department) {
    const tableName = await this.getTableName();

    if (!Number.isInteger(parseInt(id))) {
      throw new Error('Invalid PQR ID');
    }

    const query = `
      UPDATE ${tableName} 
      SET assigned_to_user_id = $1, 
          assigned_department = $2,
          status = 'assigned',
          updated_at = NOW()
      WHERE id = $3 
      RETURNING *;
    `;
    
    const result = await pool.query(query, [userId, department, id]);
    return result.rows[0];
  }

  static async acceptClassification(id) {
    const tableName = await this.getTableName();

    if (!Number.isInteger(parseInt(id))) {
      throw new Error('Invalid PQR ID');
    }

    const query = `
      UPDATE ${tableName}
      SET status = 'assigned',
          assigned_department = COALESCE(assigned_department, classification),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async updateClassification(id, { classification, confidence }) {
    const tableName = await this.getTableName();

    if (!Number.isInteger(parseInt(id))) {
      throw new Error('Invalid PQR ID');
    }

    if (!classification || typeof classification !== 'string') {
      throw new Error('Classification is required');
    }

    if (confidence !== null && confidence !== undefined && (confidence < 0 || confidence > 100)) {
      throw new Error('Confidence must be between 0 and 100');
    }

    const query = `
      UPDATE ${tableName}
      SET classification = $1,
          confidence = $2,
          assigned_department = $1,
          status = 'analyzed',
          updated_at = NOW()
      WHERE id = $3
      RETURNING *;
    `;

    const result = await pool.query(query, [classification, confidence, id]);
    return result.rows[0];
  }

  static async getStats() {
    const tableName = await this.getTableName();

    const totalResult = await pool.query(`SELECT COUNT(*)::int AS total FROM ${tableName};`);
    const confidenceResult = await pool.query(`SELECT AVG(confidence)::numeric(10,2) AS avg_confidence FROM ${tableName} WHERE confidence IS NOT NULL;`);
    const correctedResult = await pool.query('SELECT COUNT(*)::int AS corrected FROM corrections;');
    const statusResult = await pool.query(`
      SELECT status, COUNT(*)::int AS count
      FROM ${tableName}
      GROUP BY status;
    `);

    const statusMap = {
      pending: 0,
      analyzed: 0,
      assigned: 0,
      resolved: 0
    };

    statusResult.rows.forEach((row) => {
      statusMap[row.status] = row.count;
    });

    const total = totalResult.rows[0].total;

    return {
      total_PQRSDf: total,
      avg_classification_confidence: Number(confidenceResult.rows[0].avg_confidence || 0),
      total_corrected: correctedResult.rows[0].corrected,
      time_saved_minutes: total * 15,
      pending: statusMap.pending,
      analyzed: statusMap.analyzed,
      assigned: statusMap.assigned,
      resolved: statusMap.resolved
    };
  }

  static async getBreakdownMetrics() {
    const tableName = await this.getTableName();

    const [channelResult, departmentResult, activityResult, evidenceResult] = await Promise.all([
      pool.query(`
        SELECT channel, COUNT(*)::int AS count
        FROM ${tableName}
        GROUP BY channel
        ORDER BY count DESC, channel ASC;
      `),
      pool.query(`
        SELECT COALESCE(NULLIF(TRIM(assigned_department), ''), 'Sin asignar') AS label, COUNT(*)::int AS count
        FROM ${tableName}
        GROUP BY 1
        ORDER BY count DESC, label ASC
        LIMIT 8;
      `),
      pool.query(`
        SELECT TO_CHAR(date_trunc('day', created_at), 'YYYY-MM-DD') AS label, COUNT(*)::int AS count
        FROM ${tableName}
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY 1
        ORDER BY 1 ASC;
      `),
      pool.query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (
            WHERE COALESCE(jsonb_array_length(COALESCE(evidence_images, '[]'::jsonb)), 0) > 0
               OR COALESCE(jsonb_array_length(COALESCE(evidence_documents, '[]'::jsonb)), 0) > 0
          )::int AS with_evidence
        FROM ${tableName};
      `),
    ]);

    const total = evidenceResult.rows[0].total || 0;
    const withEvidence = evidenceResult.rows[0].with_evidence || 0;

    return {
      channel_distribution: channelResult.rows,
      department_distribution: departmentResult.rows,
      activity_last_7_days: activityResult.rows,
      evidence_rate: total === 0 ? 0 : Number(((withEvidence / total) * 100).toFixed(1)),
      evidence_total: withEvidence,
      evidence_missing: Math.max(total - withEvidence, 0),
    };
  }
}

module.exports = PQR;