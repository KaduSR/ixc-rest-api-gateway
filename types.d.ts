export type DashboardData = {
    clientes: { id: number; nome: string; endereco: string; }[];
    contratos: { id: number; plano: string; status: string; pdf_link: string; }[];
    faturas: { id: string; vencimento: string; valor: string; status: string; pix_code?: string; linha_digitavel?: string; }[];
    logins: { id: string; login: string; status: string; sinal_ont: string; uptime: string; contrato_id: number; }[];
    notas: any[];
    consumo: {
        total_download_bytes: number;
        total_upload_bytes: number;
        history: any;
    };
};
