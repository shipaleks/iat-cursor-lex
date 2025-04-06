FROM node:18-alpine as build

WORKDIR /app

# Устанавливаем необходимые системные зависимости для canvas
RUN apk add --no-cache \
    build-base \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    python3 \
    pixman-dev

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости с повышенным таймаутом и параметрами надежности
RUN npm install --no-audit --no-fund --loglevel=error --network-timeout=100000

# Копируем остальные файлы проекта
COPY . .

# Собираем приложение
RUN npm run build

# Используем легковесный сервер для раздачи статики
FROM node:18-alpine as production

WORKDIR /app

# Устанавливаем runtime зависимости для canvas
RUN apk add --no-cache \
    cairo \
    jpeg \
    pango \
    giflib \
    pixman

# Устанавливаем serve глобально
RUN npm install -g serve

# Копируем только необходимые для запуска файлы
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./

# Создаем файл с конфигурацией Firebase для клиента
RUN echo 'window.firebaseConfig = { \
  apiKey: "AIzaSyDwFohf7gaY0QUl1Oiz2GiB1ZwCSsPVSaY", \
  authDomain: "iat-experiment-v2.firebaseapp.com", \
  projectId: "iat-experiment-v2", \
  storageBucket: "iat-experiment-v2.firebasestorage.app", \
  messagingSenderId: "703791598754", \
  appId: "1:703791598754:web:ef80e511f703f87e4cdbfb" \
};' > ./dist/firebase-config.js

# Устанавливаем Firebase переменные окружения
ENV VITE_FIREBASE_API_KEY=AIzaSyDwFohf7gaY0QUl1Oiz2GiB1ZwCSsPVSaY
ENV VITE_FIREBASE_AUTH_DOMAIN=iat-experiment-v2.firebaseapp.com
ENV VITE_FIREBASE_PROJECT_ID=iat-experiment-v2
ENV VITE_FIREBASE_STORAGE_BUCKET=iat-experiment-v2.firebasestorage.app
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=703791598754
ENV VITE_FIREBASE_APP_ID=1:703791598754:web:ef80e511f703f87e4cdbfb

# Устанавливаем переменную окружения для порта по умолчанию
# Railway перезапишет эту переменную своим значением
ENV PORT=10000

# Запускаем приложение, используя переменную окружения $PORT
CMD ["sh", "-c", "serve dist -s -p $PORT"]