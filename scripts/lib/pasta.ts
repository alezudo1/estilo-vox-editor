// Lê a pasta de um vídeo (roteiro + áudio + imagens) e monta o plano. Roda no Node (painel e render).
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, parse } from 'node:path';
import { parseFile } from 'music-metadata';
import { analisarRoteiro, escalarPeloAudio } from '../../src/plano/parser';
import type { Plano } from '../../src/plano/tipos';
import { tinta } from '../../src/tema';
import { dentroDe, PASTA_BIBLIOTECA, PASTA_PRONTAS, PASTA_VIDEOS } from './caminhos';
import { PAPEIS, prepararTexturas } from '../preparar';

export { PASTA_VIDEOS };
const AUDIOS = ['audio.wav', 'audio.mp3', 'audio.m4a', 'audio.aac'];
const EXT_IMAGEM = ['.png', '.webp', '.jpg', '.jpeg'];

export interface ResumoVideo {
  slug: string;
  titulo: string;
  temRoteiro: boolean;
  temAudio: boolean;
  erros: number;
  alertas: number;
  modificado: number;
}

export const pastaDo = (slug: string) => dentroDe(PASTA_VIDEOS, slug);

const listar = (pasta: string) => (existsSync(pasta) ? readdirSync(pasta).filter((f) => !f.startsWith('.')) : []);

export async function montarPlano(pasta: string): Promise<Plano> {
  const caminhoRoteiro = join(pasta, 'roteiro.md');
  if (!existsSync(caminhoRoteiro)) throw new Error(`Não encontrei roteiro.md em ${pasta}`);
  let plano = analisarRoteiro(readFileSync(caminhoRoteiro, 'utf8'));
  const slug = basename(pasta);
  const recursos: Record<string, string> = {};
  const rel = (...p: string[]) => ['video', slug, ...p].join('/');

  // imagens citadas
  const imagens = listar(join(pasta, 'imagens'));
  for (const arq of plano.arquivos) {
    if (imagens.includes(arq)) recursos[`imagem:${arq}`] = rel('imagens', arq);
    else {
      const parecido = imagens.find((i) => i.toLowerCase() === arq.toLowerCase() || parse(i).name === parse(arq).name);
      plano.avisos.unshift({ nivel: 'erro', mensagem: `Falta a imagem "${arq}" na pasta imagens/.${parecido ? ` Existe "${parecido}" — é ela?` : ''}` });
    }
  }
  const recortes = listar(join(pasta, 'imagens', 'recortes'));
  const semRecorte: string[] = [];
  for (const c of plano.cenas)
    for (const e of c.elementos) {
      if (e.tipo === 'foto' && e.params.recorte && e.params.arquivo) {
        const png = `${parse(e.params.arquivo).name}.png`;
        if (recortes.includes(png)) recursos[`recorte:${e.params.arquivo}`] = rel('imagens', 'recortes', png);
        else semRecorte.push(e.params.arquivo);
      }
      if (e.tipo === 'objeto' && e.params.nome) {
        const nome = e.params.nome;
        const local = imagens.find((i) => parse(i).name === nome || i === nome);
        const daBiblioteca = listar(join(PASTA_BIBLIOTECA, 'objetos')).find((i) => parse(i).name === nome && EXT_IMAGEM.includes(parse(i).ext.toLowerCase()));
        if (local) recursos[`objeto:${nome}`] = rel('imagens', local);
        else if (daBiblioteca) recursos[`objeto:${nome}`] = `biblioteca/objetos/${daBiblioteca}`;
        else plano.avisos.unshift({ nivel: 'erro', mensagem: `Falta o objeto "${nome}". Gere com: npm run objeto -- ${nome} "descrição"` });
      }
    }
  if (semRecorte.length)
    plano.avisos.unshift({ nivel: 'erro', mensagem: `Falta recortar: ${[...new Set(semRecorte)].join(', ')}. Rode: npm run recortar -- ${slug}` });
  const usadas = new Set(plano.arquivos);
  const sobrando = imagens.filter((i) => !usadas.has(i) && i !== 'recortes' && !Object.values(recursos).some((r) => r.endsWith(`/${i}`)));
  if (sobrando.length) plano.avisos.push({ nivel: 'info', mensagem: `Imagens na pasta que o roteiro não usa: ${sobrando.join(', ')}.` });

  // texturas de papel
  if (Object.keys(PAPEIS).some((n) => !existsSync(join(PASTA_PRONTAS, `${n}.${PAPEIS[n].tipo === 'folha' ? 'png' : 'jpg'}`)))) await prepararTexturas();
  for (const fundo of ['claro', 'escuro'] as const) {
    const t = tinta(fundo, '#000000').textura;
    if (existsSync(join(PASTA_PRONTAS, `${t}.jpg`))) recursos[`textura:${t}`] = `biblioteca/.prontas/${t}.jpg`;
  }
  if (!recursos['textura:papel-claro']) plano.avisos.push({ nivel: 'info', mensagem: `Sem textura de papel: coloque as do Texturelabs em ${join(PASTA_BIBLIOTECA, 'texturas')}.` });

  // áudio
  const audio = AUDIOS.find((a) => existsSync(join(pasta, a)));
  if (audio) {
    const meta = await parseFile(join(pasta, audio), { duration: true });
    if (meta.format.duration) plano = escalarPeloAudio(plano, meta.format.duration);
    plano.meta.audio = audio;
    recursos.audio = rel(audio);
  } else {
    plano.avisos.unshift({ nivel: 'alerta', mensagem: 'Sem áudio (audio.wav) na pasta: tempos estimados pelo texto, a ~2,7 palavras/s.' });
  }
  plano.meta.slug = slug;
  plano.recursos = recursos;
  writeFileSync(join(pasta, 'plano.json'), JSON.stringify(plano, null, 2));
  return plano;
}

export async function listarVideos(): Promise<ResumoVideo[]> {
  const pastas = listar(PASTA_VIDEOS).filter((n) => statSync(join(PASTA_VIDEOS, n)).isDirectory());
  const lista = await Promise.all(
    pastas.map(async (slug): Promise<ResumoVideo> => {
      const pasta = join(PASTA_VIDEOS, slug);
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
