// Gera um objeto recortado para a biblioteca com o Nano Banana (Gemini).
//   npm run objeto -- bola "bola de futebol de couro antiga, gomos costurados"
//   npm run objeto -- trofeu "taça de campeonato, prateada" --variantes 3
// Salva em biblioteca/objetos/<nome>.png (fundo transparente, preto e branco).
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { PASTA_BIBLIOTECA } from './lib/caminhos';
import { lerEnv } from './lib/env';

lerEnv();
const MODELOS = [process.env.GEMINI_MODELO, 'gemini-3.1-flash-image-preview', 'gemini-3.1-flash-image', 'gemini-3-pro-image-preview', 'gemini-2.5-flash-image'].filter(Boolean) as string[];

export const ESTILO = [
  'A single isolated object, photographed for an editorial collage.',
  'Black-and-white photograph, high contrast, deep blacks, crisp highlights, subtle fine film grain, like a vintage newspaper print.',
  'Realistic, sharp focus, three-quarter view from slightly above, the whole object visible with generous margin, centered.',
  'Background: perfectly flat, uniform pure chroma-key green (#00FF00), no gradient, no texture, no floor, no cast shadow on the background.',
  'No text, no logos, no brand names, no watermark, no people unless explicitly requested.',
].join(' ');

const chave = () => {
  const k = process.env.GEMINI_API_KEY;
  if (!k) throw new Error('GEMINI_API_KEY não encontrada. Crie o arquivo .env na pasta do editor com: GEMINI_API_KEY=sua-chave');
  return k;
};

export async function gerarImagem(prompt: string, proporcao = '1:1'): Promise<Buffer> {
  let ultimoErro = '';
  for (const modelo of MODELOS) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
      method: 'POST',
      headers: { 'x-goog-api-key': chave(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: proporcao } },
      }),
    });
    if (r.status === 404) { ultimoErro = `modelo ${modelo} indisponível`; continue; }
    const corpo = (await r.json()) as any;
    if (!r.ok) throw new Error(`Gemini respondeu ${r.status}: ${corpo?.error?.message ?? JSON.stringify(corpo).slice(0, 300)}`);
    const parte = corpo?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData || p.inline_data);
    const dados = parte?.inlineData?.data ?? parte?.inline_data?.data;
    if (!dados) throw new Error(`O modelo não devolveu imagem (${corpo?.candidates?.[0]?.finishReason ?? 'sem motivo'}). Tente reescrever a descrição.`);
    process.stderr.write(`  (modelo: ${modelo})\n`);
    return Buffer.from(dados, 'base64');
  }
  throw new Error(`Nenhum modelo de imagem disponível: ${ultimoErro}`);
}

/** Tira o fundo verde e devolve PNG transparente, recortado nas bordas do objeto. */
export async function tirarVerde(imagem: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(imagem).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const saida = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const verde = g - Math.max(r, b); // quanto "mais verde que o resto"
    const alfa = Math.max(0, Math.min(255, 255 - (verde - 25) * 3.2));
    const gLimpo = Math.min(g, Math.max(r, b) + 8); // tira o reflexo verde das bordas
    saida[j] = r; saida[j + 1] = gLimpo; saida[j + 2] = b; saida[j + 3] = alfa;
  }
  return sharp(saida, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim({ threshold: 10 })
    .resize(1400, 1400, { fit: 'inside', withoutEnlargement: true })
    .png()
    .toBuffer();
}

const principal = async () => {
  const args = process.argv.slice(2);
  const iv = args.indexOf('--variantes');
  const variantes = iv >= 0 ? Number(args[iv + 1]) : 1;
  const livres = args.filter((a, i) => !a.startsWith('--') && (iv < 0 || i !== iv + 1));
  const [nome, ...desc] = livres;
  if (!nome || !desc.length) {
    console.log('Uso: npm run objeto -- <nome> "<descrição do objeto>" [--variantes 3]');
    process.exit(1);
  }
  const pasta = join(PASTA_BIBLIOTECA, 'objetos');
  mkdirSync(pasta, { recursive: true });
  for (let v = 1; v <= variantes; v++) {
    const arquivo = join(pasta, variantes > 1 ? `${nome}-${v}.png` : `${nome}.png`);
    if (existsSync(arquivo) && !args.includes('--refazer')) { console.log(`Já existe: ${arquivo} (use --refazer)`); continue; }
    console.log(`Gerando ${nome}${variantes > 1 ? ` (${v}/${variantes})` : ''}…`);
    const bruta = await gerarImagem(`${ESTILO}\nObject: ${desc.join(' ')}`);
    writeFileSync(arquivo.replace(/\.png$/, '.original.png'), bruta);
    writeFileSync(arquivo, await tirarVerde(bruta));
    console.log(`  → ${arquivo}`);
  }
};

if (process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/objeto.ts')) principal().catch((e) => { console.error(`✖ ${e.message}`); process.exit(1); });
