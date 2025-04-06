# Руководство по деплою проекта в Railway

## Решенные проблемы

### 1. TypeScript ошибка при сборке
**Проблема**: При сборке возникала ошибка:
```
src/components/trial/CompletionScreen.tsx(5,10): error TS2459: Module '"../../firebase/service.tsx"' declares 'RatingCalculation' locally, but it is not exported.
```

**Решение**:
- Тип `RatingCalculation` определен в файле `src/types.ts` и импортируется в `CompletionScreen.tsx`
- Исправили импорт, чтобы он импортировался только из `../../types`, а не из `../../firebase/service.tsx`

### 2. Настройка для Railway

**Проблема**: Railway использовал NIXPACKS, что вызывало проблемы при сборке.

**Решение**:
- Создали Dockerfile для настройки процесса сборки и запуска
- Обновили railway.json для использования Dockerfile вместо NIXPACKS
- Настроили двухэтапную сборку для оптимизации размера образа

### 3. Ошибка canvas

**Проблема**: Ошибка при компиляции модуля canvas с сообщениями gyp error.

**Решение**:
- Добавлены зависимости для компиляции: build-base, g++, cairo-dev и др.
- Добавлены runtime зависимости: cairo, jpeg, pango, giflib, pixman

### 4. Ошибка structuredClone

**Проблема**: Функция structuredClone не найдена при сборке Vite.

**Решение**:
- Обновлена версия Node.js с 16 до 18, где эта функция доступна

### 5. Ошибка serve not found

**Проблема**: Команда serve не найдена при запуске контейнера.

**Решение**:
- Установка пакета serve глобально: `npm install -g serve`
- Прямой запуск serve вместо npm script

## Инструкция по деплою

1. Убедитесь, что проект собирается локально:
   ```
   npm run build
   ```

2. Проверьте, что файл firebase/config.tsx содержит правильные учетные данные.

3. Разверните проект в Railway:
   ```
   railway up
   ```

4. Настройте Firebase для работы с доменом Railway:
   - Перейдите в [Firebase Console](https://console.firebase.google.com/)
   - Выберите ваш проект
   - Перейдите в Authentication -> Sign-in method
   - В разделе "Authorized domains" добавьте домен Railway
   - Формат домена обычно: `вашеприложение.up.railway.app`

5. Добавьте переменные окружения в Railway:
   - VITE_FIREBASE_API_KEY
   - VITE_FIREBASE_AUTH_DOMAIN
   - VITE_FIREBASE_PROJECT_ID
   - VITE_FIREBASE_STORAGE_BUCKET
   - VITE_FIREBASE_MESSAGING_SENDER_ID
   - VITE_FIREBASE_APP_ID

## Проверка и отладка

Для просмотра логов в Railway используйте:
```
railway logs
```

Для локальной проверки Docker-образа:
```
docker build -t iat-app .
docker run -p 10000:10000 iat-app
```

После этого приложение будет доступно по адресу `http://localhost:10000` 