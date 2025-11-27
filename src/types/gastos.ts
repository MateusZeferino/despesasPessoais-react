export interface Gasto {
  id: string;
  descricao: string;
  categoria: string;
  valor: number;
  data: string;
  mes: string;
  userId: number;
}

export interface NovoGasto {
  descricao: string;
  categoria: string;
  valor: number;
  data: string;
}

