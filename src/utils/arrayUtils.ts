/**
 * Перемешивает массив с помощью алгоритма Фишера-Йетса
 * @param array Исходный массив
 * @returns Новый перемешанный массив
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
} 