// Lê o .env da pasta do editor (sem dependências). Nunca imprime valores.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PASTA_EDITOR } from './caminhos';

export const lerEnv = () => {
  const arq = join(PASTA_EDITOR, '.env');
  if (!existsSync(arq)) return;
  for (const linha of readFileSync(arq, 'utf8').split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
};
