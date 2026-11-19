// Identidade visual do @alezudoo. Fonte: identidade-e-setup.md (projeto).

export const COR = {
  marinho: '#031927',
  lavanda: '#E5D4ED',
  menta: '#7ADFBB',
  mentaClara: '#A6ECE0',
  verde: '#4E6E58',
  verdeClaro: '#7FA38A',
  coral: '#FF6B57',
  papel: '#F4F1EA',
} as const;

export type Fundo = 'escuro' | 'claro';

// Cores derivadas do fundo escolhido no cabeçalho do roteiro.
export const paletaDoFundo = (fundo: Fundo, corExtra: string) =>
  fundo === 'escuro'
    ? { fundo: COR.marinho, texto: COR.lavanda, apoio: COR.mentaClara, terra: COR.verdeClaro, destaque: COR.menta, alerta: corExtra }
    : { fundo: COR.lavanda, texto: COR.marinho, apoio: COR.verde, terra: COR.verde, destaque: COR.menta, alerta: corExtra };

export const FONTE = {
  titulo: 'Humane, Impact, sans-serif',
  texto: 'Geist, Helvetica, Arial, sans-serif',
  serifa: 'GeistSerif, Georgia, serif',
  mono: 'GeistMono, monospace',
} as const;

// Canvas e zona segura (template do Reels medido em 1080×1920).
export const LARGURA = 1080;
export const ALTURA = 1920;
export const FPS = 24;

export const ZONA = {
  topo: 250,
  base: 1500,
  esquerda: 70,
  direitaAlta: 1025, // até y = 860
  direitaBaixa: 887, // de y = 860 até a base
  degrau: 860,
  legenda: { topo: 1280, base: 1500 }, // reservada para a legenda do Ale
} as const;

// Área útil para conteúdo principal: a faixa que nunca colide com UI nem legenda.
export const AREA = {
  x: ZONA.esquerda,
  y: ZONA.topo,
  largura: ZONA.direitaBaixa - ZONA.esquerda,
  altura: ZONA.legenda.topo - ZONA.topo,
} as const;
