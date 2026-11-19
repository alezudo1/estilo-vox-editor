import React from 'react';
import { Composition } from 'remotion';
import { analisarRoteiro } from './plano/parser';
import type { Plano } from './plano/tipos';
import { ALTURA, FPS, LARGURA } from './tema';
import { duracaoEmQuadros, Video, type PropsVideo } from './Video';

// Plano de demonstração para o Remotion Studio. O painel e o render passam o plano real por props.
const demo: Plano = analisarRoteiro(`---
titulo: Demonstração
tema: dados
fundo: escuro
---
[gancho: "ESTILO VOX"]
Uma demonstração da base da ferramenta.
[numero: "12" | legenda: "quadros por segundo"]
Animação em degraus, como na **Vox**.
[circulo: "Vox"]
Com marcação à mão.
[grafico: barras | dados: Antes=3, Depois=9 | titulo: "Eventos a cada 10 s"]
E gráficos montados aos poucos.
[card-final]
`);

export const Raiz: React.FC = () => (
  <Composition
    id="Video"
    component={Video}
    width={LARGURA}
    height={ALTURA}
    fps={FPS}
    durationInFrames={duracaoEmQuadros(demo)}
    defaultProps={{ plano: demo, base: '' } satisfies PropsVideo}
    calculateMetadata={({ props }) => ({ durationInFrames: duracaoEmQuadros(props.plano) })}
  />
);
