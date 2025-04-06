# Implicit Association Test (IAT) for Visual Aesthetics

## English

### Project Overview
This application implements an experimental instrument for studying implicit associations between visual stimuli (images) and aesthetic concepts. The project is designed to measure unconscious reactions to image-word pairs to understand how people perceive various aesthetic qualities in visual content.

### Experiment Design
The experiment presents participants with a sequence of trials where an image is briefly displayed followed by a word. Participants must quickly decide whether the word is a real aesthetic concept or a nonsense word. The system measures:

- Reaction time
- Response accuracy
- Pattern of responses across different aesthetic dimensions

**Key experiment parameters:**
- Database of ~600 images (increased from ~80 in v1)
- 46 words across 6 aesthetic factors (increased from 8 in v1)
- 40 unique images per session (increased from 10 in v1)
- 1 trial per image (reduced from 6 trials per image in v1)
- 70/30 ratio of real words to nonsense words

### Image-Word Pairing Algorithm
The system employs a sophisticated algorithm to maximize variety and coverage of image-word pairs:

1. **Session Diversity**: Each session shows 40 unique images with minimal repetition between sessions
2. **Image-Word History**: Tracks all previously shown image-word combinations for each participant
3. **Priority Selection**: Prioritizes images that have never been shown with real words (90% chance)
4. **Coverage Maximization**: Ensures all 600 images will eventually be shown with real aesthetic words
5. **Infinite Session Support**: Allows unlimited sessions with progressively different image-word combinations

### Balanced Scoring System
The scoring system accounts for the imbalanced ratio of real words to non-words:

- **Balanced Accuracy**: Average of accuracy rates for real words and non-words (prevents gaming the system by always selecting "word")
- **Time Score**: Based on minimum completion time of 57 seconds (1425ms per trial)
- **Round Bonus**: +10% score for each completed round
- **Final Score**: Combination of accuracy score (85% weight) and time score (15% weight) with round bonuses

### Technical Implementation
The application is built with:
- React with TypeScript
- Firebase for authentication and data storage
- Material-UI for responsive interface

### Device Detection
The system detects and records the device type (mobile or desktop) used for each session, allowing researchers to analyze performance differences between platforms.

### Code Structure
- `src/components/` - React components including trial screens and leaderboard
- `src/firebase/` - Firebase configuration and service functions
- `src/utils/` - Utility functions including the trial generation algorithm
- `src/types.ts` - TypeScript interfaces and type definitions

### Data Collection
The system collects and stores:
- Trial results (image, word, response, reaction time)
- Session statistics (accuracy, completion time, device type)
- Participant progress (completed images, session count)
- Leaderboard data (performance metrics across participants)

## Russian

### Обзор проекта
Это приложение реализует экспериментальный инструмент для изучения имплицитных ассоциаций между визуальными стимулами (изображениями) и эстетическими концепциями. Проект разработан для измерения неосознанных реакций на пары изображение-слово, чтобы понять, как люди воспринимают различные эстетические качества в визуальном контенте.

### Дизайн эксперимента
Эксперимент представляет участникам последовательность испытаний, где кратковременно показывается изображение, после чего следует слово. Участники должны быстро решить, является ли слово реальным эстетическим понятием или бессмысленным словом. Система измеряет:

- Время реакции
- Точность ответов
- Закономерности ответов по различным эстетическим измерениям

**Ключевые параметры эксперимента:**
- База данных из ~600 изображений (увеличена с ~80 в v1)
- 46 слов по 6 эстетическим факторам (увеличено с 8 в v1)
- 40 уникальных изображений за сессию (увеличено с 10 в v1)
- 1 испытание на изображение (уменьшено с 6 испытаний на изображение в v1)
- Соотношение 70/30 реальных слов к бессмысленным словам

### Алгоритм сопоставления изображений и слов
Система использует сложный алгоритм для максимизации разнообразия и охвата пар изображение-слово:

1. **Разнообразие сессий**: Каждая сессия показывает 40 уникальных изображений с минимальным повторением между сессиями
2. **История пар изображение-слово**: Отслеживает все ранее показанные комбинации изображение-слово для каждого участника
3. **Приоритетный выбор**: Отдаёт приоритет изображениям, которые никогда не показывались с реальными словами (вероятность 90%)
4. **Максимизация охвата**: Гарантирует, что все 600 изображений в конечном итоге будут показаны с реальными эстетическими словами
5. **Поддержка бесконечных сессий**: Позволяет проводить неограниченное количество сессий с прогрессивно разными комбинациями изображение-слово

### Сбалансированная система подсчёта очков
Система подсчёта очков учитывает несбалансированное соотношение реальных слов к нереальным:

- **Сбалансированная точность**: Средняя точность для реальных слов и нереальных слов (предотвращает игровое использование системы путем постоянного выбора «слово»)
- **Очки за время**: На основе минимального времени выполнения 57 секунд (1425 мс на испытание)
- **Бонус за раунды**: +10% к очкам за каждый завершённый раунд
- **Итоговый счёт**: Комбинация очков за точность (вес 85%) и очков за время (вес 15%) с учётом бонусов за раунды

### Техническая реализация
Приложение построено с использованием:
- React с TypeScript
- Firebase для аутентификации и хранения данных
- Material-UI для отзывчивого интерфейса

### Определение устройства
Система определяет и записывает тип устройства (мобильное или настольное), используемый для каждой сессии, что позволяет исследователям анализировать различия в производительности между платформами.

### Структура кода
- `src/components/` - React-компоненты, включая экраны испытаний и таблицу лидеров
- `src/firebase/` - Конфигурация Firebase и сервисные функции
- `src/utils/` - Вспомогательные функции, включая алгоритм генерации испытаний
- `src/types.ts` - TypeScript интерфейсы и определения типов

### Сбор данных
Система собирает и хранит:
- Результаты испытаний (изображение, слово, ответ, время реакции)
- Статистику сессий (точность, время выполнения, тип устройства)
- Прогресс участника (завершённые изображения, количество сессий)
- Данные таблицы лидеров (показатели производительности по участникам)
