import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const sop = readFileSync(join(root, 'prompts', 'sop.md'), 'utf8').trim();
const outDir = join(root, 'functions', '_lib');
mkdirSync(outDir, { recursive: true });
writeFileSync(
  join(outDir, 'instructions.js'),
  `export const INSTRUCTIONS = ${JSON.stringify(sop)};\n`,
);
console.log('Synced prompts/sop.md → functions/_lib/instructions.js');
