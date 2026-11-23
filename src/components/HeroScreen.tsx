import { ArrowRight } from 'lucide-react';
import { Button } from './ui/index.ts';
import { ContourBackdrop } from './art/index.ts';

interface HeroScreenProps {
  onStartDraft: () => void;
  onStartDemo: () => void;
}

const STATS = [
  { number: '05', label: '목소리' },
  { number: '04', label: '평가 축' },
  { number: '02', label: '개정안' },
];

export function HeroScreen({ onStartDraft, onStartDemo }: HeroScreenProps) {
  return (
    <div>
      {/* Light Hero Section */}
      <section className="mx-auto max-w-[1320px] px-6 py-16 lg:px-12 lg:py-[160px]">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-9">
            <h1
              style={{ animationDelay: '0ms' }}
              className="animate-draft-enter type-hero text-[var(--ink)]"
            >
              모의입법소
            </h1>

            <p
              style={{ animationDelay: '60ms' }}
              className="animate-draft-enter mt-8 text-[20px] font-medium leading-[1.5] text-[var(--ink-2)] sm:text-[24px]"
            >
              규칙이 사람을 만나기 전에, 먼저 겪어보는 곳
            </p>

            <div
              style={{ animationDelay: '120ms' }}
              className="animate-draft-enter mt-12 flex flex-wrap items-center gap-8"
            >
              <Button
                variant="text"
                onClick={onStartDraft}
                className="text-[18px] font-bold sm:text-[20px]"
              >
                <span>법안 발의하기</span>
                <ArrowRight size={20} strokeWidth={1.5} aria-hidden="true" />
              </Button>

              <Button
                variant="text"
                onClick={onStartDemo}
                className="text-[18px] font-medium text-[var(--ink-2)] sm:text-[20px]"
              >
                <span>예시로 체험하기</span>
                <ArrowRight size={20} strokeWidth={1.5} aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Full-Width Dark Metrics Section */}
      <section
        aria-label="시뮬레이션 구성 요소"
        className="relative w-full overflow-hidden bg-[var(--dark)] text-[var(--dark-ink)]"
      >
        <ContourBackdrop variant="hero" tone="dark" />

        <div className="relative z-10 mx-auto max-w-[1320px] px-6 py-16 lg:px-12 lg:py-[160px]">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-6">
            {STATS.map((item, idx) => (
              <div
                key={item.label}
                style={{ animationDelay: `${180 + idx * 60}ms` }}
                className="animate-draft-enter border-t border-[var(--dark-line)] pt-6 md:col-span-4"
              >
                <p className="tabular-nums text-[72px] font-extrabold leading-none tracking-[-0.04em] text-[var(--dark-ink)] sm:text-[96px] lg:text-[120px]">
                  {item.number}
                </p>
                <p className="mt-4 text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--dark-ink-2)]">
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          <footer className="mt-16 flex flex-col gap-2 border-t border-[var(--dark-line)] pt-8 text-[13px] text-[var(--dark-ink-2)] sm:flex-row sm:items-center sm:justify-between lg:mt-24">
            <p>
              AI는 판단 재료를 보여주고, 최종 판단과 가치 선택은 사용자가 합니다.
            </p>
            <p className="shrink-0">기록은 이 브라우저에만 저장됩니다.</p>
          </footer>
        </div>
      </section>
    </div>
  );
}
