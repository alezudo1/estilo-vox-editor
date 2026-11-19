import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { Video, duracaoEmQuadros } from '../../src/Video';
import type { Aviso, Plano } from '../../src/plano/tipos';
import { ALTURA, FPS, LARGURA, ZONA } from '../../src/tema';
import type { ResumoVideo } from '../../scripts/lib/pasta';

const COR_TIPO: Record<string, string> = {
  gancho: '#E5D4ED', foto: '#7FA38A', doc: '#F4F1EA', numero: '#A6ECE0', grafico: '#7ADFBB', 'card-final': '#FF6B57', texto: '#555',
};
const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toFixed(2).padStart(5, '0')}`;

export const App: React.FC = () => {
  const [lista, setLista] = useState<{ pasta: string; videos: ResumoVideo[] } | null>(null);
  const [slug, setSlug] = useState<string | null>(() => new URLSearchParams(location.search).get('video'));
  const [plano, setPlano] = useState<Plano | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregarLista = useCallback(() => fetch('/api/videos').then((r) => r.json()).then(setLista), []);
  const carregarPlano = useCallback(() => {
    if (!slug) return;
    fetch(`/api/videos/${encodeURIComponent(slug)}/plano`)
      .then((r) => r.json())
      .then((p) => (p.erro ? (setErro(p.erro), setPlano(null)) : (setErro(null), setPlano(p))));
  }, [slug]);

  useEffect(() => { carregarLista(); }, [carregarLista]);
  useEffect(() => {
    carregarPlano();
    const u = new URL(location.href);
    slug ? u.searchParams.set('video', slug) : u.searchParams.delete('video');
    history.replaceState(null, '', u);
  }, [slug, carregarPlano]);
  // salvou o roteiro ou trocou uma imagem → atualiza sozinho
  useEffect(() => {
    if (!import.meta.hot) return;
    const f = () => { carregarLista(); carregarPlano(); };
    import.meta.hot.on('vox:mudou', f);
    return () => import.meta.hot?.off('vox:mudou', f);
  }, [carregarLista, carregarPlano]);

  return (
    <div className="app">
      <aside className="lateral">
        <h1>Estilo Vox <span>painel</span></h1>
        <div className="secao">Vídeos</div>
        {lista?.videos.length === 0 && (
          <p className="vazio">
            Nenhum vídeo em <code>{lista.pasta}</code>. Crie uma pasta <code>AAAA-MM-DD-assunto</code> com <code>roteiro.md</code>, <code>audio.wav</code> e <code>imagens/</code>.
          </p>
        )}
        {lista?.videos.map((v) => (
          <button key={v.slug} className={`item ${v.slug === slug ? 'ativo' : ''}`} onClick={() => setSlug(v.slug)}>
            <strong>{v.titulo}</strong>
            <small>{v.slug}</small>
            <span className="selos">
              {v.erros > 0 && <i className="erro">{v.erros} erro{v.erros > 1 ? 's' : ''}</i>}
              {v.alertas > 0 && <i className="alerta">{v.alertas} alerta{v.alertas > 1 ? 's' : ''}</i>}
              {!v.temAudio && <i>sem áudio</i>}
              {v.erros === 0 && v.alertas === 0 && v.temAudio && <i className="ok">pronto</i>}
            </span>
          </button>
        ))}
        {lista && <p className="rodape">Pasta: <code>{lista.pasta}</code></p>}
      </aside>
      <main>
        {!slug && <p className="vazio grande">Escolha um vídeo à esquerda.</p>}
        {erro && <p className="vazio grande">⚠ {erro}</p>}
        {plano && slug && <Previa plano={plano} slug={slug} />}
      </main>
    </div>
  );
};

const Previa: React.FC<{ plano: Plano; slug: string }> = ({ plano, slug }) => {
  const player = useRef<PlayerRef>(null);
  const [frame, setFrame] = useState(0);
  const [tocando, setTocando] = useState(false);
  const [zona, setZona] = useState(true);
  const total = duracaoEmQuadros(plano);
  const inputProps = useMemo(() => ({ plano, base: `/api/videos/${encodeURIComponent(slug)}/arquivos` }), [plano, slug]);

  useEffect(() => {
    const p = player.current;
    if (!p) return;
    const f = (e: { detail: { frame: number } }) => setFrame(e.detail.frame);
    const play = () => setTocando(true);
    const pause = () => setTocando(false);
    p.addEventListener('frameupdate', f);
    p.addEventListener('seeked', f);
    p.addEventListener('play', play);
    p.addEventListener('pause', pause);
    return () => { p.removeEventListener('frameupdate', f); p.removeEventListener('seeked', f); p.removeEventListener('play', play); p.removeEventListener('pause', pause); };
  }, [plano]);

  const ir = useCallback((q: number) => {
    const alvo = Math.max(0, Math.min(total - 1, Math.round(q)));
    player.current?.pause();
    player.current?.seekTo(alvo);
    setFrame(alvo);
  }, [total]);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      const atual = player.current?.getCurrentFrame() ?? frame;
      if (e.key === 'ArrowRight') ir(atual + (e.shiftKey ? FPS : 1));
      else if (e.key === 'ArrowLeft') ir(atual - (e.shiftKey ? FPS : 1));
      else if (e.key === ' ') player.current?.toggle();
      else if (e.key.toLowerCase() === 'z') setZona((z) => !z);
      else if (e.key === 'Home') ir(0);
      else if (e.key === 'End') ir(total - 1);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [ir, frame, total]);

  const t = frame / FPS;
  const cenaAtual = plano.cenas.find((c) => t >= c.inicio && t < c.fim);
  const contagem = (n: Aviso['nivel']) => plano.avisos.filter((a) => a.nivel === n).length;
  const origem = { estimado: 'tempos estimados pelo texto', 'escalado-pelo-audio': 'tempos ajustados à duração do áudio', alinhado: 'tempos alinhados à voz' }[plano.meta.origemTempo];

  return (
    <div className="previa">
      <div className="palco">
        <div className="tela">
          <Player
            ref={player}
            component={Video}
            inputProps={inputProps}
            durationInFrames={total}
            fps={FPS}
            compositionWidth={LARGURA}
            compositionHeight={ALTURA}
            style={{ width: '100%', height: '100%' }}
            acknowledgeRemotionLicense
          />
          {zona && <ZonaSegura />}
        </div>
        <div className="controles">
          <button onClick={() => ir(frame - 1)} title="Quadro anterior (←)">◀</button>
          <button className="play" onClick={() => player.current?.toggle()} title="Tocar/pausar (espaço)">{tocando ? '❚❚' : '▶'}</button>
          <button onClick={() => ir(frame + 1)} title="Próximo quadro (→)">▶</button>
          <span className="contador">
            <b>{fmt(t)}</b> · quadro {frame}/{total - 1}
          </span>
          <label className="chave"><input type="checkbox" checked={zona} onChange={(e) => setZona(e.target.checked)} /> zona segura (Z)</label>
        </div>
        <p className="dica">← → um quadro · Shift+← → um segundo · espaço toca/pausa · os degraus de 12 fps aparecem como pares de quadros iguais</p>
      </div>

      <section className="info">
        <h2>{plano.meta.titulo}</h2>
        <p className="meta">
          {plano.meta.duracao.toFixed(1)} s · {plano.cenas.length} cenas · tema {plano.meta.tema} · fundo {plano.meta.fundo}
          <span className="amostra" style={{ background: plano.meta.corExtra }} title={`cor extra ${plano.meta.corExtra}`} />
          <br />
          <small>{origem}</small>
        </p>

        <div className="secao">Semáforo</div>
        <div className="semaforo">
          <span className={contagem('erro') ? 'erro' : 'apagado'}>{contagem('erro')} erros</span>
          <span className={contagem('alerta') ? 'alerta' : 'apagado'}>{contagem('alerta')} alertas</span>
        </div>
        <ul className="avisos">
          {plano.avisos.map((a, k) => (
            <li key={k} className={a.nivel} onClick={() => a.tempo !== undefined && ir(a.tempo * FPS)} style={{ cursor: a.tempo !== undefined ? 'pointer' : 'default' }}>
              {a.linha !== undefined && <code>linha {a.linha}</code>}
              {a.tempo !== undefined && <code>{fmt(a.tempo)}</code>}
              {a.mensagem}
            </li>
          ))}
        </ul>

        <div className="secao">Cena atual</div>
        {cenaAtual ? (
          <div className="cena">
            <b>{cenaAtual.id}</b> {fmt(cenaAtual.inicio)}–{fmt(cenaAtual.fim)}
            <div>{cenaAtual.elementos.map((e) => <span key={e.linha} className="tag" style={{ borderColor: COR_TIPO[e.tipo] }}>{e.tipo} <small>l.{e.linha}</small></span>)}</div>
            <p className="fala">
              {cenaAtual.palavras.map((p, k) => (
                <span key={k} className={`${t >= p.inicio && t < p.fim ? 'agora' : ''} ${p.destaque ? 'destaque' : ''}`}>{p.texto} </span>
              ))}
            </p>
          </div>
        ) : <p className="vazio">—</p>}
      </section>

      <Linha plano={plano} frame={frame} total={total} ir={ir} />
    </div>
  );
};

const ZonaSegura: React.FC = () => (
  <svg className="zona" viewBox={`0 0 ${LARGURA} ${ALTURA}`} preserveAspectRatio="none">
    <path d={`M0,0H${LARGURA}V${ZONA.topo}H0Z`} className="proibida" />
    <path d={`M0,${ZONA.base}H${LARGURA}V${ALTURA}H0Z`} className="proibida" />
    <path d={`M${ZONA.direitaBaixa},${ZONA.degrau}H${LARGURA}V${ZONA.base}H${ZONA.direitaBaixa}Z`} className="proibida" />
    <path d={`M0,${ZONA.topo}H${ZONA.esquerda}V${ZONA.base}H0Z M${ZONA.direitaAlta},${ZONA.topo}H${LARGURA}V${ZONA.degrau}H${ZONA.direitaAlta}Z`} className="proibida" />
    <rect x={0} y={ZONA.legenda.topo} width={LARGURA} height={ZONA.legenda.base - ZONA.legenda.topo} className="legenda" />
    <text x={ZONA.esquerda + 10} y={ZONA.legenda.topo + 50}>reservado à legenda</text>
  </svg>
);

const Linha: React.FC<{ plano: Plano; frame: number; total: number; ir: (q: number) => void }> = ({ plano, frame, total, ir }) => {
  const ref = useRef<HTMLDivElement>(null);
  const pct = (s: number) => `${((s * FPS) / total) * 100}%`;
  const clicar = (e: React.MouseEvent) => {
    const r = ref.current!.getBoundingClientRect();
    ir(((e.clientX - r.left) / r.width) * total);
  };
  return (
    <div className="linha" ref={ref} onMouseDown={clicar}>
      <div className="faixa cenas">
        {plano.cenas.map((c) => {
          const tipo = c.elementos[0]?.tipo ?? 'texto';
          return (
            <div key={c.id} className="bloco" style={{ left: pct(c.inicio), width: pct(c.fim - c.inicio), background: COR_TIPO[tipo] }} title={`${c.id}: ${c.elementos.map((e) => e.tipo).join(' + ')}`}>
              {tipo}
            </div>
          );
        })}
      </div>
      <div className="faixa eventos">
        {plano.cenas.flatMap((c) => [
          ...c.elementos.slice(1).map((e, k) => <i key={`${c.id}e${k}`} style={{ left: pct(e.inicio) }} title={e.tipo} />),
          ...c.etiquetas.map((e, k) => <i key={`${c.id}t${k}`} className="etq" style={{ left: pct(e.inicio) }} title={`etiqueta: ${e.texto}`} />),
          ...c.sobreposicoes.map((s, k) => <i key={`${c.id}s${k}`} className="sob" style={{ left: pct(s.inicio) }} title={`${s.tipo}: ${s.alvo}`} />),
        ])}
        {plano.avisos.filter((a) => a.tempo !== undefined && a.nivel !== 'info').map((a, k) => (
          <b key={k} className={a.nivel} style={{ left: pct(a.tempo!) }} title={a.mensagem}>!</b>
        ))}
      </div>
      <div className="cabeca" style={{ left: `${(frame / total) * 100}%` }} />
    </div>
  );
};
