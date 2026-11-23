import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { ImpactAxis, ImpactResponse } from '../types.ts';
import {
  AXIS_DEFINITIONS,
  getScoreTierLabel,
  SIDE_EFFECT_TYPE_LABELS,
} from '../lib/formatters.ts';
import { ErrorBanner } from './ErrorBanner.tsx';
import { Button, SectionLabel, StepLoading } from './ui/index.ts';
import { ContourBackdrop } from './art/index.ts';

const IMPACT_LOADING_MESSAGES = [
  '영향평가 기준을 검토하는 중…',
  '정당성·형평성·실효성·수용성을 분석하는 중…',
  '예상 부작용과 대안을 정리하는 중…',
];

interface ImpactScreenProps {
  isLoading: boolean;
  impact: ImpactResponse | null;
  errorMessage: string | null;
  onRetry: () => void;
  onUseSample: () => void;
  onNextToRevisions: () => void;
}

function useCountUpProgress(trigger: unknown): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setProgress(1);
      return;
    }

    setProgress(0);
    let rafId = 0;
    const duration = 700;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(eased);
      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [trigger]);

  return progress;
}

function MinimalRadarChart({
  axes,
  progress,
}: {
  axes: ImpactAxis[];
  progress: number;
}) {
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 68;
  const levels = [25, 50, 75, 100];

  const orderedKeys: Array<ImpactAxis['key']> = [
    'legitimacy',
    'effectiveness',
    'acceptance',
    'equity',
  ];
  const orderedAxes = orderedKeys.map(
    (k) => axes.find((a) => a.key === k) ?? { key: k, label: k, score: 0, reason: '' },
  );

  const angles = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];

  const getPoint = (angle: number, score: number) => {
    const r = (Math.max(0, Math.min(100, score)) / 100) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const dataPoints = orderedAxes.map((axis, idx) =>
    getPoint(angles[idx], axis.score * progress),
  );
  const polygonPoints = dataPoints
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-full max-w-[220px]"
      role="img"
      aria-label="4대 영향평가 레이더 차트"
    >
      {levels.map((lv) => {
        const pts = angles
          .map((ang) => {
            const p = getPoint(ang, lv);
            return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
          })
          .join(' ');
        return (
          <polygon
            key={lv}
            points={pts}
            fill="none"
            stroke="var(--dark-line)"
            strokeWidth={0.8}
          />
        );
      })}

      {angles.map((ang, idx) => {
        const end = getPoint(ang, 100);
        return (
          <line
            key={idx}
            x1={cx}
            y1={cy}
            x2={end.x}
            y2={end.y}
            stroke="var(--dark-line)"
            strokeWidth={0.8}
          />
        );
      })}

      <polygon
        points={polygonPoints}
        fill="none"
        stroke="var(--dark-ink)"
        strokeWidth={1.25}
      />

      {dataPoints.map((pt, idx) => (
        <circle
          key={idx}
          cx={pt.x}
          cy={pt.y}
          r={2.5}
          fill="var(--accent-on-dark)"
        />
      ))}

      {orderedAxes.map((axis, idx) => {
        const pos = getPoint(angles[idx], 126);
        const anchor = idx === 1 ? 'start' : idx === 3 ? 'end' : 'middle';
        const dy = idx === 0 ? -4 : idx === 2 ? 10 : 4;
        return (
          <g key={axis.key}>
            <text
              x={pos.x}
              y={pos.y + dy}
              textAnchor={anchor}
              fill="var(--dark-ink-2)"
              fontSize="10"
              fontWeight="600"
            >
              {axis.label}
            </text>
            <text
              x={pos.x}
              y={pos.y + dy + 12}
              textAnchor={anchor}
              fill="var(--dark-ink)"
              fontSize="10"
              fontWeight="700"
            >
              {Math.round(axis.score * progress)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function ThreeDotMeter({ value, label }: { value: 1 | 2 | 3; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1"
      aria-label={`${label} ${value}/3`}
      title={`${label} ${value}/3`}
    >
      {[1, 2, 3].map((step) => (
        <svg
          key={step}
          width="10"
          height="10"
          viewBox="0 0 10 10"
          aria-hidden="true"
        >
          {step <= value ? (
            <circle cx="5" cy="5" r="4" fill="var(--ink)" />
          ) : (
            <circle
              cx="5"
              cy="5"
              r="3.5"
              fill="none"
              stroke="var(--ink-3)"
              strokeWidth="1"
            />
          )}
        </svg>
      ))}
    </span>
  );
}

export function ImpactScreen({
  isLoading,
  impact,
  errorMessage,
  onRetry,
  onUseSample,
  onNextToRevisions,
}: ImpactScreenProps) {
  const [showCriteriaInfo, setShowCriteriaInfo] = useState(false);
  const progress = useCountUpProgress(impact);

  if (isLoading && !impact) {
    return (
      <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-12 lg:py-[160px]">
        <StepLoading
          stepLabel="STEP 03 / 05"
          messages={IMPACT_LOADING_MESSAGES}
          hint="정당성·형평성·실효성·수용성 4개 기준과 예상 부작용을 분석하고 있습니다."
          slowHint="조문이 구체적일수록 영향평가 정리에 조금 더 시간이 걸릴 수 있어요."
          onUseSample={onUseSample}
        />
      </div>
    );
  }

  if (errorMessage && !impact) {
    return (
      <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-12 lg:py-[160px]">
        <ErrorBanner
          message={errorMessage}
          onRetry={onRetry}
          onUseSample={onUseSample}
        />
      </div>
    );
  }

  if (!impact) return null;

  return (
    <div>
      {/* Light Top Title Section */}
      <section className="mx-auto max-w-[1320px] px-6 pt-16 pb-12 lg:px-12 lg:pt-[160px] lg:pb-16">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SectionLabel>STEP 03 / 05</SectionLabel>
            <h1 className="type-h1 mt-4 whitespace-pre-line text-[var(--ink)]">
              {'이 규칙이 작동할 때\n생기는 빛과 그림자'}
            </h1>
          </div>

          <div className="relative shrink-0">
            <Button
              variant="text"
              onClick={() => setShowCriteriaInfo((v) => !v)}
              aria-expanded={showCriteriaInfo}
              aria-label="영향평가 4대 기준 설명 보기"
              className="text-[15px]"
            >
              <span>{showCriteriaInfo ? '평가 기준 닫기' : '평가 기준 보기'}</span>
            </Button>

            {showCriteriaInfo && (
              <div
                role="dialog"
                aria-label="평가 기준 설명"
                className="mt-4 w-full border border-[var(--ink)] bg-[var(--bg)] p-6 sm:absolute sm:right-0 sm:top-8 sm:z-20 sm:mt-0 sm:w-[400px]"
              >
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                  <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--ink)]">
                    4대 영향평가 기준
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCriteriaInfo(false)}
                    aria-label="기준 설명 닫기"
                    className="bg-transparent p-1 text-[var(--ink)] hover:text-[var(--accent)]"
                  >
                    <X size={20} strokeWidth={1.5} aria-hidden="true" />
                  </button>
                </div>
                <dl className="mt-4 space-y-4 text-[13px]">
                  {Object.entries(AXIS_DEFINITIONS).map(([k, item]) => (
                    <div key={k}>
                      <dt className="font-bold text-[var(--ink)]">{item.label}</dt>
                      <dd className="mt-1 leading-[1.6] text-[var(--ink-2)]">
                        {item.definition}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Full-Width Dark Score Section */}
      <section
        aria-label="4대 영향평가 점수"
        className="relative w-full overflow-hidden bg-[var(--dark)] text-[var(--dark-ink)]"
      >
        <ContourBackdrop variant="impact" tone="dark" />
        <div className="relative z-10 mx-auto max-w-[1320px] px-6 py-16 lg:px-12 lg:py-[160px]">
          {/* 4-Column Score Grid */}
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {impact.axes.map((axis) => {
              const displayScore = Math.round(axis.score * progress);
              const tier = getScoreTierLabel(axis.score);
              const isLow = axis.score < 40;

              return (
                <article
                  key={axis.key}
                  className="border-t border-[var(--dark-line)] pt-6"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h2 className="text-[15px] font-bold text-[var(--dark-ink)]">
                      {axis.label}
                    </h2>
                    <span
                      className={`text-[12px] font-semibold tracking-[0.06em] ${
                        isLow ? 'text-[var(--accent-on-dark)]' : 'text-[var(--dark-ink-2)]'
                      }`}
                    >
                      {tier}
                    </span>
                  </div>

                  <p className="tabular-nums mt-4 text-[88px] font-extrabold leading-none tracking-[-0.04em] text-[var(--dark-ink)] sm:text-[112px] lg:text-[120px] xl:text-[140px]">
                    {displayScore}
                  </p>

                  {/* 1px thin bar */}
                  <div className="mt-6 h-px w-full bg-[var(--dark-line)]">
                    <div
                      style={{ width: `${Math.max(0, Math.min(100, axis.score * progress))}%` }}
                      className={`h-px ${isLow ? 'bg-[var(--accent-on-dark)]' : 'bg-[var(--dark-ink)]'}`}
                    />
                  </div>

                  <p className="mt-4 text-[15px] leading-[1.65] text-[var(--dark-ink-2)]">
                    {axis.reason}
                  </p>
                </article>
              );
            })}
          </div>

          {/* Secondary Thin-Line Radar + Summary & Key Question */}
          <div className="mt-16 grid grid-cols-1 gap-12 border-t border-[var(--dark-line)] pt-12 lg:mt-24 lg:grid-cols-12 lg:gap-6">
            <div className="lg:col-span-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--dark-ink-2)]">
                RADAR OVERVIEW
              </p>
              <div className="mt-6">
                <MinimalRadarChart axes={impact.axes} progress={progress} />
              </div>
              <table className="sr-only">
                <caption>영향평가 4축 점수표</caption>
                <thead>
                  <tr>
                    <th>평가 축</th>
                    <th>점수</th>
                    <th>수준</th>
                  </tr>
                </thead>
                <tbody>
                  {impact.axes.map((axis) => (
                    <tr key={axis.key}>
                      <td>{axis.label}</td>
                      <td>{axis.score}점</td>
                      <td>{getScoreTierLabel(axis.score)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-4 text-[12px] text-[var(--dark-ink-2)]">
                0~39 문제가 큼 · 40~69 보완 필요 · 70~100 양호
              </p>
            </div>

            <div className="lg:col-span-7 lg:col-start-6">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--dark-ink-2)]">
                SUMMARY
              </p>
              <p className="mt-4 text-[20px] font-medium leading-[1.6] text-[var(--dark-ink)]">
                {impact.summary}
              </p>

              <div className="mt-12 border-t border-[var(--dark-line)] pt-8">
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--accent-on-dark)]">
                  KEY QUESTION
                </p>
                <p className="mt-3 text-[24px] font-bold leading-[1.4] tracking-[-0.02em] text-[var(--dark-ink)] sm:text-[28px]">
                  “{impact.keyQuestion}”
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Light Bottom Section: Side Effects Table + Alternatives + Action */}
      <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-12 lg:py-[160px]">
        {/* Side Effects Table */}
        <section aria-labelledby="side-effects-heading">
          <SectionLabel>SIDE EFFECTS</SectionLabel>
          <h2 id="side-effects-heading" className="type-h2 mt-3 text-[var(--ink)]">
            예상 부작용
          </h2>

          <table className="mt-12 block w-full border-collapse border-y border-[var(--ink)] md:table">
            <thead className="hidden border-b border-[var(--ink)] md:table-header-group">
              <tr className="text-left text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-2)]">
                <th className="py-4 pr-6 font-semibold">유형</th>
                <th className="py-4 pr-6 font-semibold">내용</th>
                <th className="py-4 pr-6 font-semibold">영향받는 집단</th>
                <th className="py-4 pr-6 font-semibold">가능성</th>
                <th className="py-4 font-semibold">심각도</th>
              </tr>
            </thead>
            <tbody className="block divide-y divide-[var(--line)] md:table-row-group">
              {impact.sideEffects.map((effect, idx) => (
                <tr key={idx} className="block py-6 md:table-row md:py-0">
                  <td className="block py-1 align-top text-[13px] font-semibold text-[var(--ink-2)] whitespace-nowrap md:table-cell md:py-6 md:pr-6">
                    {SIDE_EFFECT_TYPE_LABELS[effect.type]}
                  </td>
                  <td className="block py-2 align-top md:table-cell md:py-6 md:pr-6">
                    <p className="text-[17px] font-bold text-[var(--ink)]">
                      {effect.title}
                    </p>
                    <p className="mt-1.5 text-[15px] leading-[1.6] text-[var(--ink-2)]">
                      {effect.description}
                    </p>
                  </td>
                  <td className="block py-1 align-top text-[14px] text-[var(--ink)] md:table-cell md:py-6 md:pr-6">
                    <span className="mr-2 text-[12px] font-semibold text-[var(--ink-2)] md:hidden">
                      영향받는 집단
                    </span>
                    <span>{effect.affected}</span>
                  </td>
                  <td className="block py-1 align-top whitespace-nowrap md:table-cell md:py-6 md:pr-6">
                    <span className="mr-2 text-[12px] font-semibold text-[var(--ink-2)] md:hidden">
                      가능성
                    </span>
                    <ThreeDotMeter value={effect.likelihood} label="발생 가능성" />
                  </td>
                  <td className="block py-1 align-top whitespace-nowrap md:table-cell md:py-6">
                    <span className="mr-2 text-[12px] font-semibold text-[var(--ink-2)] md:hidden">
                      심각도
                    </span>
                    <ThreeDotMeter value={effect.severity} label="심각도" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Less Intrusive Alternatives */}
        <section aria-labelledby="alternatives-heading" className="mt-16 lg:mt-[160px]">
          <SectionLabel>ALTERNATIVES</SectionLabel>
          <h2 id="alternatives-heading" className="type-h2 mt-3 text-[var(--ink)]">
            더 덜 침해적인 대안
          </h2>

          <ul className="mt-12 divide-y divide-[var(--line)] border-y border-[var(--ink)]">
            {impact.alternatives.map((alt, idx) => (
              <li
                key={idx}
                className="flex flex-col gap-2 py-6 sm:flex-row sm:items-baseline sm:gap-8"
              >
                <span className="tabular-nums shrink-0 text-[13px] font-semibold tracking-[0.08em] text-[var(--accent)]">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span className="text-[17px] leading-[1.65] text-[var(--ink)]">
                  {alt}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Bottom Action */}
        <div className="mt-16 flex flex-col gap-6 border-t border-[var(--ink)] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-[var(--ink-2)]">
            AI의 결론은 참고 자료이고, 어떤 가치를 우선할지는 당신이 정합니다.
          </p>
          <Button
            variant="primary"
            onClick={onNextToRevisions}
            className="w-full sm:w-auto sm:min-w-[280px]"
          >
            개정안 보기
          </Button>
        </div>
      </div>
    </div>
  );
}
