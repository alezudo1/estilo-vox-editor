// Medidas das fontes (larguras de avanço em fração do corpo), tiradas dos arquivos.
// Permitem diagramar textos sem depender do navegador.

const MOON: Record<string, number> = {"a": 0.775, "b": 0.775, "c": 0.629, "d": 0.775, "e": 0.745, "f": 0.618, "g": 0.775, "h": 0.671, "i": 0.31, "j": 0.581, "k": 0.746, "l": 0.31, "m": 1.06, "n": 0.686, "o": 0.746, "p": 0.775, "q": 0.775, "r": 0.537, "s": 0.524, "t": 0.608, "u": 0.669, "v": 0.853, "w": 1.088, "x": 0.746, "y": 0.807, "z": 0.627, "A": 1.023, "B": 0.818, "C": 0.968, "D": 0.866, "E": 0.656, "F": 0.672, "G": 1.089, "H": 0.94, "I": 0.31, "J": 0.58, "K": 0.895, "L": 0.626, "M": 1.03, "N": 0.91, "O": 1.089, "P": 0.82, "Q": 1.089, "R": 0.826, "S": 0.69, "T": 0.788, "U": 0.895, "V": 1.022, "W": 1.263, "X": 0.937, "Y": 0.937, "Z": 0.79, "0": 0.849, "1": 0.403, "2": 0.731, "3": 0.744, "4": 0.76, "5": 0.742, "6": 0.85, "7": 0.76, "8": 0.82, "9": 0.839, " ": 0.425, ".": 0.433, ",": 0.433, ";": 0.433, ":": 0.433, "!": 0.43, "?": 0.72, "'": 0.358, "\"": 0.618, "(": 0.602, ")": 0.602, "-": 0.707, "%": 0.999, "$": 0.69, "@": 1.243, "&": 1.319, "/": 0.609, "+": 0.707, "=": 0.787, "#": 1.207, "*": 0.588, "á": 0.775, "à": 0.775, "â": 0.775, "ã": 0.775, "é": 0.745, "ê": 0.745, "í": 0.31, "ó": 0.746, "ô": 0.746, "õ": 0.746, "ú": 0.669, "ç": 0.629, "Á": 1.023, "À": 1.023, "Â": 1.023, "Ã": 1.023, "É": 0.656, "Ê": 0.656, "Í": 0.309, "Ó": 1.089, "Ô": 1.089, "Õ": 1.089, "Ú": 0.895, "Ç": 0.968};
const ARUPALA: Record<string, number> = {"a": 0.728, "b": 0.762, "c": 0.747, "d": 0.762, "e": 0.765, "f": 0.486, "g": 0.786, "h": 0.731, "i": 0.274, "j": 0.276, "k": 0.755, "l": 0.274, "m": 1.048, "n": 0.754, "o": 0.764, "p": 0.762, "q": 0.762, "r": 0.564, "s": 0.681, "t": 0.484, "u": 0.754, "v": 0.69, "w": 0.983, "x": 0.713, "y": 0.67, "z": 0.575, "A": 0.956, "B": 0.766, "C": 0.793, "D": 0.772, "E": 0.683, "F": 0.683, "G": 0.855, "H": 0.753, "I": 0.284, "J": 0.76, "K": 0.798, "L": 0.701, "M": 0.996, "N": 0.766, "O": 0.843, "P": 0.75, "Q": 0.871, "R": 0.754, "S": 0.776, "T": 0.806, "U": 0.779, "V": 0.883, "W": 1.318, "X": 0.791, "Y": 0.892, "Z": 0.718, "0": 0.758, "1": 0.625, "2": 0.727, "3": 0.728, "4": 0.798, "5": 0.704, "6": 0.722, "7": 0.69, "8": 0.705, "9": 0.697, " ": 0.18, ".": 0.274, ",": 0.274, ";": 0.274, ":": 0.274, "!": 0.274, "?": 0.672, "'": 0.274, "\"": 0.504, "(": 0.423, ")": 0.423, "-": 0.365, "%": 0.943, "$": 0.718, "@": 1.018, "&": 0.873, "/": 0.488, "+": 0.516, "=": 0.516, "#": 0.772, "*": 0.488, "á": 0.728, "à": 0.728, "â": 0.728, "ã": 0.728, "é": 0.765, "ê": 0.765, "í": 0.284, "ó": 0.764, "ô": 0.764, "õ": 0.764, "ú": 0.754, "ç": 0.747, "Á": 0.956, "À": 0.956, "Â": 0.956, "Ã": 0.956, "É": 0.683, "Ê": 0.683, "Í": 0.284, "Ó": 0.843, "Ô": 0.843, "Õ": 0.843, "Ú": 0.779, "Ç": 0.793};

/** A Moon Get não tem aspas curvas, travessões, reticências nem º/ª: troca pelos equivalentes simples. */
export const normalizarTexto = (t: string) =>
  t.replace(/[“”«»]/g, '"').replace(/[‘’]/g, "'").replace(/[–—]/g, '-').replace(/…/g, '...').replace(/º/g, 'o').replace(/ª/g, 'a').replace(/·/g, '-');

const semAcento = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const medir = (tabela: Record<string, number>, padrao: number, caixaAlta: boolean) => (texto: string, corpo: number) =>
  [...(caixaAlta ? texto.toUpperCase() : texto)].reduce((s, c) => s + (tabela[c] ?? tabela[semAcento(c)] ?? padrao), 0) * corpo;

/** Moon Get Heavy (texto: frases, etiquetas, rótulos) */
export const larguraTexto = (texto: string, corpo: number, caixaAlta = false) => medir(MOON, 0.6, caixaAlta)(normalizarTexto(texto), corpo);
/** Arupala Grotesk Ultra (display: ganchos curtos, números, anos, placares), sempre em caixa alta */
export const larguraDisplay = medir(ARUPALA, 0.75, true);

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

/** Frase: até 2 linhas com quebra gramatical, maior corpo que cabe. Se não couber nem em `corpoLegivel`,
 *  usa 3 linhas como último recurso (e o semáforo avisa que a frase está longa demais para a tela). */
export const diagramarFrase = (palavras: string[], largura: number, altura: number, corpoMax = 92, corpoLegivel = 50, alturaLinha = 1.22) => {
  const larg = (de: number, ate: number, corpo: number) => larguraTexto(palavras.slice(de, ate).join(' '), corpo);
  const idx = palavras.map((_, i) => i);
  const n = palavras.length;
  const tentar = (corpo: number, maxLinhas: number): number[][] | null => {
    if (corpo * alturaLinha <= altura && larg(0, n, corpo) <= largura) return [idx];
    let melhor: { cortes: number[]; custo: number } | null = null;
    const avaliar = (cortes: number[]) => {
      const lim = [0, ...cortes, n];
      const ws = lim.slice(1).map((f, j) => larg(lim[j], f, corpo));
      if (ws.some((w) => w > largura) || ws.length * corpo * alturaLinha > altura) return;
      const custo = cortes.reduce((c, k) => c + custoQuebra(palavras, k - 1), 0) + ((Math.max(...ws) - Math.min(...ws)) / corpo) * 40;
      if (!melhor || custo < melhor.custo) melhor = { cortes, custo };
    };
    for (let k = 1; k < n; k++) {
      if (maxLinhas >= 2) avaliar([k]);
      if (maxLinhas >= 3) for (let j = k + 1; j < n; j++) avaliar([k, j]);
    }
    const m = melhor as { cortes: number[]; custo: number } | null;
    if (!m || m.custo >= 1000) return null;
    const lim = [0, ...m.cortes, n];
    return lim.slice(1).map((f, j) => idx.slice(lim[j], f));
  };
  for (let corpo = corpoMax; corpo >= corpoLegivel; corpo -= 2) {
    const linhas = tentar(corpo, 2);
    if (linhas) return { corpo, linhas, apertada: false };
  }
  for (let corpo = corpoLegivel; corpo >= 40; corpo -= 2) {
    const linhas = tentar(corpo, 3);
    if (linhas) return { corpo, linhas, apertada: true };
  }
  return { corpo: 40, linhas: [idx], apertada: true };
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
