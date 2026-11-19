// Identidade visual do @alezudoo (v3, 19/11/2026). Documentação: identidade-e-setup.md (Projeto).
// Base no estudo de tipografia e cor para vídeo vertical:
//  · "carvão + branco suave + 1 acento" — contraste por luminância, nada de preto/branco puros
//  · o acento (verde-limão) só em áreas largas: caixas, marca-texto, traços grossos — nunca em texto fino
//  · duas fontes

export const COR = {
  carvao: '#121212', // base escura
  grafite: '#262626', // superfícies sobre o carvão (cartões, molduras)
  cinza: '#B8B8B8', // texto secundário, linhas de apoio
  branco: '#FBFBFB', // "branco suave": texto sobre o escuro, base clara
  limao: '#CFFC00', // acento único do canal
} as const;

export type Fundo = 'escuro' | 'claro';

export const FONTE = {
  display: 'ArupalaGrotesk, "Arial Black", sans-serif', // ganchos curtos, números, anos, placares (caixa alta)
  texto: 'MoonGet, "Arial Rounded MT Bold", sans-serif', // frases (caixa mista), etiquetas, rótulos
} as const;
export const PESO = { display: 900, texto: 800 } as const;

export const LARGURA = 1080;
export const ALTURA = 1920;
export const FPS = 24; // animação em degraus de 12 fps (medido nos shorts da Vox)

// Zona segura universal (Reels, TikTok, Shorts) + template do Reels do Ale.
export const ZONA = {
  topo: 250, // proibido acima
  textoTopo: 300, // títulos e textos a partir daqui (sobrevive ao corte 4:5 do feed)
  base: 1470, // proibido abaixo
  esquerda: 70,
  direitaAlta: 950, // margem direita de 130 px
  direitaBaixa: 887, // coluna de botões do Reels abaixo de y = 860
  degrau: 860,
  legenda: { topo: 1200, base: 1420 }, // reservada para a legenda do Ale
  corte45: { topo: 285, base: 1635 },
} as const;

// Textos centralizados para o olhar de quem assiste. O eixo fica entre o centro da tela (540)
// e o centro da área segura (478): o bloco parece centrado e nada encosta na coluna de botões.
export const EIXO = 510;
/** Largura máxima de um bloco de texto centrado no eixo, conforme a altura em que ele está. */
export const larguraCentrada = (yBase: number) => 2 * ((yBase > ZONA.degrau ? ZONA.direitaBaixa : ZONA.direitaAlta) - EIXO) - 20;

export const AREA = {
  x: ZONA.esquerda,
  y: ZONA.textoTopo,
  largura: ZONA.direitaBaixa - ZONA.esquerda,
  altura: ZONA.legenda.topo - ZONA.textoTopo,
} as const;

// Palco: onde fica a imagem principal. A frase ocupa a faixa logo acima da legenda.
export const PALCO = { topo: 350, base: 930, baseSemFrase: 1180, centroX: EIXO, largura: 760 } as const;
export const FAIXA_FRASE = { topo: 950, base: ZONA.legenda.topo - 16 } as const;

/** Papéis de cor por fundo. `alerta` = cor extra do roteiro (padrão: o próprio acento; ou a cor do clube). */
export const tinta = (fundo: Fundo, corExtra: string) =>
  fundo === 'escuro'
    ? { papel: COR.carvao, superficie: COR.grafite, tinta: COR.branco, secundaria: COR.cinza, acento: COR.limao, acentoTexto: COR.carvao, alerta: corExtra, etiqueta: COR.branco, etiquetaTexto: COR.carvao, caneta: COR.limao, textura: 'papel-escuro', sombra: 'rgba(0,0,0,0.65)', grade: 'fria' as const, claro: false }
    : { papel: COR.branco, superficie: '#ECECEC', tinta: COR.carvao, secundaria: '#5C5C5C', acento: COR.limao, acentoTexto: COR.carvao, alerta: corExtra, etiqueta: COR.carvao, etiquetaTexto: COR.branco, caneta: COR.carvao, textura: 'papel-claro', sombra: 'rgba(18,18,18,0.3)', grade: 'quente' as const, claro: true };
export type Tinta = ReturnType<typeof tinta>;
