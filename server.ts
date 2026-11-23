import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import {
  buildAskPersonaPrompt,
  buildDeliberationPrompt,
  buildImpactPrompt,
  buildReflectionPrompt,
  buildRevisionsPrompt,
  COMMON_SYSTEM_INSTRUCTION,
} from './src/lib/prompts.ts';
import {
  ASK_PERSONA_RESPONSE_SCHEMA,
  DELIBERATION_RESPONSE_SCHEMA,
  IMPACT_RESPONSE_SCHEMA,
  REFLECTION_RESPONSE_SCHEMA,
  REVISIONS_RESPONSE_SCHEMA,
} from './src/lib/schemas.ts';
import {
  isValidAskPersonaResponse,
  isValidDeliberationResponse,
  isValidImpactResponse,
  isValidReflectionResponse,
  isValidRevisionsResponse,
  validateBillDraft,
} from './src/lib/validation.ts';
import type {
  BillDraft,
  FormalBill,
  ImpactResponse,
  Persona,
  PersonaChatTurn,
  ValueWeights,
} from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODEL_NAME = 'gemini-3.1-flash-lite';

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY가 설정되어 있지 않습니다. Settings > Secrets에서 확인해주세요.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function withTimeout<T>(promise: Promise<T>, ms: number, controller?: AbortController): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller?.abort();
          reject(new Error('TIMEOUT: AI 응답 시간이 초과되었습니다.'));
        }, ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function generateStructuredJson<T>(
  prompt: string,
  responseSchema: Record<string, unknown>,
  validator: (data: unknown) => data is T,
): Promise<T> {
  const ai = getAiClient();
  let lastError: unknown = null;

  // Retry once automatically if JSON parsing or schema validation fails
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const attemptTimeout = attempt === 0 ? 25_000 : 18_000;
    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: prompt,
          config: {
            systemInstruction: COMMON_SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema,
            thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
            abortSignal: controller.signal,
          },
        }),
        attemptTimeout,
        controller,
      );

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        throw new Error('SCHEMA_EMPTY: 빈 응답이 반환되었습니다.');
      }
      const parsed = JSON.parse(rawText);
      if (!validator(parsed)) {
        throw new Error('SCHEMA_MISMATCH: 응답 스키마가 기대한 형식과 일치하지 않습니다.');
      }
      return parsed;
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Gemini attempt ${attempt + 1} failed]`, msg);
      // Do not retry auth, model-not-found, bad-request, timeout, or quota errors
      if (
        msg.includes('TIMEOUT') ||
        msg.includes('API_KEY') ||
        msg.includes('PERMISSION_DENIED') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('NOT_FOUND') ||
        msg.includes('INVALID_ARGUMENT')
      ) {
        throw err;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('AI 응답 처리에 실패했습니다.');
}

function formatServerError(err: unknown): { status: number; message: string } {
  const msg = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
  if (msg.includes('GEMINI_API_KEY') || msg.includes('API_KEY_INVALID') || msg.includes('API key')) {
    return {
      status: 500,
      message: 'Gemini API 키 설정을 확인해주세요. (Settings > Secrets 패널에서 GEMINI_API_KEY 확인)',
    };
  }
  if (msg.includes('PERMISSION_DENIED')) {
    return {
      status: 403,
      message: 'Gemini API 접근 권한이 없습니다. Settings > Secrets 패널에서 API 키를 확인해주세요.',
    };
  }
  if (msg.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      message: '요청 한도를 초과했습니다. 잠시 후 다시 시도하거나 예시 데이터로 이어갈 수 있습니다.',
    };
  }
  if (msg.includes('TIMEOUT') || msg.includes('시간이 초과')) {
    return {
      status: 504,
      message: 'AI 응답 시간이 초과되어 중단되었습니다. 다시 시도하거나 예시 데이터로 이어갈 수 있습니다.',
    };
  }
  return {
    status: 502,
    message: 'AI 심의 엔진에서 응답을 정리하는 중 문제가 발생했습니다. 다시 시도하거나 예시 데이터로 이어갈 수 있습니다.',
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.post('/api/deliberate', async (req, res) => {
    try {
      const draft = req.body?.draft as BillDraft | undefined;
      if (!draft) {
        res.status(400).json({ error: '법안 초안 정보가 누락되었습니다.' });
        return;
      }
      const check = validateBillDraft(draft);
      if (!check.isValid) {
        const firstErr = Object.values(check.errors)[0] ?? '입력값을 확인해주세요.';
        res.status(400).json({ error: firstErr });
        return;
      }
      const result = await generateStructuredJson(
        buildDeliberationPrompt(draft),
        DELIBERATION_RESPONSE_SCHEMA,
        isValidDeliberationResponse,
      );
      res.json(result);
    } catch (err) {
      console.error('[POST /api/deliberate]', err);
      const { status, message } = formatServerError(err);
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/impact', async (req, res) => {
    try {
      const bill = req.body?.bill as FormalBill | undefined;
      const personas = req.body?.personas as Persona[] | undefined;
      if (!bill || !Array.isArray(personas) || personas.length === 0) {
        res.status(400).json({ error: '조문화된 법안과 이해관계자 정보가 필요합니다.' });
        return;
      }
      const result = await generateStructuredJson(
        buildImpactPrompt(bill, personas),
        IMPACT_RESPONSE_SCHEMA,
        isValidImpactResponse,
      );
      res.json(result);
    } catch (err) {
      console.error('[POST /api/impact]', err);
      const { status, message } = formatServerError(err);
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/revisions', async (req, res) => {
    try {
      const bill = req.body?.bill as FormalBill | undefined;
      const impact = req.body?.impact as ImpactResponse | undefined;
      if (!bill || !impact) {
        res.status(400).json({ error: '원안 법안과 영향평가 결과가 필요합니다.' });
        return;
      }
      const result = await generateStructuredJson(
        buildRevisionsPrompt(bill, impact),
        REVISIONS_RESPONSE_SCHEMA,
        isValidRevisionsResponse,
      );
      res.json(result);
    } catch (err) {
      console.error('[POST /api/revisions]', err);
      const { status, message } = formatServerError(err);
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/ask-persona', async (req, res) => {
    try {
      const persona = req.body?.persona as Persona | undefined;
      const bill = req.body?.bill as FormalBill | undefined;
      const history = (req.body?.history ?? []) as PersonaChatTurn[];
      const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';

      if (!persona || !bill || !question) {
        res.status(400).json({ error: '질문 내용과 대상 이해관계자 정보가 필요합니다.' });
        return;
      }
      if (question.length > 200) {
        res.status(400).json({ error: '질문은 200자 이하로 입력해주세요.' });
        return;
      }
      if (history.length >= 3) {
        res.status(400).json({ error: '이해관계자 한 명당 최대 3회까지 질문할 수 있습니다.' });
        return;
      }

      const result = await generateStructuredJson(
        buildAskPersonaPrompt(persona, bill, history, question),
        ASK_PERSONA_RESPONSE_SCHEMA,
        isValidAskPersonaResponse,
      );
      res.json(result);
    } catch (err) {
      console.error('[POST /api/ask-persona]', err);
      const { status, message } = formatServerError(err);
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/reflect', async (req, res) => {
    try {
      const bill = req.body?.bill as FormalBill | undefined;
      const adoptedLabel = req.body?.adoptedLabel as string | undefined;
      const adoptedSummary = req.body?.adoptedSummary as string | undefined;
      const weights = req.body?.weights as ValueWeights | undefined;

      if (!bill || !adoptedLabel || !weights) {
        res.status(400).json({ error: '법안, 채택안, 가치 가중치 정보가 필요합니다.' });
        return;
      }
      const result = await generateStructuredJson(
        buildReflectionPrompt(bill, adoptedLabel, adoptedSummary ?? '', weights),
        REFLECTION_RESPONSE_SCHEMA,
        isValidReflectionResponse,
      );
      res.json(result);
    } catch (err) {
      console.error('[POST /api/reflect]', err);
      const { status, message } = formatServerError(err);
      res.status(status).json({ error: message });
    }
  });

  const distPath = path.resolve(__dirname, 'dist');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(distPath);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Mock Legislature server listening on http://localhost:${port}`);
  });
}

startServer();
