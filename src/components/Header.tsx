import type { AppStep } from '../types.ts';
import { STEP_ORDER } from '../lib/state.ts';

interface HeaderProps {
  currentStep: AppStep;
  maxReachedStepIndex: number;
  isDemo: boolean;
  recordCount: number;
  onGoHome: () => void;
  onSelectStep: (step: Exclude<AppStep, 'hero'>) => void;
  onOpenHistory: () => void;
}

const STEP_LABELS: Record<Exclude<AppStep, 'hero'>, string> = {
  draft: '발의',
  deliberate: '심의',
  impact: '영향평가',
  revisions: '개정',
  reflect: '의결',
};

export function Header({
  currentStep,
  maxReachedStepIndex,
  isDemo,
  recordCount,
  onGoHome,
  onSelectStep,
  onOpenHistory,
}: HeaderProps) {
  return (
    <>
      <header className="no-print sticky top-0 z-30 h-16 border-b border-[var(--line)] bg-[var(--bg)]">
        <div className="mx-auto flex h-full max-w-[1320px] items-center justify-between gap-6 px-6 lg:px-12">
          <button
            type="button"
            onClick={onGoHome}
            className="flex items-baseline gap-3 bg-transparent p-0 text-left whitespace-nowrap shrink-0"
            aria-label="모의입법소 홈으로 이동"
          >
            <span className="text-[18px] font-extrabold tracking-[-0.02em] text-[var(--ink)]">
              모의입법소
            </span>
            <span className="hidden text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-2)] sm:inline">
              MOCK LEGISLATURE
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenHistory}
            className="bg-transparent p-0 text-[15px] font-medium text-[var(--ink)] underline-offset-4 decoration-1 transition-colors duration-200 hover:text-[var(--accent)] hover:underline active:text-[var(--accent-hover)] whitespace-nowrap shrink-0"
            aria-label={`내 기록 열기 (${recordCount}건 저장됨)`}
          >
            <span>내 기록</span>
            {recordCount > 0 && (
              <span className="ml-1.5 tabular-nums text-[13px] text-[var(--ink-2)]">
                ({recordCount})
              </span>
            )}
          </button>
        </div>
      </header>

      {currentStep !== 'hero' && (
        <nav
          aria-label="입법 절차 단계"
          className="no-print border-b border-[var(--line)] bg-[var(--bg)]"
        >
          <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-6 px-6 lg:px-12">
            <ol className="flex items-center gap-3 overflow-x-auto sm:gap-8">
              {STEP_ORDER.map((step, index) => {
                const isActive = step === currentStep;
                const isVisited = index <= maxReachedStepIndex;
                const canNavigate = isVisited && !isActive;
                const stepNum = String(index + 1).padStart(2, '0');

                return (
                  <li key={step} className="shrink-0">
                    <button
                      type="button"
                      disabled={!canNavigate && !isActive}
                      onClick={() => canNavigate && onSelectStep(step)}
                      aria-current={isActive ? 'step' : undefined}
                      className={`border-b-2 bg-transparent py-3 text-[12px] tracking-[0.01em] transition-colors duration-150 whitespace-nowrap sm:text-[13px] sm:tracking-[0.02em] ${
                        isActive
                          ? 'border-[var(--accent)] font-bold text-[var(--ink)]'
                          : canNavigate
                            ? 'border-transparent font-medium text-[var(--ink-2)] hover:text-[var(--ink)]'
                            : 'border-transparent font-medium text-[var(--ink-3)] cursor-default'
                      }`}
                    >
                      <span className="mr-1 tabular-nums sm:mr-1.5">{stepNum}</span>
                      <span>{STEP_LABELS[step]}</span>
                    </button>
                  </li>
                );
              })}
            </ol>

            {isDemo && (
              <span className="hidden text-[12px] font-semibold tracking-[0.08em] text-[var(--accent)] whitespace-nowrap shrink-0 md:inline">
                예시 체험 중
              </span>
            )}
          </div>
        </nav>
      )}
    </>
  );
}
