import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc } from 'firebase/firestore';
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

async function recalculateLeaderboardScores() {
  try {
    const leaderboardSnapshot = await getDocs(collection(db, 'leaderboard'));
    console.log('Found leaderboard entries:', leaderboardSnapshot.size);

    for (const doc of leaderboardSnapshot.docs) {
      const data = doc.data();
      console.log('\nProcessing user:', data.nickname);
      console.log('Current data:', {
        totalTrials: data.totalTrials,
        totalCorrect: data.totalCorrect,
        totalTime: data.totalTime,
        currentScore: data.score
      });

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

      console.log('New calculation:', {
        accuracy: accuracy.toFixed(1) + '%',
        time: `${Math.floor(timeInMinutes)}:${String(Math.floor((timeInMinutes % 1) * 60)).padStart(2, '0')}`,
        accuracyScore: accuracyScore.toFixed(1),
        timeScore: timeScore.toFixed(1),
        newScore: score
      });

      await updateDoc(doc.ref, { score });
    }

    console.log('\nLeaderboard scores recalculated successfully.');
  } catch (error) {
    console.error('Error recalculating leaderboard scores:', error);
  }
}

recalculateLeaderboardScores().then(() => {
  console.log('Recalculation complete.');
  process.exit(0);
}).catch(error => {
  console.error('Error:', error);
  process.exit(1);
}); 