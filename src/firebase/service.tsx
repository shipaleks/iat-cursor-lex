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
    const db = getFirestore();
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (currentUser) {
      // Очищаем запись в коллекции nicknames для текущего пользователя
      const nicknamesRef = collection(db, 'nicknames');
      const nicknameQuery = query(nicknamesRef, where('userId', '==', currentUser.uid));
      const nicknameSnapshot = await getDocs(nicknameQuery);
      
      for (const doc of nicknameSnapshot.docs) {
        await deleteDoc(doc.ref);
      }

      // Очищаем прогресс пользователя
      const progressRef = doc(db, 'progress', currentUser.uid);
      await deleteDoc(progressRef);
    }

    await signOut(auth);
    console.log('User signed out successfully');
  } catch (error) {
    console.error('Error signing out:', error);
  }
}

// Анонимная аутентификация с предварительным выходом
export async function signInAnonymousUser() {
  const auth = getAuth();
  
  try {
    // Сначала выходим из текущей сессии
    await signOutUser();
    
    // Затем создаем новую анонимную сессию
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
      }
    }
    
    // Если не нашли в nicknames или нет прогресса, возвращаем null
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
export async function updateParticipantProgress(
  userId: string,
  nickname: string,
  completedImages: string[]
) {
  const db = getFirestore();
  console.log('Updating progress for user:', userId, 'nickname:', nickname);

  try {
    // Проверяем, не занят ли никнейм другим пользователем
    const nicknamesRef = collection(db, 'nicknames');
    const nicknameQuery = query(nicknamesRef, where('nickname', '==', nickname));
    const nicknameSnapshot = await getDocs(nicknameQuery);

    if (!nicknameSnapshot.empty) {
      const existingDoc = nicknameSnapshot.docs[0];
      const existingUserId = existingDoc.data().userId;

      if (existingUserId !== userId) {
        console.error('Nickname is already taken by another user');
        throw new Error('Nickname is already taken by another user');
      }
    }

    // Создаем или обновляем запись в коллекции nicknames
    const nicknameDoc = doc(db, 'nicknames', nickname);
    await setDoc(nicknameDoc, {
      userId,
      nickname,
      updatedAt: serverTimestamp()
    });

    // Обновляем прогресс пользователя
    const progressRef = doc(db, 'progress', userId);
    const progressDoc = await getDoc(progressRef);

    if (!progressDoc.exists()) {
      // Создаем новый документ прогресса
      await setDoc(progressRef, {
        completedImages: completedImages,
        totalSessions: 1,
        createdAt: serverTimestamp(),
        lastSessionTimestamp: serverTimestamp()
      });
      console.log('Created new progress document for user:', userId);
    } else {
      // Обновляем существующий документ
      await updateDoc(progressRef, {
        completedImages: completedImages,
        totalSessions: progressDoc.data().totalSessions + 1,
        lastSessionTimestamp: serverTimestamp()
      });
      console.log('Updated existing progress document for user:', userId);
    }
  } catch (error) {
    console.error('Error updating participant progress:', error);
    throw error;
  }
}

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
    // Получаем все сессии пользователя
    const sessionsQuery = query(
      collection(db, 'sessions'),
      where('participantId', '==', participantId)
    );
    const sessionsSnapshot = await getDocs(sessionsQuery);
    const sessions = sessionsSnapshot.docs.map(doc => doc.data());

    // Считаем среднее время и общую точность
    const totalSessions = sessions.length;
    const totalAccuracy = sessions.reduce((sum, session) => sum + (session.correctTrials / session.totalTrials), 0);
    const averageTimeMs = sessions.reduce((sum, session) => sum + session.totalTimeMs, 0) / totalSessions;

    // Получаем прогресс участника для подсчета раундов
    const progress = await getParticipantProgress(participantId);
    const completedRounds = progress ? Math.floor((progress.completedImages || []).length / 4) : 0;

    // Рассчитываем рейтинг
    const rating = await calculateRating(
      totalTrials,
      correctTrials,
      averageTimeMs, // Используем среднее время вместо времени последней сессии
      completedRounds
    );

    // Обновляем запись в таблице лидеров
    const leaderboardRef = doc(db, 'leaderboard', nickname);
    await setDoc(leaderboardRef, {
      nickname,
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

    for (const doc of leaderboardSnapshot.docs) {
      const data = doc.data();
      const accuracy = (data.totalCorrect / data.totalTrials) * 100;
      const timeInMinutes = data.totalTime / (1000 * 60);

      let accuracyScore;
      if (accuracy < 80) {
        // Ниже 80% - экспоненциальное снижение
        accuracyScore = Math.pow(accuracy / 80, 4) * 30;
      } else if (accuracy < 95) {
        // От 80% до 95% - линейный рост
        accuracyScore = 30 + (accuracy - 80) * (35 / 15);
      } else {
        // Выше 95% - бонус за высокую точность
        accuracyScore = 65 + Math.min(20, Math.pow(1.3, accuracy - 95));
      }

      // Оптимальное время - 5 минут
      const optimalTime = 5;
      const timeScore = Math.max(0, 15 * (1 - Math.pow((timeInMinutes - optimalTime) / 8, 2)));
      const score = Math.round(accuracyScore + timeScore);

      await updateDoc(doc.ref, { score });
    }

    console.log('Leaderboard scores recalculated successfully.');
  } catch (error) {
    console.error('Error recalculating leaderboard scores:', error);
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

// Расчет рейтинга
export async function calculateRating(
  totalTrials: number,
  correctTrials: number,
  totalTimeMs: number,
  roundsCompleted: number
): Promise<RatingCalculation> {
  // Теоретическое минимальное время: 1.5 секунды на каждое слово
  const theoreticalMinTime = totalTrials * 1500;
  
  // Оценка времени (до 15 баллов)
  // Если время больше оптимального, уменьшаем баллы пропорционально превышению
  const timeRatio = theoreticalMinTime / totalTimeMs; // Чем медленнее, тем меньше отношение
  const timeScore = Math.round(15 * Math.min(timeRatio, 1)); // Не более 15 баллов
  
  // Множитель точности (процент правильных ответов)
  const accuracyMultiplier = correctTrials / totalTrials;
  
  // Бонус за раунды (+20% за каждый пройденный раунд)
  // Для первого раунда множитель равен 1
  const roundBonus = Math.max(1, 1 + roundsCompleted * 0.2);
  
  // Итоговый рейтинг
  const finalScore = Math.round(
    (timeScore + (accuracyMultiplier * 85)) * roundBonus
  );

  return {
    timeScore,
    accuracyMultiplier,
    roundBonus,
    finalScore,
    theoreticalMinTime,
    actualTime: totalTimeMs,
    accuracy: (correctTrials / totalTrials) * 100,
    roundsCompleted
  };
} 