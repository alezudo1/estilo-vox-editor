// Uso: npm run render -- <pasta-do-video> [--quadros 0,90,200] [--rascunho]
//   sem --quadros: renderiza o MP4 final em <pasta>/render/<slug>.mp4
//   com --quadros: só gera PNGs desses quadros (conferência rápida)
import { existsSync, mkdirSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import { montarPlano } from './lib/pasta';
import { iniciarServidorArquivos } from './lib/servidor';

const args = process.argv.slice(2);
const pasta = resolve(args.find((a) => !a.startsWith('--') && !/^[\d,]+$/.test(a)) ?? '.');
const iq = args.indexOf('--quadros');
const quadros = iq >= 0 ? args[iq + 1].split(',').map(Number) : null;
const rascunho = args.includes('--rascunho');
const slug = basename(pasta);

const plano = await montarPlano(pasta);
const erros = plano.avisos.filter((a) => a.nivel === 'erro');
if (erros.length && !quadros) {
  console.error('O plano tem erros; corrija antes do render final:');
  erros.forEach((e) => console.error(` ✖ ${e.mensagem}`));
  process.exit(1);
}

const navegador = process.env.REMOTION_CHROME ?? (existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined);
console.log('Empacotando…');
const serveUrl = await bundle({ entryPoint: resolve(import.meta.dirname, '../src/index.ts') });
const servidor = await iniciarServidorArquivos(dirname(pasta));
const inputProps = { plano, base: servidor.base };
const composition = await selectComposition({ serveUrl, id: 'Video', inputProps, browserExecutable: navegador });
const saida = join(pasta, 'render');
mkdirSync(saida, { recursive: true });

if (quadros) {
  for (const frame of quadros) {
    const output = join(saida, `quadro-${String(frame).padStart(4, '0')}.png`);
    await renderStill({ serveUrl, composition, inputProps, frame, output, browserExecutable: navegador });
    console.log(output);
  }
} else {
  const output = join(saida, `${slug}${rascunho ? '-rascunho' : ''}.mp4`);
  let ultimo = -1;
  await renderMedia({
    serveUrl, composition, inputProps, outputLocation: output, codec: 'h264', browserExecutable: navegador,
    crf: rascunho ? 28 : 16, audioBitrate: '320k', scale: rascunho ? 0.5 : 1,
    onProgress: ({ progress }) => {
      const pct = Math.floor(progress * 10) * 10;
      if (pct !== ultimo) { ultimo = pct; process.stdout.write(`${pct}% `); }
    },
  });
  console.log(`\n${output}`);
}
servidor.fechar();
