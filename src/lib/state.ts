import type {
  AdoptedChoice,
  AppStep,
  BillDraft,
  DeliberationResponse,
  ImpactResponse,
  PersonaChatTurn,
  PersonaId,
  ReflectionResponse,
  RevisionsResponse,
  SavedRecord,
  ValueWeights,
} from '../types.ts';

export const EMPTY_DRAFT: BillDraft = {
  title: '',
  content: '',
  purpose: '',
  target: '전교생',
  sanction: '',
};

export const DEFAULT_VALUE_WEIGHTS: ValueWeights = {
  freedom: 3,
  safety: 3,
  equality: 3,
  efficiency: 3,
  responsibility: 3,
  community: 3,
};

export const STEP_ORDER: Exclude<AppStep, 'hero'>[] = [
  'draft',
  'deliberate',
  'impact',
  'revisions',
  'reflect',
];

export interface SimulationState {
  step: AppStep;
  maxReachedStepIndex: number;
  isDemo: boolean;
  draft: BillDraft;
  deliberation: DeliberationResponse | null;
  impact: ImpactResponse | null;
  revisions: RevisionsResponse | null;
  personaChats: Record<PersonaId, PersonaChatTurn[]>;
  adoptedChoice: AdoptedChoice | null;
  valueWeights: ValueWeights;
  reflection: ReflectionResponse | null;
  reflectionAnswers: string[];
  activeRecordId: string | null;
  isLoadingDeliberation: boolean;
  isLoadingImpact: boolean;
  isLoadingRevisions: boolean;
  isLoadingReflection: boolean;
  askingPersonaId: PersonaId | null;
  error: {
    stage: 'deliberate' | 'impact' | 'revisions' | 'reflect' | 'ask';
    message: string;
  } | null;
}

export function createInitialSimulationState(initialDraft?: BillDraft | null): SimulationState {
  return {
    step: 'hero',
    maxReachedStepIndex: 0,
    isDemo: false,
    draft: initialDraft ?? { ...EMPTY_DRAFT },
    deliberation: null,
    impact: null,
    revisions: null,
    personaChats: {
      student: [],
      teacher: [],
      parent: [],
      admin: [],
      unseen: [],
    },
    adoptedChoice: null,
    valueWeights: { ...DEFAULT_VALUE_WEIGHTS },
    reflection: null,
    reflectionAnswers: ['', '', ''],
    activeRecordId: null,
    isLoadingDeliberation: false,
    isLoadingImpact: false,
    isLoadingRevisions: false,
    isLoadingReflection: false,
    askingPersonaId: null,
    error: null,
  };
}

export type SimulationAction =
  | { type: 'GO_TO_STEP'; step: AppStep }
  | { type: 'START_NEW_DRAFT'; initialDraft?: BillDraft }
  | { type: 'UPDATE_DRAFT'; draft: BillDraft }
  | { type: 'START_DEMO'; payload: { draft: BillDraft; deliberation: DeliberationResponse; impact: ImpactResponse; revisions: RevisionsResponse } }
  | { type: 'DELIBERATE_REQUEST' }
  | { type: 'DELIBERATE_SUCCESS'; payload: DeliberationResponse }
  | { type: 'DELIBERATE_FAILURE'; message: string }
  | { type: 'IMPACT_REQUEST' }
  | { type: 'IMPACT_SUCCESS'; payload: ImpactResponse }
  | { type: 'IMPACT_FAILURE'; message: string }
  | { type: 'REVISIONS_REQUEST' }
  | { type: 'REVISIONS_SUCCESS'; payload: RevisionsResponse }
  | { type: 'REVISIONS_FAILURE'; message: string }
  | { type: 'ASK_PERSONA_REQUEST'; personaId: PersonaId }
  | { type: 'ASK_PERSONA_SUCCESS'; personaId: PersonaId; turn: PersonaChatTurn }
  | { type: 'ASK_PERSONA_FAILURE'; message: string }
  | { type: 'SELECT_ADOPTED_CHOICE'; choice: AdoptedChoice }
  | { type: 'UPDATE_VALUE_WEIGHTS'; weights: ValueWeights }
  | { type: 'REFLECT_REQUEST' }
  | { type: 'REFLECT_SUCCESS'; payload: ReflectionResponse }
  | { type: 'REFLECT_FAILURE'; message: string }
  | { type: 'UPDATE_REFLECTION_ANSWER'; index: number; value: string }
  | { type: 'SET_ACTIVE_RECORD_ID'; id: string | null }
  | { type: 'LOAD_SAVED_RECORD'; record: SavedRecord }
  | { type: 'FALLBACK_TO_DEMO_STEP'; targetStep: 'deliberate' | 'impact' | 'revisions' | 'reflect'; payload: { draft: BillDraft; deliberation: DeliberationResponse; impact: ImpactResponse; revisions: RevisionsResponse; reflection: ReflectionResponse } }
  | { type: 'CLEAR_ERROR' };

function stepToIndex(step: AppStep): number {
  if (step === 'hero') return -1;
  return STEP_ORDER.indexOf(step);
}

export function canAddPersonaQuestion(turns: PersonaChatTurn[]): boolean {
  return turns.length < 3;
}

export function simulationReducer(state: SimulationState, action: SimulationAction): SimulationState {
  switch (action.type) {
    case 'GO_TO_STEP': {
      return {
        ...state,
        step: action.step,
        error: null,
      };
    }

    case 'START_NEW_DRAFT': {
      return {
        ...createInitialSimulationState(action.initialDraft ?? { ...EMPTY_DRAFT }),
        step: 'draft',
        maxReachedStepIndex: 0,
      };
    }

    case 'UPDATE_DRAFT': {
      return {
        ...state,
        draft: action.draft,
        isDemo: false,
      };
    }

    case 'START_DEMO': {
      return {
        ...createInitialSimulationState(action.payload.draft),
        step: 'deliberate',
        maxReachedStepIndex: 1,
        isDemo: true,
        deliberation: action.payload.deliberation,
        impact: action.payload.impact,
        revisions: action.payload.revisions,
      };
    }

    case 'DELIBERATE_REQUEST': {
      return {
        ...state,
        step: 'deliberate',
        maxReachedStepIndex: Math.max(state.maxReachedStepIndex, 1),
        isLoadingDeliberation: true,
        deliberation: null,
        impact: null,
        revisions: null,
        personaChats: {
          student: [],
          teacher: [],
          parent: [],
          admin: [],
          unseen: [],
        },
        adoptedChoice: null,
        reflection: null,
        reflectionAnswers: ['', '', ''],
        activeRecordId: null,
        error: null,
      };
    }

    case 'DELIBERATE_SUCCESS': {
      return {
        ...state,
        isLoadingDeliberation: false,
        deliberation: action.payload,
        maxReachedStepIndex: action.payload.intake.accepted
          ? Math.max(state.maxReachedStepIndex, 1)
          : 0,
        error: null,
      };
    }

    case 'DELIBERATE_FAILURE': {
      return {
        ...state,
        isLoadingDeliberation: false,
        error: { stage: 'deliberate', message: action.message },
      };
    }

    case 'IMPACT_REQUEST': {
      return {
        ...state,
        isLoadingImpact: true,
        error: null,
      };
    }

    case 'IMPACT_SUCCESS': {
      return {
        ...state,
        isLoadingImpact: false,
        impact: action.payload,
        error: null,
      };
    }

    case 'IMPACT_FAILURE': {
      return {
        ...state,
        isLoadingImpact: false,
        error: { stage: 'impact', message: action.message },
      };
    }

    case 'REVISIONS_REQUEST': {
      return {
        ...state,
        isLoadingRevisions: true,
        error: null,
      };
    }

    case 'REVISIONS_SUCCESS': {
      return {
        ...state,
        isLoadingRevisions: false,
        revisions: action.payload,
        error: null,
      };
    }

    case 'REVISIONS_FAILURE': {
      return {
        ...state,
        isLoadingRevisions: false,
        error: { stage: 'revisions', message: action.message },
      };
    }

    case 'ASK_PERSONA_REQUEST': {
      const existing = state.personaChats[action.personaId] ?? [];
      if (!canAddPersonaQuestion(existing)) {
        return state;
      }
      return {
        ...state,
        askingPersonaId: action.personaId,
        error: null,
      };
    }

    case 'ASK_PERSONA_SUCCESS': {
      const existing = state.personaChats[action.personaId] ?? [];
      if (!canAddPersonaQuestion(existing)) {
        return { ...state, askingPersonaId: null };
      }
      return {
        ...state,
        askingPersonaId: null,
        personaChats: {
          ...state.personaChats,
          [action.personaId]: [...existing, action.turn],
        },
      };
    }

    case 'ASK_PERSONA_FAILURE': {
      return {
        ...state,
        askingPersonaId: null,
        error: { stage: 'ask', message: action.message },
      };
    }

    case 'SELECT_ADOPTED_CHOICE': {
      return {
        ...state,
        adoptedChoice: action.choice,
        maxReachedStepIndex: Math.max(state.maxReachedStepIndex, stepToIndex('revisions')),
      };
    }

    case 'UPDATE_VALUE_WEIGHTS': {
      return {
        ...state,
        valueWeights: action.weights,
      };
    }

    case 'REFLECT_REQUEST': {
      return {
        ...state,
        isLoadingReflection: true,
        error: null,
      };
    }

    case 'REFLECT_SUCCESS': {
      return {
        ...state,
        isLoadingReflection: false,
        reflection: action.payload,
        maxReachedStepIndex: Math.max(state.maxReachedStepIndex, stepToIndex('reflect')),
        error: null,
      };
    }

    case 'REFLECT_FAILURE': {
      return {
        ...state,
        isLoadingReflection: false,
        error: { stage: 'reflect', message: action.message },
      };
    }

    case 'UPDATE_REFLECTION_ANSWER': {
      const next = [...state.reflectionAnswers];
      next[action.index] = action.value;
      return {
        ...state,
        reflectionAnswers: next,
      };
    }

    case 'SET_ACTIVE_RECORD_ID': {
      return {
        ...state,
        activeRecordId: action.id,
      };
    }

    case 'LOAD_SAVED_RECORD': {
      const rec = action.record;
      return {
        ...createInitialSimulationState(rec.draft),
        step: 'reflect',
        maxReachedStepIndex: 4,
        isDemo: rec.isDemo,
        deliberation: rec.deliberation,
        impact: rec.impact,
        revisions: rec.revisions,
        adoptedChoice: rec.adoptedChoice,
        valueWeights: rec.valueWeights,
        reflection: rec.reflection,
        reflectionAnswers: rec.reflectionAnswers.length === 3 ? rec.reflectionAnswers : ['', '', ''],
        activeRecordId: rec.id,
      };
    }

    case 'FALLBACK_TO_DEMO_STEP': {
      const { targetStep, payload } = action;
      return {
        ...state,
        step: targetStep,
        isDemo: true,
        maxReachedStepIndex: Math.max(state.maxReachedStepIndex, stepToIndex(targetStep)),
        draft: payload.draft,
        deliberation: state.deliberation ?? payload.deliberation,
        impact: state.impact ?? payload.impact,
        revisions: state.revisions ?? payload.revisions,
        reflection: targetStep === 'reflect' ? payload.reflection : state.reflection,
        adoptedChoice: state.adoptedChoice ?? 'B',
        isLoadingDeliberation: false,
        isLoadingImpact: false,
        isLoadingRevisions: false,
        isLoadingReflection: false,
        askingPersonaId: null,
        error: null,
      };
    }

    case 'CLEAR_ERROR': {
      return {
        ...state,
        error: null,
      };
    }

    default:
      return state;
  }
}
