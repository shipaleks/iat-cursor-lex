export type WordCategory = 
  | 'beauty_positive' | 'beauty_negative'
  | 'harmony_positive' | 'harmony_negative'
  | 'dynamics_positive' | 'dynamics_negative'
  | 'originality_positive' | 'originality_negative'
  | 'accuracy_high' | 'accuracy_low';

export interface CommonWord {
  word: string;
  category: WordCategory;
}

export interface Participant {
  nickname: string;
  sessionId: string;
  isTestSession: boolean;
}

export interface ExperimentStats {
  correct: number;
  total: number;
  totalTimeMs: number;
}

export interface ImageData {
  id: string;
  fileName: string;
  url: string;
  target: string;
  antonym: string;
  model: string;
}

export type WordType = 'target' | 'antonym' | 'factor' | 'non-word';

export interface Trial {
  imageId: string;
  word: string;
  wordType: WordType;
}

export interface Session {
  sessionId: string;
  trials: Trial[];
  currentTrialIndex: number;
  completedTrials: number;
  totalTrials: number;
}

export interface TrialResult {
  imageId: string;
  word: string;
  wordType: WordType;
  isCorrect: boolean;
  reactionTime: number;
  participantNickname: string;
}

export interface TrialState {
  trial: Trial;
  image: ImageData;
  showImage: boolean;
  showWord: boolean;
  lastResponse: { isCorrect: boolean; buttonPressed: 'left' | 'right' } | null;
  startTime: number | null;
}

export interface ParticipantProgress {
  userId: string;
  nickname: string;
  completedImages: string[];
  totalSessions: number;
  lastSessionTimestamp: any; // Firebase Timestamp
  createdAt: any; // Firebase Timestamp
}

export interface LeaderboardEntry {
  nickname: string;
  totalTrials: number;
  correctTrials: number;
  totalTimeMs: number;
  score: number;
  ratingDetails?: {
    timeScore: number;
    accuracyMultiplier: number;
    roundBonus: number;
    finalScore: number;
    theoreticalMinTime: number;
    actualTime: number;
    accuracy: number;
    roundsCompleted: number;
  };
}

// ... rest of the types ... 