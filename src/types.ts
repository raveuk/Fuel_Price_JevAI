export type PrimitiveType = 'choice' | 'score' | 'noul';

export interface ChoiceQuestion {
  type: 'choice';
  id: string;
  name: string;
  prompt: string;
  options: string[];
}

export interface ScoreQuestion {
  type: 'score';
  id: string;
  name: string;
  prompt: string;
  levels: string[];
}

export interface NoulQuestion {
  type: 'noul';
  id: string;
  name: string;
  statement: string;
}

export type Question = ChoiceQuestion | ScoreQuestion | NoulQuestion;

export interface ChoiceResponse {
  type: 'choice';
  choice: string;
  probabilities: Record<string, number>;
  confidence: number;
}

export interface ScoreResponse {
  type: 'score';
  score: string;
  levelIndex: number;
  totalLevels: number;
  probabilities: Record<string, number>;
  confidence: number;
}

export interface NoulResponse {
  type: 'noul';
  probability: number;
  boolean: boolean;
}

export type QuestionResult = ChoiceResponse | ScoreResponse | NoulResponse;

export interface EvaluationResult {
  id: string;
  statePreview: string;
  latencyMs: number;
  status: 'pending' | 'success' | 'error';
  results: Record<string, QuestionResult>;
  timestamp: string;
}

export interface PresetScenario {
  id: string;
  title: string;
  description: string;
  iconName: string;
  state: string;
  questions: Question[];
}

export type CodeSnippetStyle = 'script' | 'fastapi' | 'batch_worker';
