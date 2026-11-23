import type {
  BillDraft,
  FormalBill,
  ImpactResponse,
  Persona,
  PersonaChatTurn,
  RevisionPlan,
  ValueWeights,
} from '../types.ts';

export const COMMON_SYSTEM_INSTRUCTION = `너는 '모의입법소'의 시뮬레이션 엔진이다. 고등학생이 학교 규칙을 설계하는 연습을 돕는다.
원칙:
(1) 정답을 단정하지 않고 판단 재료를 제공한다.
(2) 정치적으로 중립을 지키고 특정 정당·종교·집단을 옹호하거나 비난하지 않는다.
(3) 모든 인물은 가상이며 실존 인물이나 실제 학교의 사람을 연상시키는 이름·특징을 쓰지 않는다. 인물은 역할로만 부른다.
(4) 학교 현실에 맞는 구체적 장면(점심시간, 야간자율학습, 통학 시간, 기숙사, 동아리 활동 등)을 근거로 든다.
(5) 고등학생이 이해할 쉬운 한국어를 쓰되 유치하지 않게 쓰고, 일관된 존댓말(해요체)을 사용한다.
(6) 특정 집단에 대한 고정관념을 쓰지 않는다.
(7) 점수에는 반드시 근거를 단다.`;

export function buildDeliberationPrompt(draft: BillDraft): string {
  return `사용자가 발의한 학교 규칙 초안입니다.
- 규칙 이름: ${draft.title}
- 적용 대상: ${draft.target}
- 규칙의 목적: ${draft.purpose}
- 규칙 내용: ${draft.content}
- 위반 시 조치: ${draft.sanction || '명시되지 않음'}

다음 순서대로 심사하고 JSON으로 답하세요.
1. 접수 심사(intake):
   반려 기준: 특정 개인 실명이나 신상 지목, 혐오·차별 표현, 정당·선거·종교 선동, 불법 행위나 폭력을 조장하는 내용, 규칙이라고 볼 수 없는 의미 없는 입력.
   반려할 때는 accepted=false로 설정하고 rejectReason과 rejectGuide를 부드럽고 명확한 한국어로 작성하세요. (반려 시 나머지 필드는 최소 형식만 채워도 됩니다.)
2. 통과(accepted=true)라면:
   - bill: 제1조(목적), 제2조(적용 대상), 제3조(내용), 제4조(위반 시 조치) 형태로 조문화하세요. 위반 시 조치가 비어 있다면 교육적·절차적 안내 문구로 보완하거나 명시되지 않음을 반영한 조문을 작성하세요.
   - personas: 정확히 5명(id: "student", "teacher", "parent", "admin", "unseen")을 생성하세요.
     * 다섯 명이 모두 같은 입장이면 안 됩니다(최소 한 명은 다른 입장).
     * 같은 입장 안에서도 서로 다른 이유를 가져야 합니다.
     * unseen은 이 규칙으로 가장 큰 영향을 받지만 발언권이 약한 구체적 상황의 인물이어야 하며, 신체·정체성 라벨로 낙인찍지 말고 처한 상황으로 묘사하세요(unseenDescription에 한 줄 설명).
     * values는 반드시 [자유, 안전, 평등, 효율, 책임, 공동체, 프라이버시, 학습권] 중에서만 고르세요.
     * headline은 30자 이내, statement는 2~3문장의 자연스러운 존댓말 구어체로 작성하세요.
   - conflicts: 가치가 충돌하는 쟁점 2~3개를 생성하세요.`;
}

export function buildImpactPrompt(bill: FormalBill, personas: Persona[]): string {
  const clausesText = bill.clauses.map((c) => `${c.no}(${c.heading}): ${c.text}`).join('\n');
  const personaSummary = personas
    .map((p) => `- ${p.roleLabel}(${p.stance}): ${p.headline} / 우려: ${p.concerns.join(', ')}`)
    .join('\n');

  return `조문화된 법안과 이해관계자 5명의 의견 요약입니다.

[법안: ${bill.title}]
${clausesText}

[심의 요약]
${personaSummary}

이 법안의 영향을 4개 축으로 평가하세요.
- axes: 반드시 4개(key: "legitimacy"|"equity"|"effectiveness"|"acceptance", label: "정당성"|"형평성"|"실효성"|"수용성")
  * 정당성: 목적의 타당성, 수단의 적합성, 침해의 최소성
  * 형평성: 부담과 혜택이 공정하게 나뉘는가, 소외되는 집단은 없는가
  * 실효성: 실제로 지켜지고 목적을 달성할 수 있는가
  * 수용성: 구성원이 납득하고 따를 수 있는가
  * 점수 기준: 0~39 문제가 큼, 40~69 보완 필요, 70~100 양호. 극단 점수(20 미만, 90 초과)는 명백한 근거가 있을 때만 쓰세요.
  * reason은 각 2문장 이내로 구체적 근거를 적으세요.
- summary: 전체 총평 한 문단
- keyQuestion: "이 법안이 먼저 답해야 할 질문" 한 줄
- sideEffects: 예상 부작용 3~5개 (type: "UNINTENDED"|"EVASION"|"INEQUITY"|"COST", likelihood: 1~3, severity: 1~3)
- alternatives: 같은 목적을 이루면서 권리 침해가 더 적은 대안 2~3개를 한 줄씩 제시하세요.`;
}

export function buildRevisionsPrompt(bill: FormalBill, impact: ImpactResponse): string {
  const clausesText = bill.clauses.map((c) => `${c.no}(${c.heading}): ${c.text}`).join('\n');
  const axesText = impact.axes.map((a) => `${a.label}: ${a.score}점 (${a.reason})`).join('\n');
  const sideEffectsText = impact.sideEffects.map((s) => `- ${s.title}: ${s.description}`).join('\n');

  return `원안 조문과 영향평가 결과입니다.

[원안: ${bill.title}]
${clausesText}

[영향평가]
${axesText}
주요 부작용:
${sideEffectsText}

원안의 목적을 유지하되 수단을 달리하는 2개의 수정안을 제시하세요.
- id "A": "실효성 강화형" (목적 달성 가능성과 집행력을 높이는 방향)
- id "B": "권리 보호형" (구성원의 권리와 예외 보호를 강화하는 방향)
규칙:
1) 원안 조문과 같은 조문 번호 체계(${bill.clauses.map((c) => c.no).join(', ')})를 유지하세요.
2) 각 조문마다 changeType("KEEP"|"MODIFIED"|"ADDED"|"REMOVED")을 정확히 표시하세요. 삭제된 조문도 REMOVED로 남기세요.
3) scores에는 정당성(legitimacy), 형평성(equity), 실효성(effectiveness), 수용성(acceptance) 0~100 점수를 예측해 적으세요.
4) tradeoff에는 "이 안을 선택했을 때 감수해야 할 대가"를 한 줄로 적으세요.`;
}

export function buildAskPersonaPrompt(
  persona: Persona,
  bill: FormalBill,
  history: PersonaChatTurn[],
  question: string,
): string {
  const clausesText = bill.clauses.map((c) => `${c.no}(${c.heading}): ${c.text}`).join('\n');
  const historyText =
    history.length === 0
      ? '이전 대화 없음'
      : history.map((h, i) => `Q${i + 1}: ${h.question}\nA${i + 1}: ${h.answer}`).join('\n\n');

  return `당신은 모의입법소 심의에 참여한 가상 인물입니다.
- 역할: ${persona.roleLabel}${persona.unseenDescription ? ` (${persona.unseenDescription})` : ''}
- 기존 입장: ${persona.stance}
- 핵심 발언: ${persona.statement}
- 주요 우려: ${persona.concerns.join(', ')}
- 요구사항: ${persona.demands.join(', ')}

[법안: ${bill.title}]
${clausesText}

[지금까지의 대화]
${historyText}

[사용자의 새 질문]
${question}

규칙:
- 인물의 기존 입장과 일관되게 2~4문장의 존댓말(해요체)로 답하세요.
- 사용자가 타당한 근거나 보완책을 제시하면 입장이 누그러질 수 있지만(SOFTENED), 근거 없이 쉽게 설득되지 마세요.
- 질문이 무례하거나 규칙과 무관해도 품위 있게 답하거나 규칙 이야기로 돌려놓으세요.
- stanceShift는 "NONE", "SOFTENED", "HARDENED" 중 하나를 고르세요.`;
}

export function buildReflectionPrompt(
  bill: FormalBill,
  adoptedLabel: string,
  adoptedSummary: string,
  weights: ValueWeights,
): string {
  return `사용자가 최종 결정과 가치 성찰을 마쳤습니다.

[법안: ${bill.title}]
[최종 선택]: ${adoptedLabel}
${adoptedSummary}

[사용자의 6대 가치 가중치 (0~5점)]
- 자유: ${weights.freedom}점
- 안전: ${weights.safety}점
- 평등: ${weights.equality}점
- 효율: ${weights.efficiency}점
- 책임: ${weights.responsibility}점
- 공동체: ${weights.community}점

어조 규칙: 평가하거나 훈계하지 말고 거울처럼 사용자의 선택을 비춰주세요. 옳고 그름을 판단하지 마세요.
출력 항목:
- profile: 사용자의 가치 우선순위가 드러나는 2~3문장 요약
- tension: 내가 우선한 가치와 상대적으로 덜 챙긴 가치, 그리고 그 선택이 낳는 대가/긴장 관계(2~3문장)
- questions: 사용자가 스스로 생각해볼 열린 질문 3개 (정답이 없는 질문)
- principle: "나는 규칙을 만들 때 ~을/를 먼저 지킨다" 형태의 한 문장 입법 원칙`;
}
