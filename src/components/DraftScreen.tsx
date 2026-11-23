import { useState } from 'react';
import type { BillDraft, BillTarget } from '../types.ts';
import { EXAMPLE_BILLS } from '../lib/sample.ts';
import { validateBillDraft } from '../lib/validation.ts';
import { Button, Field, RuleRow, SectionLabel } from './ui/index.ts';
import { Figure, LivePreviewSheet } from './art/index.ts';

interface DraftScreenProps {
  draft: BillDraft;
  onChangeDraft: (draft: BillDraft) => void;
  onSubmit: () => void;
}

const TARGET_OPTIONS: BillTarget[] = [
  '전교생',
  '1학년',
  '2학년',
  '3학년',
  '특정 동아리·학급',
  '기숙사생',
];

export function DraftScreen({ draft, onChangeDraft, onSubmit }: DraftScreenProps) {
  const [touched, setTouched] = useState<{
    title?: boolean;
    content?: boolean;
    purpose?: boolean;
    sanction?: boolean;
  }>({});

  const { isValid, errors } = validateBillDraft(draft);

  const handleFieldChange = <K extends keyof BillDraft>(key: K, value: BillDraft[K]) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    onChangeDraft({ ...draft, [key]: value });
  };

  const handleSelectExample = (example: BillDraft) => {
    setTouched({ title: true, content: true, purpose: true, sanction: true });
    onChangeDraft({ ...example });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ title: true, content: true, purpose: true, sanction: true });
    if (isValid) {
      onSubmit();
    }
  };

  return (
    <div className="grid grid-cols-1 gap-y-16 lg:grid-cols-12 lg:gap-x-6">
      {/* Left Sticky Column (Columns 1-5) */}
      <aside className="lg:col-span-5 lg:sticky lg:top-24 lg:self-start">
        <SectionLabel
          style={{ animationDelay: '0ms' }}
          className="animate-draft-enter"
        >
          STEP 01 / 05
        </SectionLabel>

        <h1
          style={{ animationDelay: '60ms' }}
          className="animate-draft-enter type-h1 mt-4 whitespace-pre-line text-[var(--ink)]"
        >
          {'어떤 학교 규칙을\n만들어 볼까요?'}
        </h1>

        <section
          aria-label="예시 법안 선택"
          style={{ animationDelay: '120ms' }}
          className="animate-draft-enter mt-10"
        >
          <SectionLabel className="mb-4">예시로 시작하기</SectionLabel>
          <div className="border-t border-[var(--line)]">
            {EXAMPLE_BILLS.map((ex, idx) => {
              const isSelected = draft.title === ex.title && draft.content === ex.content;
              return (
                <RuleRow
                  key={ex.title}
                  number={String(idx + 1).padStart(2, '0')}
                  label={ex.title}
                  selected={isSelected}
                  onClick={() => handleSelectExample(ex)}
                />
              );
            })}
          </div>
        </section>

        <div className="mt-10 hidden lg:block">
          <Figure caption="FIG. 02 — 입력하면 법안 문서가 만들어집니다">
            <LivePreviewSheet draft={draft} />
          </Figure>
        </div>
      </aside>

      {/* Right Form Column (Columns 7-12) */}
      <form
        onSubmit={handleFormSubmit}
        noValidate
        className="lg:col-span-6 lg:col-start-7"
      >
        <div className="space-y-12">
          <Field
            id="bill-title"
            label="규칙 이름"
            required
            maxLength={30}
            value={draft.title}
            counter={{ current: draft.title.trim().length, max: 30 }}
            onChange={(val) => handleFieldChange('title', val)}
            onBlur={() => setTouched((prev) => ({ ...prev, title: true }))}
            placeholder="예: 수업 시간 휴대폰 일괄 수거"
            error={touched.title ? errors.title : undefined}
            style={{ animationDelay: '180ms' }}
            className="animate-draft-enter"
          />

          <Field
            as="radio-list"
            id="bill-target"
            label="적용 대상"
            required
            value={draft.target}
            options={TARGET_OPTIONS}
            onChange={(val) => handleFieldChange('target', val)}
            style={{ animationDelay: '240ms' }}
            className="animate-draft-enter"
          />

          <Field
            as="textarea"
            id="bill-purpose"
            label="규칙의 목적"
            required
            minRows={1}
            textSize="24"
            maxLength={150}
            value={draft.purpose}
            counter={{ current: draft.purpose.trim().length, max: 150 }}
            onChange={(val) => handleFieldChange('purpose', val)}
            onBlur={() => setTouched((prev) => ({ ...prev, purpose: true }))}
            placeholder="해결하고 싶은 문제나 지키고 싶은 가치를 적어주세요"
            error={touched.purpose ? errors.purpose : undefined}
            style={{ animationDelay: '300ms' }}
            className="animate-draft-enter"
          />

          <Field
            as="textarea"
            id="bill-content"
            label="규칙 내용"
            required
            minRows={3}
            maxLength={400}
            value={draft.content}
            counter={{ current: draft.content.trim().length, max: 400 }}
            onChange={(val) => handleFieldChange('content', val)}
            onBlur={() => setTouched((prev) => ({ ...prev, content: true }))}
            placeholder="언제, 어디서, 누가 무엇을 해야 하는지 구체적으로 적어주세요 (10~400자)"
            error={touched.content ? errors.content : undefined}
            style={{ animationDelay: '360ms' }}
            className="animate-draft-enter"
          />

          <Field
            as="textarea"
            id="bill-sanction"
            label="위반 시 조치"
            optional
            minRows={1}
            textSize="24"
            maxLength={150}
            value={draft.sanction}
            counter={{ current: draft.sanction.trim().length, max: 150 }}
            onChange={(val) => handleFieldChange('sanction', val)}
            onBlur={() => setTouched((prev) => ({ ...prev, sanction: true }))}
            placeholder="어겼을 때의 안내나 조치를 적어주세요"
            error={touched.sanction ? errors.sanction : undefined}
            style={{ animationDelay: '420ms' }}
            className="animate-draft-enter"
          />

          <div
            style={{ animationDelay: '480ms' }}
            className="animate-draft-enter pt-4"
          >
            <p className="mb-6 text-[13px] leading-[1.6] text-[var(--ink-2)]">
              ※ 특정 교사·학생의 실명, 정당·종교 같은 민감한 주제는 접수 단계에서 반려될 수 있습니다.
            </p>

            <Button type="submit" variant="primary" disabled={!isValid} className="w-full">
              발의하기
            </Button>

            <p className="mt-4 text-[12px] text-[var(--ink-2)]">
              작성 중인 내용은 이 브라우저에만 임시 저장됩니다
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
