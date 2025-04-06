#!/bin/bash

# Скрипт для настройки переменных окружения Firebase в Railway

# Требует установленного Railway CLI
# Установка: npm i -g @railway/cli
# Затем войдите в аккаунт: railway login

echo "Добавление переменных окружения Firebase в Railway..."

railway variables set \
  VITE_FIREBASE_API_KEY=AIzaSyDwFohf7gaY0QUl1Oiz2GiB1ZwCSsPVSaY \
  VITE_FIREBASE_AUTH_DOMAIN=iat-experiment-v2.firebaseapp.com \
  VITE_FIREBASE_PROJECT_ID=iat-experiment-v2 \
  VITE_FIREBASE_STORAGE_BUCKET=iat-experiment-v2.firebasestorage.app \
  VITE_FIREBASE_MESSAGING_SENDER_ID=703791598754 \
  VITE_FIREBASE_APP_ID=1:703791598754:web:ef80e511f703f87e4cdbfb

echo "Переменные окружения успешно установлены!"
echo "Не забудьте добавить домен Railway в список разрешенных в Firebase Console:"
echo "https://console.firebase.google.com/project/iat-experiment-v2/authentication/settings" 