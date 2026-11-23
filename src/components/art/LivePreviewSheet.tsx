import type { BillDraft } from '../../types.ts';
import { useInViewOnce } from './useInViewOnce.ts';

interface LivePreviewSheetProps {
  draft: BillDraft;
  tone?: 'light' | 'dark';
  className?: string;
}

function PlaceholderBars({ count }: { count: number }) {
  const scales = [1, 0.86, 0.68];
  return (
    <svg
      viewBox={`0 0 240 ${count * 14}`}
      aria-hidden="true"
      className="mt-1.5 block w-full"
    >
      <defs>
        <line
          id="preview-placeholder-line"
          x1="0"
          y1="0"
          x2="240"
          y2="0"
          stroke="var(--line)"
          strokeWidth={1.25}
          vectorEffect="non-scaling-stroke"
        />
      </defs>
      {Array.from({ length: count }, (_, idx) => (
        <use
          key={idx}
          href="#preview-placeholder-line"
          transform={`translate(0 ${6 + idx * 14}) scale(${scales[idx % scales.length]} 1)`}
        />
      ))}
    </svg>
  );
}

export function LivePreviewSheet({
  draft,
  tone = 'light',
  className = '',
}: LivePreviewSheetProps) {
  const { ref, isVisible } = useInViewOnce<HTMLDivElement>(0.1);
  const vis = isVisible ? 'is-visible' : '';

  const title = draft.title.trim();
  const purpose = draft.purpose.trim();
  const content = draft.content.trim();

  const surfaceClass =
    tone === 'dark'
      ? 'border-[var(--dark-ink)] bg-[var(--dark)] text-[var(--dark-ink)]'
      : 'border-[var(--ink)] bg-[var(--bg)] text-[var(--ink)]';
  const mutedClass =
    tone === 'dark' ? 'text-[var(--dark-ink-2)]' : 'text-[var(--ink-2)]';

  return (
    <div
      ref={ref}
      role="img"
      aria-label={`실시간 법안 문서 미리보기: ${title || '제목 미입력'}`}
      className={`relative aspect-[3/4] max-h-[360px] w-full overflow-hidden border p-5 ${surfaceClass} ${className}`}
    >
      {/* Top animated hairline rule */}
      <svg
        viewBox="0 0 240 4"
        aria-hidden="true"
        className="mb-3 block h-1 w-full"
        preserveAspectRatio="none"
      >
        <line
          x1={0}
          y1={2}
          x2={240}
          y2={2}
          stroke="currentColor"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
          pathLength={1}
          className={`art-draw ${vis}`}
        />
      </svg>

      {/* Document Meta Header */}
      <div className={`flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.08em] ${mutedClass}`}>
        <span>BILL DRAFT</span>
        <span>대상 · {draft.target}</span>
      </div>

      {/* Title */}
      <div className="mt-2 border-b border-[var(--line)] pb-3">
        {title ? (
          <p className="line-clamp-2 text-[16px] font-bold leading-[1.35]">
            {title}
          </p>
        ) : (
          <svg viewBox="0 0 240 20" aria-hidden="true" className="block h-5 w-full">
            <line
              x1={0}
              y1={10}
              x2={164}
              y2={10}
              stroke="var(--line)"
              strokeWidth={4}
            />
          </svg>
        )}
      </div>

      {/* Clause 1: Purpose */}
      <div className="mt-3">
        <p className="font-clause text-[11px] leading-[1.5] text-[var(--ink-2)]">
          제1조(목적)
        </p>
        {purpose ? (
          <p className="font-clause mt-1 line-clamp-3 text-[12px] leading-[1.6]">
            {purpose}
          </p>
        ) : (
          <PlaceholderBars count={2} />
        )}
      </div>

      {/* Clause 2: Content */}
      <div className="mt-3">
        <p className="font-clause text-[11px] leading-[1.5] text-[var(--ink-2)]">
          제2조(내용)
        </p>
        {content ? (
          <p className="font-clause mt-1 line-clamp-4 text-[12px] leading-[1.6]">
            {content}
          </p>
        ) : (
          <PlaceholderBars count={3} />
        )}
      </div>
    </div>
  );
}
