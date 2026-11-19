// Identidade visual do @alezudoo. Documentação: identidade-e-setup.md (Projeto).
// Ajustada pelo estudo de tipografia e cor para vídeo vertical (nov/2026):
//  · base fixa de duas cores com contraste por luminância (nada de preto/branco puros)
//  · UM acento do canal (menta) em áreas largas; cor de alerta/clube só em áreas largas, nunca em texto fino
//  · duas famílias tipográficas

export const COR = {
  marinho: '#031927', // base escura (no lugar do carvão #121212: mesma luminância, com identidade)
  lavanda: '#E5D4ED', // "branco suave" sobre o escuro
  papel: '#F4F1EA', // base clara
  menta: '#7ADFBB', // acento único do canal
  mentaClara: '#A6ECE0',
  verde: '#4E6E58',
  verdeClaro: '#7FA38A',
  coral: '#FF6B57', // alerta/negativo (ou a cor do clube): só em áreas largas
} as const;

export type Fundo = 'escuro' | 'claro';

export const FONTE = {
  editorial: 'InstrumentSerif, Georgia, serif', // frases da narração e títulos, caixa mista
  texto: 'FiraSans, "Segoe UI", Arial, sans-serif', // etiquetas, rótulos, textos curtos
  numero: 'FiraSansCondensed, FiraSans, "Arial Narrow", sans-serif', // números, placares, ganchos de 1–3 palavras
} as const;

export const LARGURA = 1080;
export const ALTURA = 1920;
export const FPS = 24; // animação em degraus de 12 fps (medido nos shorts da Vox)

// Zona segura universal (Reels, TikTok, Shorts) + template do Reels do Ale.
export const ZONA = {
  topo: 250, // proibido acima
  textoTopo: 300, // títulos e textos a partir daqui (sobrevive ao corte 4:5 do feed)
  base: 1470, // proibido abaixo (barra inferior das três apps)
  esquerda: 70,
  direitaAlta: 950, // margem direita de 130 px
  direitaBaixa: 887, // coluna de botões do Reels abaixo de y = 860
  degrau: 860,
  legenda: { topo: 1200, base: 1420 }, // reservada para a legenda do Ale (centro ~1310)
  corte45: { topo: 285, base: 1635 }, // prévia do feed do Instagram (4:5)
} as const;

// Área útil para texto: nunca colide com interface nem com a legenda.
export const AREA = {
  x: ZONA.esquerda,
  y: ZONA.textoTopo,
  largura: ZONA.direitaBaixa - ZONA.esquerda,
  altura: ZONA.legenda.topo - ZONA.textoTopo,
} as const;

// Palco: onde fica a imagem principal. A frase editorial ocupa a faixa logo acima da legenda.
export const PALCO = { topo: 350, base: 940, baseSemFrase: 1180, centroX: (ZONA.esquerda + ZONA.direitaBaixa) / 2, largura: 800 } as const;
export const FAIXA_FRASE = { topo: 960, base: ZONA.legenda.topo - 16 } as const;

/** Papéis de cor por fundo. `alerta` = cor extra do roteiro (coral ou cor do clube). */
export const tinta = (fundo: Fundo, corExtra: string) =>
  fundo === 'claro'
    ? { papel: COR.papel, tinta: COR.marinho, acento: COR.menta, acentoTexto: COR.marinho, alerta: corExtra, etiqueta: COR.marinho, etiquetaTexto: COR.papel, caneta: COR.marinho, textura: 'papel-claro', sombra: 'rgba(3,25,39,0.35)', grade: 'quente' as const }
    : { papel: COR.marinho, tinta: COR.lavanda, acento: COR.menta, acentoTexto: COR.marinho, alerta: corExtra, etiqueta: COR.lavanda, etiquetaTexto: COR.marinho, caneta: COR.menta, textura: 'papel-escuro', sombra: 'rgba(0,0,0,0.6)', grade: 'fria' as const };
export type Tinta = ReturnType<typeof tinta>;
