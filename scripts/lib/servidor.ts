// Serve os arquivos dos vídeos e da biblioteca em /arquivos/video/<slug>/... e /arquivos/biblioteca/...
// Usado pelo painel (middleware do Vite) e pelo render (servidor local temporário).
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { extname } from 'node:path';
import { dentroDe, PASTA_BIBLIOTECA, PASTA_VIDEOS } from './caminhos';

const TIPOS: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif',
  '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.mp4': 'video/mp4', '.json': 'application/json',
};

/** Responde se a URL for de /arquivos/; devolve false para deixar passar. */
export function servirArquivo(req: IncomingMessage, res: ServerResponse, pastaVideos = PASTA_VIDEOS): boolean {
  const url = new URL(req.url ?? '/', 'http://x');
  if (!url.pathname.startsWith('/arquivos/')) return false;
  const partes = url.pathname.split('/').slice(2).map(decodeURIComponent);
  let caminho: string;
  try {
    if (partes[0] === 'video') caminho = dentroDe(dentroDe(pastaVideos, partes[1]), ...partes.slice(2));
    else if (partes[0] === 'biblioteca') caminho = dentroDe(PASTA_BIBLIOTECA, ...partes.slice(1));
    else throw new Error();
  } catch {
    res.statusCode = 400;
    res.end('caminho inválido');
    return true;
  }
  if (!existsSync(caminho) || !statSync(caminho).isFile()) {
    res.statusCode = 404;
    res.end('não encontrado');
    return true;
  }
  const tamanho = statSync(caminho).size;
  res.setHeader('Content-Type', TIPOS[extname(caminho).toLowerCase()] ?? 'application/octet-stream');
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Access-Control-Allow-Origin', '*');
  const faixa = req.headers.range?.match(/bytes=(\d*)-(\d*)/);
  if (faixa) {
    const ini = faixa[1] ? Number(faixa[1]) : 0;
    const fim = faixa[2] ? Number(faixa[2]) : tamanho - 1;
    res.statusCode = 206;
    res.setHeader('Content-Range', `bytes ${ini}-${fim}/${tamanho}`);
    res.setHeader('Content-Length', fim - ini + 1);
    createReadStream(caminho, { start: ini, end: fim }).pipe(res);
  } else {
    res.setHeader('Content-Length', tamanho);
    createReadStream(caminho).pipe(res);
  }
  return true;
}

/** Sobe um servidor local só de arquivos (para o render). */
export async function iniciarServidorArquivos(pastaVideos = PASTA_VIDEOS) {
  const servidor = createServer((req, res) => {
    if (!servirArquivo(req, res, pastaVideos)) {
      res.statusCode = 404;
      res.end();
    }
  });
  await new Promise<void>((ok) => servidor.listen(0, '127.0.0.1', ok));
  const { port } = servidor.address() as AddressInfo;
  return { base: `http://127.0.0.1:${port}/arquivos`, fechar: () => servidor.close() };
}
