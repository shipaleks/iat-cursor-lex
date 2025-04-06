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

4. Если возникнут проблемы с Firebase, проверьте:
   - Правильность доменного имени в настройках Firebase Authentication
   - Наличие прав доступа к Firestore
   - Включение всех необходимых сервисов Firebase

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