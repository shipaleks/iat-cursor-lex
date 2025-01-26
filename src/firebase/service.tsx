import { auth, db } from './config';
import { signInAnonymously, signOut } from 'firebase/auth';
import { collection, addDoc, setDoc, doc, Timestamp, getDoc, updateDoc, getDocs, query, where, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

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
  totalTimeMs: number;
  score: number;
  roundsCompleted: number;
  ratingDetails?: RatingCalculation;
}

// Экспортируем интерфейс для использования в других компонентах
export interface RatingCalculation {
  timeScore: number;
  accuracyMultiplier: number;
  roundBonus: number;
  finalScore: number;
  theoreticalMinTime: number;
  actualTime: number;
  accuracy: number;
  roundsCompleted: number;
}

// Выход из системы
export async function signOutUser() {
  try {
    const auth = getAuth();
    await signOut(auth);
    console.log('User signed out successfully');
  } catch (error) {
    console.error('Error signing out:', error);
  }
}

// Анонимная аутентификация
export async function signInAnonymousUser() {
  const auth = getAuth();
  
  try {
    // Создаем новую анонимную сессию
    const result = await signInAnonymously(auth);
    console.log('New anonymous user created with UID:', result.user.uid);
    return result.user;
  } catch (error) {
    console.error('Error signing in anonymously:', error);
    throw error;
  }
}

// Получение прогресса участника по никнейму
export const getParticipantProgressByNickname = async (nickname: string): Promise<{ userId: string; progress: ParticipantProgress } | null> => {
  try {
    console.log('Looking for progress by nickname:', nickname);
    
    // Сначала проверяем в коллекции nicknames
    const nicknameDoc = await getDoc(doc(db, 'nicknames', nickname));
    
    if (nicknameDoc.exists()) {
      // Если нашли в nicknames, используем этот userId
      const userId = nicknameDoc.data().userId;
      console.log('Found user ID in nicknames:', userId);
      
      // Получаем прогресс по userId
      const progressDoc = await getDoc(doc(db, 'progress', userId));
      if (progressDoc.exists()) {
        const progress = progressDoc.data() as ParticipantProgress;
        return {
          userId,
          progress: {
            ...progress,
            completedImages: Array.isArray(progress.completedImages) ? progress.completedImages : []
          }
        };
      } else {
        // Если нашли никнейм, но нет прогресса, создаем новый
        const newProgress: ParticipantProgress = {
          nickname,
          completedImages: [],
          totalSessions: 0,
          lastSessionTimestamp: new Date()
        };
        await setDoc(doc(db, 'progress', userId), newProgress);
        return {
          userId,
          progress: newProgress
        };
      }
    }
    
    // Если не нашли в nicknames, возвращаем null
    console.log('No progress found for nickname:', nickname);
    return null;
  } catch (error) {
    console.error('Error getting participant progress by nickname:', error);
    throw error;
  }
};

// Получение прогресса участника
export const getParticipantProgress = async (participantId: string): Promise<ParticipantProgress | null> => {
  try {
    console.log('Getting progress for participant:', participantId);
    const progressDoc = await getDoc(doc(db, 'progress', participantId));
    
    if (!progressDoc.exists()) {
      console.log('No progress found for participant');
      return null;
    }
    
    const data = progressDoc.data() as ParticipantProgress;
    console.log('Retrieved progress:', data);
    
    // Убедимся, что completedImages - это массив
    if (!Array.isArray(data.completedImages)) {
      console.log('completedImages is not an array, fixing:', data.completedImages);
      data.completedImages = [];
    }
    
    return data;
  } catch (error) {
    console.error('Error getting participant progress:', error);
    throw error;
  }
};

// Создание или обновление прогресса участника
export const updateParticipantProgress = async (
  participantId: string,
  participantNickname: string,
  completedImages: string[]
): Promise<void> => {
  try {
    console.log('Updating progress for:', {
      participantId,
      participantNickname,
      newCompletedImages: completedImages.length
    });

    // Проверяем существующий прогресс по никнейму
    const existingProgress = await getParticipantProgressByNickname(participantNickname);
    
    // Если есть существующий прогресс, используем его completedImages
    let allCompletedImages = completedImages;
    if (existingProgress) {
      console.log('Found existing progress:', existingProgress);
      // Объединяем существующие и новые изображения
      allCompletedImages = [...new Set([...existingProgress.progress.completedImages, ...completedImages])];
      console.log('Combined completed images:', allCompletedImages.length);
    }

    // Обновляем или создаем запись в коллекции nicknames
    await setDoc(doc(db, 'nicknames', participantNickname), {
      userId: participantId,
      lastUpdated: serverTimestamp()
    });

    // Обновляем прогресс участника
    const progressRef = doc(db, 'progress', participantId);
    
    // Получаем текущий прогресс для корректного подсчета сессий
    const currentProgress = await getDoc(progressRef);
    const currentTotalSessions = currentProgress.exists() ? 
      (currentProgress.data().totalSessions || 0) : 0;

    await setDoc(progressRef, {
      nickname: participantNickname,
      completedImages: allCompletedImages,
      totalSessions: currentTotalSessions + 1,
      lastSessionTimestamp: serverTimestamp()
    });

    console.log('Progress updated:', {
      totalImages: allCompletedImages.length,
      rounds: Math.floor(allCompletedImages.length / 4),
      totalSessions: currentTotalSessions + 1
    });
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

// Обновление таблицы лидеров
export const updateLeaderboard = async (
  participantId: string,
  nickname: string,
  totalTrials: number,
  correctTrials: number,
  totalTimeMs: number
) => {
  try {
    // Получаем все сессии пользователя по никнейму
    const sessionsQuery = query(
      collection(db, 'sessions'),
      where('nickname', '==', nickname)
    );
    const sessionsSnapshot = await getDocs(sessionsQuery);
    const sessions = sessionsSnapshot.docs.map(doc => doc.data());

    // Считаем среднее время и общую точность по всем сессиям
    const totalSessions = sessions.length;
    const totalAccuracy = sessions.reduce((sum, session) => sum + (session.correctTrials / session.totalTrials), 0);
    const averageTimeMs = sessions.reduce((sum, session) => sum + session.totalTimeMs, 0) / totalSessions;

    // Получаем прогресс участника для подсчета раундов
    const existingProgress = await getParticipantProgressByNickname(nickname);
    const completedImages = existingProgress?.progress.completedImages || [];
    
    // Если это новый раунд, добавляем текущие изображения
    const currentRoundImages = sessions[sessions.length - 1]?.completedImages || [];
    const allCompletedImages = [...new Set([...completedImages, ...currentRoundImages])];
    
    const completedRounds = Math.max(1, Math.floor(allCompletedImages.length / 4));

    console.log('Updating leaderboard for:', {
      nickname,
      totalSessions,
      completedRounds,
      totalImages: allCompletedImages.length,
      currentRoundImages: currentRoundImages.length,
      existingImages: completedImages.length,
      averageTimeMs
    });

    // Рассчитываем рейтинг
    const rating = await calculateRating(
      totalTrials,
      correctTrials,
      averageTimeMs,
      completedRounds
    );

    // Обновляем запись в таблице лидеров
    const leaderboardRef = doc(db, 'leaderboard', nickname);
    await setDoc(leaderboardRef, {
      nickname,
      participantId, // Добавляем participantId для связи с прогрессом
      accuracy: (totalAccuracy / totalSessions) * 100,
      totalTimeMs: averageTimeMs,
      score: rating.finalScore,
      roundsCompleted: completedRounds,
      ratingDetails: rating,
      lastUpdated: serverTimestamp()
    });

    return rating;
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
        totalTimeMs: data.totalTimeMs,
        score: data.score,
        roundsCompleted: data.roundsCompleted,
        ratingDetails: data.ratingDetails
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

    for (const docRef of leaderboardSnapshot.docs) {
      const data = docRef.data();
      
      // Получаем сессии пользователя
      const sessionsQuery = query(
        collection(db, 'sessions'),
        where('nickname', '==', data.nickname)
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessions = sessionsSnapshot.docs.map(doc => doc.data());

      if (sessions.length === 0) {
        console.warn(`No sessions found for ${data.nickname}, skipping recalculation`);
        continue;
      }

      // Считаем общую статистику по всем сессиям
      const totalSessions = sessions.length;
      const totalTrials = sessions.reduce((sum, session) => sum + (session.totalTrials || 0), 0);
      const correctTrials = sessions.reduce((sum, session) => sum + (session.correctTrials || 0), 0);
      const totalTimeMs = sessions.reduce((sum, session) => sum + (session.totalTimeMs || 0), 0);
      const averageTimeMs = totalTimeMs / totalSessions;

      // Получаем прогресс участника для подсчета раундов
      const existingProgress = await getParticipantProgressByNickname(data.nickname);
      const completedImages = existingProgress?.progress.completedImages || [];
      
      // Если есть сессии, учитываем изображения из последней сессии
      const currentRoundImages = sessions[sessions.length - 1]?.completedImages || [];
      const allCompletedImages = [...new Set([...completedImages, ...currentRoundImages])];
      
      const completedRounds = Math.max(1, Math.floor(allCompletedImages.length / 4));

      // Рассчитываем рейтинг
      const rating = await calculateRating(
        totalTrials,
        correctTrials,
        averageTimeMs,
        completedRounds
      );

      // Обновляем запись в лидерборде
      if (!isNaN(rating.finalScore)) {
        await updateDoc(docRef.ref, {
          score: rating.finalScore,
          accuracy: rating.accuracy,
          totalTimeMs: averageTimeMs,
          ratingDetails: rating,
          roundsCompleted: completedRounds,
          lastUpdated: serverTimestamp()
        });
        console.log(`Updated score for ${data.nickname}: ${rating.finalScore}`);
      } else {
        console.warn(`Invalid rating calculated for ${data.nickname}`);
      }
    }

    console.log('Leaderboard scores recalculated successfully.');
  } catch (error) {
    console.error('Error recalculating leaderboard scores:', error);
    throw error;
  }
};

// Функция для очистки таблицы лидеров
export const clearLeaderboard = async () => {
  try {
    const leaderboardSnapshot = await getDocs(collection(db, 'leaderboard'));
    
    const batch = writeBatch(db);
    leaderboardSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log('Leaderboard cleared successfully.');
  } catch (error) {
    console.error('Error clearing leaderboard:', error);
    throw error;
  }
};

// Функция для полной очистки данных эксперимента
export const clearAllData = async () => {
  try {
    const batch = writeBatch(db);
    
    // Очищаем таблицу лидеров
    const leaderboardDocs = await getDocs(collection(db, 'leaderboard'));
    leaderboardDocs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Очищаем результаты испытаний
    const trialsDocs = await getDocs(collection(db, 'trials'));
    trialsDocs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Очищаем результаты сессий
    const sessionsDocs = await getDocs(collection(db, 'sessions'));
    sessionsDocs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Очищаем прогресс участников (исправлено название коллекции)
    const progressDocs = await getDocs(collection(db, 'progress'));
    progressDocs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Добавляем очистку коллекции nicknames
    const nicknamesDocs = await getDocs(collection(db, 'nicknames'));
    nicknamesDocs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Применяем все операции удаления
    await batch.commit();
    console.log('All collections cleared successfully');
  } catch (error) {
    console.error('Error clearing collections:', error);
    throw error;
  }
};

// Расчет рейтинга с дополнительными проверками
export async function calculateRating(
  totalTrials: number,
  correctTrials: number,
  totalTimeMs: number,
  roundsCompleted: number
): Promise<RatingCalculation> {
  // Проверяем входные данные
  if (totalTrials <= 0 || totalTimeMs <= 0) {
    return {
      timeScore: 0,
      accuracyMultiplier: 0,
      roundBonus: 1,
      finalScore: 0,
      theoreticalMinTime: 0,
      actualTime: totalTimeMs,
      accuracy: 0,
      roundsCompleted: 0
    };
  }

  // 1. Вычисляем точность (0-1)
  const accuracy = totalTrials > 0 ? correctTrials / totalTrials : 0;
  
  // 2. Очки за точность (до 85 баллов)
  const accuracyScore = accuracy * accuracy * 85;
  
  // 3. Очки за время (до 15 баллов)
  const theoreticalMinTime = totalTrials * 1500; // 1.5 секунды на пробу
  const timeRatio = Math.min(theoreticalMinTime / totalTimeMs, 1); // Ограничиваем максимальное значение
  const timeScore = timeRatio * 15;
  
  // 4. Суммируем базовые очки
  const baseScore = accuracyScore + timeScore;
  
  // 5. Добавляем бонус за номер раунда (+10% за каждый раунд)
  const roundBonus = 1 + Math.max(0, 0.1 * roundsCompleted);
  const finalScore = Math.round(baseScore * roundBonus);

  return {
    timeScore: Math.round(timeScore), // 0-15 баллов за время
    accuracyMultiplier: accuracy * accuracy, // Для расчёта очков за точность
    roundBonus: roundBonus, // Множитель за раунды
    finalScore: finalScore,
    theoreticalMinTime: theoreticalMinTime,
    actualTime: totalTimeMs,
    accuracy: accuracy * 100, // Для отображения в процентах
    roundsCompleted: roundsCompleted
  };
} 