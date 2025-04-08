import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, query, where, serverTimestamp } from 'firebase/firestore';
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

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Функция для подсчета и обновления глобальной статистики изображений
 */
async function regenerateImageStats() {
  console.log('Начинаем регенерацию статистики изображений...');
  
  try {
    // Получаем все записи из коллекции trials
    const trialsSnapshot = await getDocs(collection(db, 'trials'));
    console.log(`Найдено ${trialsSnapshot.size} записей в коллекции trials`);
    
    // Создаем словарь для подсчета показов каждого изображения
    const imageCounts = {};
    
    // Подсчитываем количество показов для каждого изображения
    trialsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const imageFileName = data.imageFileName;
      
      if (imageFileName) {
        imageCounts[imageFileName] = (imageCounts[imageFileName] || 0) + 1;
      }
    });
    
    // Количество уникальных изображений
    const uniqueImagesCount = Object.keys(imageCounts).length;
    console.log(`Найдено ${uniqueImagesCount} уникальных изображений`);
    
    // Сортируем изображения по количеству показов для вывода статистики
    const sortedImages = Object.entries(imageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20); // Топ-20 изображений
    
    console.log('Топ-20 изображений по количеству показов:');
    sortedImages.forEach(([fileName, count], index) => {
      console.log(`${index + 1}. ${fileName}: ${count} показов`);
    });
    
    // Сохраняем статистику в Firestore
    await setDoc(doc(db, 'stats', 'imageStats'), {
      imageCounts,
      totalImages: uniqueImagesCount,
      totalShows: trialsSnapshot.size,
      lastUpdated: serverTimestamp(),
      createdAt: serverTimestamp()
    });
    
    console.log('Статистика изображений успешно сохранена в коллекции stats/imageStats');
    
    // Анализируем распределение показов
    let min = Infinity;
    let max = 0;
    let sum = 0;
    
    Object.values(imageCounts).forEach(count => {
      if (count < min) min = count;
      if (count > max) max = count;
      sum += count;
    });
    
    const average = sum / uniqueImagesCount;
    
    console.log(`Статистика показов изображений:`);
    console.log(`- Минимум: ${min} показов`);
    console.log(`- Максимум: ${max} показов`);
    console.log(`- Среднее: ${average.toFixed(2)} показов`);
    
    // Находим изображения с наименьшим количеством показов
    const leastShownImages = Object.entries(imageCounts)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 20); // Топ-20 наименее показанных
    
    console.log('Топ-20 наименее показанных изображений:');
    leastShownImages.forEach(([fileName, count], index) => {
      console.log(`${index + 1}. ${fileName}: ${count} показов`);
    });
    
  } catch (error) {
    console.error('Ошибка при регенерации статистики изображений:', error);
  }
}

// Запускаем функцию
regenerateImageStats()
  .then(() => console.log('Скрипт завершен успешно'))
  .catch(error => console.error('Ошибка выполнения скрипта:', error)); 