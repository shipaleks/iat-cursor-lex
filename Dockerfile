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

# Устанавливаем переменную окружения для порта по умолчанию
# Railway перезапишет эту переменную своим значением
ENV PORT=10000

# Запускаем приложение, используя переменную окружения $PORT
CMD ["sh", "-c", "serve dist -s -p $PORT"] 