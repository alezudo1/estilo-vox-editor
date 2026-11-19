// Medidas das fontes (larguras de avanço em fração do corpo), tiradas dos arquivos.
// Permitem diagramar textos sem depender do navegador.

const ITALICO: Record<string, number> = {"a": 0.474, "b": 0.431, "c": 0.351, "d": 0.474, "e": 0.348, "f": 0.273, "g": 0.401, "h": 0.476, "i": 0.288, "j": 0.266, "k": 0.447, "l": 0.24, "m": 0.745, "n": 0.521, "o": 0.414, "p": 0.45, "q": 0.425, "r": 0.368, "s": 0.302, "t": 0.272, "u": 0.508, "v": 0.412, "w": 0.609, "x": 0.45, "y": 0.418, "z": 0.385, "A": 0.457, "B": 0.479, "C": 0.475, "D": 0.536, "E": 0.454, "F": 0.411, "G": 0.514, "H": 0.545, "I": 0.25, "J": 0.251, "K": 0.499, "L": 0.414, "M": 0.665, "N": 0.542, "O": 0.54, "P": 0.469, "Q": 0.541, "R": 0.525, "S": 0.424, "T": 0.461, "U": 0.537, "V": 0.458, "W": 0.653, "X": 0.545, "Y": 0.478, "Z": 0.427, "0": 0.461, "1": 0.248, "2": 0.404, "3": 0.373, "4": 0.394, "5": 0.387, "6": 0.411, "7": 0.365, "8": 0.437, "9": 0.414, " ": 0.17, ".": 0.219, ",": 0.219, ":": 0.299, ";": 0.301, "!": 0.275, "?": 0.358, "%": 0.591, "-": 0.426, "'": 0.235, "\"": 0.374, "(": 0.346, ")": 0.346, "$": 0.424, "@": 0.665, "&": 0.525, "á": 0.474, "à": 0.474, "â": 0.474, "ã": 0.474, "é": 0.348, "ê": 0.348, "í": 0.288, "ó": 0.414, "ô": 0.414, "õ": 0.414, "ú": 0.508, "ç": 0.351, "Á": 0.457, "À": 0.457, "Â": 0.457, "Ã": 0.457, "É": 0.454, "Ê": 0.454, "Í": 0.25, "Ó": 0.54, "Ô": 0.54, "Õ": 0.54, "Ú": 0.537, "Ç": 0.475};
const CONDENSADA: Record<string, number> = {"A": 0.549, "B": 0.563, "C": 0.53, "D": 0.598, "E": 0.472, "F": 0.441, "G": 0.594, "H": 0.599, "I": 0.27, "J": 0.294, "K": 0.595, "L": 0.47, "M": 0.723, "N": 0.594, "O": 0.631, "P": 0.551, "Q": 0.631, "R": 0.566, "S": 0.528, "T": 0.497, "U": 0.585, "V": 0.529, "W": 0.779, "X": 0.543, "Y": 0.555, "Z": 0.499, "0": 0.554, "1": 0.433, "2": 0.47, "3": 0.48, "4": 0.524, "5": 0.501, "6": 0.532, "7": 0.433, "8": 0.537, "9": 0.528, " ": 0.2, ".": 0.231, ",": 0.227, ":": 0.231, ";": 0.231, "!": 0.23, "?": 0.449, "%": 0.799, "-": 0.377, "'": 0.23, "\"": 0.437, "(": 0.302, ")": 0.302, "$": 0.504, "@": 0.924, "&": 0.702, "/": 0.468, "Á": 0.549, "À": 0.549, "Â": 0.549, "Ã": 0.549, "É": 0.472, "Ê": 0.472, "Í": 0.27, "Ó": 0.631, "Ô": 0.631, "Õ": 0.631, "Ú": 0.585, "Ç": 0.53};
const FIRA: Record<string, number> = {"A": 0.596, "B": 0.619, "C": 0.579, "D": 0.654, "E": 0.523, "F": 0.486, "G": 0.649, "H": 0.661, "I": 0.293, "J": 0.321, "K": 0.646, "L": 0.517, "M": 0.789, "N": 0.657, "O": 0.69, "P": 0.605, "Q": 0.69, "R": 0.62, "S": 0.58, "T": 0.547, "U": 0.647, "V": 0.575, "W": 0.853, "X": 0.594, "Y": 0.607, "Z": 0.55, "0": 0.594, "1": 0.473, "2": 0.523, "3": 0.526, "4": 0.575, "5": 0.546, "6": 0.573, "7": 0.475, "8": 0.59, "9": 0.571, " ": 0.228, ".": 0.24, ",": 0.24, ":": 0.24, ";": 0.24, "!": 0.24, "?": 0.488, "%": 0.869, "-": 0.409, "'": 0.244, "\"": 0.452, "(": 0.325, ")": 0.325, "$": 0.555, "@": 1.02, "&": 0.77, "/": 0.52, "Á": 0.596, "À": 0.596, "Â": 0.596, "Ã": 0.596, "É": 0.523, "Ê": 0.523, "Í": 0.293, "Ó": 0.69, "Ô": 0.69, "Õ": 0.69, "Ú": 0.647, "Ç": 0.579};
export const ALTURA_MAIUSCULA = 0.695;

const semAcento = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const medir = (tabela: Record<string, number>, padrao: number, caixaAlta: boolean) => (texto: string, corpo: number) =>
  [...(caixaAlta ? texto.toUpperCase() : texto)].reduce((s, c) => s + (tabela[c] ?? tabela[semAcento(c)] ?? padrao), 0) * corpo;

export const larguraItalico = medir(ITALICO, 0.42, false);
export const larguraCondensada = medir(CONDENSADA, 0.5, true);
export const larguraEtiquetaTexto = medir(FIRA, 0.62, true);

// Palavras que não podem terminar uma linha (artigo, preposição, conjunção, pronome átono): ficam com a palavra seguinte.
const LIGADAS = new Set('o a os as um uma uns umas de da do das dos em no na nos nas num numa ao aos à às e ou que com por pelo pela pelos pelas para pra pro se me te lhe nos sem sob seu sua seus suas meu minha'.split(' '));
const limpa = (p: string) => p.toLowerCase().replace(/[^a-zà-ú0-9]/gi, '');
const nomeProprio = (p: string) => /^[A-ZÀ-Ú]/.test(p);

/** Custo de quebrar a linha depois da palavra i (quebra gramatical limpa = custo baixo). */
const custoQuebra = (palavras: string[], i: number) => {
  const a = palavras[i], b = palavras[i + 1];
  if (!b) return 0;
  let c = 0;
  if (LIGADAS.has(limpa(a))) c += 1000; // "da | história"
  if (nomeProprio(a) && nomeProprio(b) && i > 0) c += 600; // "Miroslav | Klose"
  if (/[,;:.!?…]$/.test(a)) c -= 200; // quebra depois de pontuação é natural
  return c;
};

/** Frase editorial: até 2 linhas, quebra gramatical, maior corpo que cabe. */
export const diagramarFrase = (palavras: string[], largura: number, altura: number, corpoMax = 128, corpoMin = 60, alturaLinha = 1.0) => {
  const larg = (de: number, ate: number, corpo: number) => larguraItalico(palavras.slice(de, ate).join(' '), corpo);
  for (let corpo = corpoMax; corpo >= corpoMin; corpo -= 4) {
    if (corpo * alturaLinha <= altura && larg(0, palavras.length, corpo) <= largura) return { corpo, linhas: [palavras.map((_, i) => i)] };
    if (2 * corpo * alturaLinha > altura || palavras.length < 2) continue;
    let melhor: { k: number; custo: number } | null = null;
    for (let k = 1; k < palavras.length; k++) {
      const w1 = larg(0, k, corpo), w2 = larg(k, palavras.length, corpo);
      if (w1 > largura || w2 + corpo * 0.35 > largura) continue;
      const custo = custoQuebra(palavras, k - 1) + Math.abs(w1 - w2) / corpo * 40;
      if (!melhor || custo < melhor.custo) melhor = { k, custo };
    }
    if (melhor && melhor.custo < 1000) {
      const idx = palavras.map((_, i) => i);
      return { corpo, linhas: [idx.slice(0, melhor.k), idx.slice(melhor.k)] };
    }
  }
  return { corpo: corpoMin, linhas: [palavras.map((_, i) => i)] };
};

/** Agrupa as palavras em blocos de 1 a 3 que aparecem juntos (palavra ligada vai com a seguinte). */
export const blocosDeLeitura = (palavras: string[]) => {
  const blocos: number[][] = [];
  let atual: number[] = [];
  palavras.forEach((p, i) => {
    atual.push(i);
    const fimNatural = /[,;:.!?…]$/.test(p) || atual.length >= 3;
    const ligada = LIGADAS.has(limpa(p)) && i < palavras.length - 1;
    if (fimNatural && !ligada) { blocos.push(atual); atual = []; }
  });
  if (atual.length) blocos.push(atual);
  return blocos;
};
