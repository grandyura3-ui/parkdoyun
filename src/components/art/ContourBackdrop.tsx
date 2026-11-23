import { useInViewOnce } from './useInViewOnce.ts';

interface ContourBackdropProps {
  variant?: 'hero' | 'impact' | 'reflect' | 'band';
  tone?: 'dark' | 'light';
  className?: string;
}

const RADII = [560, 495, 430, 365, 300, 235, 170, 105];

const VARIANT_POSITION: Record<NonNullable<ContourBackdropProps['variant']>, string> = {
  hero: 'right-[-240px] top-1/2 h-[1200px] w-[1200px] -translate-y-1/2',
  impact: 'right-[-260px] top-[-120px] h-[1280px] w-[1280px]',
  reflect: 'right-[-160px] top-1/2 h-[640px] w-[640px] -translate-y-1/2',
  band: 'right-[-180px] top-1/2 h-[1200px] w-[1200px] -translate-y-1/2',
};

export function ContourBackdrop({
  variant = 'hero',
  tone = 'dark',
  className = '',
}: ContourBackdropProps) {
  const { ref, isVisible } = useInViewOnce<HTMLDivElement>(0.05);
  const vis = isVisible ? 'is-visible' : '';

  const colorClass = tone === 'dark' ? 'text-[var(--dark-ink)]' : 'text-[var(--ink)]';

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none select-none absolute ${VARIANT_POSITION[variant]} ${colorClass} ${className}`}
    >
      <svg
        viewBox="0 0 1200 1200"
        className="block h-full w-full"
        aria-hidden="true"
      >
        {RADII.map((r, idx) => (
          <circle
            key={r}
            cx={600}
            cy={600}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.08}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            pathLength={1}
            style={{ animationDelay: `${idx * 60}ms` }}
            className={`art-draw ${vis}`}
          />
        ))}
      </svg>
    </div>
  );
}
