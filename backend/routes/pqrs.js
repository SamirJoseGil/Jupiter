const express = require('express');
const PQR = require('../models/pqr');
const PqrRelation = require('../models/pqrRelation');
const FAQ = require('../models/faq');
const Response = require('../models/response');
const ResponseTemplate = require('../models/responseTemplate');
const User = require('../models/user');
const Correction = require('../models/correction');
const EmailIngestion = require('../models/emailIngestion');
const { analyze } = require('../services/ai');
const { uploadEvidenceFiles } = require('../services/storage');
const { GUIDELINES, DEFAULT_TEMPLATE } = require('../services/pqrsGuidelines');
const { tokenize, buildGenericAnswer, rankFAQs, findRelated } = require('../services/faqEngine');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const router = express.Router();

const FAQ_MATCH_THRESHOLD = 0.2;
const MAX_PQRS_PER_HOUR = 3;
const submissionTracker = new Map();
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_DOCUMENT_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);

const extractKeywords = (question) => tokenize(question).slice(0, 8);

const renderResponseTemplate = (template, context) => {
  return template
    .replace(/\{\{RADICADO\}\}/g, String(context.id || 'N/D'))
    .replace(/\{\{DEPENDENCIA\}\}/g, context.department || 'la dependencia competente')
    .replace(/\{\{ESTADO\}\}/g, context.status || 'en gestion')
    .replace(/\{\{RESUMEN_CASO\}\}/g, context.summary || 'Su solicitud se encuentra en revision inicial.');
};

const getRateLimitKey = (req, citizenId) => {
  if (citizenId) {
    return `citizen:${String(citizenId).trim()}`;
  }

  const forwardedFor = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const ip = forwardedFor || req.ip || 'unknown';
  return `ip:${ip}`;
};

const isWithinHourlyLimit = (key) => {
  const now = Date.now();
  const hourAgo = now - (60 * 60 * 1000);
  const existing = submissionTracker.get(key) || [];
  const recent = existing.filter((timestamp) => timestamp > hourAgo);

  if (recent.length >= MAX_PQRS_PER_HOUR) {
    return false;
  }

  return true;
};

const registerSubmission = (key) => {
  const now = Date.now();
  const hourAgo = now - (60 * 60 * 1000);
  const existing = submissionTracker.get(key) || [];
  const recent = existing.filter((timestamp) => timestamp > hourAgo);

  recent.push(now);
  submissionTracker.set(key, recent);
};

const validateEvidenceFiles = ({ files, allowedTypes, kind }) => {
  if (!Array.isArray(files)) {
    return;
  }

  for (const file of files) {
    const contentType = String(file?.contentType || '').toLowerCase();
    if (!allowedTypes.has(contentType)) {
      throw new Error(`Unsupported ${kind} format: ${contentType || 'unknown'}`);
    }

    const dataUrl = String(file?.dataUrl || '');
    if (!/^data:[^;]+;base64,/.test(dataUrl)) {
      throw new Error(`Invalid ${kind} payload`);
    }
  }
};

// GET /faq - List frequent questions (public)
router.get('/faq', async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 8, 30));
    const allFaqs = await FAQ.listAll();

    res.json({
      total: allFaqs.length,
      results: allFaqs.slice(0, limit).map((faq) => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        usage_count: faq.usage_count,
      })),
    });
  } catch (error) {
    console.error('FAQ list error:', error);
    res.status(500).json({
      error: { status: 500, message: error.message }
    });
  }
});

// GET /faq/search?q=... - Search in frequently asked questions
router.get('/faq/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 8, 20));

    if (!q) {
      return res.status(400).json({
        error: { status: 400, message: 'Query parameter q is required' }
      });
    }

    const allFaqs = await FAQ.listAll();
    const ranked = rankFAQs(q, allFaqs)
      .filter((faq) => faq.score > 0)
      .slice(0, limit)
      .map((faq) => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        score: Number(faq.score.toFixed(3)),
      }));

    res.json({
      query: q,
      total: ranked.length,
      results: ranked,
    });
  } catch (error) {
    console.error('FAQ search error:', error);
    res.status(500).json({
      error: { status: 500, message: error.message }
    });
  }
});

// POST /faq/ask - Answer a question using FAQ bank, with generic fallback + auto-creation
router.post('/faq/ask', async (req, res) => {
  try {
    const question = String(req.body?.question || '').trim();

    if (question.length < 6) {
      return res.status(400).json({
        error: { status: 400, message: 'Question must be at least 6 characters' }
      });
    }

    const allFaqs = await FAQ.listAll();
    const ranked = rankFAQs(question, allFaqs);
    const best = ranked[0];

    if (best && best.score >= FAQ_MATCH_THRESHOLD) {
      await FAQ.touchUsage(best.id);

      return res.json({
        source: 'faq',
        confidence: Number(best.score.toFixed(3)),
        answer: best.answer,
        matched: {
          id: best.id,
          question: best.question,
        },
        related: findRelated(best, ranked),
        created: false,
      });
    }

    const keywords = extractKeywords(question);
    const genericAnswer = buildGenericAnswer(question);
    const createdFaq = await FAQ.create({
      question,
      answer: genericAnswer,
      keywords,
    });

    return res.status(201).json({
      source: 'generated',
      confidence: best ? Number(best.score.toFixed(3)) : 0,
      answer: genericAnswer,
      matched: best
        ? {
            id: best.id,
            question: best.question,
          }
        : null,
      related: best ? findRelated(best, ranked) : [],
      created: true,
      faq: createdFaq,
    });
  } catch (error) {
    console.error('FAQ ask error:', error);
    res.status(500).json({
      error: { status: 500, message: error.message }
    });
  }
});

// POST /faq - Create FAQ manually (admin)
router.post('/faq', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const question = String(req.body?.question || '').trim();
    const answer = String(req.body?.answer || '').trim();
    const keywords = Array.isArray(req.body?.keywords)
      ? req.body.keywords.map((k) => String(k).trim()).filter(Boolean)
      : extractKeywords(question);

    if (question.length < 6 || answer.length < 10) {
      return res.status(400).json({
        error: { status: 400, message: 'Question and answer are required with valid length' }
      });
    }

    const created = await FAQ.create({ question, answer, keywords });
    res.status(201).json({ message: 'FAQ created', faq: created });
  } catch (error) {
    console.error('FAQ create error:', error);
    res.status(400).json({
      error: { status: 400, message: error.message }
    });
  }
});

// PUT /faq/:id - Update FAQ manually (admin)
router.put('/faq/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({
        error: { status: 400, message: 'Invalid FAQ id' }
      });
    }

    const question = String(req.body?.question || '').trim();
    const answer = String(req.body?.answer || '').trim();
    const keywords = Array.isArray(req.body?.keywords)
      ? req.body.keywords.map((k) => String(k).trim()).filter(Boolean)
      : extractKeywords(question);

    if (question.length < 6 || answer.length < 10) {
      return res.status(400).json({
        error: { status: 400, message: 'Question and answer are required with valid length' }
      });
    }

    const existing = await FAQ.getById(id);
    if (!existing) {
      return res.status(404).json({
        error: { status: 404, message: 'FAQ not found' }
      });
    }

    const updated = await FAQ.update(id, { question, answer, keywords });
    res.json({ message: 'FAQ updated', faq: updated });
  } catch (error) {
    console.error('FAQ update error:', error);
    res.status(400).json({
      error: { status: 400, message: error.message }
    });
  }
});

// DELETE /faq/:id - Delete FAQ manually (admin)
router.delete('/faq/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({
        error: { status: 400, message: 'Invalid FAQ id' }
      });
    }

    const deleted = await FAQ.delete(id);
    if (!deleted) {
      return res.status(404).json({
        error: { status: 404, message: 'FAQ not found' }
      });
    }

    res.json({ message: 'FAQ deleted', faq: deleted });
  } catch (error) {
    console.error('FAQ delete error:', error);
    res.status(400).json({
      error: { status: 400, message: error.message }
    });
  }
});

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
 *     summary: Crea una nueva solicitud PQRSDfDf (publico)
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
 *                   example: PQRSDfDf submitted successfully
 *                 pqr:
 *                   $ref: '#/components/schemas/Pqr'
 *       400:
 *         description: Datos invalidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// POST /ingest - Submit a new PQRSDfDf (Public - Citizen)
router.post('/ingest', async (req, res) => {
  try {
    const { content, channel, citizenId, neighborhood, evidenceImages = [], evidenceDocuments = [] } = req.body;

    if (!content || !channel) {
      return res.status(400).json({
        error: {
          status: 400,
          message: 'Content and channel are required'
        }
      });
    }

    validateEvidenceFiles({ files: evidenceImages, allowedTypes: ALLOWED_IMAGE_TYPES, kind: 'image' });
    validateEvidenceFiles({ files: evidenceDocuments, allowedTypes: ALLOWED_DOCUMENT_TYPES, kind: 'document' });

    const rateLimitKey = getRateLimitKey(req, citizenId);
    if (!isWithinHourlyLimit(rateLimitKey)) {
      return res.status(429).json({
        error: {
          status: 429,
          message: 'Has alcanzado el maximo de 3 radicados por hora. Intenta nuevamente mas tarde.'
        }
      });
    }

    let pqr = await PQR.create({ content, channel, citizenId, neighborhood });

    const hasImageEvidence = Array.isArray(evidenceImages) && evidenceImages.length > 0;
    const hasDocumentEvidence = Array.isArray(evidenceDocuments) && evidenceDocuments.length > 0;

    if (hasImageEvidence || hasDocumentEvidence) {
      const uploadedImages = hasImageEvidence
        ? await uploadEvidenceFiles({ trackingId: pqr.id, files: evidenceImages, kind: 'images' })
        : [];
      const uploadedDocuments = hasDocumentEvidence
        ? await uploadEvidenceFiles({ trackingId: pqr.id, files: evidenceDocuments, kind: 'documents' })
        : [];

      pqr = await PQR.attachEvidence(pqr.id, {
        images: uploadedImages,
        documents: uploadedDocuments,
      });
    }

    try {
      const tableName = await PQR.getTableName();
      await PqrRelation.rebuildForPqr(pqr.id, tableName);
    } catch (relationError) {
      console.warn('PQR relation rebuild warning:', relationError.message);
    }

    registerSubmission(rateLimitKey);

    res.status(201).json({
      message: 'PQRSDF submitted successfully',
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

// GET /PQRSDf/:id/relations - Get related PQRS entries (admin)
router.get('/PQRSDf/:id/relations', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const tableName = await PQR.getTableName();
    const items = await PqrRelation.listByPqr(id, tableName);
    res.json({ relations: items });
  } catch (error) {
    console.error('Relations list error:', error);
    res.status(400).json({
      error: { status: 400, message: error.message }
    });
  }
});

// POST /PQRSDf/:id/relations/rebuild - Recalculate related PQRS entries (admin)
router.post('/PQRSDf/:id/relations/rebuild', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const tableName = await PQR.getTableName();
    const rebuilt = await PqrRelation.rebuildForPqr(id, tableName);
    res.json({ message: 'Relations rebuilt', relations: rebuilt });
  } catch (error) {
    console.error('Relations rebuild error:', error);
    res.status(400).json({
      error: { status: 400, message: error.message }
    });
  }
});

// DELETE /PQRSDf/:id/relations/:relatedId - Remove relation manually (admin)
router.delete('/PQRSDf/:id/relations/:relatedId', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id, relatedId } = req.params;
    const removed = await PqrRelation.deleteRelation(id, relatedId);
    res.json({ message: 'Relation removed', relation: removed });
  } catch (error) {
    console.error('Relations delete error:', error);
    res.status(400).json({
      error: { status: 400, message: error.message }
    });
  }
});

// GET /pqrs-status/:id - Public status check by tracking ID
router.get('/pqrs-status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const citizenId = req.query.cc ? String(req.query.cc).trim() : null;

    const pqr = await PQR.getPublicStatusById(id, citizenId);
    if (!pqr) {
      return res.status(404).json({
        error: {
          status: 404,
          message: 'PQRSDF not found for provided data'
        }
      });
    }

    return res.json({
      tracking: pqr.id,
      status: pqr.status,
      channel: pqr.channel,
      classification: pqr.classification,
      assigned_department: pqr.assigned_department,
      created_at: pqr.created_at,
      updated_at: pqr.updated_at,
    });
  } catch (error) {
    console.error('Public status error:', error);
    return res.status(400).json({
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
 *     summary: Analiza una PQRSDfDf con IA
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
// POST /analyze/:id - Analyze PQRSDfDf with AI (Protected - Admin)
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

// POST /PQRSDf/:id/accept - Accept current classification
router.post('/PQRSDf/:id/accept', verifyToken, verifyAdmin, async (req, res) => {
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

// PUT /PQRSDf/:id/classification - Modify classification and keep learning trace
router.put('/PQRSDf/:id/classification', verifyToken, verifyAdmin, async (req, res) => {
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
 * /api/PQRSDf:
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
// GET /PQRSDf - Get all PQRSDfDfs with optional pagination (Protected - Admin)
router.get('/PQRSDf', verifyToken, verifyAdmin, async (req, res) => {
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
      const PQRSDf = await PQR.getAll(filters);
      res.json({ PQRSDf });
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
 * /api/PQRSDf/{id}:
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
// GET /PQRSDf/:id - Get PQRSDfDf by ID (Protected - Admin)
router.get('/PQRSDf/:id', verifyToken, verifyAdmin, async (req, res) => {
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
 * /api/PQRSDf/{id}/status:
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
// PUT /PQRSDf/:id/status - Update status (Protected - Admin)
router.put('/PQRSDf/:id/status', verifyToken, verifyAdmin, async (req, res) => {
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
 * /api/PQRSDf/{id}/assign:
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
// PUT /PQRSDf/:id/assign - Assign to user/department (Protected - Admin)
router.put('/PQRSDf/:id/assign', verifyToken, verifyAdmin, async (req, res) => {
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

// GET /responses/templates - Get active response template and available templates
router.get('/responses/templates', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const active = await ResponseTemplate.getActive();
    const list = await ResponseTemplate.listAll();
    res.json({
      active: active || { name: 'Plantilla institucional', body: DEFAULT_TEMPLATE, is_active: true },
      templates: list,
      context: GUIDELINES,
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      error: { status: 500, message: error.message }
    });
  }
});

// PUT /responses/templates - Update active response template
router.put('/responses/templates', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const name = String(req.body?.name || 'Plantilla institucional').trim();
    const body = String(req.body?.body || '').trim();

    if (!body || body.length < 20) {
      return res.status(400).json({
        error: { status: 400, message: 'Template body is required (min 20 chars)' }
      });
    }

    const updated = await ResponseTemplate.upsertActive({ name, body });
    res.json({ message: 'Template updated', template: updated });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(400).json({
      error: { status: 400, message: error.message }
    });
  }
});

// POST /responses/:pqrId/generate - Generate institutional pre-response with IA context
router.post('/responses/:pqrId/generate', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { pqrId } = req.params;
    const pqr = await PQR.getById(pqrId);

    if (!pqr) {
      return res.status(404).json({
        error: { status: 404, message: 'PQR not found' }
      });
    }

    const activeTemplate = await ResponseTemplate.getActive();
    const templateBody = activeTemplate?.body || DEFAULT_TEMPLATE;

    let summary = pqr.summary;
    let department = pqr.assigned_department || pqr.classification;

    if (!summary || !department) {
      const aiResult = await analyze(pqr.content);
      summary = summary || aiResult.summary;
      department = department || aiResult.classification;
    }

    const generatedText = renderResponseTemplate(templateBody, {
      id: pqr.id,
      status: pqr.status,
      summary,
      department,
    });

    const stored = await Response.upsertDraft({
      pqrId,
      userId: req.user.id,
      responseText: `${generatedText}\n\nReferencia normativa: ${GUIDELINES}`,
      send: false,
    });

    res.status(201).json({
      message: 'Pre-response generated',
      response: stored,
      generated: generatedText,
    });
  } catch (error) {
    console.error('Generate response error:', error);
    res.status(500).json({
      error: { status: 500, message: error.message }
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
    const tableName = await PQR.getTableName();
    const [stats, responseMetrics, pqrBreakdown, faqMetrics, userMetrics, templateMetrics, responseBreakdown] = await Promise.all([
      PQR.getStats(),
      Response.getMetrics(tableName),
      PQR.getBreakdownMetrics(),
      FAQ.getMetrics(),
      User.getMetrics(),
      ResponseTemplate.getMetrics(),
      Response.getBreakdown(),
    ]);

    res.json({
      ...stats,
      ...pqrBreakdown,
      response_metrics: responseMetrics,
      response_breakdown: responseBreakdown,
      faq_metrics: faqMetrics,
      user_metrics: userMetrics,
      template_metrics: templateMetrics,
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      error: { status: 500, message: error.message }
    });
  }
});

// GET /stats/survey-random - AI sondage using random FAQ questions
router.get('/stats/survey-random', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const sampleSize = Math.max(3, Math.min(parseInt(req.query.size, 10) || 5, 10));
    const allFaqs = await FAQ.listAll();

    if (!allFaqs.length) {
      return res.status(404).json({
        error: { status: 404, message: 'No FAQ questions available for survey' }
      });
    }

    const shuffled = [...allFaqs].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, sampleSize);
    const prompt = selected.map((item, idx) => `${idx + 1}. ${item.question}`).join('\n');

    const aiPreview = await analyze(`Sondeo ciudadano basado en preguntas frecuentes:\n${prompt}`);

    res.json({
      sample_size: selected.length,
      questions: selected.map((item) => ({ id: item.id, question: item.question })),
      ai_probe: {
        classification: aiPreview.classification,
        confidence: aiPreview.confidence,
        summary: aiPreview.summary,
        topics: aiPreview.topics,
      }
    });
  } catch (error) {
    console.error('Survey sondage error:', error);
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
 *     summary: Importar email y crear PQRSDfDf automáticamente
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
 *         description: Email importado como PQRSDfDf
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
 *     description: Recibe payload de n8n, analiza con IA y guarda PQRSDfDf en BD.
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