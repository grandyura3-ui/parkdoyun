import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';

interface BaseFieldProps {
  id: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  counter?: { current: number; max: number };
  className?: string;
  style?: CSSProperties;
}

interface InputFieldProps extends BaseFieldProps {
  as?: 'input';
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  maxLength?: number;
}

interface TextareaFieldProps extends BaseFieldProps {
  as: 'textarea';
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  maxLength?: number;
  minRows?: number;
  textSize?: '20' | '24';
}

interface RadioListFieldProps<T extends string> extends BaseFieldProps {
  as: 'radio-list';
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}

type FieldProps<T extends string = string> =
  | InputFieldProps
  | TextareaFieldProps
  | RadioListFieldProps<T>;

function RequiredDot() {
  return (
    <svg
      width="4"
      height="4"
      viewBox="0 0 4 4"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx="2" cy="2" r="2" fill="var(--accent)" />
    </svg>
  );
}

export function Field<T extends string = string>(props: FieldProps<T>) {
  const {
    id,
    label,
    required = false,
    optional = false,
    error,
    counter,
    className = '',
    style,
  } = props;

  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const radioRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const textareaValue = props.as === 'textarea' ? props.value : '';
  const textareaMinRows = props.as === 'textarea' ? (props.minRows ?? 3) : 3;
  useEffect(() => {
    if (props.as !== 'textarea') return;
    const el = textareaRef.current;
    if (!el) return;
    const minHeight = textareaMinRows === 1 ? 82 : 144;
    const resize = () => {
      el.style.height = 'auto';
      el.style.height = `${Math.max(minHeight, el.scrollHeight)}px`;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [props.as, textareaMinRows, textareaValue]);

  const errorId = `${id}-error`;
  const labelId = `${id}-label`;
  const isOverLimit = counter ? counter.current >= counter.max : false;

  const renderLabelRow = () => (
    <div className="flex items-baseline justify-between gap-4">
      {props.as === 'radio-list' ? (
        <span
          id={labelId}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-2)]"
        >
          <span>{label}</span>
          {required && <RequiredDot />}
          {optional && (
            <span className="text-[12px] font-semibold tracking-[0.08em] text-[var(--ink-2)]">
              OPTIONAL
            </span>
          )}
        </span>
      ) : (
        <label
          htmlFor={id}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-2)]"
        >
          <span>{label}</span>
          {required && <RequiredDot />}
          {optional && (
            <span className="text-[12px] font-semibold tracking-[0.08em] text-[var(--ink-2)]">
              OPTIONAL
            </span>
          )}
        </label>
      )}

      {counter && (
        <span
          className={`tabular-nums text-[12px] font-semibold transition-colors duration-150 ${
            isOverLimit ? 'text-[var(--danger)]' : 'text-[var(--ink-2)]'
          }`}
        >
          {counter.current}/{counter.max}자
        </span>
      )}
    </div>
  );

  if (props.as === 'radio-list') {
    const { value, options, onChange } = props;

    const handleRadioKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
      let nextIndex = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextIndex = (index + 1) % options.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        nextIndex = (index - 1 + options.length) % options.length;
      }
      if (nextIndex >= 0) {
        onChange(options[nextIndex]);
        radioRefs.current[nextIndex]?.focus();
      }
    };

    return (
      <div style={style} className={className}>
        {renderLabelRow()}
        <div
          role="radiogroup"
          aria-labelledby={labelId}
          className="flex flex-wrap gap-x-6 gap-y-4 border-b border-[var(--line)] py-6"
        >
          {options.map((opt, idx) => {
            const isSelected = value === opt;
            return (
              <button
                key={opt}
                ref={(el) => {
                  radioRefs.current[idx] = el;
                }}
                type="button"
                role="radio"
                aria-checked={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => onChange(opt)}
                onKeyDown={(e) => handleRadioKeyDown(e, idx)}
                className={`border-b-2 bg-transparent px-0 pb-1 text-[20px] leading-[1.35] transition-colors duration-150 sm:text-[24px] ${
                  isSelected
                    ? 'border-[var(--ink)] font-bold text-[var(--ink)]'
                    : 'border-transparent font-medium text-[var(--ink-2)] hover:text-[var(--ink)]'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
        {error && (
          <p id={errorId} className="mt-2 text-[13px] font-medium text-[var(--danger)]">
            {error}
          </p>
        )}
      </div>
    );
  }

  const underlineClass = error
    ? 'bg-[var(--danger)] opacity-100'
    : isFocused
      ? 'bg-[var(--ink)] opacity-100'
      : 'bg-[var(--ink)] opacity-0';

  if (props.as === 'textarea') {
    const {
      value,
      onChange,
      onBlur,
      placeholder,
      maxLength,
      minRows = 3,
      textSize = '20',
    } = props;
    const sizeClasses =
      textSize === '24'
        ? 'text-[24px] leading-[1.4]'
        : 'text-[20px] leading-[1.6]';
    return (
      <div style={style} className={className}>
        {renderLabelRow()}
        <div className="relative border-b border-[var(--line)]">
          <textarea
            ref={textareaRef}
            id={id}
            rows={minRows}
            maxLength={maxLength}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              onBlur?.();
            }}
            placeholder={placeholder}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            className={`block w-full resize-none overflow-hidden border-0 bg-transparent px-0 py-6 font-medium text-[var(--ink)] placeholder:text-[var(--ink-3)] ${sizeClasses}`}
          />
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute inset-x-0 bottom-0 h-[2px] transition-opacity duration-150 ${underlineClass}`}
          />
        </div>
        {error && (
          <p id={errorId} className="mt-2 text-[13px] font-medium text-[var(--danger)]">
            {error}
          </p>
        )}
      </div>
    );
  }

  const { value, onChange, onBlur, placeholder, maxLength } = props;
  return (
    <div style={style} className={className}>
      {renderLabelRow()}
      <div className="relative border-b border-[var(--line)]">
        <input
          id={id}
          type="text"
          maxLength={maxLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className="block w-full border-0 bg-transparent px-0 py-6 text-[24px] font-medium leading-[1.4] text-[var(--ink)] placeholder:text-[var(--ink-3)]"
        />
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 bottom-0 h-[2px] transition-opacity duration-150 ${underlineClass}`}
        />
      </div>
      {error && (
        <p id={errorId} className="mt-2 text-[13px] font-medium text-[var(--danger)]">
          {error}
        </p>
      )}
    </div>
  );
}
