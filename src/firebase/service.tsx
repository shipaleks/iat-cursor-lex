import { auth, db } from './config.tsx';
import { signInAnonymously } from 'firebase/auth';
import { collection, addDoc, setDoc, doc, Timestamp, getDoc, updateDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore';

// Интерфейс для результата одного предъявления
interface TrialResult {
  participantId: string;
  participantNickname: string;
  imageFileName: string;
  word: string;
  wordType: 'target' | 'antonym' | 'factor' | 'non-word';
  isCorrect: boolean;
  reactionTimeMs: number;
  model?: string;
  timestamp?: Date;
}

interface ParticipantProgress {
  nickname: string;
  completedImages: string[];
  totalSessions: number;
  lastSessionTimestamp: Date;
}

// Экспортируем интерфейс LeaderboardEntry
export interface LeaderboardEntry {
  nickname: string;
  accuracy: number;
  totalTime: number;
  score: number;
}

// Анонимная аутентификация
export const signInAnonymousUser = async () => {
  try {
    console.log('Attempting anonymous sign in...');
    console.log('Auth instance state:', auth.currentUser);
    
    const userCredential = await signInAnonymously(auth);
    console.log('Sign in successful:', userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error('Error signing in anonymously:', error);
    console.error('Auth instance:', auth);
    throw error;
  }
};

// Получение прогресса участника по никнейму
export const getParticipantProgressByNickname = async (nickname: string): Promise<{ userId: string; progress: ParticipantProgress } | null> => {
  try {
    // Ищем участника по никнейму
    const progressSnapshot = await getDocs(query(
      collection(db, 'progress'),
      where('nickname', '==', nickname)
    ));

    if (!progressSnapshot.empty) {
      const doc = progressSnapshot.docs[0];
      return {
        userId: doc.id,
        progress: doc.data() as ParticipantProgress
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting participant progress by nickname:', error);
    throw error;
  }
};

// Получение прогресса участника
export const getParticipantProgress = async (participantId: string): Promise<ParticipantProgress | null> => {
  try {
    const progressDoc = await getDoc(doc(db, 'progress', participantId));
    
    if (!progressDoc.exists()) {
      // Если документ не существует, возвращаем null
      return null;
    }
    
    return progressDoc.data() as ParticipantProgress;
  } catch (error) {
    console.error('Error getting participant progress:', error);
    throw error;
  }
};

// Создание или обновление прогресса участника
export const updateParticipantProgress = async (
  participantId: string,
  nickname: string,
  completedImages: string[]
) => {
  try {
    // Убедимся, что completedImages - это массив
    const validCompletedImages = Array.isArray(completedImages) ? completedImages : [];
    
    const progressRef = doc(db, 'progress', participantId);
    const progressDoc = await getDoc(progressRef);
    
    if (progressDoc.exists()) {
      const currentProgress = progressDoc.data() as ParticipantProgress;
      const currentImages = Array.isArray(currentProgress.completedImages) ? 
        currentProgress.completedImages : [];
      
      await updateDoc(progressRef, {
        completedImages: [...new Set([...currentImages, ...validCompletedImages])],
        totalSessions: (currentProgress.totalSessions || 0) + 1,
        lastSessionTimestamp: Timestamp.now()
      });
    } else {
      await setDoc(progressRef, {
        nickname,
        completedImages: validCompletedImages,
        totalSessions: 1,
        lastSessionTimestamp: Timestamp.now()
      });
    }
  } catch (error) {
    console.error('Error updating participant progress:', error);
    throw error;
  }
};

// Сохранение результата одного предъявления
export async function saveTrialResult(result: TrialResult) {
  try {
    // Загружаем словарь моделей
    const response = await fetch('/data/dictionary.tsv');
    if (!response.ok) {
      console.error('Failed to load dictionary.tsv:', response.status);
      throw new Error('Failed to load dictionary.tsv');
    }
    
    const text = await response.text();
    console.log('Dictionary loaded, first 100 chars:', text.slice(0, 100));
    
    const rows = text.trim().split('\n').map(row => row.split('\t'));
    const [header, ...data] = rows;
    
    // Получаем номер изображения из имени файла (например, из "123.png" получаем "123")
    const imageNumber = parseInt(result.imageFileName.split('.')[0]);
    console.log('Looking for model for image:', imageNumber);
    
    // Находим соответствующую модель в словаре
    const model = data[imageNumber]?.[2]?.trim() || '';
    console.log('Found model:', model);

    // Добавляем модель и временную метку к результату
    const resultWithModel = {
      ...result,
      model,
      timestamp: new Date()
    };

    console.log('Saving trial result with model:', resultWithModel);
    const docRef = await addDoc(collection(db, 'trials'), resultWithModel);
    return docRef.id;
  } catch (error) {
    console.error('Error saving trial result:', error);
    throw error;
  }
}

// Сохранение результатов сессии
export const saveSessionResults = async (
  participantId: string,
  totalTrials: number,
  correctTrials: number,
  totalTimeMs: number,
  nickname: string
) => {
  try {
    const sessionData = {
      participantId,
      nickname,
      totalTrials,
      correctTrials,
      accuracy: (correctTrials / totalTrials) * 100,
      totalTimeMs,
      timestamp: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'sessions'), sessionData);
    console.log('Session results saved with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving session results:', error);
    throw error;
  }
};

// Обновление результатов в таблице лидеров
export const updateLeaderboard = async (
  nickname: string,
  sessionStats: {
    totalTrials: number;
    correctTrials: number;
    totalTimeMs: number;
  }
) => {
  try {
    const leaderboardRef = doc(db, 'leaderboard', nickname);
    const leaderboardDoc = await getDoc(leaderboardRef);
    
    if (leaderboardDoc.exists()) {
      const currentStats = leaderboardDoc.data();
      const newTotalTrials = currentStats.totalTrials + sessionStats.totalTrials;
      const newTotalCorrect = currentStats.totalCorrect + sessionStats.correctTrials;
      const newTotalTime = currentStats.totalTime + sessionStats.totalTimeMs;
      
      const accuracy = (newTotalCorrect / newTotalTrials) * 100;
      const timeInMinutes = newTotalTime / (1000 * 60);
      
      // Расчет баллов за точность (максимум 80 баллов)
      let accuracyScore;
      if (accuracy < 75) {
        accuracyScore = Math.pow(accuracy / 75, 6) * 20;
      } else if (accuracy < 90) {
        accuracyScore = 20 + (accuracy - 75) * (40 / 15);
      } else {
        accuracyScore = 60 + Math.min(20, Math.pow(1.2, accuracy - 90));
      }
      
      // Расчет баллов за время (максимум 20 баллов)
      // Оптимальное время - 8 минут
      const optimalTime = 8;
      const timeScore = Math.max(0, 20 * (1 - Math.pow((timeInMinutes - optimalTime) / 10, 2)));
      
      // Финальный рейтинг - сумма баллов за точность и время
      const score = Math.round(accuracyScore + timeScore);
      
      await updateDoc(leaderboardRef, {
        totalTrials: newTotalTrials,
        totalCorrect: newTotalCorrect,
        totalTime: newTotalTime,
        accuracy: accuracy,
        score: score,
        lastUpdate: Timestamp.now()
      });
    } else {
      const accuracy = (sessionStats.correctTrials / sessionStats.totalTrials) * 100;
      const timeInMinutes = sessionStats.totalTimeMs / (1000 * 60);
      
      let accuracyScore;
      if (accuracy < 75) {
        accuracyScore = Math.pow(accuracy / 75, 6) * 20;
      } else if (accuracy < 90) {
        accuracyScore = 20 + (accuracy - 75) * (40 / 15);
      } else {
        accuracyScore = 60 + Math.min(20, Math.pow(1.2, accuracy - 90));
      }
      
      const optimalTime = 8;
      const timeScore = Math.max(0, 20 * (1 - Math.pow((timeInMinutes - optimalTime) / 10, 2)));
      const score = Math.round(accuracyScore + timeScore);
      
      await setDoc(leaderboardRef, {
        nickname,
        totalTrials: sessionStats.totalTrials,
        totalCorrect: sessionStats.correctTrials,
        totalTime: sessionStats.totalTimeMs,
        accuracy: accuracy,
        score: score,
        lastUpdate: Timestamp.now()
      });
    }
  } catch (error) {
    console.error('Error updating leaderboard:', error);
    throw error;
  }
};

// Функция для получения данных лидерборда
export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  try {
    const leaderboardSnapshot = await getDocs(collection(db, 'leaderboard'));
    const entries: LeaderboardEntry[] = [];
    
    leaderboardSnapshot.forEach(doc => {
      const data = doc.data();
      entries.push({
        nickname: data.nickname,
        accuracy: data.accuracy,
        totalTime: data.totalTime,
        score: data.score
      });
    });
    
    // Сортируем по убыванию счета
    return entries.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    throw error;
  }
};

// Функция для пересчета рейтинга всех участников
export const recalculateLeaderboardScores = async () => {
  try {
    const leaderboardSnapshot = await getDocs(collection(db, 'leaderboard'));

    for (const doc of leaderboardSnapshot.docs) {
      const data = doc.data();
      const accuracy = (data.totalCorrect / data.totalTrials) * 100;
      const timeInMinutes = data.totalTime / (1000 * 60);

      let accuracyScore;
      if (accuracy < 75) {
        accuracyScore = Math.pow(accuracy / 75, 6) * 20;
      } else if (accuracy < 90) {
        accuracyScore = 20 + (accuracy - 75) * (40 / 15);
      } else {
        accuracyScore = 60 + Math.min(20, Math.pow(1.2, accuracy - 90));
      }

      const optimalTime = 8;
      const timeScore = Math.max(0, 20 * (1 - Math.pow((timeInMinutes - optimalTime) / 10, 2)));
      const score = Math.round(accuracyScore + timeScore);

      await updateDoc(doc.ref, { score });
    }

    console.log('Leaderboard scores recalculated successfully.');
  } catch (error) {
    console.error('Error recalculating leaderboard scores:', error);
  }
}; 