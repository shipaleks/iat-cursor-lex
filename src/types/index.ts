export interface Participant {
  nickname: string;
  sessionId: string;
  startTime: Date;
}

export interface ImageData {
  id: string;
  fileName: string;
  url: string;
  synonym: string;
  antonym: string;
}

export interface CommonWord {
  word: string;
  category: 'aesthetic' | 'harmony' | 'chaos'; // категории слов
}

export interface WordTrial {
  imageId: string;
  word: string;
  wordType: 'synonym' | 'antonym' | 'common' | 'non-word';
  reactionTime?: number;
  isCorrect?: boolean;
}

export interface Session {
  id: string;
  participantId: string;
  imageIds: string[]; // 10 картинок на сессию
  currentImageIndex: number;
  currentTrialIndex: number;
  trials: WordTrial[];
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
    type: 'synonym' | 'antonym' | 'common' | 'non-word';
  };
} 