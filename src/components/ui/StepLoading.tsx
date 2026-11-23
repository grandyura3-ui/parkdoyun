import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from './Button.tsx';
import { SectionLabel } from './SectionLabel.tsx';

interface StepLoadingProps {
  stepLabel: string;
  messages: string[];
  intervalMs?: number;
  hint?: string;
  slowHint?: string;
  onUseSample?: () => void;
  compact?: boolean;
}

export function StepLoading({
  stepLabel,
  messages,
  intervalMs = 1500,
  hint,
  slowHint,
  onUseSample,
  compact = false,
}: StepLoadingProps) {
  const [stage, setStage] = useState(0);
  const [showSlowHint, setShowSlowHint] = useState(false);

  useEffect(() => {
    setStage(0);
    setShowSlowHint(false);
    const timer = window.setInterval(() => {
      setStage((prev) => (prev < messages.length - 1 ? prev + 1 : prev));
    }, intervalMs);
    const slowTimer = window.setTimeout(() => {
      setShowSlowHint(true);
    }, 10000);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(slowTimer);
    };
  }, [intervalMs, messages]);

  const progressPct = Math.round(((stage + 1) / Math.max(1, messages.length)) * 100);

  return (
    <div className={compact ? 'py-8' : 'py-8 lg:py-12'}>
      <SectionLabel>{stepLabel}</SectionLabel>

      <p
        aria-live="polite"
        className="mt-6 text-[28px] font-bold leading-[1.2] tracking-[-0.02em] text-[var(--ink)] sm:text-[40px]"
      >
        {messages[stage]}
      </p>

      <div className="mt-8 h-[2px] w-full bg-[var(--line)]">
        <div
          style={{ width: `${progressPct}%` }}
          className="h-[2px] bg-[var(--accent)] transition-all duration-500 ease-out"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <span className="tabular-nums text-[12px] font-semibold tracking-[0.08em] text-[var(--ink-2)]">
          {String(stage + 1).padStart(2, '0')} / {String(messages.length).padStart(2, '0')}
        </span>

        {hint && (
          <p className="text-[13px] text-[var(--ink-2)]">
            {showSlowHint && slowHint ? slowHint : hint}
          </p>
        )}
      </div>

      {showSlowHint && onUseSample && (
        <div className="mt-6">
          <Button variant="text" onClick={onUseSample}>
            <span>예시 데이터로 먼저 체험하기</span>
            <ArrowRight size={20} strokeWidth={1.5} aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  );
}
