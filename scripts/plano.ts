// Uso: npm run plano -- <pasta-do-video>   → grava plano.json e mostra os avisos
import { resolve } from 'node:path';
import { montarPlano } from './lib/pasta';

const pasta = resolve(process.argv[2] ?? '.');
const plano = await montarPlano(pasta);
const icone = { erro: '✖', alerta: '▲', info: '·' } as const;
console.log(`${plano.meta.titulo} — ${plano.cenas.length} cenas, ${plano.meta.duracao.toFixed(1)} s (${plano.meta.origemTempo})`);
for (const a of plano.avisos) console.log(`${icone[a.nivel]} ${a.linha ? `linha ${a.linha}: ` : a.tempo !== undefined ? `${a.tempo.toFixed(1)} s: ` : ''}${a.mensagem}`);
process.exitCode = plano.avisos.some((a) => a.nivel === 'erro') ? 1 : 0;
