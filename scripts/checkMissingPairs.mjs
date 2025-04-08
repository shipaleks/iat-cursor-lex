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

// Функция для нормализации промпта
function normalizePrompt(prompt) {
  return prompt.trim().replace(/\s+/g, ' ');
}

async function main() {
  try {
    console.log('Проверка пар изображений...');
    
    // Чтение файлов
    const csvText = fs.readFileSync(CSV_PATH, 'utf8');
    const manualPairs = JSON.parse(fs.readFileSync(MANUAL_PAIRS_PATH, 'utf8'));
    
    // Парсинг CSV
    const csvRows = parseCSV(csvText);
    
    // Получаем индексы нужных колонок из заголовка
    const csvHeaders = csvRows[0];
    const promptIndex = csvHeaders.findIndex(h => h.trim() === 'prompt');
    const modelIndex = csvHeaders.findIndex(h => h.trim() === 'model_name');
    const fileNameIndex = csvHeaders.findIndex(h => h.trim() === 'file_name');
    
    // Структуры данных для анализа
    const promptByFile = {};
    const modelByFile = {};
    const filesByPrompt = {};
    
    // Заполняем структуры данных
    for (let i = 1; i < csvRows.length; i++) {
      const row = csvRows[i];
      if (row.length <= Math.max(promptIndex, modelIndex, fileNameIndex)) {
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
    
    // Проверка всех файлов на наличие пар
    console.log('\nАнализ пар файлов:');
    
    // Общая статистика
    const totalFiles = Object.keys(promptByFile).length;
    const v8Files = Object.entries(modelByFile).filter(([_, model]) => model === 'v8_latent_finetune').length;
    const v10Files = Object.entries(modelByFile).filter(([_, model]) => model === 'v10_rl_09_lcm_lora_s8r64').length;
    
    console.log(`Всего файлов: ${totalFiles}`);
    console.log(`Файлов модели v8_latent_finetune: ${v8Files}`);
    console.log(`Файлов модели v10_rl_09_lcm_lora_s8r64: ${v10Files}`);
    
    // Проверка ассоциированных файлов
    const missingPairs = [];
    const manualPairFiles = Object.keys(manualPairs);
    
    // Функция для поиска ассоциированного файла
    const findAssociatedFile = (fileName) => {
      // Проверяем ручные пары
      if (manualPairs[fileName]) {
        return manualPairs[fileName];
      }
      
      // Иначе ищем по промпту
      const prompt = promptByFile[fileName];
      if (!prompt) return null;
      
      const files = filesByPrompt[prompt] || [];
      const currentModel = modelByFile[fileName];
      
      // Находим файл с тем же промптом, но другой моделью
      return files.find(file => 
        file !== fileName && modelByFile[file] !== currentModel
      );
    };
    
    // Проверяем все файлы
    Object.keys(promptByFile).forEach(fileName => {
      const associatedFile = findAssociatedFile(fileName);
      
      if (!associatedFile) {
        missingPairs.push({
          fileName,
          model: modelByFile[fileName],
          prompt: promptByFile[fileName]?.substring(0, 50) + '...'
        });
      }
    });
    
    // Список файлов без пар
    if (missingPairs.length > 0) {
      console.log(`\nФайлы без пар (${missingPairs.length}):`);
      missingPairs.forEach(({ fileName, model, prompt }) => {
        console.log(`${fileName} (${model}): "${prompt}"`);
      });
    } else {
      console.log('\nВсе файлы имеют соответствующие пары! 👍');
    }
    
    // Проверка вручную заданных пар
    console.log(`\nВручную заданные пары (${manualPairFiles.length}):`);
    
    // Создаем набор для проверки двунаправленности
    const processedPairs = new Set();
    
    manualPairFiles.forEach(file1 => {
      const file2 = manualPairs[file1];
      const pairKey = [file1, file2].sort().join('|');
      
      // Пропускаем, если уже обработали эту пару
      if (processedPairs.has(pairKey)) return;
      processedPairs.add(pairKey);
      
      console.log(`${file1} (${modelByFile[file1] || 'неизвестно'}) <-> ${file2} (${modelByFile[file2] || 'неизвестно'})`);
      
      // Проверка взаимности
      if (!manualPairs[file2] || manualPairs[file2] !== file1) {
        console.log(`  ⚠️ ОШИБКА: Отсутствует обратная связь для ${file2} -> ${file1}`);
      }
      
      // Проверка существования файлов
      if (!promptByFile[file1]) {
        console.log(`  ⚠️ ОШИБКА: Файл ${file1} не найден в данных CSV`);
      }
      if (!promptByFile[file2]) {
        console.log(`  ⚠️ ОШИБКА: Файл ${file2} не найден в данных CSV`);
      }
      
      // Проверка моделей
      if (modelByFile[file1] && modelByFile[file2] && modelByFile[file1] === modelByFile[file2]) {
        console.log(`  ⚠️ ОШИБКА: Файлы ${file1} и ${file2} принадлежат одной модели ${modelByFile[file1]}`);
      }
      
      // Проверка промптов
      const prompt1 = promptByFile[file1];
      const prompt2 = promptByFile[file2];
      
      if (prompt1 && prompt2) {
        const samePrompt = normalizePrompt(prompt1) === normalizePrompt(prompt2);
        
        if (!samePrompt) {
          console.log(`  ⚠️ ОШИБКА: Промпты отличаются:`);
          console.log(`    ${file1}: "${prompt1?.substring(0, 50)}..."`);
          console.log(`    ${file2}: "${prompt2?.substring(0, 50)}..."`);
        }
      }
    });
    
    console.log('\nПроверка завершена!');
    
  } catch (error) {
    console.error('Ошибка при проверке пар изображений:', error);
    process.exit(1);
  }
}

main(); 