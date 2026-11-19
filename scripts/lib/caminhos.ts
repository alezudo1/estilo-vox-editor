import { resolve, sep } from 'node:path';

const EDITOR = resolve(import.meta.dirname, '../..');
export const PASTA_EDITOR = EDITOR;
export const PASTA_VIDEOS = resolve(process.env.VIDEOS_DIR ?? resolve(EDITOR, '../videos'));
export const PASTA_BIBLIOTECA = resolve(process.env.BIBLIOTECA_DIR ?? resolve(EDITOR, '../biblioteca'));
export const PASTA_PRONTAS = resolve(PASTA_BIBLIOTECA, '.prontas');

/** Resolve um caminho dentro de uma raiz, recusando ../ para fora dela. */
export const dentroDe = (raiz: string, ...partes: string[]) => {
  const p = resolve(raiz, ...partes);
  if (p !== raiz && !p.startsWith(raiz.endsWith(sep) ? raiz : raiz + sep)) throw new Error('caminho inválido');
  return p;
};
