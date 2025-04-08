import { AESTHETIC_WORDS } from '../utils/wordBank';

export const aestheticWordMap = AESTHETIC_WORDS.reduce((acc, aw) => {
  acc[aw.word] = { factor: aw.factor, connotation: aw.connotation };
  return acc;
}, {} as { [key: string]: { factor: number; connotation: string } }); 