export interface Participant {
  nickname: string;
  sessionId: string;
  startTime: Date;
  isTestSession: boolean;
}

export interface ImageData {
  id: string;
  fileName: string;
  url: string;
  target: string;
  antonym: string;
}

export interface CommonWord {
  word: string;
  category: 'aesthetic' | 'harmony' | 'chaos'; // категории слов
}

export interface Trial {
  imageId: string;
  word: string;
  wordType: 'target' | 'antonym' | 'factor' | 'non-word';
  reactionTime?: number;
  isCorrect?: boolean;
}

export interface Session {
  sessionId: string;
  participantId: string;
  imageIds: string[];
  currentImageIndex: number;
  currentTrialIndex: number;
  trials: Trial[];
  completed: boolean;
}

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