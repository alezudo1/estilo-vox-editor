import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { listarVideos, montarPlano, PASTA_VIDEOS, pastaDo } from '../scripts/lib/pasta';

const TIPOS: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif',
  '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.mp4': 'video/mp4', '.json': 'application/json',
};

const api = (): Plugin => ({
  name: 'api-estilo-vox',
  configureServer(server) {
    // avisa o navegador quando algo muda na pasta de vídeos (roteiro, imagens, áudio)
    server.watcher.add(PASTA_VIDEOS);
    server.watcher.on('all', (_ev, arquivo) => {
      if (arquivo.startsWith(PASTA_VIDEOS) && !/[\\/](plano|revisoes)\.json$|[\\/]render[\\/]/.test(arquivo))
        server.ws.send({ type: 'custom', event: 'vox:mudou', data: { arquivo } });
    });

    server.middlewares.use(async (req, res, next) => {
      const url = new URL(req.url ?? '/', 'http://x');
      if (!url.pathname.startsWith('/api/')) return next();
      const json = (dado: unknown, status = 200) => {
        res.statusCode = status;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(dado));
      };
      try {
        const partes = url.pathname.split('/').slice(2).map(decodeURIComponent); // ['videos', slug, ...]
        if (partes[0] !== 'videos') return json({ erro: 'rota desconhecida' }, 404);
        if (partes.length === 1) return json({ pasta: PASTA_VIDEOS, videos: await listarVideos() });
        const pasta = pastaDo(partes[1]);
        if (partes[2] === 'plano') return json(await montarPlano(pasta));
        if (partes[2] === 'arquivos') {
          const caminho = resolve(pasta, ...partes.slice(3));
          if (!caminho.startsWith(pasta) || !existsSync(caminho) || !statSync(caminho).isFile()) return json({ erro: 'arquivo não encontrado' }, 404);
          const tamanho = statSync(caminho).size;
          res.setHeader('Content-Type', TIPOS[extname(caminho).toLowerCase()] ?? 'application/octet-stream');
          res.setHeader('Accept-Ranges', 'bytes');
          res.setHeader('Cache-Control', 'no-cache');
          const faixa = req.headers.range?.match(/bytes=(\d*)-(\d*)/);
          if (faixa) {
            const ini = faixa[1] ? Number(faixa[1]) : 0;
            const fim = faixa[2] ? Number(faixa[2]) : tamanho - 1;
            res.statusCode = 206;
            res.setHeader('Content-Range', `bytes ${ini}-${fim}/${tamanho}`);
            res.setHeader('Content-Length', fim - ini + 1);
            return createReadStream(caminho, { start: ini, end: fim }).pipe(res);
          }
          res.setHeader('Content-Length', tamanho);
          return createReadStream(caminho).pipe(res);
        }
        return json({ erro: 'rota desconhecida' }, 404);
      } catch (e) {
        return json({ erro: (e as Error).message }, 500);
      }
    });
  },
});

export default defineConfig({
  root: resolve(import.meta.dirname),
  plugins: [react(), api()],
  server: { port: 3210, open: true, fs: { allow: [resolve(import.meta.dirname, '..')] } },
});
