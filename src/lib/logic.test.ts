import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hasExcessiveRepetition,
  isValidAskPersonaResponse,
  isValidDeliberationResponse,
  isValidImpactResponse,
  isValidReflectionResponse,
  isValidRevisionsResponse,
  validateBillDraft,
} from './validation.ts';
import {
  canAddPersonaQuestion,
  createInitialSimulationState,
  simulationReducer,
} from './state.ts';
import {
  EXAMPLE_BILLS,
  getSamplePersonaReply,
  SAMPLE_DELIBERATION,
  SAMPLE_IMPACT,
  SAMPLE_REFLECTION,
  SAMPLE_REVISIONS,
} from './sample.ts';
import {
  buildLegislativeReportText,
  createDraftFromRecordInput,
  generateDocumentNumber,
  getScoreTierLabel,
} from './formatters.ts';

test('validateBillDraft accepts valid example bills and rejects invalid drafts', () => {
  for (const bill of EXAMPLE_BILLS) {
    const res = validateBillDraft(bill);
    assert.equal(res.isValid, true, `Expected valid example bill: ${bill.title}`);
  }

  const empty = validateBillDraft({
    title: '',
    content: '',
    purpose: '',
    target: '전교생',
    sanction: '',
  });
  assert.equal(empty.isValid, false);
  assert.ok(empty.errors.title);
  assert.ok(empty.errors.content);
  assert.ok(empty.errors.purpose);

  const repeated = validateBillDraft({
    title: '규칙제목',
    content: 'ㅋㅋㅋㅋㅋㅋㅋ 이상한 내용 테스트입니다.',
    purpose: '목적 테스트입니다.',
    target: '전교생',
    sanction: '',
  });
  assert.equal(hasExcessiveRepetition('ㅋㅋㅋㅋㅋㅋㅋ'), true);
  assert.equal(repeated.isValid, false);
  assert.ok(repeated.errors.content);
});

test('AI schema validators validate sample payloads and reject malformed objects', () => {
  assert.equal(isValidDeliberationResponse(SAMPLE_DELIBERATION), true);
  assert.equal(isValidImpactResponse(SAMPLE_IMPACT), true);
  assert.equal(isValidRevisionsResponse(SAMPLE_REVISIONS), true);
  assert.equal(isValidReflectionResponse(SAMPLE_REFLECTION), true);
  assert.equal(isValidAskPersonaResponse(getSamplePersonaReply('student', '예외는 없나요?')), true);

  // Malformed deliberation (missing unseen persona)
  assert.equal(
    isValidDeliberationResponse({
      ...SAMPLE_DELIBERATION,
      personas: SAMPLE_DELIBERATION.personas.slice(0, 4),
    }),
    false,
  );

  // Accepted=false rejection payload should be valid
  assert.equal(
    isValidDeliberationResponse({
      intake: { accepted: false, rejectReason: '실명이 포함되어 있습니다.', rejectGuide: '익명으로 고쳐주세요.' },
      bill: { title: '', clauses: [] },
      personas: [],
      conflicts: [],
    }),
    true,
  );
});

test('simulationReducer manages state transitions and enforces max 3 persona Q&A turns', () => {
  let state = createInitialSimulationState();
  assert.equal(state.step, 'hero');

  state = simulationReducer(state, {
    type: 'START_DEMO',
    payload: {
      draft: EXAMPLE_BILLS[0],
      deliberation: SAMPLE_DELIBERATION,
      impact: SAMPLE_IMPACT,
      revisions: SAMPLE_REVISIONS,
    },
  });
  assert.equal(state.step, 'deliberate');
  assert.equal(state.isDemo, true);

  for (let i = 1; i <= 4; i += 1) {
    state = simulationReducer(state, {
      type: 'ASK_PERSONA_SUCCESS',
      personaId: 'student',
      turn: { question: `질문 ${i}`, answer: `답변 ${i}`, stanceShift: 'NONE' },
    });
  }
  assert.equal(state.personaChats.student.length, 3);
  assert.equal(canAddPersonaQuestion(state.personaChats.student), false);

  state = simulationReducer(state, { type: 'SELECT_ADOPTED_CHOICE', choice: 'B' });
  assert.equal(state.adoptedChoice, 'B');

  state = simulationReducer(state, { type: 'REFLECT_SUCCESS', payload: SAMPLE_REFLECTION });
  assert.equal(state.reflection?.principle, SAMPLE_REFLECTION.principle);
  assert.equal(state.maxReachedStepIndex, 4);
});

test('formatters produce document numbers, score tiers, and printable report text', () => {
  const docNo = generateDocumentNumber(new Date('2026-11-19T12:00:00Z'), 3);
  assert.equal(docNo, '모의-2026-1119-03');

  assert.equal(getScoreTierLabel(35), '문제가 큼');
  assert.equal(getScoreTierLabel(55), '보완 필요');
  assert.equal(getScoreTierLabel(78), '양호');

  const record = createDraftFromRecordInput(
    EXAMPLE_BILLS[0],
    SAMPLE_DELIBERATION,
    SAMPLE_IMPACT,
    SAMPLE_REVISIONS,
    'B',
    { freedom: 5, safety: 3, equality: 4, efficiency: 2, responsibility: 4, community: 3 },
    SAMPLE_REFLECTION,
    ['답변1', '', '답변3'],
    true,
    0,
  );
  const text = buildLegislativeReportText(record);
  assert.match(text, /\[모의입법소 입법 결과서\]/);
  assert.match(text, /수정안 B \(권리 보호형\)/);
  assert.match(text, /나는 규칙을 만들 때/);
});
