"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./src/firebase/temp-config");
var service_1 = require("./src/firebase/service");
// Load environment variables from .env.local file
var dotenv = require("dotenv");
dotenv.config({ path: '.env.local' });
(0, service_1.recalculateLeaderboardScores)().then(function () {
    console.log('Recalculation complete.');
    process.exit(0);
}).catch(function (error) {
    console.error('Error during recalculation:', error);
    process.exit(1);
});
