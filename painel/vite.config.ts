import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { PASTA_BIBLIOTECA, PASTA_VIDEOS } from '../scripts/lib/caminhos';
import { listarVideos, montarPlano, pastaDo } from '../scripts/lib/pasta';
import { servirArquivo } from '../scripts/lib/servidor';

const api = (): Plugin => ({
  name: 'api-estilo-vox',
  configureServer(server) {
    // avisa o navegador quando algo muda nos vídeos ou na biblioteca (roteiro, imagens, áudio, objetos)
    server.watcher.add([PASTA_VIDEOS, PASTA_BIBLIOTECA]);
    server.watcher.on('all', (_ev, arquivo) => {
      const nosVideos = arquivo.startsWith(PASTA_VIDEOS) || arquivo.startsWith(PASTA_BIBLIOTECA);
      if (nosVideos && !/[\\/](plano|revisoes)\.json$|[\\/]render[\\/]|[\\/]\.prontas[\\/]/.test(arquivo))
        server.ws.send({ type: 'custom', event: 'vox:mudou', data: { arquivo } });
    });

    server.middlewares.use(async (req, res, next) => {
      if (servirArquivo(req, res)) return;
      const url = new URL(req.url ?? '/', 'http://x');
      if (!url.pathname.startsWith('/api/')) return next();
      const json = (dado: unknown, status = 200) => {
        res.statusCode = status;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(dado));
      };
      try {
        const partes = url.pathname.split('/').slice(2).map(decodeURIComponent); // ['videos', slug, 'plano']
        if (partes[0] !== 'videos') return json({ erro: 'rota desconhecida' }, 404);
        if (partes.length === 1) return json({ pasta: PASTA_VIDEOS, videos: await listarVideos() });
        if (partes[2] === 'plano') return json(await montarPlano(pastaDo(partes[1])));
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
