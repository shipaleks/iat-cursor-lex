"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recalculateLeaderboardScores = exports.getLeaderboard = exports.updateLeaderboard = exports.saveSessionResults = exports.updateParticipantProgress = exports.getParticipantProgress = exports.getParticipantProgressByNickname = exports.signInAnonymousUser = void 0;
exports.saveTrialResult = saveTrialResult;
var config_1 = require("./config");
var auth_1 = require("firebase/auth");
var firestore_1 = require("firebase/firestore");
// Анонимная аутентификация
var signInAnonymousUser = function () { return __awaiter(void 0, void 0, void 0, function () {
    var userCredential, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                console.log('Attempting anonymous sign in...');
                console.log('Auth instance state:', config_1.auth.currentUser);
                return [4 /*yield*/, (0, auth_1.signInAnonymously)(config_1.auth)];
            case 1:
                userCredential = _a.sent();
                console.log('Sign in successful:', userCredential.user);
                return [2 /*return*/, userCredential.user];
            case 2:
                error_1 = _a.sent();
                console.error('Error signing in anonymously:', error_1);
                console.error('Auth instance:', config_1.auth);
                throw error_1;
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.signInAnonymousUser = signInAnonymousUser;
// Получение прогресса участника по никнейму
var getParticipantProgressByNickname = function (nickname) { return __awaiter(void 0, void 0, void 0, function () {
    var progressSnapshot, doc_1, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, firestore_1.getDocs)((0, firestore_1.query)((0, firestore_1.collection)(config_1.db, 'progress'), (0, firestore_1.where)('nickname', '==', nickname)))];
            case 1:
                progressSnapshot = _a.sent();
                if (!progressSnapshot.empty) {
                    doc_1 = progressSnapshot.docs[0];
                    return [2 /*return*/, {
                            userId: doc_1.id,
                            progress: doc_1.data()
                        }];
                }
                return [2 /*return*/, null];
            case 2:
                error_2 = _a.sent();
                console.error('Error getting participant progress by nickname:', error_2);
                throw error_2;
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getParticipantProgressByNickname = getParticipantProgressByNickname;
// Получение прогресса участника
var getParticipantProgress = function (participantId) { return __awaiter(void 0, void 0, void 0, function () {
    var progressDoc, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, firestore_1.getDoc)((0, firestore_1.doc)(config_1.db, 'progress', participantId))];
            case 1:
                progressDoc = _a.sent();
                if (!progressDoc.exists()) {
                    // Если документ не существует, возвращаем null
                    return [2 /*return*/, null];
                }
                return [2 /*return*/, progressDoc.data()];
            case 2:
                error_3 = _a.sent();
                console.error('Error getting participant progress:', error_3);
                throw error_3;
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getParticipantProgress = getParticipantProgress;
// Создание или обновление прогресса участника
var updateParticipantProgress = function (participantId, nickname, completedImages) { return __awaiter(void 0, void 0, void 0, function () {
    var validCompletedImages, progressRef, progressDoc, currentProgress, currentImages, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 6, , 7]);
                validCompletedImages = Array.isArray(completedImages) ? completedImages : [];
                progressRef = (0, firestore_1.doc)(config_1.db, 'progress', participantId);
                return [4 /*yield*/, (0, firestore_1.getDoc)(progressRef)];
            case 1:
                progressDoc = _a.sent();
                if (!progressDoc.exists()) return [3 /*break*/, 3];
                currentProgress = progressDoc.data();
                currentImages = Array.isArray(currentProgress.completedImages) ?
                    currentProgress.completedImages : [];
                return [4 /*yield*/, (0, firestore_1.updateDoc)(progressRef, {
                        completedImages: __spreadArray([], new Set(__spreadArray(__spreadArray([], currentImages, true), validCompletedImages, true)), true),
                        totalSessions: (currentProgress.totalSessions || 0) + 1,
                        lastSessionTimestamp: firestore_1.Timestamp.now()
                    })];
            case 2:
                _a.sent();
                return [3 /*break*/, 5];
            case 3: return [4 /*yield*/, (0, firestore_1.setDoc)(progressRef, {
                    nickname: nickname,
                    completedImages: validCompletedImages,
                    totalSessions: 1,
                    lastSessionTimestamp: firestore_1.Timestamp.now()
                })];
            case 4:
                _a.sent();
                _a.label = 5;
            case 5: return [3 /*break*/, 7];
            case 6:
                error_4 = _a.sent();
                console.error('Error updating participant progress:', error_4);
                throw error_4;
            case 7: return [2 /*return*/];
        }
    });
}); };
exports.updateParticipantProgress = updateParticipantProgress;
// Сохранение результата одного предъявления
function saveTrialResult(result) {
    return __awaiter(this, void 0, void 0, function () {
        var response, text, rows, header, data, imageNumber, model, resultWithModel, docRef, error_5;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, fetch('/data/dictionary.tsv')];
                case 1:
                    response = _c.sent();
                    if (!response.ok) {
                        console.error('Failed to load dictionary.tsv:', response.status);
                        throw new Error('Failed to load dictionary.tsv');
                    }
                    return [4 /*yield*/, response.text()];
                case 2:
                    text = _c.sent();
                    console.log('Dictionary loaded, first 100 chars:', text.slice(0, 100));
                    rows = text.trim().split('\n').map(function (row) { return row.split('\t'); });
                    header = rows[0], data = rows.slice(1);
                    imageNumber = parseInt(result.imageFileName.split('.')[0]);
                    console.log('Looking for model for image:', imageNumber);
                    model = ((_b = (_a = data[imageNumber]) === null || _a === void 0 ? void 0 : _a[2]) === null || _b === void 0 ? void 0 : _b.trim()) || '';
                    console.log('Found model:', model);
                    resultWithModel = __assign(__assign({}, result), { model: model, timestamp: new Date() });
                    console.log('Saving trial result with model:', resultWithModel);
                    return [4 /*yield*/, (0, firestore_1.addDoc)((0, firestore_1.collection)(config_1.db, 'trials'), resultWithModel)];
                case 3:
                    docRef = _c.sent();
                    return [2 /*return*/, docRef.id];
                case 4:
                    error_5 = _c.sent();
                    console.error('Error saving trial result:', error_5);
                    throw error_5;
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Сохранение результатов сессии
var saveSessionResults = function (participantId, totalTrials, correctTrials, totalTimeMs, nickname) { return __awaiter(void 0, void 0, void 0, function () {
    var sessionData, docRef, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                sessionData = {
                    participantId: participantId,
                    nickname: nickname,
                    totalTrials: totalTrials,
                    correctTrials: correctTrials,
                    accuracy: (correctTrials / totalTrials) * 100,
                    totalTimeMs: totalTimeMs,
                    timestamp: firestore_1.Timestamp.now()
                };
                return [4 /*yield*/, (0, firestore_1.addDoc)((0, firestore_1.collection)(config_1.db, 'sessions'), sessionData)];
            case 1:
                docRef = _a.sent();
                console.log('Session results saved with ID:', docRef.id);
                return [2 /*return*/, docRef.id];
            case 2:
                error_6 = _a.sent();
                console.error('Error saving session results:', error_6);
                throw error_6;
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.saveSessionResults = saveSessionResults;
// Обновление результатов в таблице лидеров
var updateLeaderboard = function (nickname, sessionStats) { return __awaiter(void 0, void 0, void 0, function () {
    var leaderboardRef, leaderboardDoc, currentStats, newTotalTrials, newTotalCorrect, newTotalTime, accuracy, timeInMinutes, accuracyScore, optimalTime, timeScore, score, accuracy, timeInMinutes, accuracyScore, optimalTime, timeScore, score, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 6, , 7]);
                leaderboardRef = (0, firestore_1.doc)(config_1.db, 'leaderboard', nickname);
                return [4 /*yield*/, (0, firestore_1.getDoc)(leaderboardRef)];
            case 1:
                leaderboardDoc = _a.sent();
                if (!leaderboardDoc.exists()) return [3 /*break*/, 3];
                currentStats = leaderboardDoc.data();
                newTotalTrials = currentStats.totalTrials + sessionStats.totalTrials;
                newTotalCorrect = currentStats.totalCorrect + sessionStats.correctTrials;
                newTotalTime = currentStats.totalTime + sessionStats.totalTimeMs;
                accuracy = (newTotalCorrect / newTotalTrials) * 100;
                timeInMinutes = newTotalTime / (1000 * 60);
                accuracyScore = void 0;
                if (accuracy < 75) {
                    accuracyScore = Math.pow(accuracy / 75, 6) * 20;
                }
                else if (accuracy < 90) {
                    accuracyScore = 20 + (accuracy - 75) * (40 / 15);
                }
                else {
                    accuracyScore = 60 + Math.min(20, Math.pow(1.2, accuracy - 90));
                }
                optimalTime = 8;
                timeScore = Math.max(0, 20 * (1 - Math.pow((timeInMinutes - optimalTime) / 10, 2)));
                score = Math.round(accuracyScore + timeScore);
                return [4 /*yield*/, (0, firestore_1.updateDoc)(leaderboardRef, {
                        totalTrials: newTotalTrials,
                        totalCorrect: newTotalCorrect,
                        totalTime: newTotalTime,
                        accuracy: accuracy,
                        score: score,
                        lastUpdate: firestore_1.Timestamp.now()
                    })];
            case 2:
                _a.sent();
                return [3 /*break*/, 5];
            case 3:
                accuracy = (sessionStats.correctTrials / sessionStats.totalTrials) * 100;
                timeInMinutes = sessionStats.totalTimeMs / (1000 * 60);
                accuracyScore = void 0;
                if (accuracy < 75) {
                    accuracyScore = Math.pow(accuracy / 75, 6) * 20;
                }
                else if (accuracy < 90) {
                    accuracyScore = 20 + (accuracy - 75) * (40 / 15);
                }
                else {
                    accuracyScore = 60 + Math.min(20, Math.pow(1.2, accuracy - 90));
                }
                optimalTime = 8;
                timeScore = Math.max(0, 20 * (1 - Math.pow((timeInMinutes - optimalTime) / 10, 2)));
                score = Math.round(accuracyScore + timeScore);
                return [4 /*yield*/, (0, firestore_1.setDoc)(leaderboardRef, {
                        nickname: nickname,
                        totalTrials: sessionStats.totalTrials,
                        totalCorrect: sessionStats.correctTrials,
                        totalTime: sessionStats.totalTimeMs,
                        accuracy: accuracy,
                        score: score,
                        lastUpdate: firestore_1.Timestamp.now()
                    })];
            case 4:
                _a.sent();
                _a.label = 5;
            case 5: return [3 /*break*/, 7];
            case 6:
                error_7 = _a.sent();
                console.error('Error updating leaderboard:', error_7);
                throw error_7;
            case 7: return [2 /*return*/];
        }
    });
}); };
exports.updateLeaderboard = updateLeaderboard;
// Функция для получения данных лидерборда
var getLeaderboard = function () { return __awaiter(void 0, void 0, void 0, function () {
    var leaderboardSnapshot, entries_1, error_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, firestore_1.getDocs)((0, firestore_1.collection)(config_1.db, 'leaderboard'))];
            case 1:
                leaderboardSnapshot = _a.sent();
                entries_1 = [];
                leaderboardSnapshot.forEach(function (doc) {
                    var data = doc.data();
                    entries_1.push({
                        nickname: data.nickname,
                        accuracy: data.accuracy,
                        totalTime: data.totalTime,
                        score: data.score
                    });
                });
                return [2 /*return*/, entries_1];
            case 2:
                error_8 = _a.sent();
                console.error('Error getting leaderboard:', error_8);
                throw error_8;
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getLeaderboard = getLeaderboard;
// Функция для пересчета рейтинга всех участников
var recalculateLeaderboardScores = function () { return __awaiter(void 0, void 0, void 0, function () {
    var leaderboardSnapshot, _i, _a, doc_2, data, accuracy, timeInMinutes, accuracyScore, optimalTime, timeScore, score, error_9;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 6, , 7]);
                return [4 /*yield*/, (0, firestore_1.getDocs)((0, firestore_1.collection)(config_1.db, 'leaderboard'))];
            case 1:
                leaderboardSnapshot = _b.sent();
                _i = 0, _a = leaderboardSnapshot.docs;
                _b.label = 2;
            case 2:
                if (!(_i < _a.length)) return [3 /*break*/, 5];
                doc_2 = _a[_i];
                data = doc_2.data();
                accuracy = (data.totalCorrect / data.totalTrials) * 100;
                timeInMinutes = data.totalTime / (1000 * 60);
                accuracyScore = void 0;
                if (accuracy < 75) {
                    accuracyScore = Math.pow(accuracy / 75, 6) * 20;
                }
                else if (accuracy < 90) {
                    accuracyScore = 20 + (accuracy - 75) * (40 / 15);
                }
                else {
                    accuracyScore = 60 + Math.min(20, Math.pow(1.2, accuracy - 90));
                }
                optimalTime = 8;
                timeScore = Math.max(0, 20 * (1 - Math.pow((timeInMinutes - optimalTime) / 10, 2)));
                score = Math.round(accuracyScore + timeScore);
                return [4 /*yield*/, (0, firestore_1.updateDoc)(doc_2.ref, { score: score })];
            case 3:
                _b.sent();
                _b.label = 4;
            case 4:
                _i++;
                return [3 /*break*/, 2];
            case 5:
                console.log('Leaderboard scores recalculated successfully.');
                return [3 /*break*/, 7];
            case 6:
                error_9 = _b.sent();
                console.error('Error recalculating leaderboard scores:', error_9);
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); };
exports.recalculateLeaderboardScores = recalculateLeaderboardScores;
