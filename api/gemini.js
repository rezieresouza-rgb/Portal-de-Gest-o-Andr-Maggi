import { GoogleGenAI } from '@google/genai';

const FALLBACK_MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'];

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: { code: 405, status: 'METHOD_NOT_ALLOWED', message: 'Use POST /api/gemini.' }
    });
  }

  const apiKey = (
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.API_KEY ||
    ''
  ).trim();

  if (!apiKey) {
    return res.status(503).json({
      error: {
        code: 503,
        status: 'NOT_CONFIGURED',
        message: 'Variável GEMINI_API_KEY não configurada no servidor Vercel.'
      }
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { model, models, contents, config } = body;

    if (!contents) {
      return res.status(400).json({
        error: { code: 400, status: 'INVALID_ARGUMENT', message: 'Campo "contents" é obrigatório.' }
      });
    }

    const requestedModels = Array.isArray(models) && models.length > 0
      ? models
      : model
        ? [model, ...FALLBACK_MODELS]
        : FALLBACK_MODELS;

    const uniqueModels = [...new Set(requestedModels.filter(Boolean))];
    const ai = new GoogleGenAI({ apiKey, apiVersion: 'v1beta' });

    let lastError = null;
    for (const candidateModel of uniqueModels) {
      try {
        const requestPayload = { model: candidateModel, contents };
        if (config !== undefined) {
          requestPayload.config = config;
        }
        const response = await ai.models.generateContent(requestPayload);
        return res.status(200).json({
          text: response.text || '',
          model: candidateModel
        });
      } catch (err) {
        lastError = err;
        const msg = String(err?.message || '');
        const code = err?.status || err?.code;
        const isModelIssue =
          code === 404 ||
          msg.includes('404') ||
          msg.toLowerCase().includes('not found') ||
          msg.toLowerCase().includes('not supported') ||
          code === 503 ||
          msg.includes('503');

        if (isModelIssue) {
          continue;
        }
        break;
      }
    }

    const errMsg = String(lastError?.message || 'Erro ao chamar API do Gemini.');
    let httpStatus = Number(lastError?.status || lastError?.code || 0);
    if (!Number.isInteger(httpStatus) || httpStatus < 400 || httpStatus > 599 || httpStatus === 500) {
      if (errMsg.includes('402') || errMsg.toLowerCase().includes('prepayment credits')) httpStatus = 402;
      else if (errMsg.includes('403') || errMsg.toLowerCase().includes('leaked') || errMsg.includes('PERMISSION_DENIED')) httpStatus = 403;
      else if (errMsg.includes('429') || errMsg.toLowerCase().includes('quota')) httpStatus = 429;
      else if (errMsg.includes('404')) httpStatus = 404;
      else if (!Number.isInteger(httpStatus) || httpStatus < 400 || httpStatus > 599) httpStatus = 500;
    }

    return res.status(httpStatus).json({
      error: {
        code: httpStatus,
        status: lastError?.statusText || 'GEMINI_ERROR',
        message: errMsg
      }
    });
  } catch (error) {
    console.error('[api/gemini] Unexpected error:', error);
    return res.status(500).json({
      error: {
        code: 500,
        status: 'INTERNAL_ERROR',
        message: String(error?.message || 'Erro interno ao processar requisição de IA.')
      }
    });
  }
}
