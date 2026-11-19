import React from 'react';
import { Img, useCurrentFrame } from 'remotion';
import { lerDadosGrafico } from '../plano/parser';
import type { Cena, Elemento } from '../plano/tipos';
import { aproximacao, CASCATA, entrada, tracado, visivel } from '../movimento';
import { blocosDeLeitura, diagramarFrase, larguraCondensada, larguraEtiquetaTexto, larguraItalico } from '../medidas';
import { AREA, COR, FAIXA_FRASE, FONTE, LARGURA, PALCO, ZONA, type Tinta } from '../tema';

export interface Contexto {
  cena: Cena;
  tinta: Tinta;
  url: (chave: string) => string | undefined;
  temFrase: boolean;
  duracaoCena: number; // quadros
}
export interface PropsElemento extends Contexto {
  el: Elemento;
  inicio: number; // quadro de entrada, relativo à cena
  slot: { indice: number; total: number };
}

// ---------- utilitários visuais

/** Número pseudoaleatório estável a partir de um texto (mesmo arquivo → mesmo rasgo, mesma inclinação). */
export const semente = (texto: string) => {
  let h = 2166136261;
  for (const c of texto) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
};

/** clip-path de papel rasgado (em %), com dentes irregulares nas quatro bordas. */
export const bordaRasgada = (chave: string, amplitude = 1.4) => {
  const r = semente(chave);
  const pts: string[] = [];
  const lado = (n: number, f: (t: number, d: number) => [number, number]) => {
    for (let i = 0; i < n; i++) pts.push(f(i / n, r() * amplitude).map((v) => `${v.toFixed(2)}%`).join(' '));
  };
  lado(28, (t, d) => [t * 100, d]);
  lado(40, (t, d) => [100 - d, t * 100]);
  lado(28, (t, d) => [100 - t * 100, 100 - d]);
  lado(40, (t, d) => [d, 100 - t * 100]);
  return `polygon(${pts.join(',')})`;
};

/** Filtro SVG: preto e branco "de jornal" e, se pedido, tingido com uma cor (multiplicação). */
export const FiltroImagem: React.FC<{ id: string; cor?: string; contraste?: number }> = ({ id, cor, contraste = 1.25 }) => {
  const [r, g, b] = cor ? [1, 3, 5].map((i) => parseInt(cor.slice(i, i + 2), 16) / 255) : [1, 1, 1];
  const lum = `0.3 0.59 0.11 0 0`;
  const off = (-(contraste - 1) / 2).toFixed(3);
  return (
    <svg width={0} height={0} style={{ position: 'absolute' }}>
      <filter id={id} colorInterpolationFilters="sRGB">
        <feColorMatrix type="matrix" values={`${lum} ${lum} ${lum} 0 0 0 1 0`} />
        <feComponentTransfer>
          <feFuncR type="linear" slope={contraste} intercept={off} />
          <feFuncG type="linear" slope={contraste} intercept={off} />
          <feFuncB type="linear" slope={contraste} intercept={off} />
        </feComponentTransfer>
        <feColorMatrix type="matrix" values={`${r} 0 0 0 0 0 ${g} 0 0 0 0 0 ${b} 0 0 0 0 0 1 0`} />
      </filter>
    </svg>
  );
};

/** Tratamento de cor único para fotos (preserva o tom de pele): sombras levemente frias, meios-tons quentes.
 *  "quente" no papel claro (proximidade, memória), "fria" no fundo escuro (tensão). */
const CURVAS = {
  quente: { r: '0 0.27 0.54 0.79 1', g: '0.02 0.26 0.51 0.76 0.98', b: '0.05 0.25 0.47 0.71 0.94' },
  fria: { r: '0 0.23 0.49 0.75 0.97', g: '0.03 0.26 0.51 0.76 0.98', b: '0.07 0.30 0.54 0.78 0.98' },
};
export const FiltroGrade: React.FC<{ id: string; tom: 'quente' | 'fria' }> = ({ id, tom }) => (
  <svg width={0} height={0} style={{ position: 'absolute' }}>
    <filter id={id} colorInterpolationFilters="sRGB">
      <feColorMatrix type="saturate" values="0.82" />
      <feComponentTransfer>
        <feFuncR type="table" tableValues={CURVAS[tom].r} />
        <feFuncG type="table" tableValues={CURVAS[tom].g} />
        <feFuncB type="table" tableValues={CURVAS[tom].b} />
      </feComponentTransfer>
    </filter>
  </svg>
);

/** Riscos de hachura debaixo de um objeto, como sombra desenhada. */
const Hachura: React.FC<{ largura: number; cor: string; inicio: number }> = ({ largura, cor, inicio }) => {
  const frame = useCurrentFrame();
  const p = tracado(frame, inicio + 2, 6);
  const n = Math.round(largura / 16);
  return (
    <svg width={largura} height={40} style={{ position: 'absolute', left: '50%', bottom: -26, transform: 'translateX(-50%)', overflow: 'visible' }}>
      {Array.from({ length: n }, (_, i) => {
        const x = (i / n) * largura;
        const meio = Math.abs(i / n - 0.5) * 2;
        return i / n <= p ? <line key={i} x1={x + 7} y1={4 + meio * 12} x2={x - 7} y2={30 - meio * 8} stroke={cor} strokeWidth={2.2} opacity={0.5} /> : null;
      })}
    </svg>
  );
};

export const ganchoCurto = (cena: Cena) => cena.elementos.some((e) => e.tipo === 'gancho' && (e.params.texto ?? '').split(/\s+/).filter(Boolean).length <= 3);
const ALTURA_GANCHO = 330; // faixa do título curto quando divide a cena com uma imagem
const limitesPalco = (temFrase: boolean, cena?: Cena) => ({
  topo: PALCO.topo + (cena && ganchoCurto(cena) && cena.elementos.some((e) => e.tipo !== 'gancho') ? ALTURA_GANCHO - 40 : 0),
  base: temFrase ? PALCO.base : PALCO.baseSemFrase,
});
const corPedida = (valor: string | undefined, tinta: Tinta) => (valor ? (valor === 'sim' || valor === 'destaque' || valor === 'alerta' ? tinta.alerta : valor) : undefined);

// ---------- Fundo de papel (textura da biblioteca + quadriculado leve)
export const Fundo: React.FC<{ tinta: Tinta; url: Contexto['url'] }> = ({ tinta, url }) => {
  const textura = url(`textura:${tinta.textura}`);
  const claro = tinta.papel === COR.papel;
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: tinta.papel }} />
      {textura && <Img src={textura} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: claro ? 'multiply' : 'overlay', opacity: claro ? 1 : 0.5 }} />}
      <svg width={LARGURA} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <pattern id="quadriculado" width={54} height={54} patternUnits="userSpaceOnUse">
            <path d="M54 0H0V54" fill="none" stroke={tinta.tinta} strokeWidth={1.2} opacity={claro ? 0.07 : 0.06} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#quadriculado)" />
      </svg>
    </>
  );
};

// ---------- Linha "Fonte: ..." no topo
export const LinhaFonte: React.FC<{ texto: string; tinta: Tinta }> = ({ texto, tinta }) => (
  <div style={{ position: 'absolute', left: AREA.x, top: ZONA.textoTopo, fontFamily: FONTE.texto, fontWeight: 600, fontSize: 26, color: tinta.tinta, opacity: 0.7 }}>Fonte: {texto}</div>
);

// ---------- Frase editorial (_trecho_): até 2 linhas, entra em blocos de 1–3 palavras junto com a voz.
// A ênfase é por luminância: a 2ª linha ganha um marca-texto largo no acento (sobrevive à compressão 4:2:0),
// o texto continua escuro. Nada de texto fino colorido.
export const Frase: React.FC<{ palavras: { texto: string; inicio: number }[]; tinta: Tinta; centro?: boolean; topo?: number; base?: number; corpoMax?: number }> = ({ palavras, tinta, centro, topo = FAIXA_FRASE.topo, base = FAIXA_FRASE.base, corpoMax = 124 }) => {
  const frame = useCurrentFrame();
  const textos = palavras.map((p) => p.texto);
  const { corpo, linhas } = diagramarFrase(textos, AREA.largura - 20, base - topo, corpoMax);
  const blocos = blocosDeLeitura(textos);
  const inicioDe = (i: number) => palavras[blocos.find((b) => b.includes(i))?.[0] ?? i].inicio;
  const alturaLinha = corpo * 1.0;
  return (
    <div style={{ position: 'absolute', left: AREA.x, top: topo, width: AREA.largura, height: base - topo, display: 'flex', flexDirection: 'column', justifyContent: centro ? 'center' : 'flex-end', alignItems: centro ? 'center' : 'flex-start' }}>
      {linhas.map((idx, l) => {
        const enfase = linhas.length > 1 && l === linhas.length - 1;
        const iniLinha = inicioDe(idx[0]);
        const marca = enfase ? tracado(frame, iniLinha, 6) : 0;
        return (
          <div key={l} style={{ position: 'relative', height: alturaLinha, paddingLeft: centro ? 0 : l * corpo * 0.3, whiteSpace: 'nowrap' }}>
            {enfase && (
              <div style={{ position: 'absolute', left: (centro ? 0 : l * corpo * 0.3) - corpo * 0.1, top: corpo * 0.12, height: corpo * 0.9, width: `calc((100% - ${centro ? 0 : l * corpo * 0.3}px + ${corpo * 0.2}px) * ${marca})`, background: tinta.acento, transform: 'rotate(-0.6deg)' }} />
            )}
            <span style={{ position: 'relative', fontFamily: FONTE.editorial, fontStyle: 'italic', fontSize: corpo, lineHeight: `${alturaLinha}px`, letterSpacing: -corpo * 0.005, color: enfase ? tinta.acentoTexto : tinta.tinta }}>
              {idx.map((i) => {
                const ini = inicioDe(i);
                const e = entrada(frame, ini, 4);
                return (
                  <span key={i} style={{ display: 'inline-block', opacity: visivel(frame, ini) ? 1 : 0, transform: `translateY(${(1 - e) * corpo * 0.25}px)` }}>
                    {palavras[i].texto}{i < textos.length - 1 ? '\u00a0' : ''}
                  </span>
                );
              })}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ---------- Etiquetas (caixa de tinta com texto em caixa-alta), empilhadas no topo do palco
export const ETIQUETA = { altura: 52, x: AREA.x, y: ZONA.textoTopo + 45, passo: 64, corpo: 28 } as const;
export const posicaoEtiqueta = (indice: number) => ({ x: ETIQUETA.x, y: ETIQUETA.y + indice * ETIQUETA.passo });
export const caixaAltaEtiqueta = (texto: string) => texto.trim().split(/\s+/).length <= 4; // caixa alta só em rótulos curtos
export const larguraEtiqueta = (texto: string) => 32 + larguraEtiquetaTexto(texto, ETIQUETA.corpo) * (caixaAltaEtiqueta(texto) ? 1 : 0.82);

export const Etiqueta: React.FC<{ texto: string; inicio: number; indice: number; tinta: Tinta }> = ({ texto, inicio, indice, tinta }) => {
  const frame = useCurrentFrame();
  if (!visivel(frame, inicio)) return null;
  const p = entrada(frame, inicio, 6);
  const { x, y } = posicaoEtiqueta(indice);
  return (
    <div style={{ position: 'absolute', left: x, top: y, height: ETIQUETA.altura, display: 'flex', alignItems: 'center', padding: '0 16px', background: tinta.etiqueta, transformOrigin: 'left center', transform: `scaleX(${p}) rotate(-1deg)`, boxShadow: `3px 4px 0 ${tinta.sombra}`, zIndex: 5 }}>
      <span style={{ fontFamily: FONTE.texto, fontWeight: caixaAltaEtiqueta(texto) ? 800 : 700, fontSize: ETIQUETA.corpo, letterSpacing: caixaAltaEtiqueta(texto) ? 0.8 : 0, color: tinta.etiquetaTexto, textTransform: caixaAltaEtiqueta(texto) ? 'uppercase' : 'none', whiteSpace: 'nowrap', opacity: visivel(frame, inicio + 2) ? 1 : 0 }}>{texto}</span>
    </div>
  );
};

// ---------- Gancho: no primeiro quadro. 1–3 palavras → display condensada em caixa alta (placar, ano, número);
// mais que isso → frase editorial em caixa mista.
export const Gancho: React.FC<PropsElemento> = ({ el, tinta, cena }) => {
  const texto = el.params.texto ?? '';
  const palavras = texto.split(/\s+/).filter(Boolean);
  const temImagem = cena.elementos.some((e) => e.tipo === 'objeto' || e.tipo === 'foto');
  if (palavras.length <= 3) {
    const temFrase = cena.frases.length > 0;
    const topo = PALCO.topo;
    const base = temImagem ? PALCO.topo + ALTURA_GANCHO - 20 : temFrase ? PALCO.base : PALCO.baseSemFrase;
    const corpo = Math.min((base - topo) / 0.95, (AREA.largura - 10) / Math.max(0.1, larguraCondensada(texto, 1)));
    return (
      <div style={{ position: 'absolute', left: AREA.x, top: topo, width: AREA.largura, height: base - topo, display: 'flex', alignItems: temImagem ? 'flex-start' : 'center' }}>
        <span style={{ fontFamily: FONTE.numero, fontWeight: 800, fontSize: corpo, lineHeight: 0.95, color: tinta.tinta, textTransform: 'uppercase', whiteSpace: 'nowrap', letterSpacing: -corpo * 0.01 }}>{texto}</span>
      </div>
    );
  }
  const ps = palavras.map((t) => ({ texto: t, inicio: -99 }));
  return temImagem ? <Frase palavras={ps} tinta={tinta} /> : <Frase palavras={ps} tinta={tinta} centro topo={PALCO.topo} base={PALCO.baseSemFrase} corpoMax={180} />;
};

// ---------- Objeto da biblioteca: recorte em P&B, sombra e hachura, entra "caindo" no lugar
export const Objeto: React.FC<PropsElemento> = ({ el, inicio, tinta, url, temFrase, duracaoCena, slot , cena }) => {
  const frame = useCurrentFrame();
  if (!visivel(frame, inicio)) return null;
  const src = url(`objeto:${el.params.nome}`);
  const { topo, base } = limitesPalco(temFrase, cena);
  const altura = (base - topo) / slot.total;
  const escala = Number(el.params.tamanho ?? 1);
  const e = entrada(frame, inicio, 6);
  const push = aproximacao(frame - inicio, duracaoCena, 1, 1.04);
  const id = `obj-${el.linha}`;
  return (
    <div style={{ position: 'absolute', left: PALCO.centroX - PALCO.largura / 2, width: PALCO.largura, top: topo + slot.indice * altura, height: altura, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 34 }}>
      <FiltroImagem id={id} cor={corPedida(el.params.cor, tinta)} contraste={1.12} />
      <div style={{ position: 'relative', height: `${Math.min(100, 90 * escala)}%`, maxWidth: '100%', display: 'flex', justifyContent: 'center', transform: `translateY(${(1 - e) * 90}px) scale(${(0.9 + e * 0.1) * push})`, transformOrigin: 'bottom center' }}>
        {src ? (
          <Img src={src} style={{ height: '100%', maxWidth: PALCO.largura, objectFit: 'contain', filter: `url(#${id}) drop-shadow(14px 18px 10px ${tinta.sombra})` }} />
        ) : (
          <div style={{ width: 460, height: '100%', border: `4px dashed ${tinta.alerta}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONTE.texto, fontSize: 34, color: tinta.tinta, textAlign: 'center', padding: 20 }}>falta o objeto “{el.params.nome}”</div>
        )}
        <Hachura largura={380} cor={tinta.tinta} inicio={inicio} />
      </div>
    </div>
  );
};

// ---------- Foto. Padrão: cor tratada (mesmo grade em todas, tom de pele preservado; quente no claro, fria no escuro).
//   | pb → preto e branco de jornal · | cor → P&B tingido na cor de alerta · | recorte → pessoa recortada com sombra
//   | tela: cheia → ocupa a tela · sem nada → foto de papel rasgado, inclinada
export const Foto: React.FC<PropsElemento> = ({ el, inicio, tinta, url, temFrase, duracaoCena , cena }) => {
  const frame = useCurrentFrame();
  if (!visivel(frame, inicio)) return null;
  const arq = el.params.arquivo ?? '';
  const recorte = el.params.recorte ? url(`recorte:${arq}`) : undefined;
  const src = url(`imagem:${arq}`);
  const { topo, base } = limitesPalco(temFrase, cena);
  const e = entrada(frame, inicio, 6);
  const push = aproximacao(frame - inicio, duracaoCena, 1, 1.06);
  const giro = (semente(arq)() - 0.5) * 5;
  const id = `foto-${el.linha}`;
  const cor = corPedida(el.params.cor, tinta);
  const filtroSvg = cor || el.params.pb ? <FiltroImagem id={id} cor={cor} /> : <FiltroGrade id={id} tom={tinta.grade} />;
  const filtro = `url(#${id})`;
  if (el.params.tela === 'cheia') {
    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {filtroSvg}
        {src && <Img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${push * 1.02})`, filter: filtro }} />}
      </div>
    );
  }
  if (recorte) {
    return (
      <div style={{ position: 'absolute', left: 0, width: LARGURA, top: topo + 40, height: base - topo - 30, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        {filtroSvg}
        <Img src={recorte} style={{ height: '100%', maxWidth: '90%', objectFit: 'contain', transformOrigin: 'bottom center', transform: `translateY(${(1 - e) * 120}px) scale(${push})`, filter: `${filtro} drop-shadow(18px 20px 12px ${tinta.sombra})` }} />
      </div>
    );
  }
  return (
    <div style={{ position: 'absolute', left: PALCO.centroX - PALCO.largura / 2, top: topo + 20, width: PALCO.largura, height: base - topo - 40, transform: `translateY(${(1 - e) * 100}px) rotate(${giro}deg) scale(${push})`, filter: `drop-shadow(12px 16px 10px ${tinta.sombra})` }}>
      {filtroSvg}
      <div style={{ width: '100%', height: '100%', clipPath: bordaRasgada(arq), background: COR.papel, padding: 14 }}>
        {src ? <Img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: filtro }} /> : <div style={{ width: '100%', height: '100%', background: '#bbb' }} />}
      </div>
    </div>
  );
};

// ---------- Documento: folha de papel inclinada com marca-texto menta
export const Doc: React.FC<PropsElemento> = ({ el, inicio, url, tinta, temFrase, duracaoCena , cena }) => {
  const frame = useCurrentFrame();
  if (!visivel(frame, inicio)) return null;
  const e = entrada(frame, inicio, 6);
  const push = aproximacao(frame - inicio, duracaoCena, 1, 1.05);
  const [ax, ay, aw, ah] = (el.params.area ?? '8,40,84,8').split(',').map((v) => Number(v.trim()));
  const marca = tracado(frame, inicio + 10, 8);
  const { topo, base } = limitesPalco(temFrase, cena);
  const src = url(`imagem:${el.params.arquivo}`);
  return (
    <div style={{ position: 'absolute', left: AREA.x, top: topo, width: LARGURA - AREA.x * 2, height: base - topo, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `translateY(${(1 - e) * 140}px) rotate(-2deg) scale(${push})` }}>
      <div style={{ position: 'relative', background: COR.papel, padding: 22, boxShadow: `14px 18px 0 ${tinta.sombra}`, maxWidth: '100%', maxHeight: '100%' }}>
        {src && <Img src={src} style={{ display: 'block', maxWidth: 820, maxHeight: base - topo - 60, objectFit: 'contain', mixBlendMode: 'multiply' }} />}
        <div style={{ position: 'absolute', left: `calc(22px + ${ax}% * 0.95)`, top: `calc(22px + ${ay}% * 0.95)`, width: `${aw * marca * 0.95}%`, height: `${ah * 0.95}%`, background: COR.menta, mixBlendMode: 'multiply' }} />
      </div>
    </div>
  );
};

// ---------- Número em caixa menta, com a legenda como etiqueta logo acima
export const Numero: React.FC<PropsElemento> = ({ el, inicio, tinta, temFrase, slot , cena }) => {
  const frame = useCurrentFrame();
  if (!visivel(frame, inicio)) return null;
  const { topo, base } = limitesPalco(temFrase, cena);
  const altura = (base - topo) / slot.total;
  const valor = (el.params.valor ?? '').toUpperCase();
  const corpo = Math.min(190, (AREA.largura - 90) / Math.max(0.1, larguraCondensada(valor, 1)));
  const caixa = entrada(frame, inicio, 4);
  const leg = el.params.legenda;
  const giro = slot.indice % 2 ? 1.2 : -1.5;
  return (
    <div style={{ position: 'absolute', left: AREA.x + 10, top: topo + slot.indice * altura, height: altura, width: AREA.largura, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', gap: 16 }}>
      {leg && (
        <div style={{ background: tinta.etiqueta, padding: '8px 16px', transform: `rotate(${giro * 0.6}deg)`, boxShadow: `3px 4px 0 ${tinta.sombra}` }}>
          <span style={{ fontFamily: FONTE.texto, fontWeight: caixaAltaEtiqueta(leg) ? 800 : 700, fontSize: 30, letterSpacing: caixaAltaEtiqueta(leg) ? 0.8 : 0, color: tinta.etiquetaTexto, textTransform: caixaAltaEtiqueta(leg) ? 'uppercase' : 'none' }}>{leg}</span>
        </div>
      )}
      <div style={{ background: tinta.acento, padding: `${corpo * 0.06}px ${corpo * 0.16}px`, transformOrigin: 'left center', transform: `rotate(${giro}deg) scaleX(${caixa})`, boxShadow: `6px 8px 0 ${tinta.sombra}` }}>
        <span style={{ fontFamily: FONTE.numero, fontWeight: 800, fontSize: corpo, lineHeight: 1.05, letterSpacing: -corpo * 0.01, color: tinta.acentoTexto, whiteSpace: 'nowrap', opacity: visivel(frame, inicio + 2) ? 1 : 0 }}>{valor}</span>
      </div>
    </div>
  );
};

// ---------- Gráfico de barras: rótulos diretos; a cor de alerta fica na barra (área larga), nunca no número
export const Grafico: React.FC<PropsElemento> = ({ el, inicio, tinta, temFrase , cena }) => {
  const frame = useCurrentFrame();
  if (!visivel(frame, inicio)) return null;
  const dados = lerDadosGrafico(el.params.dados);
  const max = Math.max(...dados.map((d) => d.valor), 1);
  const { topo, base } = limitesPalco(temFrase, cena);
  const topoBarras = topo + (el.params.titulo ? 260 : 150);
  const baseBarras = base - 70;
  const util = baseBarras - topoBarras;
  const gap = 50;
  const larg = Math.min(300, (AREA.largura - gap * (dados.length - 1)) / Math.max(1, dados.length));
  const esquerda = AREA.x + (AREA.largura - (larg * dados.length + gap * (dados.length - 1))) / 2;
  return (
    <>
      {el.params.titulo && (
        <div style={{ position: 'absolute', left: AREA.x, top: topo + 10, width: AREA.largura, fontFamily: FONTE.editorial, fontStyle: 'italic', fontSize: 88, lineHeight: 1, color: tinta.tinta }}>{el.params.titulo}</div>
      )}
      <div style={{ position: 'absolute', left: AREA.x - 10, top: baseBarras, width: AREA.largura + 20, height: 4, background: tinta.tinta, opacity: 0.8 }} />
      {dados.map((d, k) => {
        const ini = inicio + 4 + k * CASCATA * 2;
        if (!visivel(frame, ini)) return null;
        const cresce = tracado(frame, ini, 8);
        const h = (d.valor / max) * util * cresce;
        const x = esquerda + k * (larg + gap);
        const maior = d.valor === max;
        return (
          <React.Fragment key={k}>
            <div style={{ position: 'absolute', left: x, top: baseBarras - h, width: larg, height: h, background: maior ? tinta.alerta : tinta.tinta, opacity: maior ? 1 : 0.85, boxShadow: `8px 0 0 ${tinta.sombra}` }} />
            <div style={{ position: 'absolute', left: x, top: baseBarras - h - 140, width: larg, textAlign: 'center', fontFamily: FONTE.numero, fontWeight: 800, fontSize: 130, lineHeight: 1, color: tinta.tinta, opacity: cresce > 0.9 ? 1 : 0 }}>
              {Number.isInteger(d.valor) ? d.valor : d.valor.toLocaleString('pt-BR')}
            </div>
            <div style={{ position: 'absolute', left: x - 20, top: baseBarras + 16, width: larg + 40, textAlign: 'center', fontFamily: FONTE.texto, fontWeight: 700, fontSize: 32, color: tinta.tinta }}>{d.rotulo}</div>
          </React.Fragment>
        );
      })}
    </>
  );
};

// ---------- Card final (provisório até as referências do Ale)
export const CardFinal: React.FC<PropsElemento> = ({ inicio, tinta }) => {
  const frame = useCurrentFrame();
  if (!visivel(frame, inicio)) return null;
  const e = entrada(frame, inicio, 6);
  const nome = '@alezudoo';
  const corpo = Math.min(200, (AREA.largura - 40) / (larguraItalico(nome, 1) || 1));
  return (
    <div style={{ position: 'absolute', left: AREA.x, top: 760, width: AREA.largura, transform: `translateY(${(1 - e) * 60}px)` }}>
      <div style={{ fontFamily: FONTE.editorial, fontStyle: 'italic', fontSize: corpo, lineHeight: 1, color: tinta.tinta }}>{nome}</div>
      <div style={{ display: 'inline-block', marginTop: 24, background: tinta.etiqueta, padding: '10px 18px', opacity: visivel(frame, inicio + 6) ? 1 : 0 }}>
        <span style={{ fontFamily: FONTE.texto, fontWeight: 800, fontSize: 34, letterSpacing: 0.8, color: tinta.etiquetaTexto, textTransform: 'uppercase' }}>Segue pra mais</span>
      </div>
    </div>
  );
};

export const COMPONENTES: Record<string, React.FC<PropsElemento>> = {
  gancho: Gancho,
  foto: Foto,
  objeto: Objeto,
  doc: Doc,
  numero: Numero,
  grafico: Grafico,
  'card-final': CardFinal,
  texto: () => null,
};
