import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '.env.local') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearLeaderboard() {
  try {
    const leaderboardSnapshot = await getDocs(collection(db, 'leaderboard'));
    console.log('Found leaderboard entries:', leaderboardSnapshot.size);

    const batch = writeBatch(db);
    leaderboardSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log('Leaderboard cleared successfully.');
  } catch (error) {
    console.error('Error clearing leaderboard:', error);
  }
}

clearLeaderboard().then(() => {
  console.log('Cleanup complete.');
  process.exit(0);
}).catch(error => {
  console.error('Error:', error);
  process.exit(1);
}); 