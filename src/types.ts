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
  preloadedImage?: HTMLImageElement | null;
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
  rating: number; // Базовый рейтинг (0-100)
  timeScore: number; // Баллы за время (0-15)
  accuracyMultiplier: number; // Множитель точности (0-1)
  accuracy: number; // Точность в процентах (0-100)
  actualTime: number; // Реальное среднее время сессии
  theoreticalMinTime: number; // Теоретическое мин. время сессии
  roundsCompleted: number; // Количество завершенных раундов
  bonusPercentage: number; // Итоговый процент бонуса (100, 105...)
  roundBonus: number; // Множитель бонуса (1.0, 1.05...)
  finalScore: number; // Итоговый счет (rating * roundBonus)
  // feedbackMessage?: string; // Убираем, если не используется
}

// ... rest of the types ... 