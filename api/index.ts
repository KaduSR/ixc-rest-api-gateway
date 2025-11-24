import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import Ixc from '../src/index';
import { createRouter } from '../src/api/routes';
import { DashboardData } from '../types';

const app = express();
app.use(cors());
app.use(express.json());

const { IXC_API_URL, IXC_ADMIN_TOKEN, JWT_SECRET } = process.env;

if (!IXC_API_URL || !IXC_ADMIN_TOKEN || !JWT_SECRET) {
  console.error('Variáveis de ambiente ausentes. Verifique seu arquivo .env');
}

const ixc = new Ixc({
  baseUrl: IXC_API_URL!,
  token: IXC_ADMIN_TOKEN!,
});

// === DADOS MOCKADOS PARA MODO DEV ===
const MOCKED_CONSUMPTION_HISTORY = {
    daily: Array.from({ length: 7 }, (_, i) => ({ data: `2025-11-${18 + i}`, download_bytes: Math.random() * 25 * 1024 * 1024 * 1024, upload_bytes: Math.random() * 10 * 1024 * 1024 * 1024 })),
    monthly: Array.from({ length: 6 }, (_, i) => ({ mes_ano: `2025-${11 - i}`, download_bytes: Math.random() * 600 * 1024 * 1024 * 1024, upload_bytes: Math.random() * 250 * 1024 * 1024 * 1024 })),
};

const DEV_DASHBOARD_DATA: DashboardData = {
    clientes: [
        { id: 7, razao: 'Cliente Principal Dev', endereco: 'Rua dos Testes, 123', cnpj_cpf: '12345678900', fantasia: 'Principal Dev', fone: '11999999999', email: 'dev@fibernet.com' },
        { id: 300, razao: 'Cliente Secundário Dev', endereco: 'Avenida da Simulação, 456', cnpj_cpf: '00987654321', fantasia: 'Secundário Dev', fone: '11888888888', email: 'dev2@fibernet.com' },
    ],
    contratos: [
        { id: 101, descricao_aux_plano_venda: 'Fibra 500 Mega - Casa', status: 'A', desbloqueio_confianca: 'N', id_cliente: 7, login: 'login101' },
        { id: 102, descricao_aux_plano_venda: 'Fibra 300 Mega - Escritório', status: 'S', desbloqueio_confianca: 'N', id_cliente: 300, login: 'login102' },
    ],
    faturas: [
        { id: 1, vencimento: '10/08/2025', valor: '99.90', status: 'A', pix_txid: 'PIX_CODE_1', linha_digitavel: '12345...', documento: 'DOC1', data_emissao: '01/08/2025', id_cliente: 7, boleto: '#' },
        { id: 2, vencimento: '10/07/2025', valor: '99.90', status: 'B', documento: 'DOC2', data_emissao: '01/07/2025', id_cliente: 7, boleto: '#' },
        { id: 3, vencimento: '10/08/2025', valor: '79.90', status: 'A', pix_txid: 'PIX_CODE_2', linha_digitavel: '67890...', documento: 'DOC3', data_emissao: '01/08/2025', id_cliente: 300, boleto: '#' },
        { id: 4, vencimento: '01/06/2025', valor: '99.90', status: 'A', documento: 'DOC4', data_emissao: '01/05/2025', id_cliente: 300, boleto: '#' },
    ],
    logins: [
        { id: 1, login: 'cliente@fibra', online: 'S', sinal_ont: '-21.5 dBm', uptime: '15d 4h', id_contrato: 101, id_cliente: 7, upload_atual: '10000000000', download_atual: '50000000000' },
        { id: 2, login: 'escritorio@fibra', online: 'N', sinal_ont: '', uptime: '0d 0h', id_contrato: 102, id_cliente: 300, upload_atual: '0', download_atual: '0' },
    ],
    notas: [],
    ordensServico: [], // Initialize as empty array
    ontInfo: [], // Initialize as empty array
    consumo: {
        total_download_bytes: 750 * 1024 * 1024 * 1024, // 750 GB
        total_upload_bytes: 320 * 1024 * 1024 * 1024, // 320 GB
        history: MOCKED_CONSUMPTION_HISTORY,
    },
};

const apiRouter = createRouter(ixc, JWT_SECRET!, DEV_DASHBOARD_DATA, MOCKED_CONSUMPTION_HISTORY);
app.use('/api', apiRouter);

// Exporta o app para a Vercel
export default app;

if (process.env.NODE_ENV !== 'production') {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}
