import { ImageData, Trial, Session, WordType, WordTrial } from '../types';
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
      antonym: antonym.trim()
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
        antonym: 'квадрат'
      },
      {
        id: '1',
        fileName: '1.png',
        url: '/images/1.png',
        target: 'квадрат',
        antonym: 'круг'
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
  { factor: 'beauty', word: 'красота', connotation: 'positive' },
  { factor: 'beauty', word: 'прелесть', connotation: 'positive' },
  { factor: 'beauty', word: 'привлекательность', connotation: 'positive' },
  { factor: 'beauty', word: 'уродство', connotation: 'negative' },
  { factor: 'beauty', word: 'безобразие', connotation: 'negative' },
  { factor: 'beauty', word: 'отвращение', connotation: 'negative' },
  
  // Гармония
  { factor: 'harmony', word: 'гармония', connotation: 'positive' },
  { factor: 'harmony', word: 'баланс', connotation: 'positive' },
  { factor: 'harmony', word: 'равновесие', connotation: 'positive' },
  { factor: 'harmony', word: 'беспорядок', connotation: 'negative' },
  { factor: 'harmony', word: 'нестабильность', connotation: 'negative' },
  { factor: 'harmony', word: 'хаос', connotation: 'negative' },
  
  // Динамика
  { factor: 'dynamics', word: 'энергия', connotation: 'positive' },
  { factor: 'dynamics', word: 'живость', connotation: 'positive' },
  { factor: 'dynamics', word: 'динамика', connotation: 'positive' },
  { factor: 'dynamics', word: 'вялость', connotation: 'negative' },
  { factor: 'dynamics', word: 'статика', connotation: 'negative' },
  { factor: 'dynamics', word: 'застой', connotation: 'negative' },
  
  // Оригинальность
  { factor: 'originality', word: 'оригинальность', connotation: 'positive' },
  { factor: 'originality', word: 'новизна', connotation: 'positive' },
  { factor: 'originality', word: 'свежесть', connotation: 'positive' },
  { factor: 'originality', word: 'банальность', connotation: 'negative' },
  { factor: 'originality', word: 'шаблонность', connotation: 'negative' },
  { factor: 'originality', word: 'избитость', connotation: 'negative' },
  
  // Точность
  { factor: 'accuracy', word: 'точность', connotation: 'high' },
  { factor: 'accuracy', word: 'правильность', connotation: 'high' },
  { factor: 'accuracy', word: 'достоверность', connotation: 'high' },
  { factor: 'accuracy', word: 'неточность', connotation: 'low' },
  { factor: 'accuracy', word: 'искажение', connotation: 'low' },
  { factor: 'accuracy', word: 'ошибочность', connotation: 'low' }
];

// Типичные окончания существительных
const NOUN_ENDINGS = {
  masculine: ['ор', 'он', 'ак', 'ик', 'ец', 'от', 'ум', 'ар', 'ир', 'ал'],
  feminine: ['ость', 'ота', 'ина', 'ица', 'ура', 'ада', 'ия'],
  neutral: ['ство', 'ние', 'тие', 'ение', 'ание']
};

// Типы для фонотактических правил
type ConsonantReplacements = {
  hard: { [key: string]: string[] };
  soft: { [key: string]: string[] };
};

type VowelReplacements = {
  afterHard: { [key: string]: string[] };
  afterSoft: { [key: string]: string[] };
};

// Правила русской фонотактики
const PHONOTACTICS: {
  consonantReplacements: ConsonantReplacements;
  vowelReplacements: VowelReplacements;
} = {
  // Допустимые замены для согласных (сохраняя твердость/мягкость)
  consonantReplacements: {
    hard: {
      'б': ['п', 'в', 'м'],
      'в': ['б', 'ф', 'м'],
      'г': ['к', 'д', 'х'],
      'д': ['т', 'г', 'б'],
      'ж': ['ш', 'з'],
      'з': ['с', 'д', 'ж'],
      'к': ['г', 'т', 'х'],
      'л': ['р', 'н'],
      'м': ['н', 'б', 'в'],
      'н': ['м', 'л', 'р'],
      'п': ['б', 'ф', 'т'],
      'р': ['л', 'н'],
      'с': ['з', 'ш'],
      'т': ['д', 'к', 'п'],
      'ф': ['п', 'в'],
      'х': ['к', 'г'],
      'ш': ['ж', 'с'],
      'щ': ['ш', 'ч'],
    },
    soft: {
      'бь': ['пь', 'вь'],
      'вь': ['бь', 'фь'],
      'гь': ['кь', 'дь'],
      'дь': ['ть', 'гь'],
      'зь': ['сь'],
      'кь': ['гь', 'ть'],
      'ль': ['рь', 'нь'],
      'мь': ['нь'],
      'нь': ['мь', 'ль'],
      'пь': ['бь', 'фь'],
      'рь': ['ль', 'нь'],
      'сь': ['зь'],
      'ть': ['дь', 'кь'],
      'фь': ['пь', 'вь'],
    }
  },
  // Допустимые замены для гласных (сохраняя твердость/мягкость)
  vowelReplacements: {
    afterHard: {
      'а': ['о', 'у'],
      'о': ['а', 'у'],
      'у': ['о', 'а'],
      'ы': ['и', 'у'],
      'э': ['а', 'о'],
    },
    afterSoft: {
      'я': ['е', 'ю'],
      'е': ['и', 'я'],
      'и': ['е', 'ю'],
      'ю': ['я', 'е'],
    }
  }
};

// Вычисление расстояния Левенштейна для проверки похожести слов
const levenshteinDistance = (str1: string, str2: string): number => {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j - 1] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j] + 1
        );
      }
    }
  }

  return dp[m][n];
};

// Генератор не-слов на основе фонотактических правил
const generateNonWord = (baseWord: string): string => {
  // Определяем тип существительного по окончанию
  let wordType = 'masculine';
  if (baseWord.endsWith('а') || baseWord.endsWith('я') || 
      baseWord.endsWith('ость') || baseWord.endsWith('ота')) {
    wordType = 'feminine';
  } else if (baseWord.endsWith('о') || baseWord.endsWith('е') ||
             baseWord.endsWith('ие') || baseWord.endsWith('ство')) {
    wordType = 'neutral';
  }

  // Берем основу слова (без окончания)
  let stem = baseWord;
  ['ость', 'ота', 'ство', 'ние', 'ие', 'ия', 'а', 'я', 'о', 'е'].forEach(ending => {
    if (stem.endsWith(ending)) {
      stem = stem.slice(0, -ending.length);
    }
  });

  // Разбиваем слово на слоги для лучшего контроля структуры
  const syllables = stem.match(/[бвгджзклмнпрстфхцчшщ]*[аеиоуыэюя]/gi) || [];
  
  // Выбираем 1-2 слога для изменения (не трогая первый и последний)
  const numChanges = Math.floor(Math.random() * 2) + 1;
  const syllablePositions = new Set<number>();
  while (syllablePositions.size < numChanges && syllablePositions.size < syllables.length - 2) {
    const pos = 1 + Math.floor(Math.random() * (syllables.length - 2));
    if (!syllablePositions.has(pos)) {
      syllablePositions.add(pos);
    }
  }

  // Модифицируем выбранные слоги
  syllablePositions.forEach(pos => {
    const syllable = syllables[pos];
    const vowelMatch = syllable.match(/[аеиоуыэюя]/i);
    if (!vowelMatch) return;

    const vowelIndex = vowelMatch.index!;
    const consonants = syllable.slice(0, vowelIndex);
    const vowel = vowelMatch[0];
    
    // Изменяем согласные, если они есть
    if (consonants) {
      const isLastConsonantSoft = consonants.endsWith('ь');
      const consonantBase = isLastConsonantSoft ? consonants.slice(0, -1) : consonants;
      const lastConsonant = consonantBase[consonantBase.length - 1];
      
      if (lastConsonant) {
        const consonantType = isLastConsonantSoft ? 'soft' : 'hard';
        const replacements = PHONOTACTICS.consonantReplacements[consonantType];
        const possibleReplacements = replacements[lastConsonant.toLowerCase() + (isLastConsonantSoft ? 'ь' : '')] || [];
        
        if (possibleReplacements.length > 0) {
          const replacement = possibleReplacements[Math.floor(Math.random() * possibleReplacements.length)];
          syllables[pos] = consonantBase.slice(0, -1) + replacement + syllable.slice(vowelIndex);
        }
      }
    }
    
    // Изменяем гласную с учетом предыдущего согласного
    const prevChar = consonants[consonants.length - 1] || '';
    const isAfterSoft = /[бвгдзклмнпрстфь]/i.test(prevChar);
    const replacements = isAfterSoft 
      ? PHONOTACTICS.vowelReplacements.afterSoft
      : PHONOTACTICS.vowelReplacements.afterHard;
    
    const possibleReplacements = replacements[vowel.toLowerCase()] || [];
    if (possibleReplacements.length > 0) {
      const replacement = possibleReplacements[Math.floor(Math.random() * possibleReplacements.length)];
      syllables[pos] = syllables[pos].slice(0, vowelIndex) + replacement + 
                       syllables[pos].slice(vowelIndex + 1);
    }
  });

  // Собираем слово обратно
  const newStem = syllables.join('');
  
  // Добавляем новое окончание того же типа
  const endings = NOUN_ENDINGS[wordType as keyof typeof NOUN_ENDINGS];
  const newEnding = endings[Math.floor(Math.random() * endings.length)];
  
  const result = newStem + newEnding;
  
  // Проверяем условия:
  // 1. Не совпадает с исходным словом
  // 2. Достаточно отличается от исходного
  // 3. Длиннее 4 букв
  // 4. Нет повторяющихся букв подряд
  if (result === baseWord || 
      result.toLowerCase() === baseWord.toLowerCase() ||
      levenshteinDistance(result, baseWord) < 2 ||
      result.length <= 4 ||
      /(.)\1/.test(result)) {
    return generateNonWord(baseWord);
  }

  return result;
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

  // 3. Добавляем все факторные слова (30 слов, по 6 для каждой категории)
  for (const factor of ['beauty', 'harmony', 'dynamics', 'originality', 'accuracy']) {
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

  // 4. Добавляем не-слова (20 штук), генерируя их из факторных слов
  const factorWords = FACTOR_WORDS.map(fw => fw.word);
  const usedNonWords = new Set<string>();

  while (trials.filter(t => t.wordType === 'non-word').length < 20) {
    const baseWord = factorWords[Math.floor(Math.random() * factorWords.length)];
    const nonWord = generateNonWord(baseWord);
    
    // Проверяем, что такого не-слова еще не было и оно не совпадает с реальным словом
    if (!usedNonWords.has(nonWord) && !factorWords.includes(nonWord)) {
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
  
  // Выбираем первые 3 пары, которые не были завершены полностью
  const selectedPairs = shuffledPairs
    .filter((pair: ImageData[]) => pair.some((img: ImageData) => !completedImages.includes(img.fileName)))
    .slice(0, 3);

  if (selectedPairs.length < 3) {
    console.log('Not enough incomplete pairs, resetting progress');
    return createSession(participantId, [], isTestSession);
  }

  // Собираем все изображения из выбранных пар
  const selectedImages = selectedPairs.flat().map((img: ImageData) => img.fileName);
  console.log('Selected images for session:', selectedImages);

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
    completed: false
  };
}

// ... rest of the code ... 