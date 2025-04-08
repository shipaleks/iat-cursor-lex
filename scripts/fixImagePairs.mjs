import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.resolve(__dirname, '../public/data/exp2_samples.csv');
const MANUAL_PAIRS_PATH = path.resolve(__dirname, '../src/data/manualPairs.json');

// Функция для парсинга CSV файла
function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    if (char === '"') {
      if (i + 1 < text.length && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && i + 1 < text.length && text[i + 1] === '\n') {
        i++;
      }
      
      if (cell !== '' || row.length > 0) {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = '';
      }
    } else {
      cell += char;
    }
  }
  
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  
  return rows;
}

// Функция для нормализации промпта (удаление лишних пробелов и т.д.)
function normalizePrompt(prompt) {
  return prompt.trim().replace(/\s+/g, ' ');
}

// Функция для поиска наиболее похожего промпта
function findMostSimilarPrompt(targetPrompt, allPrompts) {
  let bestMatch = null;
  let highestSimilarity = 0;
  
  for (const prompt of allPrompts) {
    if (prompt === targetPrompt) continue;
    
    // Простой алгоритм сходства на основе общих слов
    const words1 = targetPrompt.toLowerCase().split(/\s+/);
    const words2 = prompt.toLowerCase().split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const similarity = commonWords.length / Math.max(words1.length, words2.length);
    
    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      bestMatch = prompt;
    }
  }
  
  return { prompt: bestMatch, similarity: highestSimilarity };
}

async function main() {
  try {
    console.log('Загрузка и анализ файла exp2_samples.csv...');
    
    // Чтение файла
    const csvText = fs.readFileSync(CSV_PATH, 'utf8');
    const csvRows = parseCSV(csvText);
    
    // Получаем индексы нужных колонок из заголовка
    const csvHeaders = csvRows[0];
    const promptIndex = csvHeaders.findIndex(h => h.trim() === 'prompt');
    const modelIndex = csvHeaders.findIndex(h => h.trim() === 'model_name');
    const fileNameIndex = csvHeaders.findIndex(h => h.trim() === 'file_name');
    
    if (promptIndex === -1 || modelIndex === -1 || fileNameIndex === -1) {
      console.error('Не найдены необходимые колонки в CSV:', csvHeaders);
      process.exit(1);
    }
    
    // Структуры данных для анализа
    const promptByFile = {};
    const modelByFile = {};
    const filesByPrompt = {};
    
    // Заполняем структуры данных
    for (let i = 1; i < csvRows.length; i++) {
      const row = csvRows[i];
      if (row.length <= Math.max(promptIndex, modelIndex, fileNameIndex)) {
        console.warn(`Пропуск неполной строки: ${row}`);
        continue;
      }
      
      const prompt = normalizePrompt(row[promptIndex]);
      const model = row[modelIndex].trim();
      const fileName = row[fileNameIndex].trim();
      
      if (prompt && model && fileName) {
        promptByFile[fileName] = prompt;
        modelByFile[fileName] = model;
        
        if (!filesByPrompt[prompt]) {
          filesByPrompt[prompt] = [];
        }
        filesByPrompt[prompt].push(fileName);
      }
    }
    
    // Проверка конкретных файлов
    console.log('\nПроверка проблемных файлов:');
    const problemFiles = ['17.png', '19.png', '32.png', '34.png', '61.png'];
    
    problemFiles.forEach(fileName => {
      const prompt = promptByFile[fileName];
      console.log(`\nФайл ${fileName}:`);
      
      if (!prompt) {
        console.log(`  Промпт не найден для файла ${fileName}`);
        return;
      }
      
      console.log(`  Модель: ${modelByFile[fileName]}`);
      console.log(`  Промпт: "${prompt.substring(0, 100)}..."`);
      
      const filesWithSamePrompt = filesByPrompt[prompt] || [];
      console.log(`  Файлы с таким же промптом: ${filesWithSamePrompt.join(', ')}`);
      
      // Найти ассоциированный файл
      const currentModel = modelByFile[fileName];
      const associatedFile = filesWithSamePrompt.find(file => 
        file !== fileName && modelByFile[file] !== currentModel
      );
      
      if (associatedFile) {
        console.log(`  Ассоциированный файл: ${associatedFile} (${modelByFile[associatedFile]})`);
      } else {
        console.log(`  Ассоциированный файл не найден!`);
      }
    });
    
    // Анализ всех файлов
    console.log('\nАнализ всех файлов в CSV:');
    const totalFiles = Object.keys(promptByFile).length;
    console.log(`Всего файлов: ${totalFiles}`);
    
    // Создаем словарь ассоциированных файлов
    const associatedFiles = {};
    const filesWithoutPairs = [];
    
    Object.keys(promptByFile).forEach(fileName => {
      const prompt = promptByFile[fileName];
      const currentModel = modelByFile[fileName];
      const filesWithSamePrompt = filesByPrompt[prompt] || [];
      
      // Находим файл с тем же промптом, но другой моделью
      const associatedFile = filesWithSamePrompt.find(file => 
        file !== fileName && modelByFile[file] !== currentModel
      );
      
      if (associatedFile) {
        associatedFiles[fileName] = associatedFile;
      } else {
        filesWithoutPairs.push(fileName);
      }
    });
    
    console.log(`Файлы с найденными парами: ${Object.keys(associatedFiles).length}`);
    console.log(`Файлы без пар: ${filesWithoutPairs.length}`);
    
    // Создаем ручные соответствия для проблемных файлов
    const manualPairs = {};
    const allPrompts = [...new Set(Object.values(promptByFile))];
    
    console.log('\nСоздание ручных соответствий для проблемных файлов:');
    
    filesWithoutPairs.forEach(fileName => {
      const prompt = promptByFile[fileName];
      const model = modelByFile[fileName];
      
      if (!prompt) return;
      
      // Находим наиболее похожий промпт
      const { prompt: similarPrompt, similarity } = findMostSimilarPrompt(prompt, allPrompts);
      
      if (similarPrompt && similarity > 0.5) {
        // Находим файл с похожим промптом и другой моделью
        const potentialMatches = filesByPrompt[similarPrompt].filter(
          f => modelByFile[f] !== model
        );
        
        if (potentialMatches.length > 0) {
          const match = potentialMatches[0];
          manualPairs[fileName] = match;
          manualPairs[match] = fileName; // Двусторонняя связь
          
          console.log(`${fileName} (${model}) -> ${match} (${modelByFile[match]})`);
          console.log(`  Схожесть промптов: ${(similarity * 100).toFixed(1)}%`);
          console.log(`  Оригинальный промпт: "${prompt.substring(0, 50)}..."`);
          console.log(`  Похожий промпт: "${similarPrompt.substring(0, 50)}..."`);
        }
      }
    });
    
    // Добавляем известные проблемные пары
    const knownPairs = {
      '54.png': '495.png',
      '495.png': '54.png',
      '17.png': '462.png',
      '462.png': '17.png',
      '19.png': '236.png',
      '236.png': '19.png',
      '32.png': '268.png',
      '268.png': '32.png',
      '34.png': '330.png',
      '330.png': '34.png',
      '61.png': '507.png',
      '507.png': '61.png'
    };
    
    // Объединяем с найденными парами
    const finalManualPairs = { ...manualPairs, ...knownPairs };
    
    console.log(`\nВсего создано ${Object.keys(finalManualPairs).length / 2} пар (${Object.keys(finalManualPairs).length} записей)`);
    
    // Сохраняем результат в JSON файл
    fs.writeFileSync(MANUAL_PAIRS_PATH, JSON.stringify(finalManualPairs, null, 2));
    console.log(`\nРучные соответствия сохранены в файл: ${MANUAL_PAIRS_PATH}`);
    
    console.log('\nПредложение по интеграции:');
    console.log(`
1. Создайте файл src/data/manualPairs.json (он уже создан скриптом)
2. Импортируйте этот файл в DataExport.tsx:

   import manualPairsData from '../data/manualPairs.json';

3. Замените существующий объект manualPairs в DataExport.tsx:

   const manualPairs: { [key: string]: string } = manualPairsData;
    `);
    
    console.log('\nАнализ завершен.');
    
  } catch (error) {
    console.error('Ошибка при обработке файла exp2_samples.csv:', error);
    process.exit(1);
  }
}

main(); 