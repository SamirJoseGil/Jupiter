const pool = require('../config/database');

const VALID_CHANNELS = ['web', 'email', 'chat', 'phone', 'social'];
const VALID_STATUSES = ['pending', 'analyzed', 'assigned', 'resolved'];

class PQR {
  static async create({ content, channel, assignedDepartment = null }) {
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

    const query = `
      INSERT INTO PQRSDf (content, channel, assigned_department, status, created_at)
      VALUES ($1, $2, $3, 'pending', NOW())
      RETURNING *;
    `;
    
    try {
      const result = await pool.query(query, [content.trim(), channel, assignedDepartment]);
      return result.rows[0];
    } catch (error) {
      console.error('Create PQR error:', error);
      throw error;
    }
  }

  static async getAll(filters = {}) {
    let query = 'SELECT * FROM PQRSDf WHERE 1=1';
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
    const page = Math.max(1, parseInt(filters.page) || 1);
    const limit = Math.min(parseInt(filters.limit) || 25, 100);
    const offset = (page - 1) * limit;

    let countQuery = 'SELECT COUNT(*)::int AS total FROM PQRSDf WHERE 1=1';
    let dataQuery = 'SELECT * FROM PQRSDf WHERE 1=1';
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
    if (!Number.isInteger(parseInt(id))) {
      throw new Error('Invalid PQR ID');
    }

    const query = 'SELECT * FROM PQRSDf WHERE id = $1;';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async updateAnalysis(id, { classification, confidence, summary, topics, multi_dependency, assignedDepartment }) {
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
      UPDATE PQRSDf
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
    if (!Number.isInteger(parseInt(id))) {
      throw new Error('Invalid PQR ID');
    }

    if (!VALID_STATUSES.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    const query = 'UPDATE PQRSDf SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *;';
    const result = await pool.query(query, [status, id]);
    return result.rows[0];
  }

  static async assignToUser(id, userId, department) {
    if (!Number.isInteger(parseInt(id))) {
      throw new Error('Invalid PQR ID');
    }

    const query = `
      UPDATE PQRSDf 
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
    if (!Number.isInteger(parseInt(id))) {
      throw new Error('Invalid PQR ID');
    }

    const query = `
      UPDATE PQRSDf
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
      UPDATE PQRSDf
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
    const totalResult = await pool.query('SELECT COUNT(*)::int AS total FROM PQRSDf;');
    const confidenceResult = await pool.query('SELECT AVG(confidence)::numeric(10,2) AS avg_confidence FROM PQRSDf WHERE confidence IS NOT NULL;');
    const correctedResult = await pool.query('SELECT COUNT(*)::int AS corrected FROM corrections;');
    const statusResult = await pool.query(`
      SELECT status, COUNT(*)::int AS count
      FROM PQRSDf
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
}

module.exports = PQR;