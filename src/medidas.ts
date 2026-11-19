// Larguras de avanço da Humane Bold (em fração do corpo), medidas do arquivo da fonte.
// Permitem diagramar títulos e números sem depender do navegador.
const HUMANE: Record<string, number> = {'A': 0.250, 'B': 0.238, 'C': 0.240, 'D': 0.240, 'E': 0.160, 'F': 0.155, 'G': 0.240, 'H': 0.240, 'I': 0.120, 'J': 0.240, 'K': 0.252, 'L': 0.157, 'M': 0.381, 'N': 0.291, 'O': 0.240, 'P': 0.240, 'Q': 0.240, 'R': 0.240, 'S': 0.236, 'T': 0.210, 'U': 0.240, 'V': 0.244, 'W': 0.389, 'X': 0.250, 'Y': 0.244, 'Z': 0.195, '0': 0.240, '1': 0.200, '2': 0.240, '3': 0.240, '4': 0.252, '5': 0.240, '6': 0.240, '7': 0.230, '8': 0.240, '9': 0.240, ' ': 0.090, '.': 0.140, ',': 0.140, ':': 0.150, '!': 0.160, '?': 0.260, '%': 0.578, '-': 0.180, '@': 0.484, "'": 0.140, '"': 0.260};
export const HUMANE_ALTURA_MAIUSCULA = 0.7;

export const larguraHumane = (texto: string, corpo: number) =>
  [...texto.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '')].reduce((s, c) => s + (HUMANE[c] ?? 0.24), 0) * corpo;

/** Quebra o texto em linhas e escolhe o maior corpo que cabe na caixa. */
export const diagramarHumane = (texto: string, largura: number, altura: number, alturaLinha: number, corpoMax = 900) => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  for (let corpo = corpoMax; corpo >= 80; corpo -= 10) {
    const linhas: string[] = [];
    let ok = true;
    for (const p of palavras) {
      if (larguraHumane(p, corpo) > largura) { ok = false; break; }
      const ult = linhas[linhas.length - 1];
      if (ult !== undefined && larguraHumane(`${ult} ${p}`, corpo) <= largura) linhas[linhas.length - 1] = `${ult} ${p}`;
      else linhas.push(p);
    }
    if (ok && linhas.length * corpo * alturaLinha <= altura) return { corpo, linhas };
  }
  return { corpo: 80, linhas: palavras };
};

// Larguras da Instrument Serif Itálico (frases editoriais)
const ITALICO: Record<string, number> = {"a": 0.474, "b": 0.431, "c": 0.351, "d": 0.474, "e": 0.348, "f": 0.273, "g": 0.401, "h": 0.476, "i": 0.288, "j": 0.266, "k": 0.447, "l": 0.24, "m": 0.745, "n": 0.521, "o": 0.414, "p": 0.45, "q": 0.425, "r": 0.368, "s": 0.302, "t": 0.272, "u": 0.508, "v": 0.412, "w": 0.609, "x": 0.45, "y": 0.418, "z": 0.385, "A": 0.457, "B": 0.479, "C": 0.475, "D": 0.536, "E": 0.454, "F": 0.411, "G": 0.514, "H": 0.545, "I": 0.25, "J": 0.251, "K": 0.499, "L": 0.414, "M": 0.665, "N": 0.542, "O": 0.54, "P": 0.469, "Q": 0.541, "R": 0.525, "S": 0.424, "T": 0.461, "U": 0.537, "V": 0.458, "W": 0.653, "X": 0.545, "Y": 0.478, "Z": 0.427, "0": 0.461, "1": 0.248, "2": 0.404, "3": 0.373, "4": 0.394, "5": 0.387, "6": 0.411, "7": 0.365, "8": 0.437, "9": 0.414, " ": 0.17, ".": 0.219, ",": 0.219, ":": 0.299, ";": 0.301, "!": 0.275, "?": 0.358, "%": 0.591, "-": 0.426, "'": 0.235, "\"": 0.374, "(": 0.346, ")": 0.346, "$": 0.424, "@": 0.665, "&": 0.525, "á": 0.474, "à": 0.474, "â": 0.474, "ã": 0.474, "é": 0.348, "ê": 0.348, "í": 0.288, "ó": 0.414, "ô": 0.414, "õ": 0.414, "ú": 0.508, "ç": 0.351, "Á": 0.457, "À": 0.457, "Â": 0.457, "Ã": 0.457, "É": 0.454, "Ê": 0.454, "Í": 0.25, "Ó": 0.54, "Ô": 0.54, "Õ": 0.54, "Ú": 0.537, "Ç": 0.475};

export const larguraItalico = (texto: string, corpo: number) => [...texto].reduce((s, c) => s + (ITALICO[c] ?? 0.42), 0) * corpo;

/** Quebra a frase em até `maxLinhas` linhas equilibradas e escolhe o maior corpo que cabe. */
export const diagramarFrase = (palavras: string[], largura: number, altura: number, corpoMax = 132, corpoMin = 64, alturaLinha = 0.98) => {
  for (let corpo = corpoMax; corpo >= corpoMin; corpo -= 4) {
    for (let n = 1; n <= 3; n++) {
      if (n * corpo * alturaLinha > altura) break;
      // divide em n linhas tentando igualar larguras
      const total = larguraItalico(palavras.join(' '), corpo);
      const alvo = total / n;
      const linhas: number[][] = [[]];
      let acc = 0;
      palavras.forEach((p, i) => {
        const w = larguraItalico(p + ' ', corpo);
        if (acc + w / 2 > alvo && linhas.length < n && linhas[linhas.length - 1].length) { linhas.push([]); acc = 0; }
        linhas[linhas.length - 1].push(i);
        acc += w;
      });
      if (linhas.every((l) => larguraItalico(l.map((i) => palavras[i]).join(' '), corpo) <= largura)) return { corpo, linhas };
    }
  }
  return { corpo: corpoMin, linhas: [palavras.map((_, i) => i)] };
};
