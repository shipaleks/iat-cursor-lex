const path = require('path');
const { recalculateLeaderboardScores } = require(path.resolve(__dirname, 'src/firebase/service'));

recalculateLeaderboardScores().then(() => {
  console.log('Recalculation complete.');
  process.exit(0);
}).catch(error => {
  console.error('Error during recalculation:', error);
  process.exit(1);
}); 