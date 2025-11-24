import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Ixc from '../src/index';
import { createRouter } from '../src/api/routes';
import { DashboardData } from '../types';

dotenv.config();

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
    daily: Array.from({ length: 7 }, (_, i) => ({ label: `Dia ${i + 1}`, download: Math.random() * 25, upload: Math.random() * 10 })),
    weekly: Array.from({ length: 4 }, (_, i) => ({ label: `Sem ${i + 1}`, download: Math.random() * 150, upload: Math.random() * 60 })),
    monthly: Array.from({ length: 6 }, (_, i) => ({ label: `Mês ${i + 1}`, download: Math.random() * 600, upload: Math.random() * 250 })),
    annual: Array.from({ length: 12 }, (_, i) => ({ label: `Mês ${i + 1}`, download: Math.random() * 600, upload: Math.random() * 250 })),
};

const DEV_DASHBOARD_DATA: DashboardData = {
    clientes: [
        { id: 7, nome: 'Cliente Principal Dev', endereco: 'Rua dos Testes, 123' },
        { id: 300, nome: 'Cliente Secundário Dev', endereco: 'Avenida da Simulação, 456' },
    ],
    contratos: [
        { id: 101, plano: 'Fibra 500 Mega - Casa', status: 'A', pdf_link: '#' },
        { id: 102, plano: 'Fibra 300 Mega - Escritório', status: 'S', pdf_link: '#' },
    ],
    faturas: [
        { id: 'inv_1', vencimento: '10/08/2025', valor: '99.90', status: 'aberto', pix_code: 'PIX_CODE_1', linha_digitavel: '12345...' },
        { id: 'inv_2', vencimento: '10/07/2025', valor: '99.90', status: 'pago' },
        { id: 'inv_3', vencimento: '10/08/2025', valor: '79.90', status: 'aberto', pix_code: 'PIX_CODE_2', linha_digitavel: '67890...' },
        { id: 'inv_4', vencimento: '01/06/2025', valor: '99.90', status: 'vencido' },
    ],
    logins: [
        { id: 'rad_1', login: 'cliente@fibra', status: 'online', sinal_ont: '-21.5 dBm', uptime: '15d 4h', contrato_id: 101 },
        { id: 'rad_2', login: 'escritorio@fibra', status: 'offline', sinal_ont: '', uptime: '0d 0h', contrato_id: 102 },
    ],
    notas: [],
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
