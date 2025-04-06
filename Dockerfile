FROM node:16-alpine as build

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости с повышенным таймаутом и параметрами надежности
RUN npm install --no-audit --no-fund --loglevel=error --network-timeout=100000

# Копируем остальные файлы проекта
COPY . .

# Собираем приложение
RUN npm run build

# Используем легковесный сервер для раздачи статики
FROM node:16-alpine as production

WORKDIR /app

# Копируем только необходимые для запуска файлы
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules/serve ./node_modules/serve

# Устанавливаем переменную окружения для порта
ENV PORT=10000

# Запускаем приложение
CMD ["npm", "run", "start"] 