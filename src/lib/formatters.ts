import type {
  AdoptedChoice,
  BillDraft,
  DeliberationResponse,
  ImpactAxisKey,
  ImpactResponse,
  ReflectionResponse,
  RevisionsResponse,
  SavedRecord,
  SideEffectType,
  Stance,
  ValueKey,
  ValueWeights,
} from '../types.ts';

export const STANCE_META: Record<Stance, { label: string; color: string; bg: string; border: string }> = {
  SUPPORT: {
    label: '찬성',
    color: 'var(--ink)',
    bg: 'var(--bg)',
    border: 'var(--line-strong)',
  },
  CONDITIONAL: {
    label: '조건부 찬성',
    color: 'var(--ink-2)',
    bg: 'var(--surface-alt)',
    border: 'var(--line)',
  },
  OPPOSE: {
    label: '반대',
    color: 'var(--danger)',
    bg: 'var(--bg)',
    border: 'var(--line)',
  },
};

export const SIDE_EFFECT_TYPE_LABELS: Record<SideEffectType, string> = {
  UNINTENDED: '의도치 않은 결과',
  EVASION: '우회·편법',
  INEQUITY: '불평등',
  COST: '비용·부담',
};

export const AXIS_DEFINITIONS: Record<ImpactAxisKey, { label: string; definition: string }> = {
  legitimacy: {
    label: '정당성',
    definition: '규칙의 목적이 타당한가, 목표를 이루는 수단이 적절한가, 그리고 기본 권리를 최소한으로만 제한하는가를 살핍니다.',
  },
  equity: {
    label: '형평성',
    definition: '규칙이 주는 부담과 혜택이 구성원에게 공정하게 나뉘는지, 특정 학생이 소외되거나 더 큰 피해를 입지 않는지 살핍니다.',
  },
  effectiveness: {
    label: '실효성',
    definition: '현장 교실과 학교 생활에서 실제로 지켜질 수 있는지, 편법으로 무력화되지 않고 원래 목적을 달성하는지 살핍니다.',
  },
  acceptance: {
    label: '수용성',
    definition: '규칙을 따르는 학생·교사·학부모가 취지에 공감하고 자발적으로 존중하며 따를 수 있는지를 살핍니다.',
  },
};

export const VALUE_LABELS: Record<ValueKey, { label: string; hint: string }> = {
  freedom: { label: '자유', hint: '개인의 선택과 자율성을 존중함' },
  safety: { label: '안전', hint: '위험을 줄이고 보호받는 환경을 지킴' },
  equality: { label: '평등', hint: '누구도 부당하게 불이익을 받지 않음' },
  efficiency: { label: '효율', hint: '적은 시간과 비용으로 목적을 달성함' },
  responsibility: { label: '책임', hint: '스스로 판단하고 결과에 책임짐' },
  community: { label: '공동체', hint: '함께 어우러지는 신뢰와 질서를 지킴' },
};

export function getScoreTierLabel(score: number): string {
  if (score < 40) return '문제가 큼';
  if (score < 70) return '보완 필요';
  return '양호';
}

export function generateDocumentNumber(date = new Date(), sequence = 1): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const seq = String(Math.max(1, sequence)).padStart(2, '0');
  return `모의-${year}-${month}${day}-${seq}`;
}

export function formatKoreanDate(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export function getAdoptedPlanLabel(choice: AdoptedChoice, revisions: RevisionsResponse): string {
  if (choice === 'ORIGINAL') return '원안 유지';
  const found = revisions.revisions.find((r) => r.id === choice);
  return found ? `수정안 ${found.id} (${found.name})` : `수정안 ${choice}`;
}

export function buildLegislativeReportText(record: SavedRecord): string {
  const lines: string[] = [];
  lines.push(`[모의입법소 입법 결과서]`);
  lines.push(`문서번호: ${record.docNumber}`);
  lines.push(`발의일: ${formatKoreanDate(record.createdAt)}`);
  lines.push(`법안명: ${record.deliberation.bill.title}`);
  lines.push(`적용 대상: ${record.draft.target}`);
  lines.push('');
  lines.push('1. 원안 조문');
  for (const clause of record.deliberation.bill.clauses) {
    lines.push(`- ${clause.no}(${clause.heading}): ${clause.text}`);
  }
  lines.push('');
  lines.push('2. 심의 결과 요약');
  for (const persona of record.deliberation.personas) {
    lines.push(`- ${persona.roleLabel} [${STANCE_META[persona.stance].label}]: ${persona.headline}`);
  }
  lines.push('');
  lines.push('3. 영향평가 점수');
  for (const axis of record.impact.axes) {
    lines.push(`- ${axis.label}: ${axis.score}점 (${getScoreTierLabel(axis.score)})`);
  }
  lines.push('');
  lines.push(`4. 최종 의결안: ${getAdoptedPlanLabel(record.adoptedChoice, record.revisions)}`);
  if (record.adoptedChoice !== 'ORIGINAL') {
    const rev = record.revisions.revisions.find((r) => r.id === record.adoptedChoice);
    if (rev) {
      for (const c of rev.clauses) {
        if (c.changeType !== 'REMOVED') {
          lines.push(`- ${c.no}(${c.heading}): ${c.text}`);
        }
      }
    }
  }
  lines.push('');
  lines.push('5. 나의 입법 원칙');
  lines.push(`"${record.reflection.principle}"`);
  lines.push('');
  lines.push('6. 가치 성찰 및 답변');
  lines.push(
    `가치 우선순위: ${(Object.keys(VALUE_LABELS) as ValueKey[])
      .map((k) => `${VALUE_LABELS[k].label} ${record.valueWeights[k]}`)
      .join(' · ')}`,
  );
  record.reflection.questions.forEach((q, idx) => {
    const ans = record.reflectionAnswers[idx]?.trim();
    lines.push(`Q${idx + 1}. ${q}`);
    lines.push(`A${idx + 1}. ${ans || '(작성하지 않음)'}`);
  });
  lines.push('');
  lines.push('※ 본 문서는 AI 시뮬레이션과 사용자의 판단으로 작성된 학습용 문서입니다.');
  return lines.join('\n');
}

export function createDraftFromRecordInput(
  draft: BillDraft,
  deliberation: DeliberationResponse,
  impact: ImpactResponse,
  revisions: RevisionsResponse,
  adoptedChoice: AdoptedChoice,
  valueWeights: ValueWeights,
  reflection: ReflectionResponse,
  reflectionAnswers: string[],
  isDemo: boolean,
  existingCount: number,
): SavedRecord {
  const now = new Date();
  return {
    id: `rec_${now.getTime()}_${Math.random().toString(36).slice(2, 7)}`,
    docNumber: generateDocumentNumber(now, existingCount + 1),
    createdAt: now.toISOString(),
    draft,
    deliberation,
    impact,
    revisions,
    adoptedChoice,
    valueWeights,
    reflection,
    reflectionAnswers,
    isDemo,
  };
}
