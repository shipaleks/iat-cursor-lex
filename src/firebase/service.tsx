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

    // Обновляем глобальную статистику изображений
    await updateGlobalImageStats(completedImagesInSession);

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
  // --- Лог №1: Начало функции ---
  console.log(`[LB Update START] Nick: ${nickname}, PID: ${participantId}, Trials: ${correctTrials}/${totalTrials}, Time: ${totalTimeMs}, Device: ${deviceType}`);

  const safeNickname = nickname.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase();
  if (safeNickname !== nickname) {
    console.log(`[LB Update] Normalized nickname to safe ID '${safeNickname}'`);
  }

  try {
    // --- Лог №2: Перед получением прогресса ---
    console.log(`[LB Update] Getting participant progress for PID: ${participantId}`);
    const existingProgress = await getParticipantProgress(participantId);
    // --- Лог №3: После получения прогресса ---
    console.log(`[LB Update] Got progress. Total sessions from progress: ${existingProgress?.totalSessions}`);
    const currentRounds = Math.max(1, existingProgress?.totalSessions || 0);

    // --- Лог №4: Перед запросом сессий ---
    console.log(`[LB Update] Querying sessions for PID: ${participantId}`);
    const sessionsQuery = query(
      collection(db, 'sessions'),
      where('participantId', '==', participantId)
    );
    const sessionsSnapshot = await getDocs(sessionsQuery);
    const sessionsData = sessionsSnapshot.docs.map(doc => doc.data());
    // --- Лог №5: После запроса сессий ---
    console.log(`[LB Update] Found ${sessionsData.length} sessions.`);

    const completedRounds = Math.max(
      currentRounds,
      sessionsData.length + 1
    );
    console.log(`[LB Update] Calculated completed rounds: ${completedRounds}`);

    // --- Лог №6: Перед проверкой существующей записи ЛБ ---
    console.log(`[LB Update] Checking existing LB entry for ID: ${safeNickname}`);
    const existingLeaderboardDoc = await getDoc(doc(db, 'leaderboard', safeNickname));
    console.log(`[LB Update] Existing LB entry exists: ${existingLeaderboardDoc.exists()}`);

    // Расчет рейтинга (перенесен внутрь блоков if/else, где он нужен)
    let currentSessionRating: RatingCalculation;
    let averageRating: RatingCalculation;

    if (sessionsData.length === 0) {
      // --- Лог №7a: Расчет для первой сессии ---
      console.log(`[LB Update] Calculating rating for FIRST session.`);
      currentSessionRating = await calculateRating(totalTrials, correctTrials, totalTimeMs, completedRounds);
      console.log(`[LB Update] First session rating calculated.`);

      const leaderboardRef = doc(db, 'leaderboard', safeNickname);
      const leaderboardEntry = {
        nickname,
        participantId,
        score: currentSessionRating.finalScore,
        accuracy: currentSessionRating.accuracy,
        totalTimeMs: totalTimeMs,
        roundsCompleted: completedRounds,
        deviceType: deviceType,
        ratingDetails: currentSessionRating,
        lastUpdated: serverTimestamp(),
        totalTrials: totalTrials,
        correctTrials: correctTrials
      };
      if (!participantId) {
        console.error(`[LB Update] !!! CRITICAL: Attempting to write initial entry for ${safeNickname} WITHOUT participantId!`, leaderboardEntry);
      }
      console.log(`[LB Update] Attempting FIRST session setDoc for ${safeNickname}`, leaderboardEntry);
      try {
        await setDoc(leaderboardRef, leaderboardEntry);
        console.log(`[LB Update] Successfully setDoc FIRST session for ${safeNickname}`);

        const verifyDoc = await getDoc(leaderboardRef);
        if (verifyDoc.exists()) {
          console.log(`[LB Update] Verification successful, entry created with data:`, verifyDoc.data());
        } else {
          console.error(`[LB Update] Verification failed! setDoc succeeded but entry not found for ${safeNickname}`);
        }
      } catch (error) {
        console.error(`[LB Update] !!! CRITICAL ERROR setting initial leaderboard entry for ${safeNickname}:`, error);
        console.error(`[LB Update] Data that failed to write:`, leaderboardEntry);
      }
      return currentSessionRating;
    }

    // 4. Считаем СУММАРНЫЕ и СРЕДНИЕ значения по ВСЕМ сессиям
    const totalSessions = sessionsData.length;
    const totalCorrectTrialsAllSessions = sessionsData.reduce((sum, session) => sum + (session.correctTrials || 0), 0);
    const totalTrialsAllSessions = sessionsData.reduce((sum, session) => sum + (session.totalTrials || 0), 0);
    const totalTimeMsAllSessions = sessionsData.reduce((sum, session) => sum + (session.totalTimeMs || 0), 0);
    const averageTimeMs = totalTimeMsAllSessions / totalSessions;
    console.log(`[LB Update] Totals across ${totalSessions} sessions: Trials=${totalTrialsAllSessions}, Correct=${totalCorrectTrialsAllSessions}, Time=${totalTimeMsAllSessions}ms, AvgTime=${averageTimeMs.toFixed(0)}ms`);

    // 5. Получаем детальную статистику по словам для calculateRating
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
    console.log(`[LB Update] Word type stats: Real=${correctRealWordTrials}/${realWordTrials}, NonWord=${correctNonWordTrials}/${nonWordTrials}`);

    // 6. Рассчитываем СРЕДНИЙ рейтинг по ВСЕМ сессиям
    console.log(`[LB Update] Calculating AVERAGE rating with: totalTrials=${totalTrialsAllSessions}, correctTrials=${totalCorrectTrialsAllSessions}, avgTimeMs=${averageTimeMs}, rounds=${completedRounds}`);
    averageRating = await calculateRating(
      totalTrialsAllSessions,
      totalCorrectTrialsAllSessions,
      averageTimeMs, // Передаем СРЕДНЕЕ время
      completedRounds,
      realWordTrials, // Передаем статистику по типам слов
      correctRealWordTrials,
      nonWordTrials,
      correctNonWordTrials
    );
    console.log(`[LB Update] Calculated AVERAGE rating:`, averageRating);

    // 7. Определяем последний тип устройства
    const latestDeviceType = deviceType;
    console.log(`[LB Update] Using device type: ${latestDeviceType}`);

    // 8. Обновляем запись в таблице лидеров СРЕДНИМ рейтингом
    const leaderboardRef = doc(db, 'leaderboard', safeNickname);
    const leaderboardData = {
      nickname, // Сохраняем оригинальный никнейм для отображения
      participantId,
      accuracy: averageRating.accuracy, // Средняя точность (в %)
      totalTimeMs: averageTimeMs, // Среднее время на сессию
      score: averageRating.finalScore, // Средний итоговый балл
      roundsCompleted: completedRounds, // Используем точное количество раундов
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
    // Дополнительная проверка перед записью
    if (!participantId) {
        console.error(`[LB Update] !!! CRITICAL: Attempting to write average entry for ${safeNickname} WITHOUT participantId!`, leaderboardData);
    }
    console.log('[LB Update] Data to save:', leaderboardData);
    console.log(`[LB Update] Attempting AVERAGE setDoc for ${safeNickname}`, leaderboardData); // Лог перед записью
    try {
      // Используем setDoc вместо updateDoc для гарантированного создания или обновления
      await setDoc(leaderboardRef, leaderboardData);
      console.log(`[LB Update] Successfully setDoc AVERAGE for ${safeNickname}`);

      // Проверяем, что запись действительно обновилась
      const verifyDoc = await getDoc(leaderboardRef);
      if (verifyDoc.exists()) {
        console.log(`[LB Update] Verification successful, entry updated with data:`, verifyDoc.data());
      } else {
        // Эта ситуация очень маловероятна после успешного setDoc, но добавим лог
        console.error(`[LB Update] Verification failed! setDoc succeeded but entry not found after update for ${safeNickname}`);
      }
    } catch (error) {
      console.error(`[LB Update] !!! CRITICAL ERROR setting average leaderboard entry for ${safeNickname}:`, error);
      // Дополнительно логируем данные, которые пытались записать
      console.error(`[LB Update] Data that failed to write:`, leaderboardData);
    }

    // 9. Возвращаем РЕЙТИНГ ТЕКУЩЕЙ СЕССИИ (для отображения на CompletionScreen)
    console.log(`[LB Update] Calculating rating for CURRENT session: trials=${totalTrials}, correct=${correctTrials}, time=${totalTimeMs}, rounds=${completedRounds}`);
    currentSessionRating = await calculateRating(
        totalTrials, correctTrials, totalTimeMs, completedRounds
        // Тут мы не передаем детальную статистику по словам, т.к. она относится ко ВСЕМ сессиям
        // calculateRating сможет обработать это и посчитать общую точность
    );
    console.log(`[LB Update] Calculated CURRENT session rating:`, currentSessionRating);

    return currentSessionRating;
  } catch (error) {
    console.error(`[LB Update ERROR] Error in main try block for ${safeNickname}:`, error);
    // Попытка записать отладочную запись
    try {
        // --- Лог №11: Перед расчетом отладочного рейтинга ---
        console.log(`[LB Update ERROR] Calculating fallback debug rating.`);
        const debugRating = await calculateRating(totalTrials, correctTrials, totalTimeMs, 1);
        console.log(`[LB Update ERROR] Fallback debug rating calculated.`);
        const debugEntry = {
          nickname,
          participantId,
          score: debugRating.finalScore,
          accuracy: debugRating.accuracy,
          totalTimeMs: totalTimeMs,
          roundsCompleted: 1,
          deviceType: deviceType,
          ratingDetails: debugRating,
          isErrorEntry: true,
          lastUpdated: serverTimestamp()
        };
        const debugNickname = `debug-${safeNickname}`;
        const debugRef = doc(db, 'leaderboard', debugNickname);
        // --- Лог №12: Перед записью отладочной записи ---
        console.log(`[LB Update ERROR] Attempting to setDoc for fallback debug entry: ${debugNickname}`, debugEntry);
        try {
            await setDoc(debugRef, debugEntry);
            console.log('[LB Update ERROR] Successfully setDoc for fallback debug entry');
        } catch (debugError) {
            console.error(`[LB Update ERROR] !!! CRITICAL ERROR setting fallback debug entry for ${debugNickname}:`, debugError);
            console.error(`[LB Update ERROR] Debug data that failed to write:`, debugEntry);
        }
        return debugRating;
    } catch (fallbackError) {
        console.error('[LB Update FATAL] Error creating fallback debug rating calculation:', fallbackError);
        throw error; // Перебрасываем оригинальную ошибку основного блока
    }
  }
};

// Функция для получения данных лидерборда
export const getLeaderboard = async (): Promise<LeaderboardEntryType[]> => {
  try {
    console.log('[Leaderboard] Starting getLeaderboard query...');
    const leaderboardSnapshot = await getDocs(collection(db, 'leaderboard'));
    console.log(`[Leaderboard] Received ${leaderboardSnapshot.size} documents from Firestore`);
    
    // Если коллекция пуста, создаем одну тестовую запись для диагностики
    if (leaderboardSnapshot.empty) {
      console.warn('[Leaderboard] Collection is empty, adding diagnostic entry');
      const entries: LeaderboardEntryType[] = [{
        nickname: '_debug_entry_',
        totalTimeMs: 60000,
        score: 100,
        roundsCompleted: 1,
        deviceType: 'desktop',
        ratingDetails: {
          rating: 70,
          timeScore: 10,
          accuracyMultiplier: 0.7,
          accuracy: 80,
          actualTime: 60000,
          theoreticalMinTime: 40000,
          roundsCompleted: 1,
          bonusPercentage: 100,
          roundBonus: 1.0,
          finalScore: 70
        }
      }];
      
      // Пробуем сохранить диагностическую запись
      try {
        await setDoc(doc(db, 'leaderboard', '_debug_entry_'), entries[0]);
        console.log('[Leaderboard] Diagnostic entry added successfully');
        return entries;
      } catch (e) {
        console.error('[Leaderboard] Failed to add diagnostic entry:', e);
      }
    }
    
    const entries: LeaderboardEntryType[] = [];
    
    leaderboardSnapshot.forEach(doc => {
      console.log(`[Leaderboard] Processing document with ID: ${doc.id}`);
      const data = doc.data();
      console.log('[Leaderboard] Document data:', data);

      // Пропускаем диагностические записи и записи отладки
      if (doc.id === '_debug_entry_' || doc.id.startsWith('debug-') || data.isErrorEntry) {
        console.log(`[Leaderboard] Skipping diagnostic/debug entry: ${doc.id}`);
        return; // Пропускаем эту итерацию
      }

      // Базовая проверка необходимых полей
      if (!data || typeof data.nickname !== 'string' || typeof data.score !== 'number') {
        console.warn(`[Leaderboard] Skipping invalid entry (missing/wrong type nickname or score): ID=${doc.id}`, data);
        return;
      }
      
      // Собираем объект LeaderboardEntryType, беря данные из сохраненного документа
      const entry: LeaderboardEntryType = {
        nickname: data.nickname,
        totalTimeMs: data.totalTimeMs || 0, // Добавим fallback
        score: data.score,
        roundsCompleted: data.roundsCompleted || 0, // Добавим fallback
        ratingDetails: data.ratingDetails, // Может быть null/undefined, это нормально
        deviceType: data.deviceType || 'desktop' // Добавим fallback
      };
      
      // Логируем успешно добавленную запись
      console.log(`[Leaderboard] Entry added for ${entry.nickname} with score ${entry.score}`);
      entries.push(entry);
    });
    
    // Дополнительная проверка на пустой массив
    if (entries.length === 0) {
      // Проверяем, есть ли в коллекции хоть какие-то документы (кроме диагностических)
      const realEntriesExist = leaderboardSnapshot.docs.some(doc => 
        doc.id !== '_debug_entry_' && !doc.id.startsWith('debug-') && !doc.data().isErrorEntry
      );
      
      if (realEntriesExist) {
        console.warn('[Leaderboard] Real entries exist but failed to parse them');
      }
      
      console.warn('[Leaderboard] No valid entries found after processing, adding fallback entry');
      // Добавляем заглушку, чтобы пользователь видел, что лидерборд работает
      entries.push({
        nickname: 'Пока нет данных',
        totalTimeMs: 0,
        score: 0,
        roundsCompleted: 0,
        deviceType: 'desktop'
      });
    }
    
    // Сортируем по убыванию счета
    const sortedEntries = entries.sort((a, b) => b.score - a.score);
    console.log(`[Leaderboard] Returning ${sortedEntries.length} sorted entries`);
    return sortedEntries;
  } catch (error) {
    console.error('[Leaderboard] Error getting leaderboard:', error);
    
    // В случае ошибки возвращаем заглушку
    console.warn('[Leaderboard] Returning fallback entry due to error');
    return [{
      nickname: 'Ошибка загрузки',
      totalTimeMs: 0,
      score: 0,
      roundsCompleted: 0,
      deviceType: 'desktop'
    }];
  }
};

// Функция для пересчета рейтинга всех участников
export const recalculateLeaderboardScores = async () => {
  console.log('[Recalculate] Starting recalculation process...');
  try {
    const leaderboardSnapshot = await getDocs(collection(db, 'leaderboard'));
    console.log(`[Recalculate] Found ${leaderboardSnapshot.size} total entries in leaderboard.`);

    let processedCount = 0;
    for (const leaderboardDoc of leaderboardSnapshot.docs) {
      const leaderboardData = leaderboardDoc.data();
      const docId = leaderboardDoc.id; // ID документа = safeNickname
      const originalNickname = leaderboardData.nickname; // Отображаемый никнейм
      const participantId = leaderboardData.participantId; // ID пользователя

      console.log(`[Recalculate] Processing entry ID: ${docId} (Nickname: ${originalNickname}, PID: ${participantId})`);

      // Пропускаем диагностические/отладочные записи
      if (docId === '_debug_entry_' || docId.startsWith('debug-') || leaderboardData.isErrorEntry) {
        console.log(`[Recalculate] Skipping diagnostic/debug entry: ${docId}`);
        continue;
      }

      // Проверяем, есть ли participantId (важно для запроса сессий)
      if (!participantId) {
        console.warn(`[Recalculate] Skipping entry ID ${docId} (Nickname: ${originalNickname}) because participantId is missing.`);
        continue;
      }

      // Получаем сессии пользователя по participantId (надежнее, чем по никнейму)
      console.log(`[Recalculate] Querying sessions for participantId: ${participantId}`);
      const sessionsQuery = query(
        collection(db, 'sessions'),
        where('participantId', '==', participantId)
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessions = sessionsSnapshot.docs.map(doc => doc.data());
      console.log(`[Recalculate] Found ${sessions.length} sessions for participantId: ${participantId}`);

      if (sessions.length === 0) {
        console.warn(`[Recalculate] No sessions found for participantId ${participantId} (Nickname: ${originalNickname}), skipping recalculation for this entry.`);
        // Возможно, стоит удалить эту запись из лидерборда, если сессий нет?
        // await deleteDoc(leaderboardDoc.ref);
        // console.log(`[Recalculate] Deleted leaderboard entry ${docId} due to no sessions.`);
        continue;
      }

      // Считаем общую статистику по всем сессиям
      const totalSessions = sessions.length;
      const totalTrials = sessions.reduce((sum, session) => sum + (session.totalTrials || 0), 0);
      const correctTrials = sessions.reduce((sum, session) => sum + (session.correctTrials || 0), 0);
      const totalTimeMs = sessions.reduce((sum, session) => sum + (session.totalTimeMs || 0), 0);
      const averageTimeMs = totalTimeMs / totalSessions;
      const lastDeviceType = sessions[sessions.length - 1]?.deviceType || 'desktop'; // Берем тип устройства из последней сессии

      // Получаем прогресс участника для подсчета раундов (по participantId)
      const existingProgress = await getParticipantProgress(participantId);
      const completedRounds = Math.max(1, existingProgress?.totalSessions || sessions.length);
      console.log(`[Recalculate] Calculated rounds for PID ${participantId}: ${completedRounds} (based on ${existingProgress?.totalSessions} from progress or ${sessions.length} sessions)`);

      // Рассчитываем рейтинг
      console.log(`[Recalculate] Calculating rating for PID ${participantId} with: Trials=${totalTrials}, Correct=${correctTrials}, AvgTime=${averageTimeMs}, Rounds=${completedRounds}`);
      const rating = await calculateRating(
        totalTrials,
        correctTrials,
        averageTimeMs,
        completedRounds
        // Можно добавить статистику по словам, если она есть в сессиях
      );
      console.log(`[Recalculate] Calculated rating for PID ${participantId}:`, rating);

      // Обновляем запись в лидерборде
      if (!isNaN(rating.finalScore)) {
        const updateData = {
          score: rating.finalScore,
          accuracy: rating.accuracy,
          totalTimeMs: averageTimeMs,
          ratingDetails: rating,
          roundsCompleted: completedRounds,
          lastUpdated: serverTimestamp(),
          deviceType: lastDeviceType, // Обновляем тип устройства
          participantId: participantId, // Убедимся, что ID есть
          nickname: originalNickname // Сохраняем оригинальный никнейм
        };
        console.log(`[Recalculate] Attempting to updateDoc for entry ID: ${docId}`, updateData);
        try {
          await updateDoc(leaderboardDoc.ref, updateData);
          console.log(`[Recalculate] Successfully updated score for entry ID ${docId} (Nickname: ${originalNickname}) to ${rating.finalScore}`);
          processedCount++;
        } catch (updateError) {
          console.error(`[Recalculate] !!! FAILED to update entry ID ${docId} (Nickname: ${originalNickname}):`, updateError);
          console.error(`[Recalculate] Data that failed update:`, updateData);
        }
      } else {
        console.warn(`[Recalculate] Invalid rating calculated for entry ID ${docId} (Nickname: ${originalNickname}), skipping update.`);
      }
    }

    console.log(`[Recalculate] Leaderboard scores recalculation finished. Processed ${processedCount} valid entries.`);
  } catch (error) {
    console.error('[Recalculate] Error during recalculation process:', error);
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
  console.log('[Rating] Входные данные calculateRating:', { 
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
    console.log('[Rating] Нет испытаний, возвращаем нулевой рейтинг');
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
  // Обновленные параметры времени на основе реальных данных
  const minTotalTimeMs = 80000; // 80 секунд минимальное время на весь эксперимент
  const theoreticalMinTimePerWord = minTotalTimeMs / 50; // Примерно 1600 мс на слово (при 50 словах)
  const theoreticalMinTime = minTotalTimeMs;
  
  let timeScore = 0;
  // Оптимальное время - 80 секунд, максимум баллов
  if (totalTimeMs <= minTotalTimeMs) {
    timeScore = 15; // Макс баллы, если время <= оптимального
  } else {
    // Шкала убывания от 15 до 0 баллов при увеличении времени
    const maxTimeThreshold = 180000; // 180 секунд (3 минуты) - порог для 0 баллов
    if (totalTimeMs < maxTimeThreshold) {
      const timeDiff = totalTimeMs - minTotalTimeMs;
      const maxDiff = maxTimeThreshold - minTotalTimeMs;
      timeScore = 15 * (1 - timeDiff / maxDiff);
    }
    // Если время >= maxTimeThreshold, timeScore остается 0
  }
  timeScore = Math.max(0, Math.round(timeScore)); // Округляем и ограничиваем снизу

  // 3. Расчет базового рейтинга (до бонуса)
  const baseRatingScore = Math.round((accuracyMultiplier * 85) + timeScore);

  // 4. Расчет бонуса (исправлено)
  // Гарантируем, что roundsCompleted >= 1
  const actualRoundsCompleted = Math.max(1, roundsCompleted || 1);
  
  // Бонус: 0% за первый раунд, +5% за каждый следующий раунд
  // Первый раунд (actualRoundsCompleted == 1) => additionalBonusPercent = 0
  // Второй раунд (actualRoundsCompleted == 2) => additionalBonusPercent = 5
  // и т.д.
  const additionalBonusPercent = (actualRoundsCompleted - 1) * 5;
  
  // Ограничиваем максимальный бонус (до 25 раундов)
  const cappedBonusPercent = Math.min(additionalBonusPercent, 25 * 5);
  
  // Базовый процент всегда 100%
  const baseBonusPercent = 100;
  const finalBonusPercentage = baseBonusPercent + cappedBonusPercent;
  const finalRoundBonusMultiplier = finalBonusPercentage / 100;

  // 5. Расчет финального счета
  const finalScoreWithBonus = Math.round(baseRatingScore * finalRoundBonusMultiplier);

  console.log(`[Rating] Accuracy=${(accuracy * 100).toFixed(1)}%, TimeScore=${timeScore}, BaseScore=${baseRatingScore}`);
  console.log(`[Rating] Rounds=${actualRoundsCompleted}, Bonus=${cappedBonusPercent}%, Total=${finalBonusPercentage}%, Multiplier=${finalRoundBonusMultiplier.toFixed(2)}`);
  console.log(`[Rating] Final Score=${finalScoreWithBonus}`);

  // 6. Возвращаем все рассчитанные значения
  return {
    rating: baseRatingScore, 
    timeScore: timeScore,
    accuracyMultiplier: accuracyMultiplier,
    accuracy: accuracy * 100, 
    actualTime: totalTimeMs, // Общее время сессии
    theoreticalMinTime: theoreticalMinTime, // Теоретическое общее время
    roundsCompleted: actualRoundsCompleted, // Используем гарантированное количество раундов
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

// Функция для получения глобальной статистики использования изображений
export const getGlobalImageStats = async (): Promise<{ [imageFileName: string]: number }> => {
  try {
    const statsDoc = await getDoc(doc(db, 'stats', 'imageStats'));
    if (!statsDoc.exists()) {
      console.log('Global image stats not found, creating empty stats');
      return {};
    }
    
    const data = statsDoc.data();
    return data.imageCounts || {};
  } catch (error) {
    console.error('Error getting global image stats:', error);
    return {};
  }
};

// Функция для обновления глобальной статистики использования изображений
export const updateGlobalImageStats = async (imageFileNames: string[]): Promise<void> => {
  try {
    const statsRef = doc(db, 'stats', 'imageStats');
    
    // Используем транзакцию для атомарного обновления
    await runTransaction(db, async (transaction) => {
      const statsDoc = await transaction.get(statsRef);
      
      // Получаем текущие счетчики или создаем новые
      const currentCounts = statsDoc.exists() ? statsDoc.data().imageCounts || {} : {};
      const updatedCounts = { ...currentCounts };
      
      // Обновляем счетчики для каждого изображения
      imageFileNames.forEach(fileName => {
        updatedCounts[fileName] = (updatedCounts[fileName] || 0) + 1;
      });
      
      // Сохраняем обновленные счетчики
      if (statsDoc.exists()) {
        transaction.update(statsRef, { 
          imageCounts: updatedCounts,
          lastUpdated: serverTimestamp()
        });
      } else {
        transaction.set(statsRef, { 
          imageCounts: updatedCounts,
          lastUpdated: serverTimestamp(),
          createdAt: serverTimestamp()
        });
      }
    });
    
    console.log(`Global image stats updated for ${imageFileNames.length} images`);
  } catch (error) {
    console.error('Error updating global image stats:', error);
    throw error;
  }
}; 