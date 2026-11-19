import { Easing, interpolate } from 'remotion';

// Regras de movimento da especificação:
// - animação em degraus de 12 fps (a saída é 24 fps: cada pose dura 2 quadros);
// - elementos entram já em movimento (começam no meio da curva);
// - curva "rápido e assenta";
// - nada entra junto: defasagem de alguns quadros entre elementos.

export const PASSO = 2; // 24 fps / 12 fps
export const CASCATA = 3; // quadros entre um elemento e o próximo

/** Quadro "posterizado": congela a animação em poses de 12 fps. */
export const q12 = (frame: number) => Math.floor(frame / PASSO) * PASSO;

/**
 * Progresso de entrada (0→1) a partir de `inicio`, com duração em quadros.
 * Começa em 35% da curva, então o elemento já aparece em movimento.
 */
export const entrada = (frame: number, inicio: number, duracao = 8) => {
  const f = q12(frame) - inicio;
  if (f < 0) return 0;
  return interpolate(f, [0, duracao], [0.35, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateRight: 'clamp',
  });
};

/** Visível a partir de `inicio` (sem fade: a Vox corta seco). */
export const visivel = (frame: number, inicio: number) => q12(frame) >= inicio;

/** Aproximação lenta e contínua, linear, em degraus de 12 fps. */
export const aproximacao = (frame: number, duracao: number, de = 1, ate = 1.08) =>
  interpolate(q12(frame), [0, Math.max(1, duracao)], [de, ate], { extrapolateRight: 'clamp' });

/** Desenho de traço (0→1) para marcações à mão. */
export const tracado = (frame: number, inicio: number, duracao = 10) =>
  interpolate(q12(frame) - inicio, [0, duracao], [0, 1], {
    easing: Easing.inOut(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
