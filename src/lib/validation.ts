import type {
  AskPersonaResponse,
  BillDraft,
  DeliberationResponse,
  DraftValidationErrors,
  ImpactResponse,
  ReflectionResponse,
  RevisionsResponse,
} from '../types.ts';

const REPEATED_CHAR_REGEX = /(.)\1{4,}/;
const ONLY_SYMBOLS_OR_NUMBERS_REGEX = /^[\s\d\p{P}\p{S}]+$/u;

export function hasExcessiveRepetition(text: string): boolean {
  return REPEATED_CHAR_REGEX.test(text.replace(/\s+/g, ''));
}

export function validateBillDraft(draft: BillDraft): {
  isValid: boolean;
  errors: DraftValidationErrors;
} {
  const errors: DraftValidationErrors = {};
  const title = draft.title.trim();
  const content = draft.content.trim();
  const purpose = draft.purpose.trim();
  const sanction = draft.sanction.trim();

  if (title.length < 2) {
    errors.title = '규칙 이름은 2자 이상 입력해주세요.';
  } else if (title.length > 30) {
    errors.title = '규칙 이름은 30자 이하로 입력해주세요.';
  } else if (hasExcessiveRepetition(title) || ONLY_SYMBOLS_OR_NUMBERS_REGEX.test(title)) {
    errors.title = '의미 있는 규칙 이름을 입력해주세요.';
  }

  if (content.length < 10) {
    errors.content = '규칙 내용은 10자 이상 구체적으로 작성해주세요.';
  } else if (content.length > 400) {
    errors.content = '규칙 내용은 400자 이하로 작성해주세요.';
  } else if (hasExcessiveRepetition(content) || ONLY_SYMBOLS_OR_NUMBERS_REGEX.test(content)) {
    errors.content = '반복된 문자나 기호만으로는 발의할 수 없어요.';
  }

  if (purpose.length < 5) {
    errors.purpose = '규칙의 목적은 5자 이상 입력해주세요.';
  } else if (purpose.length > 150) {
    errors.purpose = '규칙의 목적은 150자 이하로 입력해주세요.';
  } else if (hasExcessiveRepetition(purpose) || ONLY_SYMBOLS_OR_NUMBERS_REGEX.test(purpose)) {
    errors.purpose = '규칙을 만들려는 이유를 바르게 적어주세요.';
  }

  if (sanction.length > 150) {
    errors.sanction = '위반 시 조치는 150자 이하로 입력해주세요.';
  } else if (sanction.length > 0 && hasExcessiveRepetition(sanction)) {
    errors.sanction = '반복된 문자 대신 구체적인 조치를 적어주세요.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function isValidDeliberationResponse(data: unknown): data is DeliberationResponse {
  if (!data || typeof data !== 'object') return false;
  const d = data as DeliberationResponse;
  if (!d.intake || typeof d.intake.accepted !== 'boolean') return false;
  if (!d.intake.accepted) {
    return typeof d.intake.rejectReason === 'string' && d.intake.rejectReason.trim().length > 0;
  }
  if (!d.bill || typeof d.bill.title !== 'string' || !Array.isArray(d.bill.clauses) || d.bill.clauses.length === 0) {
    return false;
  }
  if (!Array.isArray(d.personas) || d.personas.length !== 5) {
    return false;
  }
  const requiredIds = new Set(['student', 'teacher', 'parent', 'admin', 'unseen']);
  for (const p of d.personas) {
    if (!p || !requiredIds.has(p.id)) return false;
    requiredIds.delete(p.id);
    if (!['SUPPORT', 'CONDITIONAL', 'OPPOSE'].includes(p.stance)) return false;
    if (typeof p.statement !== 'string' || p.statement.trim().length === 0) return false;
  }
  if (requiredIds.size !== 0) return false;
  if (!Array.isArray(d.conflicts) || d.conflicts.length < 2) return false;
  return true;
}

export function isValidImpactResponse(data: unknown): data is ImpactResponse {
  if (!data || typeof data !== 'object') return false;
  const d = data as ImpactResponse;
  if (!Array.isArray(d.axes) || d.axes.length !== 4) return false;
  const requiredAxes = new Set(['legitimacy', 'equity', 'effectiveness', 'acceptance']);
  for (const axis of d.axes) {
    if (!axis || !requiredAxes.has(axis.key)) return false;
    requiredAxes.delete(axis.key);
    if (typeof axis.score !== 'number' || axis.score < 0 || axis.score > 100) return false;
    if (typeof axis.reason !== 'string' || axis.reason.trim().length === 0) return false;
  }
  if (requiredAxes.size !== 0) return false;
  if (typeof d.summary !== 'string' || typeof d.keyQuestion !== 'string') return false;
  if (!Array.isArray(d.sideEffects) || d.sideEffects.length < 3 || d.sideEffects.length > 5) return false;
  if (!Array.isArray(d.alternatives) || d.alternatives.length < 2) return false;
  return true;
}

export function isValidRevisionsResponse(data: unknown): data is RevisionsResponse {
  if (!data || typeof data !== 'object') return false;
  const d = data as RevisionsResponse;
  if (!Array.isArray(d.revisions) || d.revisions.length !== 2) return false;
  const ids = new Set(d.revisions.map((r) => r.id));
  if (!ids.has('A') || !ids.has('B')) return false;
  for (const rev of d.revisions) {
    if (!Array.isArray(rev.clauses) || rev.clauses.length === 0) return false;
    if (!rev.scores || typeof rev.scores.legitimacy !== 'number') return false;
    if (typeof rev.tradeoff !== 'string' || rev.tradeoff.trim().length === 0) return false;
  }
  return true;
}

export function isValidAskPersonaResponse(data: unknown): data is AskPersonaResponse {
  if (!data || typeof data !== 'object') return false;
  const d = data as AskPersonaResponse;
  return (
    typeof d.answer === 'string' &&
    d.answer.trim().length > 0 &&
    ['NONE', 'SOFTENED', 'HARDENED'].includes(d.stanceShift)
  );
}

export function isValidReflectionResponse(data: unknown): data is ReflectionResponse {
  if (!data || typeof data !== 'object') return false;
  const d = data as ReflectionResponse;
  return (
    typeof d.profile === 'string' &&
    d.profile.trim().length > 0 &&
    typeof d.tension === 'string' &&
    d.tension.trim().length > 0 &&
    Array.isArray(d.questions) &&
    d.questions.length === 3 &&
    typeof d.principle === 'string' &&
    d.principle.trim().length > 0
  );
}
