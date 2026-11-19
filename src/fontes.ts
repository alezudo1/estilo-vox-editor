import { continueRender, delayRender } from 'remotion';
// Sistema de duas fontes (escolha do Ale, 19/11/2026, com base no estudo de tipografia):
//  · Arupala Grotesk Ultra — display: ganchos de 1–3 palavras em caixa alta, números, anos, placares
//  · Moon Get Heavy — texto: frases da narração (caixa mista), etiquetas, rótulos
import arupala from './fontes/ArupalaGrotesk-Ultra.woff2';
import moonGet from './fontes/MoonGet-Heavy.woff2';

const FONTES: Array<[string, string, string, string?]> = [
  ['ArupalaGrotesk', arupala, '900'],
  ['MoonGet', moonGet, '800'],
];

let carregado = false;

/** Carrega as fontes do projeto uma única vez, segurando o render até terminar. */
export const carregarFontes = () => {
  if (carregado || typeof document === 'undefined') return;
  carregado = true;
  const handle = delayRender('Carregando fontes');
  Promise.all(
    FONTES.map(([familia, url, peso, estilo]) => {
      const face = new FontFace(familia, `url(${url}) format('woff2')`, { weight: peso, style: estilo ?? 'normal' });
      document.fonts.add(face);
      return face.load();
    }),
  )
    .then(() => continueRender(handle))
    .catch((e) => {
      console.error('Falha ao carregar fontes', e);
      continueRender(handle);
    });
};
