// Formato do plano de cenas (plano.json), gerado a partir do roteiro marcado.

export type Tema = 'arquivo' | 'diagrama' | 'dados' | 'colagem';

export type TipoCena = 'gancho' | 'foto' | 'objeto' | 'doc' | 'numero' | 'grafico' | 'card-final' | 'texto';
export type Fundo = 'escuro' | 'claro';
export type TipoSobreposicao = 'circulo' | 'seta';

export interface Palavra {
  texto: string;
  destaque: boolean; // veio de **palavra** → etiqueta
  frase?: number; // índice da frase (_trecho em itálico_) a que pertence
  inicio: number; // segundos
  fim: number;
}

export interface Elemento {
  // Um elemento visual dentro de uma cena. Cenas com [continua] acumulam elementos.
  tipo: TipoCena;
  params: Record<string, string>;
  inicio: number; // segundos (instante em que entra)
  linha: number; // linha do roteiro, para mensagens
}

export interface Sobreposicao {
  tipo: TipoSobreposicao;
  alvo: string;
  inicio: number;
  linha: number;
}

export interface Etiqueta {
  texto: string;
  inicio: number;
}

export interface Frase {
  // _trecho_ da narração que aparece escrito na tela, palavra por palavra, no momento em que é falado
  palavras: { texto: string; inicio: number }[];
  inicio: number;
}

export interface Cena {
  id: string;
  inicio: number;
  fim: number;
  elementos: Elemento[];
  sobreposicoes: Sobreposicao[];
  etiquetas: Etiqueta[]; // de **destaque** e de "etiqueta:"
  frases: Frase[]; // de _trecho_
  palavras: Palavra[];
  fundo: Fundo;
  fonte?: string; // linha "Fonte: ..." no topo
}

export type NivelAviso = 'erro' | 'alerta' | 'info';
export interface Aviso {
  nivel: NivelAviso;
  mensagem: string;
  linha?: number;
  tempo?: number;
}

export interface Plano {
  meta: {
    titulo: string;
    tema: Tema;
    fundo: 'escuro' | 'claro';
    corExtra: string;
    duracao: number; // segundos
    origemTempo: 'estimado' | 'escalado-pelo-audio' | 'alinhado';
    audio?: string; // nome do arquivo de áudio na pasta do vídeo
    slug?: string;
  };
  /** chave → caminho relativo servido em /arquivos (ex.: 'objeto:bola' → 'biblioteca/objetos/bola.png'). Preenchido pelo Node. */
  recursos?: Record<string, string>;
  cenas: Cena[];
  arquivos: string[]; // arquivos de imagem citados
  avisos: Aviso[];
}
