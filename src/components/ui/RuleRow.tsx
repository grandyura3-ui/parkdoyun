import type { CSSProperties } from 'react';
import { ArrowRight } from 'lucide-react';

interface RuleRowProps {
  number: string;
  label: string;
  selected?: boolean;
  onClick: () => void;
  className?: string;
  style?: CSSProperties;
}

export function RuleRow({
  number,
  label,
  selected = false,
  onClick,
  className = '',
  style,
}: RuleRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      style={style}
      className={`group flex min-h-[56px] w-full items-center justify-between gap-4 border-b border-[var(--line)] py-3 text-left transition-colors duration-200 ${className}`}
    >
      <span className="flex min-w-0 items-baseline gap-4 transition-transform duration-200 group-hover:translate-x-2">
        <span
          className={`shrink-0 text-[13px] font-semibold tabular-nums tracking-[0.08em] transition-colors duration-200 ${
            selected
              ? 'text-[var(--accent)]'
              : 'text-[var(--ink-2)] group-hover:text-[var(--accent)]'
          }`}
        >
          {number}
        </span>
        <span
          className={`text-[17px] transition-colors duration-200 ${
            selected
              ? 'font-bold text-[var(--ink)] group-hover:text-[var(--accent)]'
              : 'font-medium text-[var(--ink)] group-hover:text-[var(--accent)]'
          }`}
        >
          {label}
        </span>
      </span>
      <ArrowRight
        size={20}
        strokeWidth={1.5}
        aria-hidden="true"
        className={`shrink-0 transition-colors duration-200 ${
          selected
            ? 'text-[var(--accent)]'
            : 'text-[var(--ink)] group-hover:text-[var(--accent)]'
        }`}
      />
    </button>
  );
}
