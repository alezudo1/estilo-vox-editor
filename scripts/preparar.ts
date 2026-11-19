// Prepara as texturas da biblioteca no tamanho do vídeo (1080×1920). Roda sozinho quando falta algo.
//   npm run preparar            → gera o que faltar
//   npm run preparar -- --tudo  → refaz tudo
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { PASTA_BIBLIOTECA, PASTA_PRONTAS } from './lib/caminhos';

sharp.cache(false);
const W = 1080, H = 1920;

// Papel de cada função: primeira textura encontrada da lista (nomes do Texturelabs). Troque à vontade.
export const PAPEIS: Record<string, { preferidas: string[]; tipo: 'fundo' | 'folha' }> = {
  'papel-claro': { preferidas: ['Paper_361', 'Paper_345', 'Paper_378'], tipo: 'fundo' },
  'papel-escuro': { preferidas: ['Grunge_354', 'Grunge_356', 'Paper_377'], tipo: 'fundo' },
  jornal: { preferidas: ['Paper_377', 'Grunge_356'], tipo: 'fundo' },
  envelhecido: { preferidas: ['Paper_320', 'Paper_378'], tipo: 'fundo' },
  folha: { preferidas: ['Paper_369'], tipo: 'folha' },
};

const achar = (preferidas: string[]) => {
  const pasta = join(PASTA_BIBLIOTECA, 'texturas');
  if (!existsSync(pasta)) return null;
  const arquivos = readdirSync(pasta).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  for (const p of preferidas) {
    const f = arquivos.find((a) => a.includes(p));
    if (f) return join(pasta, f);
  }
  return null;
};

export async function prepararTexturas(tudo = false) {
  mkdirSync(PASTA_PRONTAS, { recursive: true });
  const feitas: string[] = [];
  const faltando: string[] = [];
  for (const [nome, cfg] of Object.entries(PAPEIS)) {
    const saida = join(PASTA_PRONTAS, `${nome}.${cfg.tipo === 'folha' ? 'png' : 'jpg'}`);
    if (existsSync(saida) && !tudo) continue;
    const origem = achar(cfg.preferidas);
    if (!origem) { faltando.push(nome); continue; }
    const img = sharp(origem, { limitInputPixels: false });
    const meta = await img.metadata();
    const deitada = (meta.width ?? 0) > (meta.height ?? 0);
    if (cfg.tipo === 'fundo') {
      // tons de cinza, contraste puxado para o meio: a cor vem do código
      const escuro = nome === 'papel-escuro' || nome === 'jornal';
      const cinza = await sharp(origem, { limitInputPixels: false })
        .rotate(deitada ? 90 : 0)
        .resize(W, H, { fit: 'cover' })
        .grayscale()
        .normalise({ lower: 1, upper: 99 })
        .toBuffer();
      // papel claro: variação comprimida perto do branco (multiplica sem escurecer); escuro: meio-tom
      await sharp(cinza)
        .linear(escuro ? 0.6 : 0.15, escuro ? 50 : 222)
        .jpeg({ quality: 82, mozjpeg: true })
        .toFile(saida);
    } else {
      // folha rasgada fotografada sobre fundo preto → PNG com transparência
      const base = sharp(origem, { limitInputPixels: false }).resize(1400, 1400, { fit: 'inside' });
      const { data, info } = await base.clone().grayscale().raw().toBuffer({ resolveWithObject: true });
      const alfa = Buffer.alloc(info.width * info.height);
      for (let i = 0; i < alfa.length; i++) alfa[i] = Math.max(0, Math.min(255, (data[i] - 45) * 6));
      const rgb = await base.clone().removeAlpha().toBuffer();
      await sharp(rgb, { raw: undefined })
        .joinChannel(await sharp(alfa, { raw: { width: info.width, height: info.height, channels: 1 } }).png().toBuffer())
        .trim({ threshold: 1 })
        .png()
        .toFile(saida);
    }
    feitas.push(nome);
  }
  return { feitas, faltando };
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/preparar.ts')) {
  const r = await prepararTexturas(process.argv.includes('--tudo'));
  console.log(r.feitas.length ? `Prontas: ${r.feitas.join(', ')}` : 'Nada a fazer.');
  if (r.faltando.length) console.log(`Sem textura para: ${r.faltando.join(', ')} (coloque em ${join(PASTA_BIBLIOTECA, 'texturas')})`);
}
