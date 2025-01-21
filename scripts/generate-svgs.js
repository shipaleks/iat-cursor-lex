import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const images = [
  {
    name: 'circle1',
    svg: `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <circle cx="200" cy="200" r="150" stroke="black" stroke-width="2" fill="none"/>
    </svg>`
  },
  {
    name: 'square1',
    svg: `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect x="50" y="50" width="300" height="300" stroke="black" stroke-width="2" fill="none"/>
    </svg>`
  },
  {
    name: 'triangle1',
    svg: `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <polygon points="200,50 350,350 50,350" stroke="black" stroke-width="2" fill="none"/>
    </svg>`
  },
  {
    name: 'star1',
    svg: `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <path d="M200,50 L350,350 L50,150 L350,150 L50,350 Z" stroke="black" stroke-width="2" fill="none"/>
    </svg>`
  },
  {
    name: 'spiral1',
    svg: `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <path d="M200,200 Q300,100 200,50 T50,200 T200,350 T350,200" stroke="black" stroke-width="2" fill="none"/>
    </svg>`
  },
  {
    name: 'hexagon1',
    svg: `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <polygon points="300,200 250,320 150,320 100,200 150,80 250,80" stroke="black" stroke-width="2" fill="none"/>
    </svg>`
  },
  {
    name: 'oval1',
    svg: `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="200" cy="200" rx="180" ry="120" stroke="black" stroke-width="2" fill="none"/>
    </svg>`
  },
  {
    name: 'rhombus1',
    svg: `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <polygon points="200,50 350,200 200,350 50,200" stroke="black" stroke-width="2" fill="none"/>
    </svg>`
  },
  {
    name: 'cross1',
    svg: `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <path d="M125,50 H275 V125 H350 V275 H275 V350 H125 V275 H50 V125 H125 Z" stroke="black" stroke-width="2" fill="none"/>
    </svg>`
  },
  {
    name: 'arrow1',
    svg: `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <path d="M50,200 H300 V100 L400,200 L300,300 V200 Z" stroke="black" stroke-width="2" fill="none"/>
    </svg>`
  },
  // 3D варианты
  {
    name: 'circle2',
    svg: `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="200" cy="200" rx="150" ry="150" stroke="black" stroke-width="2" fill="none"/>
      <ellipse cx="200" cy="140" rx="120" ry="60" stroke="black" stroke-width="2" fill="none"/>
    </svg>`
  },
  {
    name: 'square2',
    svg: `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <path d="M100,100 H300 V300 H100 Z M300,100 L350,50 H150 L100,100 M350,50 V250 L300,300" stroke="black" stroke-width="2" fill="none"/>
    </svg>`
  },
  {
    name: 'triangle2',
    svg: `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <path d="M200,50 L350,350 L50,350 Z M200,50 L250,25 L400,325 L350,350" stroke="black" stroke-width="2" fill="none"/>
    </svg>`
  },
  {
    name: 'star2',
    svg: `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <path d="M200,50 L350,350 L50,150 L350,150 L50,350 Z" stroke="black" stroke-width="2" fill="none"/>
      <path d="M230,25 L380,325 L80,125 L380,125 L80,325 Z" stroke="black" stroke-width="2" fill="none" opacity="0.5"/>
    </svg>`
  },
  {
    name: 'spiral2',
    svg: `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <path d="M200,200 Q300,100 200,50 T50,200 T200,350 T350,200" stroke="black" stroke-width="2" fill="none"/>
      <path d="M220,180 Q320,80 220,30 T70,180 T220,330 T370,180" stroke="black" stroke-width="2" fill="none" opacity="0.5"/>
    </svg>`
  },
  {
    name: 'hexagon2',
    svg: `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <path d="M300,200 L250,320 L150,320 L100,200 L150,80 L250,80 Z" stroke="black" stroke-width="2" fill="none"/>
      <path d="M330,170 L280,290 L180,290 L130,170 L180,50 L280,50 Z" stroke="black" stroke-width="2" fill="none" opacity="0.5"/>
    </svg>`
  },
  {
    name: 'oval2',
    svg: `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="200" cy="200" rx="180" ry="120" stroke="black" stroke-width="2" fill="none"/>
      <ellipse cx="200" cy="140" rx="150" ry="60" stroke="black" stroke-width="2" fill="none"/>
    </svg>`
  },
  {
    name: 'rhombus2',
    svg: `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <path d="M200,50 L350,200 L200,350 L50,200 Z" stroke="black" stroke-width="2" fill="none"/>
      <path d="M230,25 L380,175 L350,200 M200,50 L230,25" stroke="black" stroke-width="2" fill="none"/>
    </svg>`
  },
  {
    name: 'cross2',
    svg: `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <path d="M125,50 H275 V125 H350 V275 H275 V350 H125 V275 H50 V125 H125 Z" stroke="black" stroke-width="2" fill="none"/>
      <path d="M125,50 L155,25 L305,25 L275,50" stroke="black" stroke-width="2" fill="none"/>
    </svg>`
  },
  {
    name: 'arrow2',
    svg: `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <path d="M50,200 H300 V100 L400,200 L300,300 V200 Z" stroke="black" stroke-width="2" fill="none"/>
      <path d="M50,200 L80,170 L330,170 L300,200" stroke="black" stroke-width="2" fill="none"/>
    </svg>`
  }
];

// Создаем директорию для SVG файлов
const outputDir = join(__dirname, '..', 'public', 'images');
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

// Сохраняем SVG файлы
images.forEach(image => {
  const filePath = join(outputDir, `${image.name}.svg`);
  writeFileSync(filePath, image.svg);
  console.log(`Created ${image.name}.svg`);
}); 