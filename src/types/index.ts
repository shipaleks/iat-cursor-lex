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
}

export type WordType = 'target' | 'antonym' | 'factor' | 'non-word';

export interface WordTrial {
  imageId: string;
  word: string;
  wordType: WordType;
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