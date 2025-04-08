import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, query, limit } from 'firebase/firestore';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env.local') });

// Конфигурация Firebase
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Вывод информации о конфигурации
console.log('Using Firebase project:', process.env.VITE_FIREBASE_PROJECT_ID);

// Инициализируем Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Список коллекций, которые нужно очистить
const COLLECTIONS_TO_CLEAR = [
  'leaderboard',    // Таблица лидеров
  'trials',         // Результаты испытаний
  'sessions',       // Результаты сессий
  'progress',       // Прогресс участников
  'nicknames',      // Сопоставление никнеймов с userId
  'participantProgress' // Альтернативное название коллекции прогресса (если используется)
];

/**
 * Функция для очистки отдельной коллекции
 */
async function clearCollection(collectionName) {
  console.log(`\n--- Очистка коллекции: ${collectionName} ---`);
  
  try {
    // Получаем все документы из коллекции
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);
    
    if (snapshot.empty) {
      console.log(`Коллекция '${collectionName}' пуста.`);
      return 0;
    }
    
    console.log(`Найдено ${snapshot.docs.length} документов для удаления.`);
    
    // Firebase имеет ограничение на 500 операций в одном батче
    // Поэтому делим удаление на батчи по 450 документов
    const batchSize = 450;
    const batches = [];
    
    for (let i = 0; i < snapshot.docs.length; i += batchSize) {
      const batch = writeBatch(db);
      
      const documentsInBatch = snapshot.docs.slice(i, i + batchSize);
      documentsInBatch.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      batches.push(batch);
    }
    
    console.log(`Создано ${batches.length} батчей для удаления.`);
    
    // Выполняем все батчи
    let completedBatches = 0;
    for (const batch of batches) {
      await batch.commit();
      completedBatches++;
      console.log(`Выполнен батч ${completedBatches}/${batches.length}`);
    }
    
    console.log(`Коллекция '${collectionName}' успешно очищена. Удалено ${snapshot.docs.length} документов.`);
    return snapshot.docs.length;
  } catch (error) {
    console.error(`Ошибка при очистке коллекции '${collectionName}':`, error);
    throw error;
  }
}

/**
 * Функция для очистки всех указанных коллекций
 */
async function clearAllData() {
  console.log('=== НАЧАЛО ОЧИСТКИ ДАННЫХ ===');
  console.log(`Запланировано удаление данных из ${COLLECTIONS_TO_CLEAR.length} коллекций.`);
  
  const results = {};
  let totalDocsRemoved = 0;
  
  for (const collectionName of COLLECTIONS_TO_CLEAR) {
    try {
      const docsRemoved = await clearCollection(collectionName);
      results[collectionName] = {
        status: 'success',
        docsRemoved
      };
      totalDocsRemoved += docsRemoved;
    } catch (error) {
      results[collectionName] = {
        status: 'error',
        error: error.message
      };
    }
  }
  
  console.log('\n=== ИТОГИ ОЧИСТКИ ДАННЫХ ===');
  console.log(`Всего удалено документов: ${totalDocsRemoved}`);
  console.log('Результаты по коллекциям:');
  
  for (const [collection, result] of Object.entries(results)) {
    if (result.status === 'success') {
      console.log(`✅ ${collection}: удалено ${result.docsRemoved} документов`);
    } else {
      console.log(`❌ ${collection}: ошибка - ${result.error}`);
    }
  }
  
  console.log('\n=== ОЧИСТКА ДАННЫХ ЗАВЕРШЕНА ===');
}

// Запуск очистки данных
console.log('Запуск скрипта очистки данных...');

clearAllData()
  .then(() => {
    console.log('Скрипт успешно выполнен.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Критическая ошибка при выполнении скрипта:', error);
    process.exit(1);
  }); 