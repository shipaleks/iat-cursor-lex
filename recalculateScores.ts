import './src/firebase/temp-config';
import { recalculateLeaderboardScores } from './src/firebase/service';

// Load environment variables from .env.local file
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

recalculateLeaderboardScores().then(() => {
  console.log('Recalculation complete.');
  process.exit(0);
}).catch(error => {
  console.error('Error during recalculation:', error);
  process.exit(1);
}); 