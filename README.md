# Implicit Association Test (IAT) for Visual Aesthetics

## English

### Project Overview
This application implements an experimental instrument for studying implicit associations between visual stimuli (images) and aesthetic concepts. The project is designed to measure unconscious reactions to image-word pairs to understand how people perceive various aesthetic qualities in visual content.

### Experiment Design
The experiment presents participants with a sequence of trials where an image is briefly displayed followed by a word. Participants must quickly decide whether the word is a real aesthetic concept or a nonsense word. The system measures:

- Reaction time (in milliseconds)
- Response accuracy (correct/incorrect classifications)
- Pattern of responses across different aesthetic dimensions

**Key experiment parameters:**
- Database of ~600 images (increased from ~80 in v1)
- 46 words across 6 aesthetic factors (increased from 8 in v1)
- 40 unique images per session (increased from 10 in v1)
- 1 trial per image (reduced from 6 trials per image in v1)
- Target ratio of 62.5% real words to 37.5% nonsense words

### Image-Word Pairing Algorithm
The system employs a sophisticated algorithm to maximize variety and coverage of image-word pairs:

1. **Session Diversity**: Each session shows 40 unique images with minimal repetition between sessions
2. **Image-Word History**: Tracks all previously shown image-word combinations for each participant
3. **Priority Selection**: Prioritizes images that have been shown less frequently across all sessions
4. **Coverage Maximization**: Ensures all 600 images will eventually be shown with real aesthetic words
5. **Infinite Session Support**: Allows unlimited sessions with progressively different image-word combinations

### Balanced Scoring System
The scoring system accounts for the imbalanced ratio of real words to non-words:

- **Balanced Accuracy**: Average of accuracy rates for real words and non-words (prevents gaming the system by always selecting "word")
- **Time Score**: Based on minimum completion time of 57 seconds (1425ms per trial)
- **Round Bonus**: Incremental bonus for each completed round (+5% for first round, +10% for second, +15% for third, etc.)
- **Final Score**: Combination of accuracy score (85% weight) and time score (15% weight) multiplied by the round bonus

### Technical Implementation
The application is built with:
- React with TypeScript for the frontend
- Firebase (Firestore) for authentication and data storage
- Material-UI for responsive interface components
- Deployed on Railway with environment variables for configuration

### Device Detection
The system automatically detects and records the device type (mobile or desktop) used for each session, allowing researchers to analyze performance differences between platforms. This helps understand how the testing environment might impact results.

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

### Experiment Logic Details

This section describes the key mechanisms for selecting stimuli (images and words) and generating non-words used in the application.

#### 1. Image Selection (`selectNextImageIndex`)

**Goal:** To ensure relatively uniform presentation of all images to a participant throughout the experiment, avoiding image repetition *within a single session* (round).

**Mechanism:**
1.  **Tracking:** For each participant, an `imageCounts` object is stored in the database (Firestore, `progress` collection). The key is the image filename, and the value is the total number of times the participant has seen that image across all previous sessions. A list of images shown in the *current* session (`shownInSession`) is also tracked.
2.  **Filtering:** When selecting the next image, those already present in `shownInSession` are first discarded.
3.  **Finding Least Shown:** Among the remaining candidates, images with the **minimum** count value in `imageCounts` are identified (i.e., those the participant has seen least often globally).
4.  **Random Selection:** One image is randomly selected from the group of least shown images.

**Result:** This algorithm ensures that all images within a single session (40 trials) are unique. Between sessions, it actively pulls images the participant has seen less frequently, aiming for uniform coverage of the entire set (600 images).

#### 2. Word Type Selection: Real vs. Non-word (`createTrialsForImageWithHistory`)

**Goal:** To present the participant with a target ratio of real and non-words within a session. The current target is **62.5% real words** and **37.5% non-words** (i.e., approximately 25 real and 15 non-words per 40-trial session).

**Dynamic Balancing Mechanism:**
1.  **Tracking:** Throughout the session, counts of already shown real words (`currentRealCount`) and non-words (`currentNonWordCount`) are maintained.
2.  **Target Ratio:** A constant `targetRealRatio = 0.625` is defined.
3.  **Calculating Current Ratio:** Before each new trial, the actual proportion of real words shown *so far* in the session is calculated (`currentRealRatio = currentRealCount / totalSoFar`).
4.  **Adjusting Probability:**
    *   The deviation of the current ratio from the target is calculated (`deviation = currentRealRatio - targetRealRatio`).
    *   The probability of selecting a **real** word for the *next* trial (`adjustedRealWordChance`) is adjusted:
        *   If *too few* real words have been shown (deviation < -0.05), the chance is **increased** (e.g., `targetRealRatio + 0.1`).
        *   If *too many* real words have been shown (deviation > 0.05), the chance is **decreased** (e.g., `targetRealRatio - 0.1`).
        *   If the ratio is close to the target, the base chance (`targetRealRatio`) is used.
5.  **Random Type Selection:** A random number between 0 and 1 is generated. If it is less than `adjustedRealWordChance`, a real word is selected for the current trial; otherwise, a non-word is selected.

**Result:** This system does not guarantee the exact 25/15 ratio in *every* session but dynamically adjusts probabilities so that, on average over the session, the ratio approaches the target of 62.5/37.5.

#### 3. Specific Real Word Selection (`selectWordForImage`)

**Goal:** When a real word is to be shown, select the most appropriate one by prioritizing globally less frequent words, avoiding word repetition *within the session*, and avoiding repeating the *exact same image-word pair* if possible.

**Mechanism:**
1.  **Tracking:**
    *   `shownWordsInSession`: List of words (real and non-words) already shown in the current session.
    *   `wordStatsCache`: Global statistics for each real word (how many times it has been shown to *all* participants). Loaded or updated periodically.
    *   `imageWordHistory`: List of image-word pairs *this participant* has already seen (stored in `progress` as `imagesSeenWithRealWord`).
2.  **Filtering Candidates:**
    *   The full list of real words (`AESTHETIC_WORDS`) is taken.
    *   Words present in `shownWordsInSession` are removed.
    *   From the remainder, words that have already formed a pair with the *current image* are removed (checked against `imageWordHistory`).
3.  **Selecting Least Shown:**
    *   If candidates remain after filtering:
        *   Words with the **minimum** display count (`totalShownCount`) in `wordStatsCache` are identified.
        *   One word is randomly selected from this group of least shown words.
4.  **Fallbacks:**
    *   *Fallback 1:* If no candidates remain after filtering (all suitable words have been shown with this image or in this session), the least shown word (based on `wordStatsCache`) that was **not** in `shownWordsInSession` is selected (ignoring the image-pair history).
    *   *Fallback 2:* If even such words are unavailable (all real words have been shown in this session), an absolutely random real word is selected from the entire `AESTHETIC_WORDS` list.

**Result:** The system tries to maximize the novelty of presented real words and image-word pairs, prioritizing less frequently encountered stimuli.

**Улучшения алгоритма (v2.1):** 
В предыдущей версии при равном счетчике показов система всегда выбирала первое слово из сортированного списка, что приводило к неравномерному распределению. Теперь реализован алгоритм с **случайным выбором** из группы слов с одинаковым (минимальным) счетчиком. Это обеспечивает более равномерное распределение слов и позволяет участнику увидеть все 46 эстетических слов за значительно меньшее количество сессий (3-4 сессии вместо 10+ с предыдущим алгоритмом).

**Результат:** Система максимизирует новизну предъявляемых реальных слов и пар изображение-слово, отдавая предпочтение тем стимулам, которые встречались реже, одновременно поддерживая равномерное распределение всех слов в банке.

#### 4. Non-word Generation (`generateNonWord`)

**Goal:** To create a phonotactically plausible but non-existent Russian word, resembling an adverb (typically ending in -но/-во), while avoiding the generation of actual existing words (from the `AESTHETIC_WORDS` and `EXTERNAL_SIMILAR_ADVERBS` lists) and the specific word that *would* have been shown if it were a real-word trial (`baseWordForMutation`).

**Mechanism:**
1.  **Base Source:** Generation **always** uses a random word selected from the `EXTERNAL_SIMILAR_ADVERBS` list (which does not contain the experiment's target words) as the base for mutation.
2.  **Primary Mutation Methods (for the selected external word):** Applied sequentially until one yields a valid result:
    *   **Random Start (50/50):**
        *   *Option A:* First attempts **vowel swapping** (`mutateBySwappingLetters` with `forceVowels=true`). Swaps two random *internal* (not first or last) vowels. Protects -но/-во endings (penultimate 'о' is not swapped).
        *   *Option B:* First attempts **consonant swapping** (`mutateBySwappingLetters` with `forceConsonants=true`). Swaps two random *internal* consonants **if** there is at least one vowel between them. Protects -но/-во endings (penultimate 'н' or 'в' is not swapped).
    *   **Second Chance:** If the first chosen swap method (A or B) fails (no suitable letters found or result failed checks), the *other* swap method (B or A) is attempted.
    *   **Third Chance:** If *both* swap methods fail, **internal letter replacement** (`mutateByReplacingLetter`) is attempted. A random *internal* letter is replaced with another letter of the same type (vowel-vowel, consonant-consonant).
3.  **Retry with New Base:** If all three methods (Vowel Swap, Consonant Swap, Letter Replace) fail for one selected external word, **another** random word is chosen from `EXTERNAL_SIMILAR_ADVERBS`, and the **entire process from step 2** is repeated for it. Up to 5 such attempts are made with different external base words.
4.  **Fallback - Target Word Mutation:** If *all* attempts with external words fail, the same logic from step 2 (Random Swap -> Other Swap -> Letter Replace) is applied to the *original target word* (`baseWordForMutation`) that was passed into the function.
5.  **Final Fallback:** If **absolutely nothing** works, *another random word* is taken from `EXTERNAL_SIMILAR_ADVERBS`. If it ends in -но/-во, its 3rd-to-last letter is replaced with a random different letter. If it doesn't end that way (or is too short), the last letter is replaced. The result undergoes a final check for existence and plausibility. If it still fails, a very simple modification of the *original target word* is returned.
6.  **Validity Checks:** Any generated word, before being returned, must pass checks:
    *   It differs from the original word it was generated from.
    *   It is not a real word (checked against the combined Set of `AESTHETIC_WORDS` and `EXTERNAL_SIMILAR_ADVERBS`).
    *   It passes the `isPhonotacticallyPlausible` check:
        *   No more than 3 consecutive consonants or 3 consecutive vowels.
        *   Does not contain forbidden letter clusters from the `FORBIDDEN_CLUSTERS` list (e.g., 'чч', 'шш', 'гт', 'бьн', 'ийе', 'тт', 'сй', 'зй' и др.).
        *   Does not start with 3 consonants.
        *   If it starts with 2 consonants, the cluster must be in the `ALLOWED_INITIAL_CONSONANT_CLUSTERS` list.
        *   Does not start with 'ь', 'ъ', 'ц', 'щ'.
        *   Does not end with 'й'.

**Result:** A complex multi-stage process that, with high probability, generates a plausible non-word, using base words unrelated to the experiment's target words and applying several mutation methods with strict phonotactic checks.

## Russian

### Обзор проекта
Это приложение реализует экспериментальный инструмент для изучения имплицитных ассоциаций между визуальными стимулами (изображениями) и эстетическими концепциями. Проект разработан для измерения неосознанных реакций на пары изображение-слово, чтобы понять, как люди воспринимают различные эстетические качества в визуальном контенте.

### Дизайн эксперимента
Эксперимент представляет участникам последовательность испытаний, где кратковременно показывается изображение, после чего следует слово. Участники должны быстро решить, является ли слово реальным эстетическим понятием или бессмысленным словом. Система измеряет:

- Время реакции (в миллисекундах)
- Точность ответов (правильность классификации)
- Закономерности ответов по различным эстетическим измерениям

**Ключевые параметры эксперимента:**
- База данных из ~600 изображений (увеличена с ~80 в v1)
- 46 слов по 6 эстетическим факторам (увеличено с 8 в v1)
- 40 уникальных изображений за сессию (увеличено с 10 в v1)
- 1 испытание на изображение (уменьшено с 6 испытаний на изображение в v1)
- Целевое соотношение 62.5% реальных слов к 37.5% нереальным словам

### Алгоритм сопоставления изображений и слов
Система использует сложный алгоритм для максимизации разнообразия и охвата пар изображение-слово:

1. **Разнообразие сессий**: Каждая сессия показывает 40 уникальных изображений с минимальным повторением между сессиями
2. **История пар изображение-слово**: Отслеживает все ранее показанные комбинации изображение-слово для каждого участника
3. **Приоритетный выбор**: Отдаёт приоритет изображениям, которые показывались реже всего за все предыдущие сессии
4. **Максимизация охвата**: Гарантирует, что все 600 изображений в конечном итоге будут показаны с реальными эстетическими словами
5. **Поддержка бесконечных сессий**: Позволяет проводить неограниченное количество сессий с прогрессивно разными комбинациями изображение-слово

### Сбалансированная система подсчёта очков
Система подсчёта очков учитывает несбалансированное соотношение реальных слов к нереальным:

- **Сбалансированная точность**: Средняя точность для реальных слов и нереальных слов (предотвращает игровое использование системы путем постоянного выбора «слово»)
- **Очки за время**: На основе минимального времени выполнения 57 секунд (1425 мс на испытание)
- **Бонус за раунды**: Нарастающий бонус за каждый завершённый раунд (+5% за первый раунд, +10% за второй, +15% за третий и т.д.)
- **Итоговый счёт**: Комбинация очков за точность (вес 85%) и очков за время (вес 15%), умноженная на бонус за раунды

### Техническая реализация
Приложение построено с использованием:
- React с TypeScript для фронтенда
- Firebase (Firestore) для аутентификации и хранения данных
- Material-UI для отзывчивых компонентов интерфейса
- Развёрнуто на платформе Railway с переменными окружения для конфигурации

### Определение устройства
Система автоматически определяет и записывает тип устройства (мобильное или настольное), используемый для каждой сессии, что позволяет исследователям анализировать различия в производительности между платформами. Это помогает понять, как среда тестирования может влиять на результаты.

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

### Детали Логики Эксперимента

Этот раздел описывает ключевые механизмы выбора стимулов (изображений и слов) и генерации не-слов, используемые в приложении.

#### 1. Выбор Изображения (`selectNextImageIndex`)

**Цель:** Обеспечить относительно равномерный показ всех изображений одному участнику на протяжении всего эксперимента, избегая повторов изображений *внутри одной сессии* (раунда).

**Механизм:**
1.  **Отслеживание:** Для каждого участника в базе данных (Firestore, коллекция `progress`) хранится объект `imageCounts`, где ключ - имя файла изображения, а значение - общее количество раз, которое участник видел это изображение за все предыдущие сессии. Также отслеживается список изображений, показанных в *текущей* сессии (`shownInSession`).
2.  **Фильтрация:** При выборе следующего изображения сначала отбрасываются те, что уже были в `shownInSession`.
3.  **Поиск Наименее Показанных:** Среди оставшихся кандидатов находятся изображения с **минимальным** значением счетчика в `imageCounts`. То есть выбираются те картинки, которые участник видел реже всего глобально.
4.  **Случайный Выбор:** Из группы наименее показанных изображений выбирается одно случайным образом.

**Результат:** Этот алгоритм гарантирует, что в рамках одной сессии (40 испытаний) все изображения будут уникальными. Между сессиями он активно "подтягивает" те изображения, которые участник видел реже, стремясь к равномерному охвату всего набора (600 изображений).

#### 2. Выбор Типа Слова: Реальное vs. Не-слово (`createTrialsForImageWithHistory`)

**Цель:** Предъявлять участнику целевое соотношение реальных и не-слов в рамках одной сессии. Текущая цель: **62.5% реальных слов** и **37.5% не-слов** (т.е. примерно 25 реальных и 15 не-слов на сессию из 40 испытаний).

**Механизм Динамической Балансировки:**
1.  **Отслеживание:** На протяжении сессии ведется подсчет уже показанных реальных слов (`currentRealCount`) и не-слов (`currentNonWordCount`).
2.  **Целевое Соотношение:** Задана константа `targetRealRatio = 0.625`.
3.  **Расчет Текущего Соотношения:** Перед каждым новым испытанием вычисляется фактическая доля реальных слов, показанных *до этого момента* в сессии (`currentRealRatio = currentRealCount / totalSoFar`).
4.  **Коррекция Вероятности:**
    *   Рассчитывается отклонение текущего соотношения от целевого (`deviation = currentRealRatio - targetRealRatio`).
    *   Вероятность выбора **реального** слова для *следующего* испытания (`adjustedRealWordChance`) корректируется:
        *   Если реальных слов показано *слишком мало* (deviation < -0.05), шанс **увеличивается** (например, `targetRealRatio + 0.1`).
        *   Если реальных слов показано *слишком много* (deviation > 0.05), шанс **уменьшается** (например, `targetRealRatio - 0.1`).
        *   Если соотношение близко к целевому, используется базовый шанс (`targetRealRatio`).
5.  **Случайный Выбор Типа:** Генерируется случайное число от 0 до 1. Если оно меньше `adjustedRealWordChance`, для текущего испытания выбирается реальное слово, иначе — не-слово.

**Результат:** Эта система не гарантирует точное соотношение 25/15 в *каждой* сессии, но динамически подстраивает вероятности, чтобы в среднем по сессии соотношение стремилось к целевому 62.5/37.5.

#### 3. Выбор Конкретного Реального Слова (`selectWordForImage`)

**Цель:** Когда решено показать реальное слово, выбрать наиболее подходящее: отдавая предпочтение тем, что показывались реже глобально, избегая повторов слов *внутри сессии* и избегая повтора *той же самой пары* (изображение-слово), если это возможно.

**Механизм:**
1.  **Отслеживание:**
    *   `shownWordsInSession`: Список слов (реальных и не-слов), уже показанных в текущей сессии.
    *   `wordStatsCache`: Глобальная статистика по каждому реальному слову (сколько раз оно было показано *всем* участникам). Загружается или обновляется периодически.
    *   `imageWordHistory`: Список пар (изображение-слово), которые *данный участник* уже видел (хранится в `progress` как `imagesSeenWithRealWord`).
2.  **Фильтрация Кандидатов:**
    *   Берется полный список реальных слов (`AESTHETIC_WORDS`).
    *   Из него удаляются слова, присутствующие в `shownWordsInSession`.
    *   Из оставшихся удаляются слова, которые уже образовывали пару с *текущим изображением* (проверка по `imageWordHistory`).
3.  **Выбор Наименее Показанного:**
    *   Если после фильтрации остались кандидаты:
        *   Находятся слова с **минимальным** счетчиком показов (`totalShownCount`) в `wordStatsCache`.
        *   Из этой группы наименее показанных слов выбирается одно **случайным образом** (улучшение v2.1).
4.  **Резервные Варианты (Fallbacks):**
    *   *Fallback 1:* Если после фильтрации не осталось кандидатов (все подходящие слова уже были показаны с этим изображением или в этой сессии), выбирается случайное слово из группы наименее показанных слов (по `wordStatsCache`) из тех, которых **не было** в `shownWordsInSession` (игнорируя историю пар с этим изображением).
    *   *Fallback 2:* Если даже таких слов нет (все реальные слова уже были показаны в этой сессии), выбирается случайное слово из группы наименее показанных слов из всего списка `AESTHETIC_WORDS`.

**Результат:** The system tries to maximize the novelty of presented real words and image-word pairs, prioritizing less frequently encountered stimuli.

**Улучшения алгоритма (v2.1):** 
В предыдущей версии при равном счетчике показов система всегда выбирала первое слово из сортированного списка, что приводило к неравномерному распределению. Теперь реализован алгоритм с **случайным выбором** из группы слов с одинаковым (минимальным) счетчиком. Это обеспечивает более равномерное распределение слов и позволяет участнику увидеть все 46 эстетических слов за значительно меньшее количество сессий (3-4 сессии вместо 10+ с предыдущим алгоритмом).

**Результат:** Система максимизирует новизну предъявляемых реальных слов и пар изображение-слово, отдавая предпочтение тем стимулам, которые встречались реже, одновременно поддерживая равномерное распределение всех слов в банке.

#### 4. Генерация Не-слов (`generateNonWord`)

**Цель:** Создать фонотактически правдоподобное, но не существующее русское слово, похожее на наречие (обычно оканчивающееся на -но/-во), избегая генерации реально существующих слов (из списков `AESTHETIC_WORDS` и `EXTERNAL_SIMILAR_ADVERBS`) и слова, которое было бы показано, если бы это было испытание с реальным словом (`baseWordForMutation`).

**Механизм:**
1.  **Источник Базы:** Для генерации **всегда** используется случайное слово, выбранное из списка наречий-аналогов `EXTERNAL_SIMILAR_ADVERBS` (который не содержит целевых слов эксперимента).
2.  **Основные Методы Мутации (для выбранного внешнего слова):** Применяются последовательно, пока один из них не даст валидный результат:
    *   **Случайный Старт (50/50):**
        *   *Вариант А:* Сначала пробуется **обмен гласных** (`mutateBySwappingLetters` с `forceVowels=true`). Меняются местами две случайные *внутренние* (не первая и не последняя) гласные. Защищается окончание -но/-во (предпоследняя 'о' не меняется).
        *   *Вариант Б:* Сначала пробуется **обмен согласных** (`mutateBySwappingLetters` с `forceConsonants=true`). Меняются местами две случайные *внутренние* согласные, **если** между ними есть хотя бы одна гласная. Защищается окончание -но/-во (предпоследняя 'н' или 'в' не меняется).
    *   **Второй Шанс:** Если первый выбранный метод обмена (А или Б) не дал результата (не нашлось подходящих букв или результат не прошел проверки), пробуется *другой* метод обмена (Б или А).
    *   **Третий Шанс:** Если *оба* метода обмена не сработали, пробуется **замена внутренней буквы** (`mutateByReplacingLetter`). Случайная *внутренняя* буква заменяется другой буквой того же типа (гласная на гласную, согласная на согласную).
3.  **Повторные Попытки с Новой Базой:** Если все три метода (обмен Гл., обмен Согл., замена Б.) не дали результата для одного выбранного внешнего слова, выбирается **другое** случайное слово из `EXTERNAL_SIMILAR_ADVERBS` и для него повторяется **весь процесс из п.2**. Выполняется до 5 таких попыток с разными внешними словами.
4.  **Резервный Вариант (Fallback) - Мутация Целевого Слова:** Если *все* попытки с внешними словами не дали результата, применяется та же логика из п.2 (Случайный обмен -> Другой обмен -> Замена буквы) к *исходному целевому слову* (`baseWordForMutation`), которое передавалось в функцию.
5.  **Крайний Резерв (Final Fallback):** Если **вообще ничего** не сработало, берется *еще одно случайное слово* из `EXTERNAL_SIMILAR_ADVERBS`. Если оно оканчивается на -но/-во, у него заменяется 3-я с конца буква на случайную другую. Если не оканчивается (или слишком короткое), заменяется последняя буква. Результат проходит финальную проверку на существование и благозвучие. Если и он неудачен, возвращается совсем простая модификация *оригинального целевого слова*.
6.  **Проверки Валидности:** Любое сгенерированное слово перед возвратом проходит проверки:
    *   Не совпадает с исходным словом, из которого генерировалось.
    *   Не является реальным словом (проверка по объединенному Set из `AESTHETIC_WORDS` и `EXTERNAL_SIMILAR_ADVERBS`).
    *   Проходит проверку `isPhonotacticallyPlausible`:
        *   Не более 3 согласных или 3 гласных подряд.
        *   Не содержит запрещенных сочетаний букв из списка `FORBIDDEN_CLUSTERS` (например, 'чч', 'шш', 'гт', 'бьн', 'ийе', 'тт', 'сй', 'зй' и др.).
        *   Не начинается с 3 согласных.
        *   Если начинается с 2 согласных, это сочетание должно быть в списке разрешенных `ALLOWED_INITIAL_CONSONANT_CLUSTERS`.
        *   Не начинается с 'ь', 'ъ', 'ц', 'щ'.
        *   Не оканчивается на 'й'.

**Результат:** Сложный многоступенчатый процесс, который с высокой вероятностью генерирует правдоподобное не-слово, используя в качестве основы слова, не связанные напрямую с целевыми словами эксперимента, и применяя несколько методов мутации с строгими проверками благозвучия.
