import { continueRender, delayRender } from 'remotion';
import humaneBold from './fontes/Humane-Bold.woff2';
import geist from './fontes/Geist-VF.woff2';
import geistSerif from './fontes/GeistSerif-VF.woff2';
import geistMono from './fontes/GeistMono-VF.woff2';
import instrumentItalico from './fontes/InstrumentSerif-Italic.woff2';
import instrumentRegular from './fontes/InstrumentSerif-Regular.woff2';

const FONTES: Array<[string, string, string, string?]> = [
  ['InstrumentSerif', instrumentItalico, '400', 'italic'],
  ['InstrumentSerif', instrumentRegular, '400', 'normal'],
  ['Humane', humaneBold, '700'],
  ['Geist', geist, '100 900'],
  ['GeistSerif', geistSerif, '100 900'],
  ['GeistMono', geistMono, '100 900'],
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
