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
