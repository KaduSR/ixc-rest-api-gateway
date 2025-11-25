export interface DashboardLogin {
  raw: number;
  id: number;
  login: string;
  status: string;
  sinal_ont?: string;
  uptime?: string;
  contrato_id?: number;
  download_atual?: string; // Novo
  upload_atual?: string; // Novo
}
