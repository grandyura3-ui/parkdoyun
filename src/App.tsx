import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import type {
  AppStep,
  BillDraft,
  DeliberationResponse,
  ImpactResponse,
  Persona,
  SavedRecord,
  ValueWeights,
} from './types.ts';
import {
  requestAskPersona,
  requestDeliberation,
  requestImpact,
  requestReflection,
  requestRevisions,
} from './lib/api.ts';
import {
  createDraftFromRecordInput,
  getAdoptedPlanLabel,
} from './lib/formatters.ts';
import {
  buildSampleReflection,
  EXAMPLE_BILLS,
  getSamplePersonaReply,
  SAMPLE_DELIBERATION,
  SAMPLE_IMPACT,
  SAMPLE_REFLECTION,
  SAMPLE_REVISIONS,
} from './lib/sample.ts';
import {
  createInitialSimulationState,
  EMPTY_DRAFT,
  simulationReducer,
  STEP_ORDER,
} from './lib/state.ts';
import {
  clearAllRecordsFromStorage,
  clearDraftFromStorage,
  deleteRecordFromStorage,
  loadDraftFromStorage,
  loadSavedRecords,
  saveDraftToStorage,
  saveRecordToStorage,
} from './lib/storage.ts';
import { Header } from './components/Header.tsx';
import { HeroScreen } from './components/HeroScreen.tsx';
import { DraftScreen } from './components/DraftScreen.tsx';
import { DeliberateScreen } from './components/DeliberateScreen.tsx';
import { ImpactScreen } from './components/ImpactScreen.tsx';
import { RevisionsScreen } from './components/RevisionsScreen.tsx';
import { ReflectScreen } from './components/ReflectScreen.tsx';
import { HistoryDrawer } from './components/HistoryDrawer.tsx';

function getInitialDraftAndStep(): { draft: BillDraft | null; autostart: boolean } {
  const draft = loadDraftFromStorage();
  let autostart = false;
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    autostart = params.get('autostart') === '1';
  }
  return { draft, autostart };
}

export default function App() {
  const initialSetup = useRef(getInitialDraftAndStep());
  const [state, dispatch] = useReducer(
    simulationReducer,
    initialSetup.current.draft,
    createInitialSimulationState,
  );
  const [records, setRecords] = useState<SavedRecord[]>(() => loadSavedRecords());
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Tracks the active simulation run so stale background prefetches are ignored
  const activeRunIdRef = useRef(0);
  const prefetchStartedForRunRef = useRef<number | null>(null);

  useEffect(() => {
    if (initialSetup.current.autostart) {
      dispatch({ type: 'GO_TO_STEP', step: 'draft' });
    }
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [state.step]);

  // Auto-save draft changes while composing
  useEffect(() => {
    if (!state.isDemo && state.step === 'draft') {
      saveDraftToStorage(state.draft);
    }
  }, [state.draft, state.isDemo, state.step]);

  const runPrefetchPipeline = useCallback(
    async (runId: number, delib: DeliberationResponse) => {
      if (!delib.intake.accepted || prefetchStartedForRunRef.current === runId) {
        return;
      }
      prefetchStartedForRunRef.current = runId;

      dispatch({ type: 'IMPACT_REQUEST' });
      try {
        const impactResult = await requestImpact(delib.bill, delib.personas);
        if (activeRunIdRef.current !== runId) return;
        dispatch({ type: 'IMPACT_SUCCESS', payload: impactResult });

        dispatch({ type: 'REVISIONS_REQUEST' });
        try {
          const revisionsResult = await requestRevisions(delib.bill, impactResult);
          if (activeRunIdRef.current !== runId) return;
          dispatch({ type: 'REVISIONS_SUCCESS', payload: revisionsResult });
        } catch (revErr) {
          if (activeRunIdRef.current !== runId) return;
          dispatch({
            type: 'REVISIONS_FAILURE',
            message: revErr instanceof Error ? revErr.message : '개정안 생성에 실패했습니다.',
          });
        }
      } catch (impErr) {
        if (activeRunIdRef.current !== runId) return;
        dispatch({
          type: 'IMPACT_FAILURE',
          message: impErr instanceof Error ? impErr.message : '영향평가 생성에 실패했습니다.',
        });
      }
    },
    [],
  );

  const handleSubmitBill = useCallback(async () => {
    const runId = activeRunIdRef.current + 1;
    activeRunIdRef.current = runId;
    prefetchStartedForRunRef.current = null;

    dispatch({ type: 'DELIBERATE_REQUEST' });
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const delib = await requestDeliberation(state.draft);
      if (activeRunIdRef.current !== runId) return;
      dispatch({ type: 'DELIBERATE_SUCCESS', payload: delib });

      if (delib.intake.accepted) {
        clearDraftFromStorage();
        void runPrefetchPipeline(runId, delib);
      }
    } catch (err) {
      if (activeRunIdRef.current !== runId) return;
      dispatch({
        type: 'DELIBERATE_FAILURE',
        message: err instanceof Error ? err.message : '법안 심의 요청에 실패했습니다.',
      });
    }
  }, [runPrefetchPipeline, state.draft]);

  const handleStartDemo = useCallback(() => {
    activeRunIdRef.current += 1;
    dispatch({
      type: 'START_DEMO',
      payload: {
        draft: EXAMPLE_BILLS[0],
        deliberation: SAMPLE_DELIBERATION,
        impact: SAMPLE_IMPACT,
        revisions: SAMPLE_REVISIONS,
      },
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleAskPersona = useCallback(
    async (persona: Persona, question: string) => {
      if (!state.deliberation) return;
      const history = state.personaChats[persona.id] ?? [];
      dispatch({ type: 'ASK_PERSONA_REQUEST', personaId: persona.id });

      if (state.isDemo) {
        const reply = getSamplePersonaReply(persona.id, question);
        dispatch({
          type: 'ASK_PERSONA_SUCCESS',
          personaId: persona.id,
          turn: { question, answer: reply.answer, stanceShift: reply.stanceShift },
        });
        return;
      }

      try {
        const reply = await requestAskPersona({
          persona,
          bill: state.deliberation.bill,
          history,
          question,
        });
        dispatch({
          type: 'ASK_PERSONA_SUCCESS',
          personaId: persona.id,
          turn: { question, answer: reply.answer, stanceShift: reply.stanceShift },
        });
      } catch (err) {
        dispatch({
          type: 'ASK_PERSONA_FAILURE',
          message: err instanceof Error ? err.message : '이해관계자 답변을 불러오지 못했습니다.',
        });
      }
    },
    [state.deliberation, state.isDemo, state.personaChats],
  );

  const handleRetryImpact = useCallback(async () => {
    if (!state.deliberation) return;
    const runId = activeRunIdRef.current;
    dispatch({ type: 'IMPACT_REQUEST' });
    try {
      const impactResult = await requestImpact(
        state.deliberation.bill,
        state.deliberation.personas,
      );
      if (activeRunIdRef.current !== runId) return;
      dispatch({ type: 'IMPACT_SUCCESS', payload: impactResult });

      dispatch({ type: 'REVISIONS_REQUEST' });
      const revisionsResult = await requestRevisions(state.deliberation.bill, impactResult);
      if (activeRunIdRef.current !== runId) return;
      dispatch({ type: 'REVISIONS_SUCCESS', payload: revisionsResult });
    } catch (err) {
      if (activeRunIdRef.current !== runId) return;
      dispatch({
        type: 'IMPACT_FAILURE',
        message: err instanceof Error ? err.message : '영향평가를 다시 불러오는 데 실패했습니다.',
      });
    }
  }, [state.deliberation]);

  const handleRetryRevisions = useCallback(async () => {
    if (!state.deliberation || !state.impact) return;
    const runId = activeRunIdRef.current;
    dispatch({ type: 'REVISIONS_REQUEST' });
    try {
      const revisionsResult = await requestRevisions(state.deliberation.bill, state.impact);
      if (activeRunIdRef.current !== runId) return;
      dispatch({ type: 'REVISIONS_SUCCESS', payload: revisionsResult });
    } catch (err) {
      if (activeRunIdRef.current !== runId) return;
      dispatch({
        type: 'REVISIONS_FAILURE',
        message: err instanceof Error ? err.message : '개정안을 불러오는 데 실패했습니다.',
      });
    }
  }, [state.deliberation, state.impact]);

  const navigateWithStepProgress = useCallback(
    (step: AppStep) => {
      dispatch({ type: 'GO_TO_STEP', step });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [],
  );

  const handleGoToImpact = useCallback(() => {
    if (state.maxReachedStepIndex < STEP_ORDER.indexOf('impact')) {
      // Ensure stepper unlocks impact step cleanly via selection/step transition
      dispatch({ type: 'GO_TO_STEP', step: 'impact' });
    } else {
      dispatch({ type: 'GO_TO_STEP', step: 'impact' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (!state.impact && !state.isLoadingImpact && state.deliberation) {
      void handleRetryImpact();
    }
  }, [handleRetryImpact, state.deliberation, state.impact, state.isLoadingImpact, state.maxReachedStepIndex]);

  const handleGoToRevisions = useCallback(() => {
    dispatch({ type: 'GO_TO_STEP', step: 'revisions' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (!state.revisions && !state.isLoadingRevisions && state.deliberation && state.impact) {
      void handleRetryRevisions();
    }
  }, [handleRetryRevisions, state.deliberation, state.impact, state.isLoadingRevisions, state.revisions]);

  const persistCompletedRecord = useCallback(
    (
      weights: ValueWeights,
      reflectionData: typeof SAMPLE_REFLECTION,
      answers: string[],
    ) => {
      if (!state.deliberation || !state.impact || !state.revisions || !state.adoptedChoice) {
        return;
      }
      const existingIndex = state.activeRecordId
        ? records.findIndex((r) => r.id === state.activeRecordId)
        : -1;

      let nextRecord: SavedRecord;
      if (existingIndex >= 0) {
        nextRecord = {
          ...records[existingIndex],
          adoptedChoice: state.adoptedChoice,
          valueWeights: weights,
          reflection: reflectionData,
          reflectionAnswers: answers,
        };
      } else {
        nextRecord = createDraftFromRecordInput(
          state.draft,
          state.deliberation,
          state.impact,
          state.revisions,
          state.adoptedChoice,
          weights,
          reflectionData,
          answers,
          state.isDemo,
          records.length,
        );
      }

      const updated = saveRecordToStorage(nextRecord);
      setRecords(updated);
      dispatch({ type: 'SET_ACTIVE_RECORD_ID', id: nextRecord.id });
    },
    [
      records,
      state.activeRecordId,
      state.adoptedChoice,
      state.deliberation,
      state.draft,
      state.impact,
      state.isDemo,
      state.revisions,
    ],
  );

  const handleRequestReflection = useCallback(async () => {
    if (!state.deliberation || !state.revisions || !state.adoptedChoice) return;
    const adoptedLabel = getAdoptedPlanLabel(state.adoptedChoice, state.revisions);
    const adoptedSummary =
      state.adoptedChoice === 'ORIGINAL'
        ? '원안 조문을 그대로 유지하기로 결정함.'
        : state.revisions.revisions.find((r) => r.id === state.adoptedChoice)?.changeSummary ?? '';

    dispatch({ type: 'REFLECT_REQUEST' });

    if (state.isDemo) {
      const demoReflection = buildSampleReflection(state.valueWeights, adoptedLabel);
      dispatch({ type: 'REFLECT_SUCCESS', payload: demoReflection });
      persistCompletedRecord(state.valueWeights, demoReflection, state.reflectionAnswers);
      return;
    }

    try {
      const result = await requestReflection({
        bill: state.deliberation.bill,
        adoptedLabel,
        adoptedSummary,
        weights: state.valueWeights,
      });
      dispatch({ type: 'REFLECT_SUCCESS', payload: result });
      persistCompletedRecord(state.valueWeights, result, state.reflectionAnswers);
    } catch (err) {
      dispatch({
        type: 'REFLECT_FAILURE',
        message: err instanceof Error ? err.message : '가치 성찰 결과를 생성하지 못했습니다.',
      });
    }
  }, [
    persistCompletedRecord,
    state.adoptedChoice,
    state.deliberation,
    state.isDemo,
    state.reflectionAnswers,
    state.revisions,
    state.valueWeights,
  ]);

  const handleUpdateReflectionAnswer = useCallback(
    (index: number, value: string) => {
      dispatch({ type: 'UPDATE_REFLECTION_ANSWER', index, value });
      if (state.reflection) {
        const nextAnswers = [...state.reflectionAnswers];
        nextAnswers[index] = value;
        persistCompletedRecord(state.valueWeights, state.reflection, nextAnswers);
      }
    },
    [persistCompletedRecord, state.reflection, state.reflectionAnswers, state.valueWeights],
  );

  const handleFallbackToDemo = useCallback(
    (targetStep: 'deliberate' | 'impact' | 'revisions' | 'reflect') => {
      activeRunIdRef.current += 1;
      dispatch({
        type: 'FALLBACK_TO_DEMO_STEP',
        targetStep,
        payload: {
          draft: EXAMPLE_BILLS[0],
          deliberation: SAMPLE_DELIBERATION,
          impact: SAMPLE_IMPACT,
          revisions: SAMPLE_REVISIONS,
          reflection: SAMPLE_REFLECTION,
        },
      });
    },
    [],
  );

  // Compute effective maxReachedStepIndex so user can click back to completed steps
  const computedMaxStepIndex = Math.max(
    state.maxReachedStepIndex,
    state.step === 'hero' ? 0 : STEP_ORDER.indexOf(state.step),
    state.impact ? STEP_ORDER.indexOf('impact') : 0,
    state.revisions && state.step === 'revisions' ? STEP_ORDER.indexOf('revisions') : 0,
    state.reflection ? STEP_ORDER.indexOf('reflect') : 0,
  );

  const activeRecord =
    records.find((r) => r.id === state.activeRecordId) ?? null;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <Header
        currentStep={state.step}
        maxReachedStepIndex={computedMaxStepIndex}
        isDemo={state.isDemo}
        recordCount={records.length}
        onGoHome={() => navigateWithStepProgress('hero')}
        onSelectStep={(step) => navigateWithStepProgress(step)}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      <main
        className={
          state.step === 'hero' || state.step === 'impact' || state.step === 'reflect'
            ? 'w-full'
            : 'mx-auto max-w-[1320px] px-6 py-16 lg:px-12 lg:py-[160px]'
        }
      >
        {state.step === 'hero' && (
          <HeroScreen
            onStartDraft={() => {
              const saved = loadDraftFromStorage();
              dispatch({ type: 'START_NEW_DRAFT', initialDraft: saved ?? { ...EMPTY_DRAFT } });
            }}
            onStartDemo={handleStartDemo}
          />
        )}

        {state.step === 'draft' && (
          <DraftScreen
            draft={state.draft}
            onChangeDraft={(draft) => dispatch({ type: 'UPDATE_DRAFT', draft })}
            onSubmit={handleSubmitBill}
          />
        )}

        {state.step === 'deliberate' && (
          <DeliberateScreen
            isLoading={state.isLoadingDeliberation}
            deliberation={state.deliberation}
            personaChats={state.personaChats}
            askingPersonaId={state.askingPersonaId}
            errorMessage={
              state.error && (state.error.stage === 'deliberate' || state.error.stage === 'ask')
                ? state.error.message
                : null
            }
            onEditDraft={() => navigateWithStepProgress('draft')}
            onRetryDeliberation={handleSubmitBill}
            onUseSample={() => handleFallbackToDemo('deliberate')}
            onAskPersona={handleAskPersona}
            onNextToImpact={handleGoToImpact}
          />
        )}

        {state.step === 'impact' && (
          <ImpactScreen
            isLoading={state.isLoadingImpact}
            impact={state.impact}
            errorMessage={
              state.error?.stage === 'impact' ? state.error.message : null
            }
            onRetry={handleRetryImpact}
            onUseSample={() => handleFallbackToDemo('impact')}
            onNextToRevisions={handleGoToRevisions}
          />
        )}

        {state.step === 'revisions' && state.deliberation && state.impact && (
          <RevisionsScreen
            isLoading={state.isLoadingRevisions}
            originalBill={state.deliberation.bill}
            impact={state.impact}
            revisions={state.revisions}
            adoptedChoice={state.adoptedChoice}
            errorMessage={
              state.error?.stage === 'revisions' ? state.error.message : null
            }
            onRetry={handleRetryRevisions}
            onUseSample={() => handleFallbackToDemo('revisions')}
            onSelectChoice={(choice) =>
              dispatch({ type: 'SELECT_ADOPTED_CHOICE', choice })
            }
            onNextToReflect={() => navigateWithStepProgress('reflect')}
          />
        )}

        {state.step === 'reflect' &&
          state.deliberation &&
          state.impact &&
          state.revisions &&
          state.adoptedChoice && (
            <ReflectScreen
              draft={state.draft}
              deliberation={state.deliberation}
              impact={state.impact}
              revisions={state.revisions}
              adoptedChoice={state.adoptedChoice}
              valueWeights={state.valueWeights}
              reflection={state.reflection}
              reflectionAnswers={state.reflectionAnswers}
              activeRecord={activeRecord}
              isLoading={state.isLoadingReflection}
              errorMessage={
                state.error?.stage === 'reflect' ? state.error.message : null
              }
              onChangeWeights={(weights) =>
                dispatch({ type: 'UPDATE_VALUE_WEIGHTS', weights })
              }
              onRequestReflection={handleRequestReflection}
              onUseSample={() => handleFallbackToDemo('reflect')}
              onChangeAnswer={handleUpdateReflectionAnswer}
              onStartNewBill={() => {
                clearDraftFromStorage();
                dispatch({ type: 'START_NEW_DRAFT', initialDraft: { ...EMPTY_DRAFT } });
              }}
            />
          )}
      </main>

      <HistoryDrawer
        isOpen={isHistoryOpen}
        records={records}
        onClose={() => setIsHistoryOpen(false)}
        onSelectRecord={(rec) => {
          dispatch({ type: 'LOAD_SAVED_RECORD', record: rec });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onDeleteRecord={(id) => {
          const next = deleteRecordFromStorage(id);
          setRecords(next);
          if (state.activeRecordId === id) {
            dispatch({ type: 'SET_ACTIVE_RECORD_ID', id: null });
          }
        }}
        onClearAll={() => {
          const next = clearAllRecordsFromStorage();
          setRecords(next);
          dispatch({ type: 'SET_ACTIVE_RECORD_ID', id: null });
        }}
      />
    </div>
  );
}
