const knowledgeBase = require('../knowledge_base.json');

const STOPWORDS = new Set([
  'de', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'o', 'u', 'a', 'ante',
  'bajo', 'con', 'contra', 'desde', 'durante', 'en', 'entre', 'hacia', 'hasta', 'mediante',
  'para', 'por', 'segun', 'sin', 'sobre', 'tras', 'que', 'como', 'cual', 'cuales', 'cuando',
  'donde', 'quien', 'quienes', 'se', 'me', 'te', 'nos', 'les', 'mi', 'tu', 'su', 'sus', 'al',
  'del', 'es', 'son', 'fue', 'ser', 'estar', 'esta', 'estas', 'esto', 'estos', 'esta', 'porfavor',
  'favor', 'hola', 'buenas', 'buenos', 'dias', 'tardes', 'noches', 'quiero', 'necesito', 'ayuda'
]);

const normalizeText = (text = '') => text
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const tokenize = (text = '') => normalizeText(text)
  .split(' ')
  .filter((token) => token.length > 2 && !STOPWORDS.has(token));

const unique = (items) => Array.from(new Set(items));

const jaccard = (aTokens, bTokens) => {
  const setA = new Set(aTokens);
  const setB = new Set(bTokens);

  if (!setA.size || !setB.size) {
    return 0;
  }

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) {
      intersection += 1;
    }
  }

  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
};

const overlapBonus = (aTokens, bTokens) => {
  if (!aTokens.length || !bTokens.length) {
    return 0;
  }

  const setB = new Set(bTokens);
  const overlapCount = aTokens.filter((token) => setB.has(token)).length;
  return Math.min(0.3, overlapCount * 0.05);
};

const detectDepartment = (question = '') => {
  const normalized = normalizeText(question);
  let selected = null;
  let bestScore = 0;

  for (const [department, info] of Object.entries(knowledgeBase.departamentos || {})) {
    const hits = (info.keywords || []).reduce((acc, keyword) => {
      return acc + (normalized.includes(normalizeText(keyword)) ? 1 : 0);
    }, 0);

    if (hits > bestScore) {
      bestScore = hits;
      selected = department;
    }
  }

  return selected;
};

const buildGenericAnswer = (question) => {
  const department = detectDepartment(question);

  const intro = 'Gracias por tu consulta. Esta respuesta es orientativa y puede requerir validacion administrativa.';
  const genericSteps = [
    'Verifica que la informacion incluya ubicacion, fecha aproximada y una descripcion clara del caso.',
    'Si aplica, adjunta evidencias (fotos, documentos o referencias).',
    'Radica la solicitud por los canales oficiales y conserva el numero de seguimiento.',
    'Si no recibes avance, presenta seguimiento con el mismo caso para evitar duplicados.'
  ];

  if (department) {
    return `${intro} Por el tipo de pregunta, podria corresponder a ${department}. ${genericSteps.join(' ')}`;
  }

  return `${intro} ${genericSteps.join(' ')}`;
};

const scoreCandidate = (question, faq) => {
  const normalizedQuestion = normalizeText(question);
  const normalizedFaqQuestion = normalizeText(faq.question || '');
  const questionTokens = tokenize(question);
  const faqTokens = unique([
    ...tokenize(faq.question || ''),
    ...(Array.isArray(faq.keywords) ? faq.keywords.map((k) => normalizeText(k)) : [])
  ]);

  const similarity = jaccard(questionTokens, faqTokens);
  const bonus = overlapBonus(questionTokens, faqTokens);
  const usageBoost = Math.min(0.1, (faq.usage_count || 0) * 0.01);
  const phraseBoost =
    normalizedQuestion.includes(normalizedFaqQuestion) || normalizedFaqQuestion.includes(normalizedQuestion)
      ? 0.25
      : 0;

  const keywordHits = questionTokens.filter((token) => faqTokens.includes(token)).length;
  const keywordBoost = Math.min(0.25, keywordHits * 0.08);

  return Math.min(1, similarity + bonus + usageBoost + phraseBoost + keywordBoost);
};

const rankFAQs = (question, faqs = []) => {
  return faqs
    .map((faq) => ({ ...faq, score: scoreCandidate(question, faq) }))
    .sort((a, b) => b.score - a.score);
};

const findRelated = (baseFaq, rankedFAQs, limit = 4) => {
  const related = rankedFAQs
    .filter((faq) => faq.id !== baseFaq.id)
    .slice(0, limit)
    .map((faq) => ({
      id: faq.id,
      question: faq.question,
      score: Number(faq.score.toFixed(3)),
    }));

  return related;
};

module.exports = {
  normalizeText,
  tokenize,
  buildGenericAnswer,
  rankFAQs,
  findRelated,
};
