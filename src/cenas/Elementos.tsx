import React from 'react';
import { Img, useCurrentFrame } from 'remotion';
import { lerDadosGrafico } from '../plano/parser';
import type { Elemento } from '../plano/tipos';
import { aproximacao, CASCATA, entrada, tracado, visivel } from '../movimento';
import { diagramarHumane, larguraHumane } from '../medidas';
import { AREA, ALTURA, COR, FONTE, LARGURA, paletaDoFundo } from '../tema';

type Paleta = ReturnType<typeof paletaDoFundo>;
export interface PropsElemento {
  el: Elemento;
  inicio: number; // quadro de entrada, relativo à cena
  duracaoCena: number; // em quadros
  paleta: Paleta;
  url: (arquivo: string) => string;
  slot: { indice: number; total: number }; // posição entre elementos do mesmo tipo na cena
}

// ---------- Gancho: título grande já presente no primeiro quadro (vira a capa do Reels)
const ALTURA_LINHA = 0.8;

export const Gancho: React.FC<PropsElemento> = ({ el, inicio, paleta }) => {
  const frame = useCurrentFrame();
  const { corpo, linhas } = diagramarHumane(el.params.texto ?? '', AREA.largura, AREA.altura * 0.85, ALTURA_LINHA);
  return (
    <div style={{ position: 'absolute', left: AREA.x, top: AREA.y, width: AREA.largura, height: AREA.altura, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      {linhas.map((linha, k) => {
        // começa antes do quadro 0: no primeiro quadro tudo já está na tela, ainda em movimento
        const e = entrada(frame, inicio - 6 + k * CASCATA);
        return (
          <div key={k} style={{ fontFamily: FONTE.titulo, fontWeight: 700, fontSize: corpo, lineHeight: ALTURA_LINHA, color: paleta.texto, textTransform: 'uppercase', whiteSpace: 'nowrap', transform: `translateY(${(1 - e) * 60}px)` }}>
            {linha}
          </div>
        );
      })}
    </div>
  );
};

// ---------- Foto: tela cheia com aproximação lenta e contínua
export const Foto: React.FC<PropsElemento> = ({ el, duracaoCena, url, inicio }) => {
  const frame = useCurrentFrame();
  if (!visivel(frame, inicio)) return null;
  const escala = aproximacao(frame - inicio, duracaoCena);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <Img src={url(el.params.arquivo)} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${escala})` }} />
    </div>
  );
};

// ---------- Documento: papel levemente girado + marca-texto menta
export const Doc: React.FC<PropsElemento> = ({ el, inicio, url, duracaoCena }) => {
  const frame = useCurrentFrame();
  if (!visivel(frame, inicio)) return null;
  const e = entrada(frame, inicio);
  const escala = aproximacao(frame - inicio, duracaoCena, 1, 1.05);
  const [ax, ay, aw, ah] = (el.params.area ?? '20,46,60,7').split(',').map((v) => Number(v.trim()));
  const marca = tracado(frame, inicio + 10, 10);
  const largura = AREA.largura - 40;
  return (
    <div style={{ position: 'absolute', left: AREA.x + 20, top: AREA.y + 40, width: largura, height: AREA.altura - 120, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `translateY(${(1 - e) * 120}px) rotate(-1.5deg) scale(${escala})` }}>
      <div style={{ position: 'relative', background: COR.papel, padding: 18, maxWidth: '100%', maxHeight: '100%' }}>
        <Img src={url(el.params.arquivo)} style={{ display: 'block', maxWidth: largura - 36, maxHeight: AREA.altura - 160, objectFit: 'contain' }} />
        <div style={{ position: 'absolute', left: `calc(18px + ${ax}% * 0.93)`, top: `calc(18px + ${ay}% * 0.93)`, width: `${aw * marca * 0.93}%`, height: `${ah * 0.93}%`, background: COR.menta, mixBlendMode: 'multiply' }} />
      </div>
    </div>
  );
};

// ---------- Número grande com legenda
export const Numero: React.FC<PropsElemento> = ({ el, inicio, paleta, slot }) => {
  const frame = useCurrentFrame();
  if (!visivel(frame, inicio)) return null;
  const e = entrada(frame, inicio);
  const legendaVisivel = visivel(frame, inicio + CASCATA);
  const altura = AREA.altura / slot.total;
  const valor = el.params.valor ?? '';
  const tamanho = Math.min(altura * 0.95, AREA.largura / Math.max(0.1, larguraHumane(valor, 1)) * 0.98);
  return (
    <div style={{ position: 'absolute', left: AREA.x, top: AREA.y + slot.indice * altura, width: AREA.largura, height: altura, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ fontFamily: FONTE.titulo, fontWeight: 700, fontSize: tamanho, lineHeight: 0.82, color: slot.indice === slot.total - 1 ? paleta.texto : paleta.apoio, transform: `scale(${0.9 + e * 0.1})`, transformOrigin: 'left bottom' }}>
        {valor}
      </div>
      {el.params.legenda && (
        <div style={{ fontFamily: FONTE.texto, fontWeight: 600, fontSize: Math.max(44, Math.min(64, tamanho * 0.12)), color: paleta.destaque, textTransform: 'uppercase', marginTop: 8, opacity: legendaVisivel ? 1 : 0 }}>
          {el.params.legenda}
        </div>
      )}
    </div>
  );
};

// ---------- Gráfico de barras construído aos poucos, com rótulos diretos
export const Grafico: React.FC<PropsElemento> = ({ el, inicio, paleta }) => {
  const frame = useCurrentFrame();
  if (!visivel(frame, inicio)) return null;
  const dados = lerDadosGrafico(el.params.dados);
  const max = Math.max(...dados.map((d) => d.valor), 1);
  const topoBarras = AREA.y + 260;
  const baseBarras = AREA.y + AREA.altura - 140;
  const alturaUtil = baseBarras - topoBarras;
  const gap = 60;
  const larg = (AREA.largura - gap * (dados.length - 1)) / Math.max(1, dados.length);
  const corDe = (d: { rotulo: string; valor: number }) => (d.valor === max ? paleta.alerta : paleta.terra);
  return (
    <>
      {el.params.titulo && (
        <div style={{ position: 'absolute', left: AREA.x, top: AREA.y, width: AREA.largura, fontFamily: FONTE.serifa, fontSize: 64, lineHeight: 1.1, color: paleta.texto }}>{el.params.titulo}</div>
      )}
      {dados.map((d, k) => {
        const ini = inicio + 4 + k * CASCATA * 2;
        if (!visivel(frame, ini)) return null;
        const cresce = tracado(frame, ini, 10);
        const h = (d.valor / max) * alturaUtil * cresce;
        const x = AREA.x + k * (larg + gap);
        return (
          <React.Fragment key={k}>
            <div style={{ position: 'absolute', left: x, top: baseBarras - h, width: larg, height: h, background: corDe(d) }} />
            <div style={{ position: 'absolute', left: x, top: baseBarras - h - 190, width: larg, textAlign: 'center', fontFamily: FONTE.titulo, fontWeight: 700, fontSize: 180, lineHeight: 1, color: paleta.texto, opacity: cresce > 0.9 ? 1 : 0 }}>
              {Number.isInteger(d.valor) ? d.valor : d.valor.toLocaleString('pt-BR')}
            </div>
            <div style={{ position: 'absolute', left: x, top: baseBarras + 18, width: larg, textAlign: 'center', fontFamily: FONTE.texto, fontWeight: 600, fontSize: 44, color: paleta.texto, textTransform: 'uppercase' }}>{d.rotulo}</div>
          </React.Fragment>
        );
      })}
    </>
  );
};

// ---------- Card final (provisório: será substituído pelas 3 opções a partir das referências do Ale)
export const CardFinal: React.FC<PropsElemento> = ({ inicio, paleta }) => {
  const frame = useCurrentFrame();
  if (!visivel(frame, inicio)) return null;
  const e = entrada(frame, inicio);
  const sub = tracado(frame, inicio + 6, 10);
  return (
    <div style={{ position: 'absolute', inset: 0, background: COR.marinho }}>
      <div style={{ position: 'absolute', left: AREA.x, top: AREA.y + AREA.altura * 0.3, width: AREA.largura }}>
        <div style={{ fontFamily: FONTE.titulo, fontWeight: 700, fontSize: 300, lineHeight: 0.85, color: COR.lavanda, transform: `translateY(${(1 - e) * 80}px)` }}>@ALEZUDOO</div>
        <div style={{ height: 18, width: `${sub * 100}%`, background: COR.menta, marginTop: 10 }} />
        <div style={{ fontFamily: FONTE.texto, fontWeight: 600, fontSize: 48, color: COR.mentaClara, marginTop: 36, textTransform: 'uppercase', opacity: visivel(frame, inicio + 12) ? 1 : 0 }}>Segue pra mais</div>
      </div>
    </div>
  );
};

export const COMPONENTES: Record<string, React.FC<PropsElemento>> = {
  gancho: Gancho,
  foto: Foto,
  doc: Doc,
  numero: Numero,
  grafico: Grafico,
  'card-final': CardFinal,
  texto: () => null,
};

export { ALTURA, LARGURA };
