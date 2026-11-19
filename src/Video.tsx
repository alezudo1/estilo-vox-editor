import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { COMPONENTES } from './cenas/Elementos';
import { Etiqueta } from './cenas/Etiqueta';
import { Marcacao } from './cenas/Marcacoes';
import { carregarFontes } from './fontes';
import type { Plano } from './plano/tipos';
import { FPS, paletaDoFundo } from './tema';

carregarFontes();

export type PropsVideo = {
  plano: Plano;
  /** Prefixo das URLs dos arquivos do vídeo. Vazio = render (usa a pasta pública do vídeo). */
  base: string;
};

const q = (s: number) => Math.round(s * FPS);

export const Video: React.FC<PropsVideo> = ({ plano, base }) => {
  const paleta = paletaDoFundo(plano.meta.fundo, plano.meta.corExtra);
  const caminho = (rel: string) => (base ? `${base}/${rel.split('/').map(encodeURIComponent).join('/')}` : staticFile(rel));
  const url = (arquivo: string) => caminho(`imagens/${arquivo}`);
  return (
    <AbsoluteFill style={{ background: paleta.fundo }}>
      {plano.cenas.map((cena) => {
        const de = q(cena.inicio);
        const dur = Math.max(1, q(cena.fim) - de);
        const contagem: Record<string, number> = {};
        const totais: Record<string, number> = {};
        cena.elementos.forEach((e) => (totais[e.tipo] = (totais[e.tipo] ?? 0) + 1));
        return (
          <Sequence key={cena.id} from={de} durationInFrames={dur} name={cena.id}>
            {cena.elementos.map((el, k) => {
              const C = COMPONENTES[el.tipo];
              const indice = (contagem[el.tipo] = (contagem[el.tipo] ?? -1) + 1);
              return C ? (
                <C key={k} el={el} inicio={q(el.inicio) - de} duracaoCena={dur} paleta={paleta} url={url} slot={{ indice, total: totais[el.tipo] }} />
              ) : null;
            })}
            {cena.etiquetas.map((e, k) => (
              <Etiqueta key={`e${k}`} texto={e.texto} inicio={q(e.inicio) - de} indice={k} />
            ))}
            {cena.sobreposicoes.map((s, k) => (
              <Marcacao key={`s${k}`} s={s} cena={cena} inicio={q(s.inicio) - de} />
            ))}
          </Sequence>
        );
      })}
      {plano.meta.audio && <Audio src={caminho(plano.meta.audio)} />}
    </AbsoluteFill>
  );
};

export const duracaoEmQuadros = (plano: Plano) => Math.max(1, q(plano.meta.duracao));
