import { auth, db } from './config';
import { signInAnonymously, signOut } from 'firebase/auth';
import { collection, addDoc, setDoc, doc, Timestamp, getDoc, updateDoc, getDocs, query, where, deleteDoc, writeBatch, serverTimestamp, runTransaction } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
// Импортируем типы из глобального файла
import { TrialResult, ParticipantProgress as ParticipantProgressType, LeaderboardEntry as LeaderboardEntryType, WordType, Trial, RatingCalculation } from '../types';

// Удаляем локальный интерфейс TrialResult
/*
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
*/

// Используем импортированный тип ParticipantProgressType
/*
interface ParticipantProgress {
  nickname: string;
  completedImages: string[];
  totalSessions: number;
  lastSessionTimestamp: Date;
}
*/

// Используем импортированный тип LeaderboardEntryType
// export interface LeaderboardEntry { ... }

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
// Используем ParticipantProgressType во внутреннем возвращаемом типе
export const getParticipantProgressByNickname = async (nickname: string, forceNewProgress = false): Promise<{ userId: string; progress: ParticipantProgressType } | null> => {
  try {
    console.log('Looking for progress by nickname:', nickname, 'forceNewProgress:', forceNewProgress);
    
    // If we want to force new progress, skip nickname lookup
    if (!forceNewProgress) {
      // Check for existing nickname
      const nicknameDoc = await getDoc(doc(db, 'nicknames', nickname));
      
      if (nicknameDoc.exists()) {
        // Found existing nickname mapping
        const userId = nicknameDoc.data().userId;
        console.log('Found existing user ID in nicknames:', userId);
        
        // Get progress by userId
        const progressDoc = await getDoc(doc(db, 'progress', userId));
        if (progressDoc.exists()) {
          const progress = progressDoc.data() as ParticipantProgressType;
          console.log('Loaded existing progress for nickname', nickname, 'with', progress.completedImages?.length || 0, 'completed images');
          
          // Проверим целостность данных
          if (!progress.completedImages) {
            console.warn('Warning: completedImages missing in progress for nickname', nickname);
            progress.completedImages = [];
          } else if (!Array.isArray(progress.completedImages)) {
            console.warn('Warning: completedImages is not an array for nickname', nickname, '- fixing it');
            progress.completedImages = [];
          }
          
          // Проверим и исправим userId, если отсутствует
          if (!progress.userId) {
            console.warn('Warning: userId missing in progress for nickname', nickname, '- adding it');
            progress.userId = userId;
          }
          
          return {
            userId,
            progress: {
              ...progress,
              userId: progress.userId || userId,
              completedImages: Array.isArray(progress.completedImages) ? progress.completedImages : []
            }
          };
        } else {
          console.warn('Found nickname mapping but no progress document for userId', userId);
        }
      } else {
        console.log('No nickname mapping found for', nickname);
      }
    }
    
    console.log('No existing progress found or forceNewProgress is true');
    return null;
  } catch (error) {
    console.error('Error getting participant progress by nickname:', error);
    throw error;
  }
};

// Получение прогресса участника
// Возвращаемый тип ParticipantProgressType
export const getParticipantProgress = async (participantId: string): Promise<ParticipantProgressType | null> => {
  try {
    console.log('Getting progress for participant:', participantId);
    const progressDoc = await getDoc(doc(db, 'progress', participantId));
    
    if (!progressDoc.exists()) {
      console.log('No progress found for participant');
      return null;
    }
    
    // Используем ParticipantProgressType
    const data = progressDoc.data() as ParticipantProgressType;
    console.log('Retrieved progress:', data);
    
    // Убедимся, что completedImages - это массив
    if (!Array.isArray(data.completedImages)) {
      console.log('completedImages is not an array, fixing:', data.completedImages);
      data.completedImages = [];
    }
    // Убедимся, что userId есть в данных
    if (!data.userId) {
        data.userId = participantId;
    }
    
    return data;
  } catch (error) {
    console.error('Error getting participant progress:', error);
    throw error;
  }
};

// Обновление прогресса участника (новая версия)
export const updateParticipantProgress = async (
  participantId: string,
  participantNickname: string,
  // Принимаем результаты испытаний для извлечения нужных данных
  trialsData: TrialResult[] 
): Promise<void> => {
  try {
    console.log(`[Progress Update] Updating progress for ${participantNickname} (${participantId}) after ${trialsData.length} trials.`);
    
    // --- Извлекаем нужные данные из trialsData --- 
    const completedImagesInSession = [...new Set(trialsData.map(t => t.imageFileName))]; // Уникальные картинки
    const imagesSeenWithRealWordInSession = [
      ...new Set(trialsData
        .filter(t => t.wordType === 'aesthetic')
        .map(t => t.imageFileName))
    ];
    const sessionImageCounts: { [key: string]: number } = {};
    trialsData.forEach(t => {
      sessionImageCounts[t.imageFileName] = (sessionImageCounts[t.imageFileName] || 0) + 1;
    });
    console.log(`[Progress Update] Data extracted: uniqueImages=${completedImagesInSession.length}, realWordImages=${imagesSeenWithRealWordInSession.length}, countsCreated=${Object.keys(sessionImageCounts).length > 0}`);
    // ----------------------------------------------

    const progressRef = doc(db, 'progress', participantId);
    const nicknameRef = doc(db, 'nicknames', participantNickname.toLowerCase());

    // Используем транзакцию для атомарности
    await runTransaction(db, async (transaction) => {
      const progressDoc = await transaction.get(progressRef);
      let currentProgress: ParticipantProgressType | null = null;
      if (progressDoc.exists()) {
        currentProgress = progressDoc.data() as ParticipantProgressType;
      }
      
      console.log('[Progress Update] Current progress from DB:', currentProgress);

      const existingCompletedImages = currentProgress?.completedImages || [];
      const existingImagesSeenWithRealWord = currentProgress?.imagesSeenWithRealWord || [];
      const currentTotalSessions = currentProgress?.totalSessions || 0;
      const currentImageCounts = currentProgress?.imageCounts || {}; // Загружаем текущие счетчики

      // --- Обновление списка ВСЕХ увиденных картинок ---
      const allCompletedImages = [...new Set([...existingCompletedImages, ...completedImagesInSession])];
      
      // --- Обновление списка картинок, ПОКАЗАННЫХ С РЕАЛЬНЫМ СЛОВОМ ---
      const allImagesSeenWithRealWord = [...new Set([...existingImagesSeenWithRealWord, ...imagesSeenWithRealWordInSession])];
      
      // --- ИСПРАВЛЕНИЕ ЛОГИКИ ПОДСЧЕТА РАУНДОВ/СЕССИЙ --- 
      const newTotalSessions = currentTotalSessions + 1;
      
      // --- Обновление счетчиков просмотров картинок (imageCounts) ---
      const updatedImageCounts = { ...currentImageCounts };
      Object.entries(sessionImageCounts).forEach(([fileName, count]) => {
        updatedImageCounts[fileName] = (updatedImageCounts[fileName] || 0) + count;
      });
      const changedCounts = Object.keys(sessionImageCounts).length;
      console.log(`[Progress Update] Image counts updated for ${changedCounts} images.`);

      // --- Подготовка данных для обновления --- 
      const updateData: Partial<ParticipantProgressType> = {
        nickname: participantNickname,
        userId: participantId,
        completedImages: allCompletedImages,
        totalSessions: newTotalSessions,
        lastSessionTimestamp: serverTimestamp(),
        imagesSeenWithRealWord: allImagesSeenWithRealWord,
        imageCounts: updatedImageCounts // Сохраняем обновленные счетчики
      };
      
      if (!currentProgress) {
        updateData.createdAt = serverTimestamp();
        transaction.set(progressRef, updateData);
        console.log('[Progress Update] New progress document created.');
      } else {
        transaction.update(progressRef, updateData);
        console.log('[Progress Update] Existing progress document updated.');
      }

      // Обновляем или создаем запись в nicknames
      transaction.set(nicknameRef, { userId: participantId }, { merge: true });
    });

    console.log(`[Progress Update] Progress update successful for ${participantNickname}.`);
  } catch (error) {
    console.error('[Progress Update] Error updating participant progress:', error);
    throw error; // Пробрасываем ошибку дальше
  }
};

// Сохранение результата одного предъявления
// Оптимизированная версия для минимизации задержек во время измерения
export async function saveTrialResult(result: TrialResult, participantId: string) {
  try {
    // Убираем логирование, чтобы не замедлять операцию
    // Оптимизируем данные для сохранения, исключая ненужные поля
    const dataToSave = {
      participantId: participantId,
      participantNickname: result.participantNickname,
      imageFileName: result.imageFileName,
      word: result.word,
      wordType: result.wordType,
      isCorrect: result.isCorrect,
      reactionTimeMs: result.reactionTimeMs,
      timestamp: serverTimestamp() // Используем серверное время
    };

    // Асинхронно добавляем документ без ожидания результата
    const docRef = await addDoc(collection(db, 'trials'), dataToSave);
    return docRef.id;
  } catch (error) {
    // Только базовый лог ошибки для диагностики
    console.error('Error saving trial result:', error);
    throw error; 
  }
}

// Сохранение результатов сессии
// Используем serverTimestamp()
export const saveSessionResults = async (
  participantId: string,
  totalTrials: number,
  correctTrials: number,
  totalTimeMs: number,
  nickname: string,
  deviceType: 'mobile' | 'desktop' = 'desktop' // Add device type with default value
) => {
  try {
    const sessionData = {
      participantId,
      nickname,
      totalTrials,
      correctTrials,
      accuracy: (correctTrials / totalTrials) * 100,
      totalTimeMs,
      deviceType, // Add device type to the session data
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

// Обновленная функция updateLeaderboard с расчетом сбалансированной точности
export const updateLeaderboard = async (
  nickname: string, 
  participantId: string, 
  correctTrials: number, // Correct trials for the *current* session
  totalTrials: number,   // Total trials for the *current* session
  totalTimeMs: number,   // Total time for the *current* session
  deviceType: 'mobile' | 'desktop'
): Promise<RatingCalculation> => {
  console.log(`[Leaderboard Update] Starting for ${nickname} (${participantId})`);
  try {
    // 1. Получаем ВСЕ сессии пользователя, чтобы посчитать средние значения
    const sessionsQuery = query(
      collection(db, 'sessions'),
      where('participantId', '==', participantId) // Используем ID для надежности
    );
    const sessionsSnapshot = await getDocs(sessionsQuery);
    const sessionsData = sessionsSnapshot.docs.map(doc => doc.data());
    console.log(`[Leaderboard Update] Found ${sessionsData.length} previous sessions.`);

    if (sessionsData.length === 0) {
      console.warn(`[Leaderboard Update] No sessions found for ${nickname}, cannot calculate average score.`);
      // Возвращаем фиктивный рейтинг или бросаем ошибку?
      // Пока вернем рейтинг текущей сессии, т.к. среднее посчитать не можем
       const tempRating = await calculateRating(totalTrials, correctTrials, totalTimeMs, 1); // Считаем для 1 раунда
       console.log(`[Leaderboard Update] Returning rating for current session only:`, tempRating);
       // Записываем хотя бы результат текущей сессии
        const leaderboardRefOnError = doc(db, 'leaderboard', nickname);
        await setDoc(leaderboardRefOnError, {
          nickname, participantId, score: tempRating.finalScore, accuracy: tempRating.accuracy,
          totalTimeMs: totalTimeMs, roundsCompleted: 1, deviceType: deviceType, 
          ratingDetails: tempRating, lastUpdated: serverTimestamp()
        }, { merge: true });
       return tempRating; 
    }

    // 2. Считаем СУММАРНЫЕ и СРЕДНИЕ значения по ВСЕМ сессиям
    const totalSessions = sessionsData.length;
    const totalCorrectTrialsAllSessions = sessionsData.reduce((sum, session) => sum + (session.correctTrials || 0), 0);
    const totalTrialsAllSessions = sessionsData.reduce((sum, session) => sum + (session.totalTrials || 0), 0);
    const totalTimeMsAllSessions = sessionsData.reduce((sum, session) => sum + (session.totalTimeMs || 0), 0);
    const averageTimeMs = totalTimeMsAllSessions / totalSessions;
    console.log(`[Leaderboard Update] Totals across ${totalSessions} sessions: Trials=${totalTrialsAllSessions}, Correct=${totalCorrectTrialsAllSessions}, Time=${totalTimeMsAllSessions}ms, AvgTime=${averageTimeMs.toFixed(0)}ms`);

    // 3. Получаем ПРОГРЕСС участника для определения количества раундов
    const existingProgress = await getParticipantProgress(participantId);
    const completedRounds = Math.max(1, existingProgress?.totalSessions || 0);
    console.log(`[Leaderboard Update] Rounds completed from progress: ${completedRounds}`);
    
    // --- Получаем детальную статистику по словам для calculateRating --- 
    let realWordTrials = 0;
    let correctRealWordTrials = 0;
    let nonWordTrials = 0;
    let correctNonWordTrials = 0;
    sessionsData.forEach(session => {
      realWordTrials += session.realWordTrials || 0;
      correctRealWordTrials += session.correctRealWordTrials || 0;
      nonWordTrials += session.nonWordTrials || 0;
      correctNonWordTrials += session.correctNonWordTrials || 0;
    });
     console.log(`[Leaderboard Update] Word type stats: Real=${correctRealWordTrials}/${realWordTrials}, NonWord=${correctNonWordTrials}/${nonWordTrials}`);
    // -----------------------------------------------------------------

    // 4. Рассчитываем СРЕДНИЙ рейтинг по ВСЕМ сессиям
    console.log(`[Leaderboard Update] Calculating AVERAGE rating with: totalTrials=${totalTrialsAllSessions}, correctTrials=${totalCorrectTrialsAllSessions}, avgTimeMs=${averageTimeMs}, rounds=${completedRounds}`);
    const averageRating = await calculateRating(
      totalTrialsAllSessions,
      totalCorrectTrialsAllSessions,
      averageTimeMs, // Передаем СРЕДНЕЕ время
      completedRounds,
      realWordTrials, // Передаем статистику по типам слов
      correctRealWordTrials,
      nonWordTrials,
      correctNonWordTrials
    );
    console.log(`[Leaderboard Update] Calculated AVERAGE rating:`, averageRating);

    // 5. Определяем последний тип устройства
    const latestDeviceType = deviceType;
    console.log(`[Leaderboard Update] Using device type: ${latestDeviceType}`);

    // 6. Обновляем запись в таблице лидеров СРЕДНИМ рейтингом
    const leaderboardRef = doc(db, 'leaderboard', nickname);
    const leaderboardData = {
      nickname,
      participantId,
      accuracy: averageRating.accuracy, // Средняя точность (в %)
      totalTimeMs: averageTimeMs, // Среднее время на сессию
      score: averageRating.finalScore, // Средний итоговый балл
      roundsCompleted: completedRounds, 
      deviceType: latestDeviceType,
      ratingDetails: averageRating, // Сохраняем весь объект среднего рейтинга
      lastUpdated: serverTimestamp(),
      // Сохраняем общую статистику по испытаниям (может быть полезно)
      totalTrials: totalTrialsAllSessions, 
      correctTrials: totalCorrectTrialsAllSessions,
      trialStats: { // Детализация по типам слов (суммарная)
        realWordTrials,
        correctRealWordTrials,
        nonWordTrials,
        correctNonWordTrials
      }
    };
    console.log('[Leaderboard Update] Data to save:', leaderboardData);
    await setDoc(leaderboardRef, leaderboardData, { merge: true });
    console.log(`[Leaderboard Update] Leaderboard document for ${nickname} updated successfully.`);

    // Возвращаем РЕЙТИНГ ТЕКУЩЕЙ СЕССИИ (для отображения на CompletionScreen)
    console.log(`[Leaderboard Update] Calculating rating for CURRENT session: trials=${totalTrials}, correct=${correctTrials}, time=${totalTimeMs}, rounds=${completedRounds}`);
    const currentSessionRating = await calculateRating(
        totalTrials, correctTrials, totalTimeMs, completedRounds
        // Тут мы не передаем детальную статистику по словам, т.к. она относится ко ВСЕМ сессиям
        // calculateRating сможет обработать это и посчитать общую точность
    );
    console.log(`[Leaderboard Update] Calculated CURRENT session rating:`, currentSessionRating);

    return currentSessionRating;
  } catch (error) {
    console.error('[Leaderboard Update] Error:', error);
    throw error;
  }
};

// Функция для получения данных лидерборда
export const getLeaderboard = async (): Promise<LeaderboardEntryType[]> => {
  try {
    const leaderboardSnapshot = await getDocs(collection(db, 'leaderboard'));
    const entries: LeaderboardEntryType[] = [];
    
    leaderboardSnapshot.forEach(doc => {
      const data = doc.data();
      // Собираем объект LeaderboardEntryType, беря данные из сохраненного документа
      const entry: LeaderboardEntryType = {
        nickname: data.nickname,
        totalTimeMs: data.totalTimeMs, // Среднее время
        score: data.score, // Средний балл
        roundsCompleted: data.roundsCompleted, // Общее кол-во раундов
        ratingDetails: data.ratingDetails, // Весь объект деталей рейтинга
        deviceType: data.deviceType || 'desktop'
        // totalTrials и correctTrials больше не читаем
      };
      
      // Проверка на наличие необходимых полей (для отладки)
      if (entry.nickname && typeof entry.score === 'number') {
         entries.push(entry);
      } else {
         console.warn("Skipping invalid leaderboard entry:", data);
      }
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
      console.log('Recalculating for nickname', data.nickname, 'completed images:', completedImages.length);
      
      // НОВАЯ ЛОГИКА: раунд = количество сессий
      const sessionsCount = existingProgress?.progress.totalSessions || 1;
      const completedRounds = Math.max(1, sessionsCount);
      console.log('Recalculated completedRounds based on sessions:', completedRounds);

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

// Обновленная функция расчета рейтинга с компенсацией дисбаланса слов/не-слов
export const calculateRating = async (
  totalTrials: number,
  correctTrials: number,
  totalTimeMs: number,
  roundsCompleted: number,
  // Добавляем новые параметры для детального учета точности
  realWordTrials: number = 0,
  correctRealWordTrials: number = 0,
  nonWordTrials: number = 0,
  correctNonWordTrials: number = 0
): Promise<RatingCalculation> => {
  console.log('Входные данные calculateRating:', { 
    totalTrials, 
    correctTrials, 
    totalTimeMs, 
    roundsCompleted,
    realWordTrials,
    correctRealWordTrials,
    nonWordTrials,
    correctNonWordTrials
  });

  if (totalTrials <= 0) {
    console.log('Нет испытаний, возвращаем нулевой рейтинг');
    return {
      rating: 0, timeScore: 0, accuracyMultiplier: 0, accuracy: 0, actualTime: 0, 
      theoreticalMinTime: 0, roundsCompleted: 1, bonusPercentage: 100, 
      roundBonus: 1.0, finalScore: 0
    };
  }

  // 1. Расчет точности
  const accuracy = correctTrials / totalTrials;
  const accuracyMultiplier = accuracy * accuracy; // Квадратичное влияние

  // 2. Расчет времени
  const averageTimePerWord = totalTimeMs / totalTrials;
  const theoreticalMinTimePerWord = 1500; // 1.5 секунды
  const theoreticalMinTime = theoreticalMinTimePerWord * totalTrials;
  let timeScore = 0;
  if (averageTimePerWord <= theoreticalMinTimePerWord) {
    timeScore = 15; // Макс баллы, если время <= оптимального
  } else {
    // Шкала убывания от 15 до 0 баллов при увеличении времени от 1.5с до 4с
    const maxTimeThreshold = 4000; 
    if (averageTimePerWord < maxTimeThreshold) {
      const timeDiff = averageTimePerWord - theoreticalMinTimePerWord;
      const maxDiff = maxTimeThreshold - theoreticalMinTimePerWord;
      timeScore = 15 * (1 - timeDiff / maxDiff);
    }
    // Если время >= 4с, timeScore остается 0
  }
  timeScore = Math.max(0, Math.round(timeScore)); // Округляем и ограничиваем снизу

  // 3. Расчет базового рейтинга (до бонуса)
  const baseRatingScore = Math.round((accuracyMultiplier * 85) + timeScore);

  // 4. Расчет бонуса
  const baseBonusPercent = 100;
  const additionalBonusPercent = Math.min(roundsCompleted * 5, 25 * 5);
  const finalBonusPercentage = baseBonusPercent + additionalBonusPercent;
  const finalRoundBonusMultiplier = finalBonusPercentage / 100;

  // 5. Расчет финального счета
  const finalScoreWithBonus = Math.round(baseRatingScore * finalRoundBonusMultiplier);

  console.log(`Rating Calc: Accuracy=${(accuracy * 100).toFixed(1)}%, TimeScore=${timeScore}, BaseScore=${baseRatingScore}`);
  console.log(`Bonus Calc: Rounds=${roundsCompleted}, Bonus%=${finalBonusPercentage}, Multiplier=${finalRoundBonusMultiplier.toFixed(2)}`);
  console.log(`Final Score: ${finalScoreWithBonus}`);

  // 6. Возвращаем все рассчитанные значения
  return {
    rating: baseRatingScore, 
    timeScore: timeScore,
    accuracyMultiplier: accuracyMultiplier,
    accuracy: accuracy * 100, 
    actualTime: totalTimeMs, // Общее время сессии
    theoreticalMinTime: theoreticalMinTime, // Теоретическое общее время
    roundsCompleted: roundsCompleted,
    bonusPercentage: finalBonusPercentage,
    roundBonus: finalRoundBonusMultiplier,
    finalScore: finalScoreWithBonus
  };
}

// Добавляем функцию для получения истории испытаний пользователя
export const getPreviousTrials = async (participantId: string) => {
  try {
    console.log('Getting previous trials for participant:', participantId);
    
    // Запрашиваем все испытания пользователя
    const trialsQuery = query(
      collection(db, 'trials'),
      where('participantId', '==', participantId)
    );
    
    const trialsSnapshot = await getDocs(trialsQuery);
    
    // Преобразуем документы в массив объектов, включая isCorrect
    const trials = trialsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        imageFileName: data.imageFileName,
        word: data.word,
        wordType: data.wordType,
        isCorrect: data.isCorrect // Include the isCorrect field
      };
    });
    
    console.log(`Retrieved ${trials.length} previous trials for participant ${participantId}`);
    return trials;
  } catch (error) {
    console.error('Error getting previous trials:', error);
    return []; // В случае ошибки возвращаем пустой массив
  }
}; 