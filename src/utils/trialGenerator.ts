import { ImageData, Trial, Session, WordType } from '../types';
import { shuffle } from './arrayUtils';

// Загружаем данные из dictionary.tsv
let IMAGES: ImageData[] = [];

// Функция для загрузки изображений
export async function loadImages(): Promise<ImageData[]> {
  try {
    const response = await fetch('/data/dictionary.tsv');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();
    if (!text) {
      throw new Error('Empty response from server');
    }
    
    const rows = text.trim().split('\n').map(row => row.split('\t'));
    const [header, ...data] = rows;
    
    IMAGES = data.map(([antonym, concept, model], index) => ({
      id: String(index),
      fileName: `${index}.png`,
      url: `/images/${index}.png`,
      target: concept.trim(),
      antonym: antonym.trim(),
      model: model.trim()
    }));

    console.log('Loaded images:', IMAGES);
    return IMAGES;
  } catch (error) {
    console.error('Failed to load dictionary.tsv:', error);
    // Временные тестовые данные
    IMAGES = [
      {
        id: '0',
        fileName: '0.png',
        url: '/images/0.png',
        target: 'круг',
        antonym: 'квадрат',
        model: 'модель1'
      },
      {
        id: '1',
        fileName: '1.png',
        url: '/images/1.png',
        target: 'квадрат',
        antonym: 'круг',
        model: 'модель2'
      }
    ];
    return IMAGES;
  }
}

// Экспортируем массив изображений
export { IMAGES };

// Слова для факторов
export const FACTOR_WORDS = [
  // Красота
  { factor: 'beauty', word: 'красиво', connotation: 'positive' },
  { factor: 'beauty', word: 'безобразно', connotation: 'negative' },
  
  // Точность
  { factor: 'accuracy', word: 'точно', connotation: 'positive' },
  { factor: 'accuracy', word: 'неточно', connotation: 'negative' },
  
  // Гармония
  { factor: 'harmony', word: 'гармонично', connotation: 'positive' },
  { factor: 'harmony', word: 'хаотично', connotation: 'negative' },
  
  // Оригинальность
  { factor: 'originality', word: 'оригинально', connotation: 'positive' },
  { factor: 'originality', word: 'банально', connotation: 'negative' }
];

// Типичные окончания для разных типов слов
const WORD_ENDINGS = {
  nouns: {
    abstract: ['ость', 'ота', 'ство', 'ание', 'ение'],
    other: ['ак', 'ик', 'ец', 'от', 'ар', 'ир', 'ор', 'ун', 'ыш', 'ач']
  },
  adverbs: ['но', 'во']
};

// Обновляем список гласных, убирая ю, ё, й, ы
const VOWELS = new Set(['а', 'е', 'и', 'о', 'у', 'э', 'я']);

// Добавляем функцию проверки на последовательные гласные
function hasConsecutiveVowels(word: string): boolean {
  const lowered = word.toLowerCase();
  for (let i = 0; i < lowered.length - 1; i++) {
    if (VOWELS.has(lowered[i]) && VOWELS.has(lowered[i + 1])) {
      return true;
    }
  }
  return false;
}

// Добавляем функцию проверки на три согласные подряд
function hasThreeConsecutiveConsonants(word: string): boolean {
  const lowered = word.toLowerCase();
  let consecutiveCount = 0;
  
  for (let i = 0; i < lowered.length; i++) {
    if (!VOWELS.has(lowered[i])) {
      consecutiveCount++;
      if (consecutiveCount > 2) return true;
    } else {
      consecutiveCount = 0;
    }
  }
  return false;
}

// Обновляем ADVERB_RULES
const ADVERB_RULES = {
  // Начальные сочетания согласных
  initialConsonants: {
    // Шумный + сонорный
    obstruentSonorant: ['пр', 'бр', 'тр', 'др', 'кр', 'гр', 'вр', 'пл', 'бл', 'кл', 'гл', 'фл'],
    // Шумный + шумный
    obstruentObstruent: ['ст', 'ск', 'сп', 'зд', 'шт', 'жд'],
    // в + согласный
    vClusters: ['вз', 'вс', 'вн'],
    // Одиночные согласные (исключаем ц и щ)
    single: 'бвгджзклмнпрстфхчш'.split('')
  },
  
  // Суффиксы для наречий с их весами
  suffixes: [
    { value: 'тельн', weight: 0.2 },
    { value: 'ичн', weight: 0.2 },
    { value: 'альн', weight: 0.2 },
    { value: 'озн', weight: 0.15 },
    { value: 'ивн', weight: 0.15 },
    { value: '', weight: 0.1 } // Для случаев как "красиво"
  ],
  
  // Гласные после шипящих
  vowelsAfterHushing: ['а', 'о', 'у', 'е', 'и'],
  
  // Гласные после ц - удаляем, так как ц исключена
  
  // Используем общий список гласных
  regularVowels: Array.from(VOWELS),
  
  hasConsecutiveVowels,
  hasThreeConsecutiveConsonants
};

// Выбор элемента с учетом весов
function weightedChoice<T extends { weight: number }>(items: T[]): T {
  if (!items.length) return items[0];
  
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item;
  }
  
  return items[0];
}

// Генерация основы слова
function generateStem(): string {
  const consonants = ADVERB_RULES.initialConsonants.single;
  const vowels = ADVERB_RULES.regularVowels;
  
  // Создаем основу CVCVCV или CCVCVCV
  const useCluster = Math.random() < 0.4; // Увеличили вероятность кластера
  let stem = '';
  
  if (useCluster) {
    const clusters = [
      ...ADVERB_RULES.initialConsonants.obstruentSonorant,
      ...ADVERB_RULES.initialConsonants.obstruentObstruent,
      ...ADVERB_RULES.initialConsonants.vClusters
    ];
    stem = clusters[Math.floor(Math.random() * clusters.length)];
  } else {
    stem = consonants[Math.floor(Math.random() * consonants.length)];
  }
  
  // Добавляем 2-3 слога CV
  const syllableCount = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < syllableCount; i++) {
    // Добавляем гласный
    stem += vowels[Math.floor(Math.random() * vowels.length)];
    
    // Добавляем согласный (кроме последнего слога)
    if (i < syllableCount - 1) {
      stem += consonants[Math.floor(Math.random() * consonants.length)];
    }
  }
  
  return stem;
}

// Проверка на допустимость сочетаний согласных
function hasValidConsonantClusters(word: string): boolean {
  // Проверка на недопустимые сочетания в начале
  const initialCluster = word.match(/^[бвгджзклмнпрстфхцчшщ]+/)?.[0] || '';
  if (initialCluster.length > 2) return false;
  
  // Проверка на недопустимые сочетания внутри слова
  const consonantClusters = word.match(/[бвгджзклмнпрстфхцчшщ]{2,}/g) || [];
  return !consonantClusters.some(cluster => cluster.length > 3);
}

// Генератор не-слов
const generateNonWord = (baseWord: string, wordType: WordType, attempts: number = 0): string => {
  // Если слишком много попыток, возвращаем простое слово
  if (attempts > 10) {
    const consonants = ADVERB_RULES.initialConsonants.single;
    const vowels = ADVERB_RULES.regularVowels;
    
    if (wordType === 'factor') {
      const stem = consonants[Math.floor(Math.random() * consonants.length)] +
                  vowels[Math.floor(Math.random() * vowels.length)] +
                  consonants[Math.floor(Math.random() * consonants.length)] +
                  vowels[Math.floor(Math.random() * vowels.length)];
      
      // Случайный выбор между разными окончаниями
      const endings = ['ично', 'ально', 'иво'];
      return stem + endings[Math.floor(Math.random() * endings.length)];
    } else {
      return consonants[Math.floor(Math.random() * consonants.length)] +
             vowels[Math.floor(Math.random() * vowels.length)] +
             consonants[Math.floor(Math.random() * consonants.length)] +
             'ость';
    }
  }

  if (wordType === 'factor') {
    const stem = generateStem();
    const suffix = weightedChoice(ADVERB_RULES.suffixes);
    const ending = Math.random() < 0.8 ? 'но' : 'во';
    const result = stem + suffix.value + ending;
    
    if (result === baseWord ||
        result.length < 5 ||
        result.length > 11 || // Увеличили максимальную длину
        hasConsecutiveVowels(result) ||
        hasThreeConsecutiveConsonants(result) ||
        /[юёйы]/i.test(result)) {
      return generateNonWord(baseWord, wordType, attempts + 1);
    }
    
    return result;
  } else {
    // Для существительных используем простую генерацию
    const stem = generateStem();
    const endingTypes = Math.random() < 0.6 ? WORD_ENDINGS.nouns.other : WORD_ENDINGS.nouns.abstract;
    const ending = endingTypes[Math.floor(Math.random() * endingTypes.length)];
    const result = stem + ending;
    
    if (result === baseWord ||
        result.length < 5 ||
        result.length > 10 ||
        hasConsecutiveVowels(result) ||
        hasThreeConsecutiveConsonants(result) ||
        /[юёйы]/i.test(result)) {
      return generateNonWord(baseWord, wordType, attempts + 1);
    }
    
    return result;
  }
};

/**
 * Создает испытания для одного изображения
 */
function createTrialsForImage(image: ImageData): Trial[] {
  const trials: Trial[] = [];
  
  // 1. Добавляем целевое слово (концепт)
  trials.push({
    imageId: image.id,
    word: image.target,
    wordType: 'target'
  });

  // 2. Добавляем антоним
  trials.push({
    imageId: image.id,
    word: image.antonym,
    wordType: 'antonym'
  });

  // 3. Добавляем все факторные слова (8 слов, по 2 для каждого фактора)
  for (const factor of ['beauty', 'accuracy', 'harmony', 'originality']) {
    // Берем все слова для текущего фактора
    const factorWords = FACTOR_WORDS.filter(fw => fw.factor === factor);
    // Добавляем каждое слово
    for (const factorWord of factorWords) {
      trials.push({
        imageId: image.id,
        word: factorWord.word,
        wordType: 'factor'
      });
    }
  }

  // 4. Добавляем не-слова (10 штук)
  const usedNonWords = new Set<string>();
  
  // Генерируем 2 не-слова для концепта/антонима
  const conceptWords = [image.target, image.antonym];
  for (let i = 0; i < 2; i++) {
    const baseWord = conceptWords[Math.floor(Math.random() * conceptWords.length)];
    let nonWord = generateNonWord(baseWord, 'target');
    
    while (usedNonWords.has(nonWord)) {
      nonWord = generateNonWord(baseWord, 'target');
    }
    
    usedNonWords.add(nonWord);
    trials.push({
      imageId: image.id,
      word: nonWord,
      wordType: 'non-word'
    });
  }
  
  // Генерируем 8 не-слов для факторных слов
  const factorWords = FACTOR_WORDS.map(fw => fw.word);
  while (trials.filter(t => t.wordType === 'non-word').length < 10) {
    const baseWord = factorWords[Math.floor(Math.random() * factorWords.length)];
    let nonWord = generateNonWord(baseWord, 'factor');
    
    if (!usedNonWords.has(nonWord)) {
      usedNonWords.add(nonWord);
      trials.push({
        imageId: image.id,
        word: nonWord,
        wordType: 'non-word'
      });
    }
  }
  
  return trials;
}

// Группируем изображения по парам (concept/antonym)
function groupImagesByPairs(images: ImageData[]): ImageData[][] {
  const pairs: { [key: string]: ImageData[] } = {};
  
  // Группируем изображения по их concept/antonym парам
  images.forEach((img: ImageData) => {
    const key = `${img.target}_${img.antonym}`;
    if (!pairs[key]) {
      pairs[key] = [];
    }
    pairs[key].push(img);
  });

  return Object.values(pairs);
}

// Функция для предварительной загрузки изображений
function preloadImages(imageUrls: string[]): Promise<void> {
  return Promise.all(imageUrls.map(url => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    });
  })).then(() => {});
}

export async function createSession(
  participantId: string,
  completedImages: string[],
  isTestSession: boolean
): Promise<Session> {
  // Убеждаемся, что изображения загружены
  if (IMAGES.length === 0) {
    await loadImages();
  }
  
  // Группируем изображения по парам
  const imagePairs = groupImagesByPairs(IMAGES);
  
  // Перемешиваем пары
  const shuffledPairs = shuffle(imagePairs);
  
  // Выбираем первые 2 пары (4 изображения), которые не были завершены полностью
  const selectedPairs = shuffledPairs
    .filter((pair: ImageData[]) => pair.some((img: ImageData) => !completedImages.includes(img.fileName)))
    .slice(0, 2);  // Было 3, стало 2

  if (selectedPairs.length < 2) {  // Было < 3, стало < 2
    console.log('Not enough incomplete pairs, resetting progress');
    return createSession(participantId, [], isTestSession);
  }

  // Собираем все изображения из выбранных пар
  const selectedImages = selectedPairs.flat().map((img: ImageData) => img.fileName);
  console.log('Selected images for session:', selectedImages);

  // Предварительная загрузка изображений
  const imageUrls = selectedImages.map((fileName: string) => `/images/${fileName}`);
  await preloadImages(imageUrls);

  // Создаем испытания для каждого изображения
  const trials: Trial[] = [];
  selectedImages.forEach((img: string) => {
    const image = IMAGES.find(i => i.fileName === img);
    if (image) {
      trials.push(...createTrialsForImage(image));
    }
  });

  // Перемешиваем испытания
  const shuffledTrials = shuffle(trials);

  return {
    sessionId: Math.random().toString(36).substring(7),
    participantId,
    imageIds: selectedImages,
    currentImageIndex: 0,
    currentTrialIndex: 0,
    trials: shuffledTrials,
    completed: false,
    completedTrials: 0,
    totalTrials: shuffledTrials.length
  } as Session;
}

// ... rest of the code ... 