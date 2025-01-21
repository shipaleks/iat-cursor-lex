import { ImageData, Trial, Session, CommonWord } from '../types';

// Факторные слова (30 слов: по 3 пары для каждой из 5 категорий)
export const FACTOR_WORDS: CommonWord[] = [
  // Красота
  { word: 'красота', category: 'beauty_positive' },
  { word: 'прелесть', category: 'beauty_positive' },
  { word: 'привлекательность', category: 'beauty_positive' },
  { word: 'уродство', category: 'beauty_negative' },
  { word: 'безобразие', category: 'beauty_negative' },
  { word: 'отвращение', category: 'beauty_negative' },
  
  // Гармония
  { word: 'гармония', category: 'harmony_positive' },
  { word: 'баланс', category: 'harmony_positive' },
  { word: 'равновесие', category: 'harmony_positive' },
  { word: 'беспорядок', category: 'harmony_negative' },
  { word: 'нестабильность', category: 'harmony_negative' },
  { word: 'хаос', category: 'harmony_negative' },
  
  // Динамика
  { word: 'динамика', category: 'dynamics_positive' },
  { word: 'движение', category: 'dynamics_positive' },
  { word: 'энергия', category: 'dynamics_positive' },
  { word: 'статика', category: 'dynamics_negative' },
  { word: 'инертность', category: 'dynamics_negative' },
  { word: 'застой', category: 'dynamics_negative' },
  
  // Оригинальность
  { word: 'оригинальность', category: 'originality_positive' },
  { word: 'новизна', category: 'originality_positive' },
  { word: 'уникальность', category: 'originality_positive' },
  { word: 'банальность', category: 'originality_negative' },
  { word: 'шаблонность', category: 'originality_negative' },
  { word: 'стереотипность', category: 'originality_negative' },
  
  // Точность
  { word: 'точность', category: 'accuracy_high' },
  { word: 'четкость', category: 'accuracy_high' },
  { word: 'ясность', category: 'accuracy_high' },
  { word: 'размытость', category: 'accuracy_low' },
  { word: 'нечеткость', category: 'accuracy_low' },
  { word: 'неясность', category: 'accuracy_low' },
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

// Функция для генерации не-слов
const generateNonWord = (word: string, attempts: number = 0): string => {
  // Предотвращаем бесконечную рекурсию
  if (attempts > 10) {
    return word + 'ость'; // Добавляем типичное окончание если не удалось сгенерировать
  }

  // Если исходное слово короче 5 букв, используем более длинное слово из списка
  if (word.length < 5) {
    const longWords = FACTOR_WORDS
      .map(f => f.word)
      .filter(w => w.length >= 5);
    word = longWords[Math.floor(Math.random() * longWords.length)];
  }

  const vowels = 'аеиоуыэя'; // убрали ё и ю
  const consonants = 'бвгдзклмнпрстфхцчшщ'; // убрали й
  
  // Разбиваем слово на слоги (примерно)
  const syllables = word.match(/[бвгдзйклмнпрстфхцчшщ]*[аеёиоуыэюя]+/g) || [word];
  
  // Выбираем случайный слог для модификации, исключая первый и последний
  const availableSyllables = syllables.slice(1, -1);
  if (availableSyllables.length === 0) {
    // Если слово состоит из одного слога, модифицируем середину
    const middleIndex = Math.floor(word.length / 2);
    const char = word[middleIndex];
    const isVowel = 'аеёиоуыэюя'.includes(char.toLowerCase());
    const replacements = isVowel ? vowels : consonants;
    const newChar = replacements[Math.floor(Math.random() * replacements.length)];
    return word.slice(0, middleIndex) + newChar + word.slice(middleIndex + 1);
  }
  
  const syllableIndex = Math.floor(Math.random() * availableSyllables.length) + 1;
  const syllable = syllables[syllableIndex];
  
  // Модифицируем выбранный слог
  let modifiedSyllable = syllable;
  if (Math.random() < 0.5) {
    // Заменяем гласную
    const vowel = syllable.match(/[аеёиоуыэюя]/);
    if (vowel) {
      const newVowel = vowels[Math.floor(Math.random() * vowels.length)];
      modifiedSyllable = syllable.replace(vowel[0], newVowel);
    }
  } else {
    // Заменяем согласную
    const consonant = syllable.match(/[бвгдзйклмнпрстфхцчшщ]/);
    if (consonant) {
      const newConsonant = consonants[Math.floor(Math.random() * consonants.length)];
      modifiedSyllable = syllable.replace(consonant[0], newConsonant);
    }
  }
  
  // Собираем слово обратно
  syllables[syllableIndex] = modifiedSyllable;
  const result = syllables.join('');

  // Если получилось слово короче 5 букв, генерируем новое с увеличенным счетчиком попыток
  if (result.length < 5) {
    return generateNonWord(word, attempts + 1);
  }

  return result;
};

// Функция для создания испытаний для одного изображения
const createTrialsForImage = (image: ImageData): Trial[] => {
  const trials: Trial[] = [];
  
  // Добавляем таргет
  trials.push({
    imageId: image.id,
    word: image.target,
    wordType: 'target'
  });
  
  // Добавляем антоним
  trials.push({
    imageId: image.id,
    word: image.antonym,
    wordType: 'antonym'
  });
  
  // Добавляем факторные слова
  FACTOR_WORDS.forEach(factor => {
    trials.push({
      imageId: image.id,
      word: factor.word,
      wordType: 'factor'
    });
  });
  
  // Генерируем не-слова (20 штук)
  const wordsForNonWords = [image.target, image.antonym, ...FACTOR_WORDS.map(f => f.word)];
  const nonWords = new Set<string>();
  
  while (nonWords.size < 20) {
    const baseWord = wordsForNonWords[Math.floor(Math.random() * wordsForNonWords.length)];
    const nonWord = generateNonWord(baseWord);
    if (!wordsForNonWords.includes(nonWord) && !nonWords.has(nonWord)) {
      nonWords.add(nonWord);
      trials.push({
        imageId: image.id,
        word: nonWord,
        wordType: 'non-word'
      });
    }
  }
  
  return trials;
};

// Функция для перемешивания массива
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Основная функция создания сессии
export const createSession = (
  participantId: string,
  images: ImageData[],
  completedImages: Set<string>,
  imagesPerSession: number = 10
): Session | null => {
  console.log('Creating session with:', {
    participantId,
    totalImages: images.length,
    completedImagesCount: completedImages.size,
    imagesPerSession
  });

  // Если все изображения пройдены, начинаем новый круг
  let availableImages = images;
  if (completedImages.size >= images.length) {
    console.log('All images completed, starting new round');
    completedImages.clear();
  } else {
    // Фильтруем уже использованные изображения
    availableImages = images.filter(img => !completedImages.has(img.id));
  }
  
  console.log('Available images:', availableImages.length);
  
  // Если недостаточно изображений, возвращаем null
  if (availableImages.length < imagesPerSession) {
    console.log('Not enough available images:', {
      available: availableImages.length,
      required: imagesPerSession
    });
    return null;
  }
  
  // Выбираем случайные изображения для сессии
  const sessionImages = shuffleArray(availableImages).slice(0, imagesPerSession);
  console.log('Selected images for session:', sessionImages.map(img => img.id));
  
  // Создаем испытания для каждого изображения
  const allTrials = sessionImages.flatMap(createTrialsForImage);
  console.log('Created trials:', allTrials.length);
  
  // Перемешиваем все испытания
  const shuffledTrials = shuffleArray(allTrials);
  
  const session: Session = {
    trials: shuffledTrials,
    currentTrialIndex: 0,
    completed: false
  };
  
  console.log('Session created successfully:', session);
  return session;
}; 