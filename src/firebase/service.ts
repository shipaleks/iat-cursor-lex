import { auth, db } from './config';
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

interface LeaderboardEntry {
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
  nickname: string,
  progress: {
    completedImages: string[];
  }
) => {
  try {
    // Убедимся, что completedImages - это массив
    const validCompletedImages = Array.isArray(progress.completedImages) ? progress.completedImages : [];
    
    // Ищем документ по никнейму
    const progressSnapshot = await getDocs(query(
      collection(db, 'progress'),
      where('nickname', '==', nickname)
    ));
    
    if (!progressSnapshot.empty) {
      const progressDoc = progressSnapshot.docs[0];
      const currentProgress = progressDoc.data() as ParticipantProgress;
      const currentImages = Array.isArray(currentProgress.completedImages) ? 
        currentProgress.completedImages : [];
      
      await updateDoc(progressDoc.ref, {
        completedImages: [...new Set([...currentImages, ...validCompletedImages])],
        totalSessions: (currentProgress.totalSessions || 0) + 1,
        lastSessionTimestamp: Timestamp.now()
      });
    } else {
      // Создаем новый документ в коллекции
      await addDoc(collection(db, 'progress'), {
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
      
      // Новая формула рейтинга:
      // 1. Для точности ниже 75% рейтинг близок к нулю
      // 2. От 75% до 90% - линейный рост
      // 3. Выше 90% - экспоненциальный бонус
      let accuracyScore;
      if (accuracy < 75) {
        // Ниже 75% - практически нулевой рейтинг
        accuracyScore = Math.pow(accuracy / 75, 6) * 25; // максимум 25 баллов
      } else if (accuracy < 90) {
        // От 75% до 90% - линейный рост от 25 до 75 баллов
        accuracyScore = 25 + (accuracy - 75) * (50 / 15);
      } else {
        // Выше 90% - экспоненциальный рост, максимум примерно 100 баллов
        accuracyScore = 75 + Math.min(25, Math.pow(1.2, accuracy - 90));
      }
      
      // Влияние времени: от 0.5 до 1.0
      const timeMultiplier = Math.max(0.5, 1 - (timeInMinutes - 2) / 8);
      
      // Финальный рейтинг от 0 до 100
      const score = Math.min(100, Math.round(accuracyScore * timeMultiplier));
      
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
        accuracyScore = Math.pow(accuracy / 75, 6) * 25;
      } else if (accuracy < 90) {
        accuracyScore = 25 + (accuracy - 75) * (50 / 15);
      } else {
        accuracyScore = 75 + Math.min(25, Math.pow(1.2, accuracy - 90));
      }
      
      const timeMultiplier = Math.max(0.5, 1 - (timeInMinutes - 2) / 8);
      const score = Math.min(100, Math.round(accuracyScore * timeMultiplier));
      
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
    
    return entries;
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    throw error;
  }
};

export const clearAllCollections = async () => {
  try {
    const collections = ['trials', 'sessions', 'progress', 'leaderboard'];
    
    for (const collectionName of collections) {
      const querySnapshot = await getDocs(collection(db, collectionName));
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    }
    
    console.log('All collections cleared successfully');
  } catch (error) {
    console.error('Error clearing collections:', error);
    throw error;
  }
}; 