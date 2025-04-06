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
  startTime: Date;
  userId: string;
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

export type WordType = 'aesthetic' | 'non-word';

export interface Trial {
  imageId: string;
  imageFileName: string;
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
  participantNickname: string;
  imageFileName: string;
  word: string;
  wordType: WordType;
  isCorrect: boolean;
  reactionTimeMs: number;
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
  imagesSeenWithRealWord?: string[];
  v8ImagesSeenCount?: number;
  v10ImagesSeenCount?: number;
  imageCounts?: { [key: string]: number };
}

export interface LeaderboardEntry {
  nickname: string;
  totalTimeMs: number;
  score: number;
  roundsCompleted: number;
  deviceType?: 'mobile' | 'desktop';
  ratingDetails?: RatingCalculation;
}

export interface RatingCalculation {
  rating: number;
  feedbackMessage?: string;
  roundsCompleted: number;
  bonusPercentage: number;
}

// ... rest of the types ... 