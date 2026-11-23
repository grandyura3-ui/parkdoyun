import { useInViewOnce } from './useInViewOnce.ts';

interface EmptyArtProps {
  variant?: 'empty' | 'error';
  tone?: 'light' | 'dark';
  className?: string;
}

export function EmptyArt({
  variant = 'empty',
  tone = 'light',
  className = '',
}: EmptyArtProps) {
  const { ref, isVisible } = useInViewOnce<HTMLDivElement>(0.1);
  const vis = isVisible ? 'is-visible' : '';

  const colorClass = tone === 'dark' ? 'text-[var(--dark-ink)]' : 'text-[var(--ink)]';
  const accentFill = tone === 'dark' ? 'var(--accent-on-dark)' : 'var(--accent)';

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`h-[160px] w-[160px] shrink-0 ${colorClass} ${className}`}
    >
      <svg viewBox="0 0 160 160" className="block h-full w-full" aria-hidden="true">
        {/* Dashed blank sheet */}
        <rect
          x={20}
          y={16}
          width={108}
          height={128}
          rx={0}
          ry={0}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          vectorEffect="non-scaling-stroke"
          className={`art-clip ${vis}`}
        />

        {/* Error variant: single folded-corner line */}
        {variant === 'error' && (
          <path
            d="M100 16 L128 44"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
            pathLength={1}
            style={{ animationDelay: '200ms' }}
            className={`art-draw ${vis}`}
          />
        )}

        {/* Single 4px --accent dot in bottom-left corner */}
        <circle cx={38} cy={126} r={2} fill={accentFill} />
      </svg>
    </div>
  );
}
