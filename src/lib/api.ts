import type {
  AskPersonaResponse,
  BillDraft,
  DeliberationResponse,
  FormalBill,
  ImpactResponse,
  Persona,
  PersonaChatTurn,
  ReflectionResponse,
  RevisionsResponse,
  ValueWeights,
} from '../types.ts';

const API_TIMEOUT_MS = 45_000;

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg =
        (data && typeof data.error === 'string' && data.error) ||
        '요청을 처리하는 중에 문제가 발생했어요.';
      throw new Error(msg);
    }

    return data as T;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('응답 시간이 45초를 넘어 중단되었어요. 다시 시도하거나 예시 데이터로 이어갈 수 있습니다.');
    }
    throw err instanceof Error
      ? err
      : new Error('네트워크 오류가 발생했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    window.clearTimeout(timer);
  }
}

export function requestDeliberation(draft: BillDraft): Promise<DeliberationResponse> {
  return postJson<DeliberationResponse>('/api/deliberate', { draft });
}

export function requestImpact(bill: FormalBill, personas: Persona[]): Promise<ImpactResponse> {
  return postJson<ImpactResponse>('/api/impact', { bill, personas });
}

export function requestRevisions(bill: FormalBill, impact: ImpactResponse): Promise<RevisionsResponse> {
  return postJson<RevisionsResponse>('/api/revisions', { bill, impact });
}

export function requestAskPersona(params: {
  persona: Persona;
  bill: FormalBill;
  history: PersonaChatTurn[];
  question: string;
}): Promise<AskPersonaResponse> {
  return postJson<AskPersonaResponse>('/api/ask-persona', params);
}

export function requestReflection(params: {
  bill: FormalBill;
  adoptedLabel: string;
  adoptedSummary: string;
  weights: ValueWeights;
}): Promise<ReflectionResponse> {
  return postJson<ReflectionResponse>('/api/reflect', params);
}
