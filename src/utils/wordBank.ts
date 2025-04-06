export interface AestheticWord {
  factor: number; // 1-6 (1: Привлекательность, 2: Структура, 3: Точность, 4: Выразительность, 5: Эмоции, 6: Оригинальность)
  word: string;
  connotation: 'positive' | 'negative';
}

// TODO: Заполнить этот массив 46 словами
export const AESTHETIC_WORDS: AestheticWord[] = [
  // Фактор 1: БАЗОВАЯ ЭСТЕТИЧЕСКАЯ ПРИВЛЕКАТЕЛЬНОСТЬ
  { factor: 1, word: 'красиво', connotation: 'positive' },
  { factor: 1, word: 'прекрасно', connotation: 'positive' },
  { factor: 1, word: 'чудесно', connotation: 'positive' },
  { factor: 1, word: 'мило', connotation: 'positive' },
  { factor: 1, word: 'изящно', connotation: 'positive' },
  { factor: 1, word: 'свежо', connotation: 'positive' },
  { factor: 1, word: 'восхитительно', connotation: 'positive' },
  { factor: 1, word: 'привлекательно', connotation: 'positive' },
  { factor: 1, word: 'приятно', connotation: 'positive' },
  { factor: 1, word: 'безобразно', connotation: 'negative' },
  { factor: 1, word: 'уродливо', connotation: 'negative' },
  { factor: 1, word: 'отвратительно', connotation: 'negative' },
  { factor: 1, word: 'страшно', connotation: 'negative' },
  { factor: 1, word: 'дурно', connotation: 'negative' },
  { factor: 1, word: 'мерзко', connotation: 'negative' },
  { factor: 1, word: 'гадко', connotation: 'negative' },
  { factor: 1, word: 'неприятно', connotation: 'negative' },
  { factor: 1, word: 'грубо', connotation: 'negative' },
  { factor: 1, word: 'ужасно', connotation: 'negative' },

  // Фактор 2: СТРУКТУРНАЯ ОРГАНИЗАЦИЯ
  { factor: 2, word: 'ровно', connotation: 'positive' },
  { factor: 2, word: 'цельно', connotation: 'positive' },
  { factor: 2, word: 'складно', connotation: 'positive' },
  { factor: 2, word: 'стройно', connotation: 'positive' },
  { factor: 2, word: 'хаотично', connotation: 'negative' },
  { factor: 2, word: 'коряво', connotation: 'negative' },
  { factor: 2, word: 'криво', connotation: 'negative' },
  { factor: 2, word: 'сумбурно', connotation: 'negative' },

  // Фактор 3: ТОЧНОСТЬ И ЧЁТКОСТЬ
  { factor: 3, word: 'точно', connotation: 'positive' },
  { factor: 3, word: 'чётко', connotation: 'positive' },
  { factor: 3, word: 'ясно', connotation: 'positive' },
  { factor: 3, word: 'неточно', connotation: 'negative' },
  { factor: 3, word: 'мутно', connotation: 'negative' },
  { factor: 3, word: 'размыто', connotation: 'negative' },

  // Фактор 4: ВЫРАЗИТЕЛЬНОСТЬ
  { factor: 4, word: 'живо', connotation: 'positive' },
  { factor: 4, word: 'сочно', connotation: 'positive' },
  { factor: 4, word: 'бойко', connotation: 'positive' },
  { factor: 4, word: 'бледно', connotation: 'negative' },
  { factor: 4, word: 'тускло', connotation: 'negative' },
  { factor: 4, word: 'вяло', connotation: 'negative' },
  { factor: 4, word: 'скучно', connotation: 'negative' },

  // Фактор 5: ЭМОЦИОНАЛЬНОЕ ВОЗДЕЙСТВИЕ
  { factor: 5, word: 'радостно', connotation: 'positive' },
  { factor: 5, word: 'тоскливо', connotation: 'negative' },

  // Фактор 6: ОРИГИНАЛЬНОСТЬ И ИНТЕРЕС
  { factor: 6, word: 'оригинально', connotation: 'positive' },
  { factor: 6, word: 'необычно', connotation: 'positive' },
  { factor: 6, word: 'избито', connotation: 'negative' },
  { factor: 6, word: 'шаблонно', connotation: 'negative' },
];

// Вспомогательные массивы (будут заполнены автоматически или вручную)
export const POSITIVE_AESTHETIC_WORDS: AestheticWord[] = AESTHETIC_WORDS.filter(w => w.connotation === 'positive');
export const NEGATIVE_AESTHETIC_WORDS: AestheticWord[] = AESTHETIC_WORDS.filter(w => w.connotation === 'negative');

// Опционально: Группировка по факторам для возможного использования в будущем
export const WORDS_BY_FACTOR: Record<number, AestheticWord[]> = AESTHETIC_WORDS.reduce((acc, word) => {
  if (!acc[word.factor]) {
    acc[word.factor] = [];
  }
  acc[word.factor].push(word);
  return acc;
}, {} as Record<number, AestheticWord[]>); 