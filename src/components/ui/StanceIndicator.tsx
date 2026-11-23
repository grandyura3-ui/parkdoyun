import type { Stance } from '../../types.ts';

const STANCE_LABEL: Record<Stance, string> = {
  SUPPORT: '찬성',
  CONDITIONAL: '조건부 찬성',
  OPPOSE: '반대',
};

export function StanceIndicator({ stance }: { stance: Stance }) {
  return (
    <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--ink)] whitespace-nowrap shrink-0">
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        aria-hidden="true"
        className="shrink-0"
      >
        {stance === 'SUPPORT' && (
          <circle cx="6" cy="6" r="5" fill="var(--ink)" />
        )}
        {stance === 'CONDITIONAL' && (
          <>
            <circle cx="6" cy="6" r="4.5" fill="none" stroke="var(--ink)" strokeWidth="1.2" />
            <path d="M6 1.5 A4.5 4.5 0 0 0 6 10.5 Z" fill="var(--ink)" />
          </>
        )}
        {stance === 'OPPOSE' && (
          <circle cx="6" cy="6" r="4.5" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
        )}
      </svg>
      <span>{STANCE_LABEL[stance]}</span>
    </span>
  );
}
