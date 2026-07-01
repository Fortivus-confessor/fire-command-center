export type RiskLevel = "extremo" | "alto" | "medio" | "baixo";

export interface FireEvent {
  id: string;
  codigo: string;
  municipio: string;
  uf: string;
  satelite: string;
  risco: RiskLevel;
  frp: number; // fire radiative power
  detectadoHa: string;
  lat: number;
  lng: number;
  // normalized map coords 0..1
  x: number;
  y: number;
  hectares: number;
  bioma: string;
}

export interface OrdemServico {
  id: string;
  codigo: string;
  evento: string;
  municipio: string;
  tipo: ("Terrestre" | "Aéreo" | "Maquinário")[];
  prioridade: "P1" | "P2" | "P3";
  status: "Rascunho" | "Aprovada" | "Em execução";
  criadaHa: string;
  responsavel: string;
}

export type EquipeStatus = "Em deslocamento" | "No combate" | "Retornando" | "Standby";

export interface Equipe {
  id: string;
  codinome: string;
  tipo: "Brigada Terrestre" | "Helitack" | "Maquinário" | "Comando";
  efetivo: number;
  veiculo: string;
  placa: string;
  status: EquipeStatus;
  os: string;
  eta: string;
  bateria: number;
  combustivel: number;
}

export const fires: FireEvent[] = [];
export const ordens: OrdemServico[] = [];
export const equipes: Equipe[] = [];
export const timeline: {
  t: string;
  label: string;
  tone: "fire" | "command" | "muted" | "success";
}[] = [];
