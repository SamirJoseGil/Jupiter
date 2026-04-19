const express = require('express');
const PQR = require('../models/pqr');
const Response = require('../models/response');
const Correction = require('../models/correction');
const EmailIngestion = require('../models/emailIngestion');
const { analyze } = require('../services/ai');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const router = express.Router();

const mapN8nEmailPayload = (payload = {}) => {
  const from = payload.from || payload.sender || payload.email || payload.senderEmail;
  const subject = payload.subject || payload.title || '(Sin asunto)';
  const content = payload.content || payload.body || payload.text || '';
  const externalMessageId = payload.messageId || payload.gmailMessageId || payload.id || null;

  return {
    from,
    subject,
    content,
    externalMessageId,
  };
};

const createAnalyzedEmailPqr = async ({ from, subject, content, externalMessageId, rawPayload }) => {
  if (!from || !subject || !content) {
    throw new Error('Missing required fields: from, subject, content');
  }

  if (content.length < 20 || content.length > 5000) {
    throw new Error('Content must be between 20 and 5000 characters');
  }

  const duplicated = externalMessageId
    ? await EmailIngestion.getByExternalMessageId(externalMessageId)
    : null;

  if (duplicated) {
    return {
      duplicated: true,
      ingestion: duplicated,
      pqrId: duplicated.pqr_id || null,
    };
  }

  const ingestion = await EmailIngestion.create({
    externalMessageId,
    senderEmail: from,
    subject,
    content,
    rawPayload,
  });

  try {
    const pqr = await PQR.create({
      content: `[Email] ${subject}\n\n${content}`,
      channel: 'email',
    });

    const analysis = await analyze(content);
    const updatedPqr = await PQR.updateAnalysis(pqr.id, {
      ...analysis,
      assignedDepartment: analysis.classification,
    });

    await EmailIngestion.markProcessed(ingestion.id, updatedPqr.id);

    return {
      duplicated: false,
      ingestion,
      pqrId: updatedPqr.id,
      pqr: updatedPqr,
    };
  } catch (error) {
    await EmailIngestion.markFailed(ingestion.id, error.message);
    throw error;
  }
};

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
    const { from, subject, content, messageId } = req.body;

    const result = await createAnalyzedEmailPqr({
      from,
      subject,
      content,
      externalMessageId: messageId || null,
      rawPayload: req.body,
    });

    if (result.duplicated) {
      return res.status(200).json({
        message: 'Email ya procesado previamente',
        duplicated: true,
        id: result.pqrId,
      });
    }

    res.status(201).json({
      message: 'Email importado exitosamente',
      id: result.pqr.id,
      classification: result.pqr.classification,
      confidence: result.pqr.confidence,
      topics: result.pqr.topics,
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

/**
 * @openapi
 * /api/webhooks/n8n/email:
 *   post:
 *     tags: [Email Import]
 *     summary: Webhook de n8n para ingesta automatica de correos
 *     description: Recibe payload de n8n, analiza con IA y guarda PQRSD en BD.
 *     requestBody:
 *       required: true
 *     responses:
 *       200:
 *         description: Procesado correctamente
 *       401:
 *         description: Webhook secret invalido
 */
router.post('/webhooks/n8n/email', async (req, res) => {
  try {
    const configuredSecret = process.env.N8N_WEBHOOK_SECRET;

    if (!configuredSecret) {
      return res.status(503).json({
        error: {
          status: 503,
          message: 'N8N_WEBHOOK_SECRET is not configured'
        }
      });
    }

    const incomingSecret = req.headers['x-webhook-secret'] || req.query.secret;
    if (!incomingSecret || incomingSecret !== configuredSecret) {
      return res.status(401).json({
        error: {
          status: 401,
          message: 'Invalid webhook secret'
        }
      });
    }

    const payloadItems = Array.isArray(req.body?.emails)
      ? req.body.emails
      : Array.isArray(req.body)
      ? req.body
      : [req.body];

    const processed = [];
    const failed = [];

    for (const item of payloadItems) {
      const { from, subject, content, externalMessageId } = mapN8nEmailPayload(item);

      try {
        const result = await createAnalyzedEmailPqr({
          from,
          subject,
          content,
          externalMessageId,
          rawPayload: item,
        });

        processed.push({
          externalMessageId: externalMessageId || null,
          duplicated: result.duplicated,
          pqrId: result.pqrId || result.pqr?.id || null,
        });
      } catch (error) {
        failed.push({
          externalMessageId: externalMessageId || null,
          error: error.message,
        });
      }
    }

    res.status(200).json({
      message: 'n8n email webhook processed',
      total: payloadItems.length,
      processed: processed.length,
      failed: failed.length,
      results: processed,
      errors: failed,
    });
  } catch (error) {
    console.error('n8n webhook error:', error);
    res.status(500).json({
      error: {
        status: 500,
        message: 'Webhook processing failed: ' + error.message
      }
    });
  }
});

module.exports = router;