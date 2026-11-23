import { ArrowRight } from 'lucide-react';
import { Button, SectionLabel } from './ui/index.ts';
import { EmptyArt } from './art/index.ts';

interface ErrorBannerProps {
  message: string;
  onRetry: () => void;
  onUseSample: () => void;
}

export function ErrorBanner({ message, onRetry, onUseSample }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="border-y border-[var(--danger)] bg-[var(--bg)] py-8"
    >
      <EmptyArt variant="error" className="mb-8" />
      <SectionLabel className="text-[var(--danger)]">ERROR</SectionLabel>
      <h3 className="mt-3 text-[24px] font-bold leading-[1.3] tracking-[-0.02em] text-[var(--ink)]">
        잠시 심의 진행이 멈췄습니다
      </h3>
      <p className="mt-2 max-w-[65ch] text-[15px] leading-[1.65] text-[var(--ink-2)]">
        {message}
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-6">
        <Button variant="primary" onClick={onRetry}>
          다시 시도
        </Button>
        <Button variant="text" onClick={onUseSample}>
          <span>예시 데이터로 계속하기</span>
          <ArrowRight size={20} strokeWidth={1.5} aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
