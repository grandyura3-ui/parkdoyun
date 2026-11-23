import type { CSSProperties, ReactNode } from 'react';

interface SectionLabelProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function SectionLabel({ children, className = '', style }: SectionLabelProps) {
  const hasCustomColor = /\btext-/.test(className);
  return (
    <p
      style={style}
      className={`text-[12px] font-semibold uppercase tracking-[0.08em] tabular-nums ${
        hasCustomColor ? '' : 'text-[var(--ink-2)]'
      } ${className}`}
    >
      {children}
    </p>
  );
}
