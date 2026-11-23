import { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import type { SavedRecord } from '../types.ts';
import { formatKoreanDate, getAdoptedPlanLabel } from '../lib/formatters.ts';
import { SectionLabel } from './ui/index.ts';

interface HistoryDrawerProps {
  isOpen: boolean;
  records: SavedRecord[];
  onClose: () => void;
  onSelectRecord: (record: SavedRecord) => void;
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
}

export function HistoryDrawer({
  isOpen,
  records,
  onClose,
  onSelectRecord,
  onDeleteRecord,
  onClearAll,
}: HistoryDrawerProps) {
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      className="no-print fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-drawer-title"
    >
      <div
        className="fixed inset-0 bg-[var(--ink)]/40"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-[var(--ink)] bg-[var(--bg)]">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--ink)] px-6 py-6">
          <div>
            <SectionLabel>ARCHIVE</SectionLabel>
            <h2
              id="history-drawer-title"
              className="mt-2 text-[24px] font-bold leading-[1.2] tracking-[-0.02em] text-[var(--ink)]"
            >
              내 발의 기록
            </h2>
            <p className="mt-1 tabular-nums text-[12px] text-[var(--ink-2)]">
              이 브라우저에 최근 {records.length}/10건 저장
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="내 기록 닫기"
            className="flex h-10 w-10 shrink-0 items-center justify-center bg-transparent text-[var(--ink)] transition-colors hover:text-[var(--accent)]"
          >
            <X size={20} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {records.length === 0 ? (
            <div className="py-12">
              <p className="text-[22px] font-bold leading-[1.35] text-[var(--ink)]">
                아직 저장된 입법 결과서가 없어요
              </p>
              <p className="mt-2 text-[14px] leading-[1.6] text-[var(--ink-2)]">
                법안을 의결하고 성찰 결과 받기를 완료하면 이곳에 자동으로 보관됩니다.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--line)]">
              {records.map((rec) => (
                <li key={rec.id} className="py-5">
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectRecord(rec);
                        onClose();
                      }}
                      className="min-w-0 flex-1 bg-transparent p-0 text-left"
                    >
                      <div className="flex flex-col gap-0.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-2)] sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                        <span className="tabular-nums">{formatKoreanDate(rec.createdAt)}</span>
                        <span className="hidden sm:inline" aria-hidden="true">·</span>
                        <span>{getAdoptedPlanLabel(rec.adoptedChoice, rec.revisions)}</span>
                      </div>
                      <h3 className="mt-2 text-[18px] font-bold leading-[1.35] text-[var(--ink)] transition-colors hover:text-[var(--accent)]">
                        {rec.draft.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-[14px] leading-[1.6] text-[var(--ink-2)]">
                        “{rec.reflection.principle}”
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteRecord(rec.id)}
                      aria-label={`${rec.draft.title} 기록 삭제`}
                      className="flex h-10 w-10 shrink-0 items-center justify-center bg-transparent text-[var(--ink-2)] transition-colors hover:text-[var(--danger)]"
                    >
                      <Trash2 size={20} strokeWidth={1.5} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {records.length > 0 && (
          <div className="border-t border-[var(--ink)] px-6 py-5">
            {!confirmClearAll ? (
              <button
                type="button"
                onClick={() => setConfirmClearAll(true)}
                className="w-full border border-[var(--line-strong)] bg-[var(--bg)] py-3 text-[14px] font-bold text-[var(--danger)] transition-colors hover:border-[var(--danger)] hover:bg-[var(--danger)] hover:text-[var(--bg)]"
              >
                전체 기록 삭제
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-[13px] font-semibold text-[var(--danger)]">
                  저장된 {records.length}건의 기록을 모두 지울까요?
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmClearAll(false)}
                    className="flex-1 border border-[var(--line-strong)] bg-[var(--bg)] py-2.5 text-[14px] font-bold text-[var(--ink)] transition-colors hover:bg-[var(--surface-alt)]"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClearAll();
                      setConfirmClearAll(false);
                    }}
                    className="flex-1 border border-[var(--danger)] bg-[var(--danger)] py-2.5 text-[14px] font-bold text-[var(--bg)] transition-opacity hover:opacity-90"
                  >
                    모두 삭제
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
