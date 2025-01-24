import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch } from 'firebase/firestore';
import dotenv from 'dotenv';

// Загружаем переменные окружения из .env.local
dotenv.config({ path: '.env.local' });

// Конфигурация Firebase
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Инициализируем Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Функция очистки всех коллекций
async function clearAllData() {
  try {
    const batch = writeBatch(db);
    const collections = ['leaderboard', 'trials', 'sessions', 'participantProgress'];
    
    for (const collectionName of collections) {
      console.log(`Clearing collection: ${collectionName}`);
      const querySnapshot = await getDocs(collection(db, collectionName));
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
    }
    
    await batch.commit();
    console.log('All collections cleared successfully');
  } catch (error) {
    console.error('Error clearing collections:', error);
    throw error;
  }
}

// Запускаем очистку
console.log('Starting data cleanup...');

clearAllData()
  .then(() => {
    console.log('All data has been successfully cleared from Firebase.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error during data cleanup:', error);
    process.exit(1);
  }); 