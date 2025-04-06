FROM node:18-alpine as build

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем остальные файлы проекта
COPY . .

# Собираем приложение
RUN npm run build

# Используем легковесный сервер для раздачи статики
FROM node:18-alpine as production

WORKDIR /app

# Копируем только необходимые для запуска файлы
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules/serve ./node_modules/serve

# Устанавливаем переменную окружения для порта
ENV PORT=10000

# Запускаем приложение
CMD ["npm", "run", "start"] 