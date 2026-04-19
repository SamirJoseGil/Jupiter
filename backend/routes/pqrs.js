const express = require('express');
const PQR = require('../models/pqr');
const Response = require('../models/response');
const Correction = require('../models/correction');
const { analyze } = require('../services/ai');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const router = express.Router();

/**
 * @openapi
 * /api/ingest:
 *   post:
 *     tags: [PQR]
 *     summary: Crea una nueva solicitud PQRSD (publico)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IngestRequest'
 *     responses:
 *       201:
 *         description: Solicitud creada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: PQRSD submitted successfully
 *                 pqr:
 *                   $ref: '#/components/schemas/Pqr'
 *       400:
 *         description: Datos invalidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// POST /ingest - Submit a new PQRSD (Public - Citizen)
router.post('/ingest', async (req, res) => {
  try {
    const { content, channel } = req.body;

    if (!content || !channel) {
      return res.status(400).json({
        error: {
          status: 400,
          message: 'Content and channel are required'
        }
      });
    }

    const pqr = await PQR.create({ content, channel });
    res.status(201).json({
      message: 'PQRSD submitted successfully',
      pqr
    });
  } catch (error) {
    console.error('Ingest error:', error);
    res.status(400).json({
      error: {
        status: 400,
        message: error.message
      }
    });
  }
});

/**
 * @openapi
 * /api/analyze/{id}:
 *   post:
 *     tags: [PQR]
 *     summary: Analiza una PQRSD con IA
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la solicitud
 *     responses:
 *       200:
 *         description: Analisis completado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Analysis completed
 *                 pqr:
 *                   $ref: '#/components/schemas/Pqr'
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Solicitud no encontrada
 */
// POST /analyze/:id - Analyze PQRSD with AI (Protected - Admin)
router.post('/analyze/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const pqr = await PQR.getById(id);
    if (!pqr) {
      return res.status(404).json({
        error: {
          status: 404,
          message: 'PQR not found'
        }
      });
    }

    const analysis = await analyze(pqr.content);
    analysis.assignedDepartment = analysis.classification;
    const updatedPqr = await PQR.updateAnalysis(id, analysis);

    res.json({
      message: 'Analysis completed',
      pqr: updatedPqr
    });
  } catch (error) {
    console.error('Analyze error:', error);
    res.status(500).json({
      error: {
        status: 500,
        message: error.message
      }
    });
  }
});

// POST /pqrs/:id/accept - Accept current classification
router.post('/pqrs/:id/accept', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const pqr = await PQR.getById(id);

    if (!pqr) {
      return res.status(404).json({
        error: { status: 404, message: 'PQR not found' }
      });
    }

    const updatedPqr = await PQR.acceptClassification(id);
    res.json({ message: 'Classification accepted', pqr: updatedPqr });
  } catch (error) {
    console.error('Accept classification error:', error);
    res.status(400).json({
      error: { status: 400, message: error.message }
    });
  }
});

// PUT /pqrs/:id/classification - Modify classification and keep learning trace
router.put('/pqrs/:id/classification', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { classification, confidence, adminNotes } = req.body;

    if (!classification) {
      return res.status(400).json({
        error: { status: 400, message: 'Classification is required' }
      });
    }

    const existing = await PQR.getById(id);
    if (!existing) {
      return res.status(404).json({
        error: { status: 404, message: 'PQR not found' }
      });
    }

    const updatedPqr = await PQR.updateClassification(id, {
      classification,
      confidence: typeof confidence === 'number' ? confidence : existing.confidence
    });

    await Correction.create({
      pqrId: id,
      originalClassification: existing.classification,
      correctedClassification: classification,
      confidenceBefore: existing.confidence,
      confidenceAfter: updatedPqr.confidence,
      adminNotes,
      adminId: req.user.id
    });

    res.json({ message: 'Classification updated', pqr: updatedPqr });
  } catch (error) {
    console.error('Update classification error:', error);
    res.status(400).json({
      error: { status: 400, message: error.message }
    });
  }
});

/**
 * @openapi
 * /api/pqrs:
 *   get:
 *     tags: [PQR]
 *     summary: Lista solicitudes con filtros
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, analyzed, assigned, resolved]
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *     responses:
 *       200:
 *         description: Lista de solicitudes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PqrListResponse'
 *       401:
 *         description: No autenticado
 */
// GET /pqrs - Get all PQRSDs with optional pagination (Protected - Admin)
router.get('/pqrs', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { status, department, page, limit, paginate } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (department) filters.department = department;
    if (page) filters.page = parseInt(page);
    if (limit) filters.limit = parseInt(limit);
    
    // If user has department, filter by it
    if (req.user.department && !department) {
      filters.department = req.user.department;
    }

    // Use pagination if explicitly requested or if page is provided
    if (paginate === 'true' || page) {
      const result = await PQR.getAllPaginated(filters);
      res.json(result);
    } else {
      // Legacy: return all (for backward compatibility)
      const pqrs = await PQR.getAll(filters);
      res.json({ pqrs });
    }
  } catch (error) {
    console.error('Get all error:', error);
    res.status(500).json({
      error: {
        status: 500,
        message: error.message
      }
    });
  }
});

/**
 * @openapi
 * /api/pqrs/{id}:
 *   get:
 *     tags: [PQR]
 *     summary: Obtiene una solicitud por ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Solicitud encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pqr:
 *                   $ref: '#/components/schemas/Pqr'
 *       404:
 *         description: Solicitud no encontrada
 */
// GET /pqrs/:id - Get PQRSD by ID (Protected - Admin)
router.get('/pqrs/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const pqr = await PQR.getById(id);
    if (!pqr) {
      return res.status(404).json({
        error: {
          status: 404,
          message: 'PQR not found'
        }
      });
    }

    res.json({ pqr });
  } catch (error) {
    console.error('Get by ID error:', error);
    res.status(400).json({
      error: {
        status: 400,
        message: error.message
      }
    });
  }
});

/**
 * @openapi
 * /api/pqrs/{id}/status:
 *   put:
 *     tags: [PQR]
 *     summary: Actualiza estado de una solicitud
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StatusUpdateRequest'
 *     responses:
 *       200:
 *         description: Estado actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 pqr:
 *                   $ref: '#/components/schemas/Pqr'
 *       400:
 *         description: Datos invalidos
 */
// PUT /pqrs/:id/status - Update status (Protected - Admin)
router.put('/pqrs/:id/status', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        error: {
          status: 400,
          message: 'Status is required'
        }
      });
    }

    const updatedPqr = await PQR.updateStatus(id, status);
    res.json({
      message: 'Status updated',
      pqr: updatedPqr
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(400).json({
      error: {
        status: 400,
        message: error.message
      }
    });
  }
});

/**
 * @openapi
 * /api/pqrs/{id}/assign:
 *   put:
 *     tags: [PQR]
 *     summary: Asigna solicitud a dependencia y/o usuario
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignRequest'
 *     responses:
 *       200:
 *         description: Solicitud asignada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 pqr:
 *                   $ref: '#/components/schemas/Pqr'
 *       400:
 *         description: Datos invalidos
 */
// PUT /pqrs/:id/assign - Assign to user/department (Protected - Admin)
router.put('/pqrs/:id/assign', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, department } = req.body;

    if (!department) {
      return res.status(400).json({
        error: {
          status: 400,
          message: 'Department is required'
        }
      });
    }

    const updatedPqr = await PQR.assignToUser(id, userId, department);
    res.json({
      message: 'PQR assigned',
      pqr: updatedPqr
    });
  } catch (error) {
    console.error('Assign error:', error);
    res.status(400).json({
      error: {
        status: 400,
        message: error.message
      }
    });
  }
});

// POST /responses/:pqrId - Save or send response draft
router.post('/responses/:pqrId', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { pqrId } = req.params;
    const { response_text, send } = req.body;

    const result = await Response.upsertDraft({
      pqrId,
      userId: req.user.id,
      responseText: response_text,
      send: !!send
    });

    if (send) {
      await PQR.updateStatus(pqrId, 'resolved');
    }

    res.status(201).json({ message: send ? 'Response sent' : 'Draft saved', response: result });
  } catch (error) {
    console.error('Save response error:', error);
    res.status(400).json({
      error: { status: 400, message: error.message }
    });
  }
});

// GET /responses/:pqrId - Get current response draft
router.get('/responses/:pqrId', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { pqrId } = req.params;
    const responseDraft = await Response.getByPqrId(pqrId);
    res.json({ response: responseDraft });
  } catch (error) {
    console.error('Get response error:', error);
    res.status(400).json({
      error: { status: 400, message: error.message }
    });
  }
});

// GET /stats - Basic dashboard metrics
router.get('/stats', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const stats = await PQR.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      error: { status: 500, message: error.message }
    });
  }
});

// POST /analyze-preview - Preview analysis without saving (for real-time suggestions)
router.post('/analyze-preview', async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length < 20) {
      return res.status(400).json({
        error: {
          status: 400,
          message: 'Content must be at least 20 characters'
        }
      });
    }

    // Perform analysis without saving to DB
    const analysis = await analyze(content);

    res.json({
      message: 'Preview analysis completed',
      preview: {
        classification: analysis.classification,
        confidence: analysis.confidence,
        summary: analysis.summary,
        topics: analysis.topics,
        multi_dependency: analysis.multi_dependency
      }
    });
  } catch (error) {
    console.error('Preview analysis error:', error);
    res.status(500).json({
      error: {
        status: 500,
        message: 'Analysis failed: ' + error.message
      }
    });
  }
});

/**
 * @openapi
 * /api/import-email:
 *   post:
 *     tags: [Email Import]
 *     summary: Importar email y crear PQRSD automáticamente
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               from:
 *                 type: string
 *                 example: "ciudadano@example.com"
 *               subject:
 *                 type: string
 *                 example: "Problema con huecos en la calle"
 *               content:
 *                 type: string
 *                 example: "Tengo un problema grave..."
 *     responses:
 *       201:
 *         description: Email importado como PQRSD
 */
router.post('/import-email', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { from, subject, content } = req.body;

    // Validations
    if (!from || !subject || !content) {
      return res.status(400).json({
        error: {
          status: 400,
          message: 'Falta información: from, subject, content requeridos'
        }
      });
    }

    if (content.length < 20 || content.length > 2000) {
      return res.status(400).json({
        error: {
          status: 400,
          message: 'El contenido debe tener entre 20 y 2000 caracteres'
        }
      });
    }

    // Analyze with AI
    const analysis = await analyze(content);

    // Create PQRSD
    const result = await PQR.create({
      email: from,
      channel: 'email',
      title: subject,
      content: content,
      classification: analysis.classification,
      confidence: analysis.confidence,
      topics: analysis.topics,
      multi_dependency: analysis.multi_dependency,
      summary: analysis.summary,
      status: 'analyzed' // Mark as analyzed since we already did it
    });

    res.status(201).json({
      message: 'Email importado exitosamente',
      id: result.id,
      classification: result.classification,
      confidence: result.confidence,
      topics: result.topics,
      from: from,
      subject: subject
    });
  } catch (error) {
    console.error('Email import error:', error);
    res.status(500).json({
      error: {
        status: 500,
        message: 'Error importando email: ' + error.message
      }
    });
  }
});

module.exports = router;