import { continueRender, delayRender } from 'remotion';
// Sistema de duas famílias (estudo de tipografia, nov/2026):
//  · Instrument Serif — voz editorial: frases da narração e títulos (caixa mista)
//  · Fira Sans (humanista) — etiquetas e textos curtos; Fira Sans Condensed — números, placares e ganchos de 1–3 palavras
import instrumentItalico from './fontes/InstrumentSerif-Italic.woff2';
import instrumentRegular from './fontes/InstrumentSerif-Regular.woff2';
import firaSemi from './fontes/FiraSans-SemiBold.woff2';
import firaBold from './fontes/FiraSans-Bold.woff2';
import firaExtra from './fontes/FiraSans-ExtraBold.woff2';
import firaCondExtra from './fontes/FiraSansCondensed-ExtraBold.woff2';

const FONTES: Array<[string, string, string, string?]> = [
  ['InstrumentSerif', instrumentItalico, '400', 'italic'],
  ['InstrumentSerif', instrumentRegular, '400', 'normal'],
  ['FiraSans', firaSemi, '600'],
  ['FiraSans', firaBold, '700'],
  ['FiraSans', firaExtra, '800'],
  ['FiraSansCondensed', firaCondExtra, '800'],
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
