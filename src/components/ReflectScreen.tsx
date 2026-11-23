import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type {
  AdoptedChoice,
  BillDraft,
  DeliberationResponse,
  ImpactResponse,
  ReflectionResponse,
  RevisionsResponse,
  SavedRecord,
  ValueKey,
  ValueWeights,
} from '../types.ts';
import {
  buildLegislativeReportText,
  formatKoreanDate,
  generateDocumentNumber,
  getAdoptedPlanLabel,
  getScoreTierLabel,
  VALUE_LABELS,
} from '../lib/formatters.ts';
import { ErrorBanner } from './ErrorBanner.tsx';
import { Button, SectionLabel, StanceIndicator, StepLoading } from './ui/index.ts';
import { ContourBackdrop } from './art/index.ts';

interface ReflectScreenProps {
  draft: BillDraft;
  deliberation: DeliberationResponse;
  impact: ImpactResponse;
  revisions: RevisionsResponse;
  adoptedChoice: AdoptedChoice;
  valueWeights: ValueWeights;
  reflection: ReflectionResponse | null;
  reflectionAnswers: string[];
  activeRecord: SavedRecord | null;
  isLoading: boolean;
  errorMessage: string | null;
  onChangeWeights: (weights: ValueWeights) => void;
  onRequestReflection: () => void;
  onUseSample: () => void;
  onChangeAnswer: (index: number, value: string) => void;
  onStartNewBill: () => void;
}

const VALUE_KEYS: ValueKey[] = [
  'freedom',
  'safety',
  'equality',
  'efficiency',
  'responsibility',
  'community',
];

const REFLECT_LOADING_MESSAGES = [
  '여섯 가지 가치 점수를 읽는 중…',
  '선택한 안의 가치 긴장을 분석하는 중…',
  '나의 입법 원칙과 성찰 질문을 정리하는 중…',
];

export function ReflectScreen({
  draft,
  deliberation,
  impact,
  revisions,
  adoptedChoice,
  valueWeights,
  reflection,
  reflectionAnswers,
  activeRecord,
  isLoading,
  errorMessage,
  onChangeWeights,
  onRequestReflection,
  onUseSample,
  onChangeAnswer,
  onStartNewBill,
}: ReflectScreenProps) {
  const [copied, setCopied] = useState(false);
  const [focusedAnswerIdx, setFocusedAnswerIdx] = useState<number | null>(null);

  const allSame =
    new Set(VALUE_KEYS.map((k) => valueWeights[k])).size === 1;

  const adoptedLabel = getAdoptedPlanLabel(adoptedChoice, revisions);

  const stanceCounts = {
    SUPPORT: deliberation.personas.filter((p) => p.stance === 'SUPPORT').length,
    CONDITIONAL: deliberation.personas.filter((p) => p.stance === 'CONDITIONAL').length,
    OPPOSE: deliberation.personas.filter((p) => p.stance === 'OPPOSE').length,
  };

  const docNumber =
    activeRecord?.docNumber ?? generateDocumentNumber(new Date(), 1);
  const createdAt = activeRecord?.createdAt ?? new Date().toISOString();

  const handleCopyText = async () => {
    if (!reflection) return;
    const recordForText: SavedRecord = activeRecord ?? {
      id: 'temp',
      docNumber,
      createdAt,
      draft,
      deliberation,
      impact,
      revisions,
      adoptedChoice,
      valueWeights,
      reflection,
      reflectionAnswers,
      isDemo: false,
    };
    const text = buildLegislativeReportText(recordForText);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div>
      {/* Top Interactive Reflection Section */}
      <div className="no-print mx-auto max-w-[1320px] px-6 py-16 lg:px-12 lg:py-[160px]">
        <div className="max-w-3xl">
          <SectionLabel>STEP 05 / 05</SectionLabel>
          <h1 className="type-h1 mt-4 whitespace-pre-line text-[var(--ink)]">
            {'이 법안을 결정할 때\n무엇을 더 소중히 여겼나요?'}
          </h1>
          <p className="mt-6 max-w-[65ch] text-[17px] leading-[1.65] text-[var(--ink-2)]">
            선택한 안({adoptedLabel})을 떠올리며 아래 여섯 가지 가치의 중요도를 조절해 보세요.
          </p>
        </div>

        {/* 6 Value Sliders */}
        <section aria-labelledby="value-sliders-heading" className="mt-12 lg:mt-16">
          <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-[var(--ink)] pb-4">
            <h2
              id="value-sliders-heading"
              className="type-h2 text-[var(--ink)]"
            >
              가치 우선순위 점검 (0~5)
            </h2>
            {allSame && (
              <span className="text-[13px] font-semibold text-[var(--accent)]">
                모두 같은 점수예요. 하나를 더 중요하게 골라보세요.
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-x-12 md:grid-cols-2">
            {VALUE_KEYS.map((key) => {
              const meta = VALUE_LABELS[key];
              const val = valueWeights[key];
              const pct = (val / 5) * 100;

              return (
                <div
                  key={key}
                  className="border-b border-[var(--line)] py-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <label
                        htmlFor={`slider-${key}`}
                        className="block text-[18px] font-bold leading-[1.3] text-[var(--ink)]"
                      >
                        {meta.label}
                      </label>
                      <p className="mt-1 text-[13px] leading-[1.5] text-[var(--ink-2)]">
                        {meta.hint}
                      </p>
                    </div>
                    <span className="tabular-nums shrink-0 text-[32px] font-extrabold leading-none tracking-[-0.03em] text-[var(--ink)]">
                      {val}
                    </span>
                  </div>

                  {/* Thin 1px track + black square thumb */}
                  <div className="relative mt-5 flex h-6 items-center">
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[var(--line)]"
                    >
                      <div
                        style={{ width: `${pct}%` }}
                        className="h-px bg-[var(--ink)]"
                      />
                    </div>
                    <input
                      id={`slider-${key}`}
                      type="range"
                      min={0}
                      max={5}
                      step={1}
                      value={val}
                      onChange={(e) =>
                        onChangeWeights({
                          ...valueWeights,
                          [key]: Number(e.target.value),
                        })
                      }
                      className="swiss-slider relative z-10"
                    />
                  </div>

                  <div className="mt-1 flex justify-between text-[12px] font-semibold tabular-nums text-[var(--ink-2)]">
                    <span>0</span>
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                    <span>5</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
            <p className="text-[13px] text-[var(--ink-2)]">
              조정한 가치 점수를 바탕으로 나의 입법 원칙을 정리합니다.
            </p>
            <Button
              variant="primary"
              disabled={isLoading}
              onClick={onRequestReflection}
              className="w-full sm:w-auto sm:min-w-[280px]"
            >
              {isLoading
                ? '성찰 정리 중…'
                : reflection
                  ? '성찰 결과 다시 받기'
                  : '성찰 결과 받기'}
            </Button>
          </div>
        </section>

        {errorMessage && (
          <div className="mt-12">
            <ErrorBanner
              message={errorMessage}
              onRetry={onRequestReflection}
              onUseSample={onUseSample}
            />
          </div>
        )}

        {isLoading && (
          <div className="mt-12 border-t border-[var(--ink)] pt-8">
            <StepLoading
              compact
              stepLabel="REFLECTION"
              messages={REFLECT_LOADING_MESSAGES}
              hint="가치 우선순위와 선택한 안의 긴장을 분석하고 있습니다."
              slowHint="성찰 문장을 정리하는 중이니 잠시만 기다려 주세요."
              onUseSample={onUseSample}
            />
          </div>
        )}

        {reflection && !isLoading && (
          <section aria-label="성찰 분석 및 질문" className="mt-16 lg:mt-24">
            {/* Value Profile & Tension 2-Col Hairline Grid */}
            <div className="grid grid-cols-1 gap-12 border-y border-[var(--ink)] py-10 lg:grid-cols-2 lg:gap-0 lg:divide-x lg:divide-[var(--line)]">
              <div className="lg:pr-12">
                <SectionLabel>VALUE PROFILE</SectionLabel>
                <h2 className="type-h2 mt-3 text-[var(--ink)]">
                  나의 가치 프로필
                </h2>
                <p className="mt-5 text-[17px] leading-[1.7] text-[var(--ink)]">
                  {reflection.profile}
                </p>
              </div>

              <div className="border-t border-[var(--line)] pt-8 lg:border-t-0 lg:pt-0 lg:pl-12">
                <SectionLabel>TRADE-OFF & TENSION</SectionLabel>
                <h2 className="type-h2 mt-3 text-[var(--ink)]">
                  선택의 대가와 긴장
                </h2>
                <p className="mt-5 text-[17px] leading-[1.7] text-[var(--ink)]">
                  {reflection.tension}
                </p>
              </div>
            </div>

            {/* 3 Self-Reflection Underline Inputs */}
            <div className="mt-16">
              <SectionLabel>SELF QUESTIONS</SectionLabel>
              <h2 className="type-h2 mt-3 text-[var(--ink)]">
                스스로에게 던지는 성찰 질문
              </h2>
              <p className="mt-2 text-[14px] text-[var(--ink-2)]">
                정답이 있는 질문이 아닙니다. 내 생각을 짧게 적으면 아래 입법 결과서에 함께 담깁니다.
              </p>

              <div className="mt-8 divide-y divide-[var(--line)] border-t border-[var(--ink)]">
                {reflection.questions.map((q, idx) => {
                  const isFocused = focusedAnswerIdx === idx;
                  return (
                    <div key={idx} className="py-8">
                      <label
                        htmlFor={`reflect-q-${idx}`}
                        className="flex flex-wrap items-baseline justify-between gap-2"
                      >
                        <span className="text-[18px] font-bold leading-[1.45] text-[var(--ink)]">
                          <span className="mr-2 tabular-nums text-[var(--accent)]">
                            Q{idx + 1}.
                          </span>
                          {q}
                        </span>
                        <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-2)]">
                          OPTIONAL
                        </span>
                      </label>

                      <div className="relative mt-4 border-b border-[var(--line)]">
                        <input
                          id={`reflect-q-${idx}`}
                          type="text"
                          maxLength={200}
                          value={reflectionAnswers[idx] ?? ''}
                          onFocus={() => setFocusedAnswerIdx(idx)}
                          onBlur={() =>
                            setFocusedAnswerIdx((prev) => (prev === idx ? null : prev))
                          }
                          onChange={(e) => onChangeAnswer(idx, e.target.value)}
                          placeholder="내 생각을 자유롭게 한두 문장으로 적어보세요"
                          className="block w-full border-0 bg-transparent px-0 py-4 text-[18px] font-medium text-[var(--ink)] placeholder:text-[var(--ink-3)]"
                        />
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-[var(--ink)] transition-opacity duration-150 ${
                            isFocused ? 'opacity-100' : 'opacity-0'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Bottom A4 Legislative Report on --surface-alt */}
      {reflection && (
        <section
          id="printable-report-backdrop"
          aria-labelledby="report-heading"
          className="w-full border-t border-[var(--line)] bg-[var(--surface-alt)] py-16 lg:py-[160px]"
        >
          <div className="mx-auto max-w-[794px] px-6 sm:px-0">
            {/* Report Toolbar (no-print) */}
            <div className="no-print mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <SectionLabel>LEGISLATIVE REPORT</SectionLabel>
                <h2 id="report-heading" className="type-h2 mt-2 text-[var(--ink)]">
                  입법 결과서
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <Button variant="primary" onClick={() => window.print()}>
                  PDF로 저장
                </Button>
                <Button variant="text" onClick={handleCopyText}>
                  <span>{copied ? '복사됨' : '텍스트 복사'}</span>
                </Button>
              </div>
            </div>

            {/* White A4 Paper Sheet */}
            <article
              id="printable-report"
              className="border border-[var(--line)] bg-[var(--bg)] p-6 sm:p-12 lg:p-16"
            >
              {/* Document Header */}
              <header className="border-b border-[var(--ink)] pb-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-2)]">
                  MOCK LEGISLATURE · OFFICIAL LEGISLATIVE REPORT
                </p>
                <h3 className="mt-3 text-[32px] font-extrabold leading-[1.15] tracking-[-0.03em] text-[var(--ink)] sm:text-[40px]">
                  입법 결과서
                </h3>

                <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-[var(--line)] pt-5 sm:grid-cols-3">
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-2)]">
                      DOC NO.
                    </dt>
                    <dd className="mt-1 tabular-nums text-[14px] font-semibold text-[var(--ink)]">
                      {docNumber}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-2)]">
                      DATE
                    </dt>
                    <dd className="mt-1 tabular-nums text-[14px] font-semibold text-[var(--ink)]">
                      {formatKoreanDate(createdAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-2)]">
                      TARGET
                    </dt>
                    <dd className="mt-1 text-[14px] font-semibold text-[var(--ink)]">
                      {draft.target}
                    </dd>
                  </div>
                </dl>
              </header>

              {/* My Legislative Principle (Dark section with ContourBackdrop; monochrome on print) */}
              <div className="relative overflow-hidden border-b border-[var(--ink)] bg-[var(--dark)] px-6 py-10 text-[var(--dark-ink)] sm:px-10">
                <ContourBackdrop variant="reflect" tone="dark" className="no-print" />
                <div className="relative z-10">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--accent-on-dark)]">
                    LEGISLATIVE PRINCIPLE · 나의 입법 원칙
                  </p>
                  <p className="mt-4 text-[28px] font-bold leading-[1.25] tracking-[-0.02em] text-[var(--dark-ink)] sm:text-[40px]">
                    “{reflection.principle}”
                  </p>
                </div>
              </div>

              {/* 1. Original Bill Clauses */}
              <div className="pt-10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-2)]">
                  SECTION 01
                </p>
                <h4 className="mt-2 text-[20px] font-bold text-[var(--ink)]">
                  1. 원안 조문 — {deliberation.bill.title}
                </h4>
                <dl className="mt-4 divide-y divide-[var(--line)] border-y border-[var(--ink)] text-[15px]">
                  {deliberation.bill.clauses.map((c) => (
                    <div
                      key={c.no}
                      className="grid grid-cols-1 gap-1.5 py-3.5 sm:grid-cols-[160px_1fr] sm:gap-6"
                    >
                      <dt className="tabular-nums font-bold text-[var(--accent)]">
                        {c.no} ({c.heading})
                      </dt>
                      <dd className="font-clause leading-[1.7] text-[var(--ink)]">
                        {c.text}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* 2. Deliberation Stance Distribution */}
              <div className="pt-10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-2)]">
                  SECTION 02
                </p>
                <h4 className="mt-2 text-[20px] font-bold text-[var(--ink)]">
                  2. 이해관계자 심의 요약
                </h4>

                <div className="mt-4 flex h-2 w-full bg-[var(--line)]">
                  {stanceCounts.SUPPORT > 0 && (
                    <div
                      style={{ width: `${(stanceCounts.SUPPORT / 5) * 100}%` }}
                      className="bg-[var(--ink)]"
                      title={`찬성 ${stanceCounts.SUPPORT}명`}
                    />
                  )}
                  {stanceCounts.CONDITIONAL > 0 && (
                    <div
                      style={{ width: `${(stanceCounts.CONDITIONAL / 5) * 100}%` }}
                      className="bg-[var(--ink-2)]"
                      title={`조건부 찬성 ${stanceCounts.CONDITIONAL}명`}
                    />
                  )}
                  {stanceCounts.OPPOSE > 0 && (
                    <div
                      style={{ width: `${(stanceCounts.OPPOSE / 5) * 100}%` }}
                      className="border-l border-[var(--ink)] bg-[var(--surface-alt)]"
                      title={`반대 ${stanceCounts.OPPOSE}명`}
                    />
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 tabular-nums text-[12px] font-semibold text-[var(--ink-2)]">
                  <span>찬성 {stanceCounts.SUPPORT}명</span>
                  <span>조건부 찬성 {stanceCounts.CONDITIONAL}명</span>
                  <span>반대 {stanceCounts.OPPOSE}명</span>
                </div>

                <ul className="mt-4 divide-y divide-[var(--line)] border-t border-[var(--line)] text-[14px]">
                  {deliberation.personas.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-col gap-1.5 py-3 sm:flex-row sm:items-baseline sm:gap-4"
                    >
                      <span className="shrink-0 font-bold text-[var(--ink)] sm:w-40">
                        {p.roleLabel}
                      </span>
                      <StanceIndicator stance={p.stance} />
                      <span className="leading-[1.6] text-[var(--ink-2)]">
                        {p.headline}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 3. Impact Score Table */}
              <div className="pt-10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-2)]">
                  SECTION 03
                </p>
                <h4 className="mt-2 text-[20px] font-bold text-[var(--ink)]">
                  3. 영향평가 점수표 (원안 기준)
                </h4>

                <table className="mt-4 block w-full border-collapse border-y border-[var(--ink)] text-left text-[14px] sm:table print:table">
                  <thead className="hidden border-b border-[var(--ink)] sm:table-header-group print:table-header-group">
                    <tr className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-2)]">
                      <th className="py-3 pr-6 font-semibold whitespace-nowrap">평가 축</th>
                      <th className="py-3 px-4 font-semibold whitespace-nowrap">점수</th>
                      <th className="py-3 pl-4 font-semibold">수준 및 근거</th>
                    </tr>
                  </thead>
                  <tbody className="block divide-y divide-[var(--line)] sm:table-row-group print:table-row-group">
                    {impact.axes.map((axis) => (
                      <tr key={axis.key} className="block py-3 sm:table-row sm:py-0 print:table-row">
                        <td className="block py-1 align-top font-bold text-[var(--ink)] sm:table-cell sm:py-3 sm:pr-4 sm:whitespace-nowrap print:table-cell print:py-3">
                          {axis.label}
                        </td>
                        <td className="block py-1 align-top tabular-nums font-bold text-[var(--ink)] sm:table-cell sm:px-4 sm:py-3 sm:whitespace-nowrap print:table-cell print:py-3">
                          {axis.score}점
                        </td>
                        <td className="block py-1 align-top leading-[1.6] text-[var(--ink-2)] sm:table-cell sm:py-3 sm:pl-4 print:table-cell print:py-3">
                          <span className="font-semibold text-[var(--ink)]">
                            [{getScoreTierLabel(axis.score)}]
                          </span>{' '}
                          {axis.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 4. Final Adopted Plan */}
              <div className="pt-10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-2)]">
                  SECTION 04
                </p>
                <h4 className="mt-2 text-[20px] font-bold text-[var(--ink)]">
                  4. 최종 의결안 — {adoptedLabel}
                </h4>
                {adoptedChoice === 'ORIGINAL' ? (
                  <p className="mt-3 text-[15px] leading-[1.6] text-[var(--ink-2)]">
                    개정 없이 원안 조문 그대로 의결하였습니다.
                  </p>
                ) : (
                  (() => {
                    const rev = revisions.revisions.find((r) => r.id === adoptedChoice);
                    if (!rev) return null;
                    return (
                      <div className="mt-3 space-y-4">
                        <p className="text-[15px] leading-[1.6] text-[var(--ink-2)]">
                          {rev.changeSummary}
                        </p>
                        <dl className="divide-y divide-[var(--line)] border-y border-[var(--ink)] text-[15px]">
                          {rev.clauses
                            .filter((c) => c.changeType !== 'REMOVED')
                            .map((c, idx) => (
                              <div
                                key={idx}
                                className="grid grid-cols-1 gap-1.5 py-3.5 sm:grid-cols-[160px_1fr] sm:gap-6"
                              >
                                <dt className="tabular-nums font-bold text-[var(--accent)]">
                                  {c.no} ({c.heading})
                                </dt>
                                <dd className="font-clause leading-[1.7] text-[var(--ink)]">
                                  {c.text}
                                </dd>
                              </div>
                            ))}
                        </dl>
                      </div>
                    );
                  })()
                )}
              </div>

              {/* 5. Reflection Answers */}
              <div className="pt-10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-2)]">
                  SECTION 05
                </p>
                <h4 className="mt-2 text-[20px] font-bold text-[var(--ink)]">
                  5. 나의 가치 우선순위 및 성찰
                </h4>
                <p className="mt-3 tabular-nums text-[13px] font-medium text-[var(--ink-2)]">
                  {VALUE_KEYS.map((k) => `${VALUE_LABELS[k].label} ${valueWeights[k]}`).join(' · ')}
                </p>
                <div className="mt-4 divide-y divide-[var(--line)] border-y border-[var(--ink)] text-[14px]">
                  {reflection.questions.map((q, idx) => (
                    <div key={idx} className="py-4">
                      <p className="font-bold text-[var(--ink)]">
                        Q{idx + 1}. {q}
                      </p>
                      <p className="mt-1.5 leading-[1.6] text-[var(--ink-2)]">
                        {reflectionAnswers[idx]?.trim() || '답변을 작성하지 않았습니다.'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <footer className="mt-10 border-t border-[var(--ink)] pt-6 text-left text-[12px] leading-[1.6] text-[var(--ink-2)]">
                <p>본 문서는 AI 시뮬레이션과 사용자의 판단으로 작성된 학습용 문서입니다.</p>
                <p className="mt-1">
                  AI의 결론은 참고 자료이고, 어떤 가치를 우선할지는 당신이 정합니다.
                </p>
              </footer>
            </article>

            <div className="no-print mt-12">
              <Button variant="text" onClick={onStartNewBill}>
                <span>새 법안 발의하기</span>
                <ArrowRight size={20} strokeWidth={1.5} aria-hidden="true" />
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
