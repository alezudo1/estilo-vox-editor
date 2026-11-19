// Formato do plano de cenas (plano.json), gerado a partir do roteiro marcado.

export type Tema = 'arquivo' | 'diagrama' | 'dados' | 'colagem';

export type TipoCena = 'gancho' | 'foto' | 'doc' | 'numero' | 'grafico' | 'card-final' | 'texto';
export type TipoSobreposicao = 'circulo' | 'seta';

export interface Palavra {
  texto: string;
  destaque: boolean; // veio de **palavra**
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

export interface Cena {
  id: string;
  inicio: number;
  fim: number;
  elementos: Elemento[];
  sobreposicoes: Sobreposicao[];
  etiquetas: Etiqueta[]; // de **destaque**
  palavras: Palavra[];
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
  };
  cenas: Cena[];
  arquivos: string[]; // arquivos de imagem citados
  avisos: Aviso[];
}
