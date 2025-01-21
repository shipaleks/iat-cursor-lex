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
  startTime: Date;
  isTestSession: boolean;
}

export interface ExperimentStats {
  correct: number;
  total: number;
  totalTimeMs: number;
}

export interface Trial {
  imageId: string;
  word: string;
  wordType: 'target' | 'antonym' | 'factor' | 'non-word';
  reactionTime?: number;
  isCorrect?: boolean;
}

export interface Session {
  trials: Trial[];
  currentTrialIndex: number;
  completed: boolean;
}

export interface TrialState {
  showImage: boolean;
  imageStartTime: number;
  wordStartTime: number;
  currentImage: ImageData;
  currentWord: {
    word: string;
    type: 'target' | 'antonym' | 'factor' | 'non-word';
  };
}

export interface ImageData {
  id: string;
  fileName: string;
  url: string;
  target: string;
  antonym: string;
}

// ... rest of the types ... 