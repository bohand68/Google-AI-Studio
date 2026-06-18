export type Phase = 'Discover' | 'Prepare' | 'Explore' | 'Realize' | 'Deploy' | 'Run+Hypercare';
export type Complexity = 'Low' | 'Medium' | 'High' | 'Very High';
export type StandardComplexity = 'Low' | 'Medium' | 'High';

export interface ProjectDurationState {
  startDate: string;
  endDate: string;
  netWeeks: number;
  runHypercareWeeks: number;
  phaseDistributions: Record<Phase, number>; // percentages
  phaseDetails: { id: string; phase: Phase; content: string; percentage: number }[];
}

export interface ScopeItemsState {
  items: Record<string, { total: number; low: number; medium: number; high: number; veryHigh: number }>;
  complexityMatrix: Record<Phase, Record<Complexity, number>>;
}

export interface GenericEstimationState {
  setup: Record<string, Record<StandardComplexity, number>>; // Type -> Complexity -> Days
  inputs: Record<string, { total: number; low: number; medium: number; high: number }>;
  distribution: Record<string, Record<Phase, number>>; // Percentages
}

export interface TeamAndCostsState {
  teamFTE: Record<string, number>;
  dailyRates: Record<string, number>;
  rolePercent: Record<string, number>;
  roleDaysOverride: Record<string, number | null>;
  runHypercareDays?: Record<string, number>;
  pmPersons: number;
  pmDaysPerWeek: number;
  meetingPersons: number;
  meetingDaysPerWeek: number;
  complexityFactor?: number;
  steeringFactor?: number;
}

export interface AppState {
  projectDuration: ProjectDurationState;
  scopeItems: ScopeItemsState;
  dataMigration: GenericEstimationState;
  integrations: GenericEstimationState;
  forms: GenericEstimationState;
  teamAndCosts: TeamAndCostsState;
}
