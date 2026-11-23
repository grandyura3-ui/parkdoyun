import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'text';
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  children,
  className = '',
  disabled = false,
  type = 'button',
  ...rest
}: ButtonProps) {
  if (variant === 'text') {
    return (
      <button
        type={type}
        disabled={disabled}
        className={`inline-flex items-center gap-2 bg-transparent p-0 text-[15px] font-semibold text-[var(--ink)] underline underline-offset-4 decoration-1 transition-colors duration-200 hover:text-[var(--accent)] active:text-[var(--accent-hover)] disabled:cursor-not-allowed disabled:text-[var(--ink-3)] disabled:no-underline ${className}`}
        {...rest}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      className={`group inline-flex h-16 items-center justify-between gap-4 bg-[var(--ink)] px-6 text-[20px] font-bold text-[var(--bg)] transition-colors duration-200 hover:bg-[var(--accent)] active:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:bg-[var(--line)] disabled:text-[var(--ink-3)] disabled:hover:bg-[var(--line)] ${className}`}
      {...rest}
    >
      <span>{children}</span>
      <ArrowRight
        size={20}
        strokeWidth={1.5}
        aria-hidden="true"
        className="shrink-0 transition-transform duration-200 group-hover:translate-x-2 group-disabled:translate-x-0"
      />
    </button>
  );
}
