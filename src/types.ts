export type AppStep = 'hero' | 'draft' | 'deliberate' | 'impact' | 'revisions' | 'reflect';

export type BillTarget =
  | '전교생'
  | '1학년'
  | '2학년'
  | '3학년'
  | '특정 동아리·학급'
  | '기숙사생';

export interface BillDraft {
  title: string;
  content: string;
  purpose: string;
  target: BillTarget;
  sanction: string;
}

export interface BillClause {
  no: string;
  heading: string;
  text: string;
}

export interface FormalBill {
  title: string;
  clauses: BillClause[];
}

export interface IntakeResult {
  accepted: boolean;
  rejectReason: string;
  rejectGuide: string;
}

export type PersonaId = 'student' | 'teacher' | 'parent' | 'admin' | 'unseen';

export type Stance = 'SUPPORT' | 'CONDITIONAL' | 'OPPOSE';

export interface Persona {
  id: PersonaId;
  roleLabel: string;
  unseenDescription: string;
  stance: Stance;
  headline: string;
  statement: string;
  concerns: string[];
  demands: string[];
  values: string[];
}

export interface ConflictPoint {
  valueA: string;
  valueB: string;
  description: string;
  sideA: PersonaId[];
  sideB: PersonaId[];
}

export interface DeliberationResponse {
  intake: IntakeResult;
  bill: FormalBill;
  personas: Persona[];
  conflicts: ConflictPoint[];
}

export type ImpactAxisKey = 'legitimacy' | 'equity' | 'effectiveness' | 'acceptance';

export interface ImpactAxis {
  key: ImpactAxisKey;
  label: string;
  score: number;
  reason: string;
}

export type SideEffectType = 'UNINTENDED' | 'EVASION' | 'INEQUITY' | 'COST';

export interface SideEffect {
  title: string;
  type: SideEffectType;
  description: string;
  affected: string;
  likelihood: 1 | 2 | 3;
  severity: 1 | 2 | 3;
}

export interface ImpactResponse {
  axes: ImpactAxis[];
  summary: string;
  keyQuestion: string;
  sideEffects: SideEffect[];
  alternatives: string[];
}

export type ClauseChangeType = 'KEEP' | 'MODIFIED' | 'ADDED' | 'REMOVED';

export interface RevisionClause {
  no: string;
  heading: string;
  text: string;
  changeType: ClauseChangeType;
}

export interface AxisScores {
  legitimacy: number;
  equity: number;
  effectiveness: number;
  acceptance: number;
}

export interface RevisionPlan {
  id: 'A' | 'B';
  name: string;
  strategy: string;
  clauses: RevisionClause[];
  changeSummary: string;
  scores: AxisScores;
  tradeoff: string;
}

export interface RevisionsResponse {
  revisions: RevisionPlan[];
}

export type StanceShift = 'NONE' | 'SOFTENED' | 'HARDENED';

export interface PersonaChatTurn {
  question: string;
  answer: string;
  stanceShift: StanceShift;
}

export interface AskPersonaResponse {
  answer: string;
  stanceShift: StanceShift;
}

export type AdoptedChoice = 'ORIGINAL' | 'A' | 'B';

export type ValueKey = 'freedom' | 'safety' | 'equality' | 'efficiency' | 'responsibility' | 'community';

export interface ValueWeights {
  freedom: number;
  safety: number;
  equality: number;
  efficiency: number;
  responsibility: number;
  community: number;
}

export interface ReflectionResponse {
  profile: string;
  tension: string;
  questions: string[];
  principle: string;
}

export interface SavedRecord {
  id: string;
  docNumber: string;
  createdAt: string;
  draft: BillDraft;
  deliberation: DeliberationResponse;
  impact: ImpactResponse;
  revisions: RevisionsResponse;
  adoptedChoice: AdoptedChoice;
  valueWeights: ValueWeights;
  reflection: ReflectionResponse;
  reflectionAnswers: string[];
  isDemo: boolean;
}

export interface DraftValidationErrors {
  title?: string;
  content?: string;
  purpose?: string;
  sanction?: string;
}
