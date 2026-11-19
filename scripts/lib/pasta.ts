// Lê a pasta de um vídeo (roteiro + áudio + imagens) e monta o plano. Roda no Node (painel e render).
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseFile } from 'music-metadata';
import { analisarRoteiro, escalarPeloAudio } from '../../src/plano/parser';
import type { Plano } from '../../src/plano/tipos';

export const PASTA_VIDEOS = resolve(process.env.VIDEOS_DIR ?? resolve(import.meta.dirname, '../../../videos'));
const AUDIOS = ['audio.wav', 'audio.mp3', 'audio.m4a', 'audio.aac'];

export interface ResumoVideo {
  slug: string;
  titulo: string;
  temRoteiro: boolean;
  temAudio: boolean;
  erros: number;
  alertas: number;
  modificado: number;
}

export const pastaDo = (slug: string, base = PASTA_VIDEOS) => {
  const p = resolve(base, slug);
  if (!p.startsWith(resolve(base))) throw new Error('slug inválido');
  return p;
};

export async function montarPlano(pasta: string): Promise<Plano> {
  const caminhoRoteiro = join(pasta, 'roteiro.md');
  if (!existsSync(caminhoRoteiro)) throw new Error(`Não encontrei roteiro.md em ${pasta}`);
  let plano = analisarRoteiro(readFileSync(caminhoRoteiro, 'utf8'));

  const imagens = existsSync(join(pasta, 'imagens')) ? readdirSync(join(pasta, 'imagens')) : [];
  for (const arq of plano.arquivos) {
    if (!imagens.includes(arq)) {
      const parecido = imagens.find((i) => i.toLowerCase() === arq.toLowerCase() || i.replace(/\.[^.]+$/, '') === arq.replace(/\.[^.]+$/, ''));
      plano.avisos.unshift({ nivel: 'erro', mensagem: `Falta a imagem "${arq}" na pasta imagens/.${parecido ? ` Existe "${parecido}" — é ela?` : ''}` });
    }
  }
  const sobrando = imagens.filter((i) => !plano.arquivos.includes(i) && !i.startsWith('.'));
  if (sobrando.length) plano.avisos.push({ nivel: 'info', mensagem: `Imagens na pasta que o roteiro não usa: ${sobrando.join(', ')}.` });

  const audio = AUDIOS.find((a) => existsSync(join(pasta, a)));
  if (audio) {
    const meta = await parseFile(join(pasta, audio), { duration: true });
    const dur = meta.format.duration;
    if (dur) plano = escalarPeloAudio(plano, dur);
    plano.meta.audio = audio;
  } else {
    plano.avisos.unshift({ nivel: 'alerta', mensagem: 'Sem áudio (audio.wav) na pasta: tempos estimados pelo texto, a ~2,7 palavras/s.' });
  }
  writeFileSync(join(pasta, 'plano.json'), JSON.stringify(plano, null, 2));
  return plano;
}

export async function listarVideos(base = PASTA_VIDEOS): Promise<ResumoVideo[]> {
  if (!existsSync(base)) return [];
  const pastas = readdirSync(base).filter((n) => !n.startsWith('.') && statSync(join(base, n)).isDirectory());
  const lista = await Promise.all(
    pastas.map(async (slug): Promise<ResumoVideo> => {
      const pasta = join(base, slug);
      const temRoteiro = existsSync(join(pasta, 'roteiro.md'));
      let titulo = slug, erros = 0, alertas = 0;
      if (temRoteiro) {
        try {
          const p = await montarPlano(pasta);
          titulo = p.meta.titulo;
          erros = p.avisos.filter((a) => a.nivel === 'erro').length;
          alertas = p.avisos.filter((a) => a.nivel === 'alerta').length;
        } catch { erros = 1; }
      }
      return { slug, titulo, temRoteiro, temAudio: AUDIOS.some((a) => existsSync(join(pasta, a))), erros, alertas, modificado: statSync(pasta).mtimeMs };
    }),
  );
  return lista.sort((a, b) => b.slug.localeCompare(a.slug));
}
