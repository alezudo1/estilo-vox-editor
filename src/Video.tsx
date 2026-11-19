import React from 'react';
import { AbsoluteFill, Audio, Sequence } from 'remotion';
import { COMPONENTES, Etiqueta, Frase, Fundo, LinhaFonte } from './cenas/Elementos';
import { Marcacao } from './cenas/Marcacoes';
import { carregarFontes } from './fontes';
import type { Plano } from './plano/tipos';
import { FPS, tinta as tintaDo } from './tema';

carregarFontes();

export type PropsVideo = {
  plano: Plano;
  /** Endereço base dos arquivos (painel: '/arquivos'; render: servidor local). Vazio = sem imagens. */
  base: string;
};

const q = (s: number) => Math.round(s * FPS);

export const Video: React.FC<PropsVideo> = ({ plano, base }) => {
  const url = (chave: string) => {
    const rel = plano.recursos?.[chave];
    return base && rel ? `${base}/${rel.split('/').map(encodeURIComponent).join('/')}` : undefined;
  };
  return (
    <AbsoluteFill>
      {plano.cenas.map((cena) => {
        const de = q(cena.inicio);
        const dur = Math.max(1, q(cena.fim) - de);
        const tinta = tintaDo(cena.fundo, plano.meta.corExtra);
        const temFrase = cena.frases.length > 0 || cena.elementos.some((e) => e.tipo === 'gancho' && (e.params.texto ?? '').split(/\s+/).length > 3);
        const contagem: Record<string, number> = {};
        const totais: Record<string, number> = {};
        cena.elementos.forEach((e) => (totais[e.tipo] = (totais[e.tipo] ?? 0) + 1));
        const ctx = { cena, tinta, url, temFrase, duracaoCena: dur };
        return (
          <Sequence key={cena.id} from={de} durationInFrames={dur} name={cena.id}>
            <Fundo tinta={tinta} url={url} />
            {cena.fonte && !cena.elementos.some((e) => e.tipo === 'card-final') && <LinhaFonte texto={cena.fonte} tinta={tinta} />}
            {cena.elementos.map((el, k) => {
              const C = COMPONENTES[el.tipo];
              const indice = (contagem[el.tipo] = (contagem[el.tipo] ?? -1) + 1);
              return C ? <C key={k} {...ctx} el={el} inicio={q(el.inicio) - de} slot={{ indice, total: totais[el.tipo] }} /> : null;
            })}
            {cena.frases.map((f, k) => {
              // cada frase fica até a próxima frase da mesma cena
              const ini = q(f.inicio) - de;
              const fim = k < cena.frases.length - 1 ? q(cena.frases[k + 1].inicio) - de : dur;
              return (
                <Sequence key={`f${k}`} from={ini} durationInFrames={Math.max(1, fim - ini)} layout="none">
                  <Frase palavras={f.palavras.map((p) => ({ texto: p.texto, inicio: q(p.inicio) - de - ini }))} tinta={tinta} />
                </Sequence>
              );
            })}
            {cena.etiquetas.map((e, k) => (
              <Etiqueta key={`e${k}`} texto={e.texto} inicio={q(e.inicio) - de} indice={k} tinta={tinta} />
            ))}
            {cena.sobreposicoes.map((s, k) => (
              <Marcacao key={`s${k}`} s={s} cena={cena} inicio={q(s.inicio) - de} cor={tinta.caneta} />
            ))}
          </Sequence>
        );
      })}
      {plano.meta.audio && url('audio') && <Audio src={url('audio')!} />}
    </AbsoluteFill>
  );
};

export const duracaoEmQuadros = (plano: Plano) => Math.max(1, q(plano.meta.duracao));
