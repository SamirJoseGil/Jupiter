const axios = require('axios');
const knowledgeBase = require('../knowledge_base.json');
require('dotenv').config();

// Use Gemini API by default (free tier available)
// Falls back to mock if API key is not set
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const analyzeWithMock = (content) => {
  // Simple keyword matching to classify
  const lowerContent = content.toLowerCase();
  let bestMatch = 'Servicios Públicos';
  let maxMatches = 0;

  for (const [dept, info] of Object.entries(knowledgeBase.departamentos)) {
    const matches = info.keywords.filter((kw) =>
      lowerContent.includes(kw)
    ).length;

    if (matches > maxMatches) {
      maxMatches = matches;
      bestMatch = dept;
    }
  }

  // Extract topics (keywords found in content)
  const topics = [];
  for (const [, info] of Object.entries(knowledgeBase.departamentos)) {
    info.keywords.forEach((kw) => {
      if (lowerContent.includes(kw) && !topics.includes(kw)) {
        topics.push(kw);
      }
    });
  }

  const confidence = Math.min(95, 60 + maxMatches * 10);
  const multi_dependency = maxMatches > 3 || content.length > 500;

  return {
    classification: bestMatch,
    confidence,
    summary: `Solicitud de: ${bestMatch.toLowerCase()}. ${content.substring(0, 100)}...`,
    topics: topics.slice(0, 5),
    multi_dependency,
  };
};

const analyzeWithGemini = async (content) => {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: `Actúa como analista de PQRSDfDfs en Medellín, Colombia.
                
Departamentos disponibles: ${Object.keys(knowledgeBase.departamentos).join(', ')}

Análiza la PQRSDfDf y devuelve SOLO un JSON válido (sin markdown adicional) con exactamente estos campos:
- classification: Nombre del departamento
- confidence: Número entre 0-100
- summary: Resumen de máximo 150 caracteres
- topics: Array de máximo 5 temas/palabras clave
- multi_dependency: Boolean true/false si afecta múltiples dependencias

PQRSDfDf a analizar:
${content}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      }
    );

    if (response.data.candidates && response.data.candidates[0]) {
      const result = response.data.candidates[0].content.parts[0].text;
      // Try to parse JSON from response
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
    return analyzeWithMock(content); // Fallback
  } catch (error) {
    console.error('Gemini API error:', error.message);
    return analyzeWithMock(content); // Fallback to mock
  }
};

const analyzeWithOpenAI = async (content) => {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Actúa como analista de PQRSDfDfs en Medellín, Colombia.
            
Departamentos disponibles: ${Object.keys(knowledgeBase.departamentos).join(', ')}

Análiza la PQRSDfDf y devuelve un JSON válido (sin markdown) con exactamente estos campos:
- classification: Nombre del departamento
- confidence: Número entre 0-100
- summary: Resumen de máximo 150 caracteres
- topics: Array de máximo 5 temas/palabras clave
- multi_dependency: Boolean true/false si afecta múltiples dependencias`,
          },
          {
            role: 'user',
            content: `Analiza esta PQRSDfDf:\n\n${content}`,
          },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const result = response.data.choices[0].message.content;
    // Try to parse JSON from response
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return analyzeWithMock(content); // Fallback
  } catch (error) {
    console.error('OpenAI API error:', error.message);
    return analyzeWithMock(content); // Fallback to mock
  }
};

const analyze = async (content) => {
  // Priority: Gemini > OpenAI > Mock
  if (GEMINI_API_KEY) {
    console.log('Using Gemini API for analysis');
    return await analyzeWithGemini(content);
  }
  if (OPENAI_API_KEY) {
    console.log('Using OpenAI API for analysis');
    return await analyzeWithOpenAI(content);
  }
  console.log('Using Mock analysis (no API keys configured)');
  return analyzeWithMock(content);
};

module.exports = {
  analyze,
};