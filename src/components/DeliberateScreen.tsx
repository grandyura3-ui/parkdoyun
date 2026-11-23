import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type {
  DeliberationResponse,
  Persona,
  PersonaChatTurn,
  PersonaId,
} from '../types.ts';
import { ErrorBanner } from './ErrorBanner.tsx';
import { Button, SectionLabel, StanceIndicator, StepLoading } from './ui/index.ts';

interface DeliberateScreenProps {
  isLoading: boolean;
  deliberation: DeliberationResponse | null;
  personaChats: Record<PersonaId, PersonaChatTurn[]>;
  askingPersonaId: PersonaId | null;
  errorMessage: string | null;
  onEditDraft: () => void;
  onRetryDeliberation: () => void;
  onUseSample: () => void;
  onAskPersona: (persona: Persona, question: string) => Promise<void>;
  onNextToImpact: () => void;
}

const LOADING_MESSAGES = [
  '법안을 접수하는 중…',
  '조문 형식으로 정리하는 중…',
  '이해관계자를 소집하는 중…',
  '발언 순서를 정하는 중…',
];

export function DeliberateScreen({
  isLoading,
  deliberation,
  personaChats,
  askingPersonaId,
  errorMessage,
  onEditDraft,
  onRetryDeliberation,
  onUseSample,
  onAskPersona,
  onNextToImpact,
}: DeliberateScreenProps) {
  const [openQaId, setOpenQaId] = useState<PersonaId | null>(null);
  const [focusedQaId, setFocusedQaId] = useState<PersonaId | null>(null);
  const [questionInputs, setQuestionInputs] = useState<Record<PersonaId, string>>({
    student: '',
    teacher: '',
    parent: '',
    admin: '',
    unseen: '',
  });

  if (isLoading) {
    return (
      <StepLoading
        stepLabel="STEP 02 / 05"
        messages={LOADING_MESSAGES}
        hint="다섯 이해관계자의 입장을 정리하는 데 보통 5~10초 정도 걸립니다."
        slowHint="입력이 구체적일수록 심의 준비에 조금 더 시간이 걸릴 수 있어요."
        onUseSample={onUseSample}
      />
    );
  }

  if (errorMessage && !deliberation) {
    return (
      <div className="animate-draft-enter">
        <ErrorBanner
          message={errorMessage}
          onRetry={onRetryDeliberation}
          onUseSample={onUseSample}
        />
      </div>
    );
  }

  if (!deliberation) return null;

  if (!deliberation.intake.accepted) {
    return (
      <div className="animate-draft-enter grid grid-cols-1 gap-y-12 lg:grid-cols-12 lg:gap-x-6">
        <div className="lg:col-span-5">
          <SectionLabel className="text-[var(--danger)]">STEP 02 / 05 · 접수 반려</SectionLabel>
          <h1 className="type-h1 mt-4 whitespace-pre-line text-[var(--ink)]">
            {'접수 단계에서\n반려되었습니다'}
          </h1>
        </div>

        <div className="border-t border-[var(--line-strong)] pt-8 lg:col-span-6 lg:col-start-7">
          <p className="text-[20px] font-medium leading-[1.6] text-[var(--ink)]">
            {deliberation.intake.rejectReason}
          </p>

          {deliberation.intake.rejectGuide && (
            <div className="mt-8 border-t border-[var(--line)] pt-6">
              <SectionLabel>고치는 방법</SectionLabel>
              <p className="mt-2 text-[17px] leading-[1.65] text-[var(--ink-2)]">
                {deliberation.intake.rejectGuide}
              </p>
            </div>
          )}

          <div className="mt-12">
            <Button variant="primary" onClick={onEditDraft} className="w-full sm:w-auto sm:min-w-[320px]">
              수정해서 다시 발의하기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const personaById = Object.fromEntries(
    deliberation.personas.map((p) => [p.id, p]),
  ) as Record<PersonaId, Persona>;
  const personaNumberById = Object.fromEntries(
    deliberation.personas.map((p, idx) => [p.id, String(idx + 1).padStart(2, '0')]),
  ) as Record<PersonaId, string>;

  const handleSendQuestion = async (persona: Persona) => {
    const q = (questionInputs[persona.id] ?? '').trim();
    if (!q || askingPersonaId === persona.id) return;
    setQuestionInputs((prev) => ({ ...prev, [persona.id]: '' }));
    await onAskPersona(persona, q);
  };

  return (
    <div>
      {/* Formalized Bill */}
      <section aria-labelledby="formal-bill-heading" className="animate-draft-enter">
        <SectionLabel>STEP 02 / 05</SectionLabel>
        <h1
          id="formal-bill-heading"
          className="type-h1 mt-4 text-[var(--ink)]"
        >
          조문화된 법안
        </h1>

        <h2 className="type-h2 mt-12 text-[var(--ink)]">
          {deliberation.bill.title}
        </h2>

        <dl className="mt-8 divide-y divide-[var(--line)] border-y border-[var(--ink)]">
          {deliberation.bill.clauses.map((clause) => (
            <div
              key={clause.no}
              className="grid grid-cols-1 gap-y-2 py-6 sm:grid-cols-12 sm:gap-x-6"
            >
              <dt className="flex items-baseline gap-2 whitespace-nowrap sm:col-span-3">
                <span className="tabular-nums text-[15px] font-bold text-[var(--accent)]">
                  {clause.no}
                </span>
                <span className="text-[14px] font-semibold text-[var(--ink-2)]">
                  ({clause.heading})
                </span>
              </dt>
              <dd className="font-clause text-[18px] leading-[1.8] text-[var(--ink)] sm:col-span-9">
                {clause.text}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Five Stakeholder Voices */}
      <section aria-labelledby="voices-heading" className="mt-16 lg:mt-[160px]">
        <SectionLabel>FIVE VOICES</SectionLabel>
        <h2
          id="voices-heading"
          className="type-h2 mt-3 text-[var(--ink)]"
        >
          심의 — 다섯 개의 목소리
        </h2>

        {errorMessage && (
          <div className="mt-8">
            <ErrorBanner
              message={errorMessage}
              onRetry={onRetryDeliberation}
              onUseSample={onUseSample}
            />
          </div>
        )}

        <div className="mt-12 border-b border-[var(--line)]">
          {deliberation.personas.map((persona, idx) => {
            const isUnseen = persona.id === 'unseen';
            const chats = personaChats[persona.id] ?? [];
            const isQaOpen = openQaId === persona.id;
            const remaining = 3 - chats.length;
            const isAsking = askingPersonaId === persona.id;
            const numberStr = String(idx + 1).padStart(2, '0');
            const isFocusedQa = focusedQaId === persona.id;

            return (
              <article
                key={persona.id}
                style={{ animationDelay: `${idx * 60}ms` }}
                className={`animate-draft-enter py-8 lg:py-12 ${
                  isUnseen
                    ? 'border-t border-dashed border-[var(--ink-2)]'
                    : idx === 0
                      ? 'border-t border-[var(--ink)]'
                      : 'border-t border-[var(--line)]'
                }`}
              >
                <div className="grid grid-cols-1 gap-y-8 lg:grid-cols-12 lg:gap-x-6">
                  {/* Left (Columns 1-3): Number, Role, Stance */}
                  <div className="lg:col-span-3">
                    {isUnseen && (
                      <div className="mb-3">
                        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--accent)]">
                          UNSEEN
                        </p>
                        {persona.unseenDescription && (
                          <p className="mt-1 text-[13px] leading-[1.5] text-[var(--ink-2)]">
                            {persona.unseenDescription}
                          </p>
                        )}
                      </div>
                    )}

                    <span className="tabular-nums text-[13px] font-semibold tracking-[0.08em] text-[var(--ink-2)]">
                      {numberStr}
                    </span>

                    <h3 className="mt-2 text-[22px] font-bold leading-[1.3] text-[var(--ink)]">
                      {persona.roleLabel}
                    </h3>

                    <p className="mt-1 text-[12px] text-[var(--ink-2)]">
                      가상 페르소나
                    </p>

                    <div className="mt-4">
                      <StanceIndicator stance={persona.stance} />
                    </div>
                  </div>

                  {/* Center (Columns 4-9): Headline (28px/700) + Statement + Q&A */}
                  <div className="lg:col-span-6">
                    <p className="text-[24px] font-bold leading-[1.35] tracking-[-0.02em] text-[var(--ink)] sm:text-[28px]">
                      {persona.headline}
                    </p>

                    <blockquote className="mt-4 text-[17px] leading-[1.65] text-[var(--ink)]">
                      “{persona.statement}”
                    </blockquote>

                    {persona.values.length > 0 && (
                      <p className="mt-4 text-[13px] text-[var(--ink-2)]">
                        중요 가치 — {persona.values.join(' / ')}
                      </p>
                    )}
                  </div>

                  {/* Right (Columns 10-12): CONCERNS & DEMANDS */}
                  <div className="lg:col-span-3">
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-2)]">
                        CONCERNS
                      </p>
                      <ul className="mt-2 space-y-1.5 text-[14px] leading-[1.6] text-[var(--ink)]">
                        {persona.concerns.map((item, cIdx) => (
                          <li key={cIdx}>— {item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6">
                      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-2)]">
                        DEMANDS
                      </p>
                      <ul className="mt-2 space-y-1.5 text-[14px] leading-[1.6] text-[var(--ink)]">
                        {persona.demands.map((item, dIdx) => (
                          <li key={dIdx}>— {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Inline Q&A Trigger & Underline Expansion */}
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 lg:gap-x-6">
                  <div className="border-t border-[var(--line)] pt-4 lg:col-span-9 lg:col-start-4">
                    <div className="flex items-center justify-between gap-4">
                      <Button
                        variant="text"
                        aria-expanded={isQaOpen}
                        onClick={() => setOpenQaId(isQaOpen ? null : persona.id)}
                        className="text-[15px]"
                      >
                        <span>{isQaOpen ? '질문 닫기' : '이 사람에게 질문하기'}</span>
                      </Button>

                      <span className="tabular-nums text-[12px] font-semibold text-[var(--ink-2)]">
                        남은 질문 {remaining}/3회
                      </span>
                    </div>

                    {isQaOpen && (
                      <div className="mt-6 space-y-6">
                        {chats.length > 0 && (
                          <div className="divide-y divide-[var(--line)] border-t border-[var(--line)]">
                            {chats.map((turn, tIdx) => (
                              <div key={tIdx} className="py-4">
                                <p className="text-[15px] font-semibold text-[var(--ink)]">
                                  나 — {turn.question}
                                </p>
                                <p className="mt-2 text-[16px] leading-[1.65] text-[var(--ink)]">
                                  {persona.roleLabel} — {turn.answer}
                                </p>
                                {turn.stanceShift !== 'NONE' && (
                                  <p
                                    className={`mt-2 text-[12px] font-semibold ${
                                      turn.stanceShift === 'HARDENED'
                                        ? 'text-[var(--danger)]'
                                        : 'text-[var(--accent)]'
                                    }`}
                                  >
                                    {turn.stanceShift === 'SOFTENED'
                                      ? '입장이 조금 누그러졌습니다.'
                                      : '우려가 더 커졌습니다.'}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {remaining > 0 ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleSendQuestion(persona);
                            }}
                            className="flex flex-col gap-4 sm:flex-row sm:items-end"
                          >
                            <div className="relative flex-1 border-b border-[var(--line)]">
                              <label htmlFor={`qa-${persona.id}`} className="sr-only">
                                {persona.roleLabel}에게 질문 입력
                              </label>
                              <input
                                id={`qa-${persona.id}`}
                                type="text"
                                maxLength={200}
                                value={questionInputs[persona.id] ?? ''}
                                onFocus={() => setFocusedQaId(persona.id)}
                                onBlur={() =>
                                  setFocusedQaId((prev) => (prev === persona.id ? null : prev))
                                }
                                onChange={(e) =>
                                  setQuestionInputs((prev) => ({
                                    ...prev,
                                    [persona.id]: e.target.value,
                                  }))
                                }
                                placeholder="예: 점심시간에만 허용하면 어떨까요?"
                                className="block w-full border-0 bg-transparent px-0 py-4 text-[18px] font-medium text-[var(--ink)] placeholder:text-[var(--ink-3)]"
                              />
                              <span
                                aria-hidden="true"
                                className={`pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-[var(--ink)] transition-opacity duration-150 ${
                                  isFocusedQa ? 'opacity-100' : 'opacity-0'
                                }`}
                              />
                            </div>

                            <button
                              type="submit"
                              disabled={isAsking || !(questionInputs[persona.id] ?? '').trim()}
                              aria-label={`${persona.roleLabel}에게 질문 보내기`}
                              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 bg-[var(--ink)] px-6 text-[15px] font-bold text-[var(--bg)] transition-colors duration-200 hover:bg-[var(--accent)] active:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:bg-[var(--line)] disabled:text-[var(--ink-3)] whitespace-nowrap"
                            >
                              <span>{isAsking ? '답변 중…' : '질문'}</span>
                              <ArrowRight size={20} strokeWidth={1.5} aria-hidden="true" />
                            </button>
                          </form>
                        ) : (
                          <p className="text-[13px] text-[var(--ink-2)]">
                            이 이해관계자에게는 3회 질문을 모두 사용했습니다.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Value Conflicts */}
      <section aria-labelledby="conflicts-heading" className="mt-16 lg:mt-[160px]">
        <SectionLabel>VALUE CONFLICTS</SectionLabel>
        <h2
          id="conflicts-heading"
          className="type-h2 mt-3 text-[var(--ink)]"
        >
          쟁점 충돌
        </h2>

        <div className="mt-12 divide-y divide-[var(--line)] border-y border-[var(--ink)]">
          {deliberation.conflicts.map((conflict, idx) => (
            <div key={idx} className="py-8">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-[18px] font-bold text-[var(--ink)]">
                  {conflict.valueA}
                </span>
                <span className="text-right text-[18px] font-bold text-[var(--ink)]">
                  {conflict.valueB}
                </span>
              </div>

              {/* 1px horizontal line with stakeholder dots */}
              <div className="relative mt-4 flex h-4 items-center justify-between">
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[var(--ink)]"
                />

                <div className="relative z-10 flex items-center gap-2">
                  {conflict.sideA.map((pid) => {
                    const p = personaById[pid];
                    if (!p) return null;
                    return (
                      <span
                        key={pid}
                        title={`${conflict.valueA}: ${p.roleLabel}`}
                        className="inline-flex h-5 min-w-[22px] items-center justify-center border border-[var(--ink)] bg-[var(--bg)] px-1 text-[12px] font-bold leading-none tabular-nums text-[var(--ink)]"
                      >
                        {personaNumberById[pid]}
                      </span>
                    );
                  })}
                </div>

                <div className="relative z-10 flex items-center gap-2">
                  {conflict.sideB.map((pid) => {
                    const p = personaById[pid];
                    if (!p) return null;
                    return (
                      <span
                        key={pid}
                        title={`${conflict.valueB}: ${p.roleLabel}`}
                        className="inline-flex h-5 min-w-[22px] items-center justify-center border border-[var(--ink)] bg-[var(--bg)] px-1 text-[12px] font-bold leading-none tabular-nums text-[var(--ink)]"
                      >
                        {personaNumberById[pid]}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-4 text-[13px]">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  {conflict.sideA.map((pid) => {
                    const p = personaById[pid];
                    if (!p) return null;
                    return (
                      <span
                        key={pid}
                        className="inline-flex items-center gap-1.5 text-[var(--ink)]"
                      >
                        <span className="inline-flex h-5 min-w-[22px] items-center justify-center border border-[var(--ink)] bg-[var(--bg)] px-1 text-[12px] font-bold leading-none tabular-nums text-[var(--ink)]">
                          {personaNumberById[pid]}
                        </span>
                        <span>{p.roleLabel}</span>
                      </span>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-right">
                  {conflict.sideB.map((pid) => {
                    const p = personaById[pid];
                    if (!p) return null;
                    return (
                      <span
                        key={pid}
                        className="inline-flex items-center gap-1.5 text-[var(--ink)]"
                      >
                        <span className="inline-flex h-5 min-w-[22px] items-center justify-center border border-[var(--ink)] bg-[var(--bg)] px-1 text-[12px] font-bold leading-none tabular-nums text-[var(--ink)]">
                          {personaNumberById[pid]}
                        </span>
                        <span>{p.roleLabel}</span>
                      </span>
                    );
                  })}
                </div>
              </div>

              <p className="mt-4 text-[15px] leading-[1.6] text-[var(--ink-2)]">
                {conflict.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Action */}
      <div className="mt-16 flex flex-col gap-6 border-t border-[var(--ink)] pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] text-[var(--ink-2)]">
          다섯 목소리를 바탕으로 이 규칙이 현장에 미칠 영향을 살펴봅니다.
        </p>
        <Button
          variant="primary"
          onClick={onNextToImpact}
          className="w-full sm:w-auto sm:min-w-[280px]"
        >
          영향평가 받기
        </Button>
      </div>
    </div>
  );
}
