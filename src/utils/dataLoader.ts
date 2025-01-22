import { ImageData } from '../types';

export const loadImageData = async (): Promise<ImageData[]> => {
  try {
    const response = await fetch('/data/images.tsv');
    const text = await response.text();
    
    // Разбираем TSV файл
    const lines = text.trim().split('\n');
    const headers = lines[0].split('\t');
    
    // Проверяем наличие необходимых колонок
    const requiredColumns = ['png', 'target', 'antonym'];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }
    
    // Преобразуем строки в объекты
    const images: ImageData[] = lines.slice(1).map((line, index) => {
      const values = line.split('\t');
      const [fileName, target, antonym] = values;
      
      return {
        id: `img_${index + 1}`,
        fileName,
        url: `/images/${fileName}`,
        target,
        antonym,
        model: ''
      };
    });
    
    return images;
  } catch (error) {
    console.error('Error loading image data:', error);
    throw error;
  }
}; 