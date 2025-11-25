export interface DashboardLogin {
  raw: number;
  id: number;
  login: string;
  online: string;
  uptime?: string;
  contrato_id?: number;
  download_atual?: string;
  upload_atual?: string;
  // Novos campos
  ip_privado?: string;
  ip_publico?: string;
}
