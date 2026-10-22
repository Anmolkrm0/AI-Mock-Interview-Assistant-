export type InterviewRigor = 'Standard' | 'Target Bar' | 'Stress Test';

export interface QuestionItem {
  id: number;
  topic?: string;
  category: 'System Design' | 'Behavioral' | 'Technical' | 'Deep Architecture';
  question: string;
  rubricFocus?: string;
  benchmark?: string;
  score?: number;
  timestamp?: string;
  candidateExcerpt?: string;
  aiRationale?: string;
  modelUpgrade?: string;
}

export interface TranscriptEntry {
  time: string;
  speaker: string;
  role: 'interviewer' | 'candidate';
  text: string;
  isActive?: boolean;
  isLive?: boolean;
}

export interface DimensionMetric {
  name: string;
  score: number;
  status: 'Exceptional' | 'Strong' | 'Competent' | 'Needs Work';
}

export interface SessionReport {
  id: string;
  role: string;
  companyRef: string;
  rigor: InterviewRigor;
  durationMinutes: number;
  actualDuration: string;
  promptsAnswered: number;
  date: string;
  overallScore: number;
  verdict: string;
  percentile: string;
  confidenceIndex: string;
  modelPasses: number;
  speechRateWpm: number;
  dimensions: DimensionMetric[];
  answerQuality: {
    relevance: number;
    completeness: number;
    clarity: number;
    conciseness: number;
  };
  strengths: { title: string; description: string }[];
  gaps: { title: string; description: string }[];
  actionPlan: { title: string; description: string }[];
  questions: QuestionItem[];
  transcript: TranscriptEntry[];
  simulationAuthenticity: number;
}

export interface UserFeedback {
  id: string;
  sessionId: string;
  rating: number;
  comments: string;
  tags: string[];
  submittedAt: string;
}
