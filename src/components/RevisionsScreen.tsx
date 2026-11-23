import { useEffect, useState } from 'react';
import type {
  AdoptedChoice,
  ClauseChangeType,
  FormalBill,
  ImpactResponse,
  RevisionsResponse,
} from '../types.ts';
import { ErrorBanner } from './ErrorBanner.tsx';
import { Button, SectionLabel, StepLoading } from './ui/index.ts';

const REVISIONS_LOADING_MESSAGES = [
  '영향평가 결과를 반영하는 중…',
  '실효성 강화형 개정안을 설계하는 중…',
  '권리 보호형 개정안을 설계하는 중…',
];

interface RevisionsScreenProps {
  isLoading: boolean;
  originalBill: FormalBill;
  impact: ImpactResponse;
  revisions: RevisionsResponse | null;
  adoptedChoice: AdoptedChoice | null;
  errorMessage: string | null;
  onRetry: () => void;
  onUseSample: () => void;
  onSelectChoice: (choice: AdoptedChoice) => void;
  onNextToReflect: () => void;
}

const CHANGE_LABEL: Record<ClauseChangeType, string> = {
  KEEP: '유지',
  MODIFIED: '수정',
  ADDED: '+ 추가',
  REMOVED: '삭제',
};

function ScoreDeltaBars({
  scores,
  baseScores,
}: {
  scores: { legitimacy: number; equity: number; effectiveness: number; acceptance: number };
  baseScores: { legitimacy: number; equity: number; effectiveness: number; acceptance: number };
}) {
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setFilled(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  const items: Array<{ key: keyof typeof scores; label: string }> = [
    { key: 'legitimacy', label: '정당성' },
    { key: 'equity', label: '형평성' },
    { key: 'effectiveness', label: '실효성' },
    { key: 'acceptance', label: '수용성' },
  ];

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const val = scores[item.key];
        const delta = val - baseScores[item.key];
        return (
          <div key={item.key} className="space-y-1.5">
            <div className="flex items-center justify-between text-[13px]">
              <span className="font-medium text-[var(--ink-2)]">{item.label}</span>
              <span className="tabular-nums font-bold text-[var(--ink)]">
                {val}점{' '}
                {delta !== 0 && (
                  <span
                    className={
                      delta > 0 ? 'text-[var(--ink)]' : 'text-[var(--danger)]'
                    }
                  >
                    ({delta > 0 ? `▲${delta}` : `▼${Math.abs(delta)}`})
                  </span>
                )}
              </span>
            </div>
            <div className="h-px w-full bg-[var(--line)]">
              <div
                style={{ width: filled ? `${val}%` : '0%' }}
                className="h-px bg-[var(--ink)] transition-all duration-700 ease-out"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function RevisionsScreen({
  isLoading,
  originalBill,
  impact,
  revisions,
  adoptedChoice,
  errorMessage,
  onRetry,
  onUseSample,
  onSelectChoice,
  onNextToReflect,
}: RevisionsScreenProps) {
  const [mobileTab, setMobileTab] = useState<AdoptedChoice>('ORIGINAL');

  if (isLoading && !revisions) {
    return (
      <StepLoading
        stepLabel="STEP 04 / 05"
        messages={REVISIONS_LOADING_MESSAGES}
        hint="실효성을 높이는 방향과 권리를 보호하는 두 가지 개정안을 준비하고 있습니다."
        slowHint="영향평가 내용을 조문에 반영하는 중이니 잠시만 기다려 주세요."
        onUseSample={onUseSample}
      />
    );
  }

  if (errorMessage && !revisions) {
    return (
      <div>
        <ErrorBanner
          message={errorMessage}
          onRetry={onRetry}
          onUseSample={onUseSample}
        />
      </div>
    );
  }

  if (!revisions) return null;

  const baseScores = {
    legitimacy: impact.axes.find((a) => a.key === 'legitimacy')?.score ?? 50,
    equity: impact.axes.find((a) => a.key === 'equity')?.score ?? 50,
    effectiveness: impact.axes.find((a) => a.key === 'effectiveness')?.score ?? 50,
    acceptance: impact.axes.find((a) => a.key === 'acceptance')?.score ?? 50,
  };

  const revA = revisions.revisions.find((r) => r.id === 'A') ?? revisions.revisions[0];
  const revB = revisions.revisions.find((r) => r.id === 'B') ?? revisions.revisions[1];

  const columns: Array<{
    choice: AdoptedChoice;
    kicker: string;
    title: string;
    subtitle: string;
    clauses: Array<{ no: string; heading: string; text: string; changeType: ClauseChangeType }>;
    scores: typeof baseScores;
    tradeoff: string;
    actionLabel: string;
  }> = [
    {
      choice: 'ORIGINAL',
      kicker: '기존 발의안',
      title: '원안',
      subtitle: '처음 발의한 그대로의 기준을 유지합니다.',
      clauses: originalBill.clauses.map((c) => ({ ...c, changeType: 'KEEP' })),
      scores: baseScores,
      tradeoff: impact.keyQuestion,
      actionLabel: '원안 유지',
    },
    {
      choice: 'A',
      kicker: '수정안 A',
      title: revA.name,
      subtitle: revA.strategy,
      clauses: revA.clauses,
      scores: revA.scores,
      tradeoff: revA.tradeoff,
      actionLabel: '수정안 A 채택',
    },
    {
      choice: 'B',
      kicker: '수정안 B',
      title: revB.name,
      subtitle: revB.strategy,
      clauses: revB.clauses,
      scores: revB.scores,
      tradeoff: revB.tradeoff,
      actionLabel: '수정안 B 채택',
    },
  ];

  return (
    <div>
      <SectionLabel>STEP 04 / 05</SectionLabel>
      <h1 className="type-h1 mt-4 whitespace-pre-line text-[var(--ink)]">
        {'어떤 방향으로\n규칙을 다듬을까요?'}
      </h1>

      {/* Mobile Tabs */}
      <div
        role="tablist"
        aria-label="개정안 비교 탭"
        className="mt-12 flex gap-6 border-b border-[var(--line)] lg:hidden"
      >
        {columns.map((col) => {
          const active = mobileTab === col.choice;
          return (
            <button
              key={col.choice}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setMobileTab(col.choice)}
              className={`border-b-2 bg-transparent py-3 text-[15px] transition-colors whitespace-nowrap ${
                active
                  ? 'border-[var(--accent)] font-bold text-[var(--ink)]'
                  : 'border-transparent font-medium text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              {col.choice === 'ORIGINAL' ? '원안' : col.kicker}
            </button>
          );
        })}
      </div>

      {/* 3-Column Hairline Comparison Grid */}
      <div className="border-b border-[var(--ink)] lg:mt-12 lg:grid lg:grid-cols-3 lg:divide-x lg:divide-[var(--line)] lg:border-t lg:border-[var(--ink)]">
        {columns.map((col, colIndex) => {
          const isAdopted = adoptedChoice === col.choice;
          const hiddenOnMobile = mobileTab !== col.choice ? 'hidden lg:flex' : 'flex';

          return (
            <article
              key={col.choice}
              className={`${hiddenOnMobile} relative flex-col justify-between py-8 lg:py-12 ${
                colIndex === 0
                  ? 'lg:pr-8'
                  : colIndex === 1
                    ? 'lg:px-8'
                    : 'lg:pl-8'
              }`}
            >
              {isAdopted && (
                <div
                  aria-label="채택됨"
                  className="stamp-seal animate-stamp pointer-events-none absolute right-2 top-6 z-10 flex h-16 w-16 items-center justify-center bg-[var(--bg)] lg:right-6 lg:top-8"
                >
                  <span className="text-[15px] font-extrabold tracking-[0.06em]">
                    채택
                  </span>
                </div>
              )}

              <div>
                <SectionLabel>{col.kicker}</SectionLabel>
                <h2 className="mt-2 pr-20 text-[24px] font-bold leading-[1.3] tracking-[-0.02em] text-[var(--ink)]">
                  {col.title}
                </h2>
                <p className="mt-2 text-[14px] leading-[1.6] text-[var(--ink-2)]">
                  {col.subtitle}
                </p>

                <div className="mt-8 divide-y divide-[var(--line)] border-t border-[var(--line)]">
                  {col.clauses.map((clause, cIdx) => {
                    const isModified = clause.changeType === 'MODIFIED';
                    const isAdded = clause.changeType === 'ADDED';
                    const isRemoved = clause.changeType === 'REMOVED';

                    return (
                      <div key={cIdx} className="py-4">
                        <div className="flex items-baseline justify-between gap-2">
                          <span
                            className={`text-[13px] font-bold tabular-nums ${
                              isRemoved ? 'text-[var(--ink-2)]' : 'text-[var(--ink)]'
                            }`}
                          >
                            {clause.no} ({clause.heading})
                          </span>
                          {col.choice !== 'ORIGINAL' && (
                            <span
                              className={`text-[11px] font-semibold uppercase tracking-[0.06em] ${
                                isRemoved
                                  ? 'text-[var(--ink-2)]'
                                  : isAdded || isModified
                                    ? 'text-[var(--ink)]'
                                    : 'text-[var(--ink-2)]'
                              }`}
                            >
                              {CHANGE_LABEL[clause.changeType]}
                            </span>
                          )}
                        </div>

                        <p
                          className={`mt-2 text-[15px] leading-[1.7] ${
                            isRemoved
                              ? 'font-clause line-through text-[var(--ink-2)]'
                              : isAdded
                                ? 'font-bold text-[var(--ink)]'
                                : isModified
                                  ? 'font-clause underline decoration-2 decoration-[var(--ink)] underline-offset-4 text-[var(--ink)]'
                                  : 'font-clause text-[var(--ink)]'
                          }`}
                        >
                          {isAdded && (
                            <span className="mr-1 font-bold text-[var(--ink)]">+</span>
                          )}
                          {clause.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8 space-y-6 border-t border-[var(--line)] pt-6">
                <ScoreDeltaBars scores={col.scores} baseScores={baseScores} />

                <p className="border-t border-[var(--line)] pt-4 text-[13px] leading-[1.6] text-[var(--ink-2)]">
                  <span className="font-semibold text-[var(--ink)]">
                    {col.choice === 'ORIGINAL' ? '핵심 질문 — ' : '이 안의 대가 — '}
                  </span>
                  {col.tradeoff}
                </p>

                <button
                  type="button"
                  onClick={() => onSelectChoice(col.choice)}
                  aria-pressed={isAdopted}
                  className={`inline-flex h-12 w-full items-center justify-center border text-[15px] font-bold transition-colors duration-200 ${
                    isAdopted
                      ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--bg)]'
                      : 'border-[var(--ink)] bg-[var(--bg)] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--bg)]'
                  }`}
                >
                  <span>{isAdopted ? '선택 완료' : col.actionLabel}</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Bottom Action */}
      <div className="mt-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] text-[var(--ink-2)]">
          AI의 결론은 참고 자료이고, 어떤 가치를 우선할지는 당신이 정합니다.
        </p>
        <Button
          variant="primary"
          disabled={!adoptedChoice}
          onClick={onNextToReflect}
          className="w-full sm:w-auto sm:min-w-[280px]"
        >
          가치 돌아보기
        </Button>
      </div>
    </div>
  );
}
