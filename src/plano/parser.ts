// Converte o roteiro marcado (vocabulario-marcacoes.md) em um plano de cenas.
// Sem dependências de Node: roda no painel, no servidor e no render.

import type { Aviso, Cena, Elemento, Palavra, Plano, Sobreposicao, Tema, TipoCena, TipoSobreposicao } from './tipos';

const TIPOS_CENA: TipoCena[] = ['gancho', 'foto', 'objeto', 'doc', 'numero', 'grafico', 'card-final'];
const AJUSTES = ['fundo', 'fonte']; // marcações que mudam o estado das próximas cenas
const TIPOS_SOBRE: TipoSobreposicao[] = ['circulo', 'seta'];
const TODOS = [...TIPOS_CENA, ...TIPOS_SOBRE, ...AJUSTES, 'continua'];
const FASE2 = ['recorte', 'ficha', 'placar', 'manchete', 'mapa', 'campo', 'video', 'tela-dividida', 'som'];
const POSICIONAL: Record<string, string> = {
  gancho: 'texto', foto: 'arquivo', objeto: 'nome', doc: 'arquivo', fundo: 'valor', fonte: 'valor', numero: 'valor', grafico: 'tipo', circulo: 'alvo', seta: 'alvo',
};
const TEMAS: Tema[] = ['arquivo', 'diagrama', 'dados', 'colagem'];
const CORES_NOMEADAS: Record<string, string> = { coral: '#FF6B57' };

export const RITMO_PADRAO = 2.7; // palavras por segundo (estimativa até o alinhamento da voz)

const semAspas = (s: string) => s.trim().replace(/^["'“”]|["'“”]$/g, '').trim();

const distancia = (a: string, b: string) => {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
};
const sugerir = (t: string) => {
  const melhor = TODOS.map((x) => [x, distancia(t, x)] as const).sort((a, b) => a[1] - b[1])[0];
  return melhor && melhor[1] <= 3 ? ` Você quis dizer [${melhor[0]}]?` : '';
};

export const lerParametros = (tipo: string, resto: string | undefined) => {
  const params: Record<string, string> = {};
  if (!resto) return params;
  resto.split('|').forEach((seg, i) => {
    const m = seg.match(/^\s*([a-zà-ú-]+)\s*:\s*(.*)$/i);
    if (m && !(i === 0 && POSICIONAL[tipo] && !['etiqueta', 'marcar', 'legenda', 'dados', 'titulo', 'area'].includes(m[1].toLowerCase()))) {
      params[m[1].toLowerCase()] = semAspas(m[2]);
    } else if (i === 0 && POSICIONAL[tipo]) {
      params[POSICIONAL[tipo]] = semAspas(seg);
    } else if (/^\s*[a-zà-ú-]+\s*$/i.test(seg)) {
      params[seg.trim().toLowerCase()] = 'sim'; // bandeira: | recorte
    } else {
      params[`extra${i}`] = semAspas(seg);
    }
  });
  return params;
};

export const lerDadosGrafico = (dados: string | undefined) =>
  (dados ?? '')
    .split(',')
    .map((par) => par.split('='))
    .filter((p) => p.length === 2)
    .map(([rotulo, valor]) => ({ rotulo: rotulo.trim(), valor: Number(valor.trim().replace(',', '.')) }));

interface Pendente {
  aplicar: (t: number) => void;
}

export function analisarRoteiro(texto: string, ritmo = RITMO_PADRAO): Plano {
  const avisos: Aviso[] = [];
  const linhas = texto.replace(/\r\n/g, '\n').split('\n');

  // ---- cabeçalho
  const meta: Plano['meta'] = { titulo: 'Sem título', tema: 'arquivo', fundo: 'escuro', corExtra: CORES_NOMEADAS.coral, duracao: 0, origemTempo: 'estimado' };
  let i = 0;
  while (i < linhas.length && linhas[i].trim() === '') i++;
  if (linhas[i]?.trim() === '---') {
    i++;
    for (; i < linhas.length && linhas[i].trim() !== '---'; i++) {
      const m = linhas[i].replace(/#.*$/, '').match(/^\s*([a-z-]+)\s*:\s*(.+?)\s*$/i);
      if (!m) continue;
      const [, chave, valor] = m;
      if (chave === 'titulo') meta.titulo = semAspas(valor);
      else if (chave === 'tema') {
        if (TEMAS.includes(valor as Tema)) meta.tema = valor as Tema;
        else avisos.push({ nivel: 'erro', linha: i + 1, mensagem: `Tema "${valor}" não existe. Use: ${TEMAS.join(', ')}.` });
      } else if (chave === 'fundo') {
        if (valor === 'escuro' || valor === 'claro') meta.fundo = valor;
        else avisos.push({ nivel: 'erro', linha: i + 1, mensagem: `Fundo "${valor}" não existe. Use: escuro ou claro.` });
      } else if (chave === 'cor-extra') {
        const cor = CORES_NOMEADAS[valor] ?? valor;
        if (/^#[0-9a-f]{6}$/i.test(cor)) meta.corExtra = cor;
        else avisos.push({ nivel: 'erro', linha: i + 1, mensagem: `Cor extra "${valor}" inválida. Use coral ou um hex como #FFD700.` });
      }
    }
    i++;
  } else {
    avisos.push({ nivel: 'alerta', mensagem: 'Roteiro sem cabeçalho (--- ... ---). Usando tema arquivo, fundo escuro e cor extra coral.' });
  }

  // ---- corpo
  const cenas: Cena[] = [];
  const arquivos = new Set<string>();
  let tempo = 0.2;
  let pendentes: Pendente[] = [];
  let continua = false;
  let emDestaque = false;
  let cenaAtual: Cena | null = null;
  let fundoAtual = meta.fundo;
  let fonteAtual: string | undefined;
  let emFrase = false;
  let ultimaFoiMarcacao = false; // marcações seguidas, sem narração entre elas, formam uma cena só

  const novaCena = (): Cena => {
    const c: Cena = { id: `cena-${cenas.length + 1}`, inicio: 0, fim: 0, elementos: [], sobreposicoes: [], etiquetas: [], frases: [], palavras: [], fundo: fundoAtual, fonte: fonteAtual };
    cenas.push(c);
    return c;
  };

  for (; i < linhas.length; i++) {
    const n = i + 1;
    const bruta = linhas[i].trim();
    if (!bruta || bruta.startsWith('#')) continue;

    const marca = bruta.match(/^\[([a-zà-ú-]+)(?:\s*:\s*(.*))?\]$/i);
    if (marca) {
      const tipo = marca[1].toLowerCase();
      if (tipo === 'continua') {
        continua = true;
        continue;
      }
      if (FASE2.includes(tipo)) {
        avisos.push({ nivel: 'alerta', linha: n, mensagem: `[${tipo}] é da fase 2 e ainda não está disponível. A linha foi ignorada.` });
        continue;
      }
      if (!TODOS.includes(tipo)) {
        avisos.push({ nivel: 'erro', linha: n, mensagem: `Marcação [${tipo}] desconhecida.${sugerir(tipo)}` });
        continue;
      }
      const params = lerParametros(tipo, marca[2]);

      if (tipo === 'fundo') {
        if (params.valor === 'escuro' || params.valor === 'claro') fundoAtual = params.valor;
        else avisos.push({ nivel: 'erro', linha: n, mensagem: `[fundo: ${params.valor ?? ''}] — use escuro ou claro.` });
        continue;
      }
      if (tipo === 'fonte') {
        fonteAtual = params.valor || undefined;
        continue;
      }

      if ((TIPOS_SOBRE as string[]).includes(tipo)) {
        if (!cenaAtual) {
          avisos.push({ nivel: 'erro', linha: n, mensagem: `[${tipo}] precisa de uma cena antes dela.` });
          continue;
        }
        const s: Sobreposicao = { tipo: tipo as TipoSobreposicao, alvo: params.alvo ?? 'centro', inicio: 0, linha: n };
        cenaAtual.sobreposicoes.push(s);
        pendentes.push({ aplicar: (t) => (s.inicio = t) });
        continue;
      }

      // validações por tipo
      if (tipo === 'objeto' && !params.nome) avisos.push({ nivel: 'erro', linha: n, mensagem: '[objeto] sem nome. Ex.: [objeto: bola]' });
      if (params.fundo === 'escuro' || params.fundo === 'claro') fundoAtual = params.fundo;
      if ((tipo === 'foto' || tipo === 'doc') && !params.arquivo) avisos.push({ nivel: 'erro', linha: n, mensagem: `[${tipo}] sem nome de arquivo.` });
      if (params.arquivo) arquivos.add(params.arquivo);
      if (tipo === 'doc' && params.marcar && !params.area)
        avisos.push({ nivel: 'info', linha: n, mensagem: `Marca-texto "${params.marcar}" sem área definida: ficará no centro do documento. Adicione | area: x,y,largura,altura (em %).` });
      if (tipo === 'gancho' && !params.texto) avisos.push({ nivel: 'erro', linha: n, mensagem: '[gancho] sem texto.' });
      if (tipo === 'numero' && !params.valor) avisos.push({ nivel: 'erro', linha: n, mensagem: '[numero] sem valor.' });
      if (tipo === 'grafico') {
        const dados = lerDadosGrafico(params.dados);
        if (!dados.length || dados.some((d) => Number.isNaN(d.valor)))
          avisos.push({ nivel: 'erro', linha: n, mensagem: 'Dados do gráfico ilegíveis. Use: dados: Brasil=1, Alemanha=7' });
      }

      const el: Elemento = { tipo: tipo as TipoCena, params, inicio: 0, linha: n };
      if ((continua || ultimaFoiMarcacao) && cenaAtual) {
        cenaAtual.elementos.push(el);
      } else {
        cenaAtual = novaCena();
        cenaAtual.elementos.push(el);
      }
      continua = false;
      ultimaFoiMarcacao = true;
      pendentes.push({ aplicar: (t) => (el.inicio = t) });
      continue;
    }

    if (bruta.startsWith('[')) {
      avisos.push({ nivel: 'erro', linha: n, mensagem: 'Linha começa com [ mas não é uma marcação válida (feche com ] e use [tipo: parâmetros]).' });
      continue;
    }

    // narração
    ultimaFoiMarcacao = false;
    if (!cenaAtual) {
      cenaAtual = novaCena();
      cenaAtual.elementos.push({ tipo: 'texto', params: {}, inicio: tempo, linha: n });
      avisos.push({ nivel: 'alerta', linha: n, mensagem: 'Narração antes de qualquer marcação: a abertura ficará sem imagem.' });
    }
    for (const bruto of bruta.split(/\s+/)) {
      const abre = bruto.startsWith('**');
      const fecha = /\*\*[.,;:!?…"”)]*$/.test(bruto) && (bruto.length > 2 || !abre);
      if (abre) emDestaque = true;
      const textoPalavra = bruto.replace(/\*\*/g, '');
      if (!textoPalavra) continue;
      const dur = 1 / ritmo + (/[.!?…]$/.test(textoPalavra) ? 0.25 : /[,;:]$/.test(textoPalavra) ? 0.1 : 0);
      if (pendentes.length) {
        pendentes.forEach((p) => p.aplicar(tempo));
        pendentes = [];
      }
      // _trecho_ → frase escrita na tela
      const abreFrase = /^["“(]*_/.test(textoPalavra);
      const fechaFrase = /_[.,;:!?…"”)]*$/.test(textoPalavra) && (textoPalavra.replace(/[^_]/g, '').length >= (abreFrase ? 2 : 1));
      if (abreFrase && !emFrase) {
        emFrase = true;
        cenaAtual.frases.push({ palavras: [], inicio: tempo });
      }
      const limpa = textoPalavra.replace(/_/g, '');
      if (!limpa) continue;
      const p: Palavra = { texto: limpa, destaque: emDestaque, inicio: tempo, fim: tempo + dur };
      if (emFrase) {
        const f = cenaAtual.frases[cenaAtual.frases.length - 1];
        if (f) { f.palavras.push({ texto: limpa, inicio: tempo }); p.frase = cenaAtual.frases.length - 1; }
      }
      if (fechaFrase) emFrase = false;
      cenaAtual.palavras.push(p);
      tempo += dur;
      if (fecha) emDestaque = false;
    }
  }

  const fimFala = tempo;
  if (emFrase) avisos.push({ nivel: 'alerta', mensagem: 'Um _trecho em itálico_ foi aberto e não foi fechado com _.' });
  // o gancho é o primeiro quadro do vídeo
  cenas[0]?.elementos.forEach((e) => e.tipo === 'gancho' && (e.inicio = 0));
  // marcações sem narração depois (ex.: card-final no fim)
  pendentes.forEach((p) => p.aplicar(fimFala + 0.2));

  // etiquetas: as do parâmetro "etiqueta:" + as dos destaques **consecutivos**
  for (const c of cenas) {
    c.elementos.forEach((e) => e.params.etiqueta && c.etiquetas.push({ texto: e.params.etiqueta, inicio: e.inicio + 0.4 }));
    let atual: { texto: string[]; inicio: number } | null = null;
    for (const p of c.palavras) {
      if (p.destaque) {
        if (!atual) atual = { texto: [], inicio: p.inicio };
        atual.texto.push(p.texto.replace(/[.,;:!?…"”]+$/, ''));
      } else if (atual) {
        c.etiquetas.push({ texto: atual.texto.join(' '), inicio: atual.inicio });
        atual = null;
      }
    }
    if (atual) c.etiquetas.push({ texto: atual.texto.join(' '), inicio: atual.inicio });
    c.etiquetas.sort((a, b) => a.inicio - b.inicio);
  }

  // limites das cenas
  const temCard = cenas.some((c) => c.elementos.some((e) => e.tipo === 'card-final'));
  const duracao = fimFala + (temCard ? 3.2 : 0.6);
  cenas.forEach((c, k) => {
    c.inicio = k === 0 ? 0 : Math.min(...c.elementos.map((e) => e.inicio));
  });
  cenas.forEach((c, k) => (c.fim = k < cenas.length - 1 ? cenas[k + 1].inicio : duracao));

  const plano: Plano = { meta: { ...meta, duracao }, cenas, arquivos: [...arquivos], avisos };
  validarRitmo(plano);
  return plano;
}

/** Ajusta todos os tempos para a duração real do áudio (até existir o alinhamento palavra a palavra). */
export function escalarPeloAudio(plano: Plano, duracaoAudio: number): Plano {
  const temCard = plano.cenas.some((c) => c.elementos.some((e) => e.tipo === 'card-final'));
  const falaEstimada = plano.meta.duracao - (temCard ? 3.2 : 0.6);
  const k = duracaoAudio / Math.max(0.1, falaEstimada);
  const s = (t: number) => Math.round(t * k * 1000) / 1000;
  const cenas = plano.cenas.map((c) => ({
    ...c,
    inicio: s(c.inicio),
    fim: s(c.fim),
    elementos: c.elementos.map((e) => ({ ...e, inicio: s(e.inicio) })),
    sobreposicoes: c.sobreposicoes.map((o) => ({ ...o, inicio: s(o.inicio) })),
    etiquetas: c.etiquetas.map((e) => ({ ...e, inicio: s(e.inicio) })),
    palavras: c.palavras.map((p) => ({ ...p, inicio: s(p.inicio), fim: s(p.fim) })),
  }));
  const duracao = duracaoAudio + (temCard ? 3.2 : 0.6);
  cenas[cenas.length - 1] && (cenas[cenas.length - 1].fim = duracao);
  const novo: Plano = { ...plano, cenas, meta: { ...plano.meta, duracao, origemTempo: 'escalado-pelo-audio' }, avisos: plano.avisos.filter((a) => a.tempo === undefined) };
  validarRitmo(novo);
  return novo;
}

/** Semáforo da especificação: eventos a cada ~2 s, nada parado > 4 s (alerta) / 7 s (erro). */
export function validarRitmo(plano: Plano) {
  const eventos = new Set<number>();
  for (const c of plano.cenas) {
    eventos.add(c.inicio);
    c.elementos.forEach((e) => eventos.add(e.inicio));
    c.sobreposicoes.forEach((o) => eventos.add(o.inicio));
    c.etiquetas.forEach((e) => eventos.add(e.inicio));
  }
  const ts = [...eventos].sort((a, b) => a - b);
  ts.push(plano.meta.duracao);
  for (let k = 1; k < ts.length; k++) {
    const vazio = ts[k] - ts[k - 1];
    if (vazio > 7) plano.avisos.push({ nivel: 'erro', tempo: ts[k - 1], mensagem: `${vazio.toFixed(1)} s sem nada novo na tela (máximo 7 s).` });
    else if (vazio > 4) plano.avisos.push({ nivel: 'alerta', tempo: ts[k - 1], mensagem: `${vazio.toFixed(1)} s sem nada novo na tela (ideal ≤ 4 s, salvo leitura).` });
  }
  const primeira = plano.cenas[0];
  if (primeira && !primeira.elementos.some((e) => e.tipo === 'gancho'))
    plano.avisos.push({ nivel: 'alerta', tempo: 0, mensagem: 'O vídeo não abre com [gancho]: o primeiro quadro deve ter o título.' });
  if (plano.cenas[1] && plano.cenas[1].inicio > 4.5)
    plano.avisos.push({ nivel: 'alerta', tempo: plano.cenas[1].inicio, mensagem: `Primeira troca de imagem só em ${plano.cenas[1].inicio.toFixed(1)} s (ideal até ~3–4 s).` });
  const eventosPor10s = (ts.length - 1) / Math.max(1, plano.meta.duracao) * 10;
  plano.avisos.push({ nivel: 'info', mensagem: `Ritmo: ${eventosPor10s.toFixed(1)} eventos a cada 10 s (Vox: ~4,5). Duração: ${plano.meta.duracao.toFixed(1)} s (alvo 55–60 s).` });
  return plano;
}
