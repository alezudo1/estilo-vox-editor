import React from 'react';
import { useCurrentFrame } from 'remotion';
import type { Cena, Sobreposicao } from '../plano/tipos';
import { tracado, visivel } from '../movimento';
import { ALTURA, LARGURA } from '../tema';
import { ETIQUETA, larguraEtiqueta, posicaoEtiqueta } from './Elementos';

// Resolve o alvo: texto de uma etiqueta da cena, "centro", "rosto" ou "x,y" em %.
export const alvoEmPixels = (alvo: string, cena: Cena) => {
  const limpo = alvo.trim().replace(/^["']|["']$/g, '');
  const idx = cena.etiquetas.findIndex((e) => e.texto.toLowerCase() === limpo.toLowerCase());
  if (idx >= 0) {
    const { x, y } = posicaoEtiqueta(idx);
    const w = larguraEtiqueta(cena.etiquetas[idx].texto);
    const cx = x + w / 2;
    return { cx, cy: y + ETIQUETA.altura / 2, rx: Math.min(w / 2 + 34, cx - 40), ry: ETIQUETA.altura / 2 + 34 };
  }
  const coord = limpo.match(/^(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)$/);
  if (coord) return { cx: (Number(coord[1]) / 100) * LARGURA, cy: (Number(coord[2]) / 100) * ALTURA, rx: 200, ry: 140 };
  if (limpo === 'rosto') return { cx: LARGURA * 0.5, cy: ALTURA * 0.3, rx: 220, ry: 260 };
  return { cx: LARGURA * 0.48, cy: ALTURA * 0.42, rx: 260, ry: 180 };
};

// Elipse "à mão": passa um pouco do ponto inicial, com leve irregularidade fixa.
const caminhoCirculo = (cx: number, cy: number, rx: number, ry: number) => {
  const pts: string[] = [];
  const voltas = 1.12;
  const n = 64;
  for (let k = 0; k <= n; k++) {
    const t = (k / n) * voltas * Math.PI * 2 - 0.6;
    const r = 1 + 0.035 * Math.sin(t * 3.1) + 0.02 * (k / n);
    pts.push(`${(cx + Math.cos(t) * rx * r).toFixed(1)},${(cy + Math.sin(t) * ry * r).toFixed(1)}`);
  }
  return `M${pts.join(' L')}`;
};

const caminhoSeta = (cx: number, cy: number, ry: number) => {
  const x0 = cx - 260, y0 = cy - ry - 220;
  const xe = cx - 30, ye = cy - ry - 10;
  return { corpo: `M${x0},${y0} Q${x0 + 40},${ye} ${xe},${ye}`, ponta: `M${xe - 50},${ye - 34} L${xe},${ye} L${xe - 46},${ye + 38}` };
};

export const Marcacao: React.FC<{ s: Sobreposicao; cena: Cena; inicio: number; cor: string }> = ({ s, cena, inicio, cor }) => {
  const frame = useCurrentFrame();
  if (!visivel(frame, inicio)) return null;
  const { cx, cy, rx, ry } = alvoEmPixels(s.alvo, cena);
  const p = tracado(frame, inicio, 10);
  const filtro = (
    <defs>
      <filter id={`mao-${s.linha}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" />
        <feDisplacementMap in="SourceGraphic" scale="5" />
      </filter>
    </defs>
  );
  const traco = { fill: 'none', stroke: cor, strokeWidth: 12, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, filter: `url(#mao-${s.linha})` };
  if (s.tipo === 'circulo') {
    return (
      <svg width={LARGURA} height={ALTURA} style={{ position: 'absolute', inset: 0 }}>
        {filtro}
        <path d={caminhoCirculo(cx, cy, rx, ry)} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} {...traco} />
      </svg>
    );
  }
  const seta = caminhoSeta(cx, cy, ry);
  const ponta = tracado(frame, inicio + 8, 4);
  return (
    <svg width={LARGURA} height={ALTURA} style={{ position: 'absolute', inset: 0 }}>
      {filtro}
      <path d={seta.corpo} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} {...traco} />
      <path d={seta.ponta} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ponta} {...traco} />
    </svg>
  );
};
