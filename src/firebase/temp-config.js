"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = exports.db = void 0;
var app_1 = require("firebase/app");
var firestore_1 = require("firebase/firestore");
var auth_1 = require("firebase/auth");
var firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY || "your-api-key",
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "your-auth-domain",
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "your-storage-bucket",
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "your-messaging-sender-id",
    appId: process.env.VITE_FIREBASE_APP_ID || "your-app-id"
};
var app = (0, app_1.initializeApp)(firebaseConfig);
exports.db = (0, firestore_1.getFirestore)(app);
exports.auth = (0, auth_1.getAuth)(app);
