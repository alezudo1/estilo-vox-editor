import React from 'react';
import { useCurrentFrame } from 'remotion';
import { entrada, visivel } from '../movimento';
import { AREA, COR, FONTE, ZONA } from '../tema';

// Etiquetas ficam acima da faixa da legenda, empilhadas de baixo para cima.
export const ETIQUETA_ALTURA = 76;
export const posicaoEtiqueta = (indice: number) => ({
  x: AREA.x + 20,
  y: ZONA.legenda.topo - 60 - (indice + 1) * (ETIQUETA_ALTURA + 18),
});
export const larguraEtiqueta = (texto: string) => Math.min(AREA.largura - 40, 60 + texto.length * 27);

export const Etiqueta: React.FC<{ texto: string; inicio: number; indice: number }> = ({ texto, inicio, indice }) => {
  const frame = useCurrentFrame();
  if (!visivel(frame, inicio)) return null;
  const p = entrada(frame, inicio, 6);
  const textoVisivel = visivel(frame, inicio + 2);
  const { x, y } = posicaoEtiqueta(indice);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        height: ETIQUETA_ALTURA,
        maxWidth: AREA.largura - 40,
        display: 'flex',
        alignItems: 'center',
        padding: '0 22px',
        background: COR.menta,
        transformOrigin: 'left center',
        transform: `scaleX(${p})`,
      }}
    >
      <span
        style={{
          fontFamily: FONTE.texto,
          fontWeight: 650,
          fontSize: 40,
          letterSpacing: 0.5,
          color: COR.marinho,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          opacity: textoVisivel ? 1 : 0,
        }}
      >
        {texto}
      </span>
    </div>
  );
};
