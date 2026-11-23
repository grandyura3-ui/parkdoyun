import type { ReactNode } from 'react';

interface FigureProps {
  caption?: string;
  rightLabel?: string;
  tone?: 'light' | 'dark';
  className?: string;
  children: ReactNode;
}

export function Figure({
  caption,
  rightLabel,
  tone = 'light',
  className = '',
  children,
}: FigureProps) {
  const borderClass =
    tone === 'dark' ? 'border-[var(--dark-ink)]' : 'border-[var(--ink)]';
  const captionClass =
    tone === 'dark' ? 'text-[var(--dark-ink-2)]' : 'text-[var(--ink-2)]';

  return (
    <figure className={`m-0 border-t ${borderClass} pt-4 ${className}`}>
      {children}
      {(caption || rightLabel) && (
        <figcaption
          className={`mt-3 flex items-baseline justify-between gap-4 text-[12px] font-semibold uppercase tracking-[0.08em] ${captionClass}`}
        >
          <span>{caption}</span>
          {rightLabel && <span className="shrink-0">{rightLabel}</span>}
        </figcaption>
      )}
    </figure>
  );
}
