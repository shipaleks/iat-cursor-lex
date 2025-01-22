export interface Participant {
  nickname: string;
  sessionId: string;
  isTestSession: boolean;
  startTime: Date;
}

export interface ImageData {
  id: string;
  fileName: string;
  url: string;
  target: string;
  antonym: string;
  model: string;
}

export interface CommonWord {
  word: string;
  category: 'aesthetic' | 'harmony' | 'chaos'; // категории слов
}

export interface Session {
  sessionId: string;
  participantId: string;
  imageIds: string[];
  currentImageIndex: number;
  currentTrialIndex: number;
  trials: Trial[];
  completed: boolean;
  completedTrials?: number;
}

export interface Trial {
  imageId: string;
  word: string;
  wordType: WordType;
}

export type WordType = 'target' | 'antonym' | 'factor' | 'non-word';

// Состояние текущего испытания
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