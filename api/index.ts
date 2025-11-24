import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import Ixc from '../src/index';
import { verifyToken } from '../src/middleware/authMiddleware';
import { DashboardData } from '../../types';

dotenv.config({ path: './backend/.env' });

const app = express();
app.use(cors());
app.use(express.json());

const { IXC_API_URL, IXC_ADMIN_TOKEN, JWT_SECRET } = process.env;

if (!IXC_API_URL || !IXC_ADMIN_TOKEN || !JWT_SECRET) {
  console.error('Variáveis de ambiente ausentes. Verifique seu arquivo .env');
  // Em um ambiente de produção real, você poderia lançar um erro.
  // Para Vercel, as variáveis são configuradas na UI do projeto.
}

const ixc = new Ixc({
  baseUrl: IXC_API_URL!,
  token: IXC_ADMIN_TOKEN!,
});

// Rota de Login com Unificação de Contas
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  // Modo DEV
  if (email === 'dev@fibernet.com' && password === 'dev') {
    const devToken = jwt.sign({ ids: [7, 300], email: 'dev@fibernet.com', isDev: true }, JWT_SECRET!, { expiresIn: '1d' });
    return res.json({ token: devToken });
  }

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  try {
    const clientesIniciais = await ixc.clientes.filtrarClientes({ hotsite_email: email });
    const clienteInicial = clientesIniciais?.[0];

    if (!clienteInicial || clienteInicial.senha !== password) { // A senha no IXC é em texto plano no campo 'senha' do cliente
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Lógica de Unificação: Busca todos os clientes com o mesmo CPF
    const todosClientes = await ixc.clientes.filtrarClientes({ cnpj_cpf: clienteInicial.cnpj_cpf });
    const clientIds = todosClientes.map(c => c.id);

    const token = jwt.sign({ ids: clientIds, email: clienteInicial.hotsite_email }, JWT_SECRET!, { expiresIn: '1d' });
    res.json({ token });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor durante o login' });
  }
});

// Rota de Dashboard Unificado
app.get('/api/dashboard', verifyToken, async (req: any, res) => {
    // Modo DEV
    if (req.user.isDev) {
        return res.json(DEV_DASHBOARD_DATA);
    }
  
    try {
        const clientIds: number[] = req.user.ids;

        const promises = clientIds.map(id => Promise.all([
            ixc.clientes.buscarClientesPorId(id),
            ixc.contratos.buscarContratosPorIdCliente(id),
            ixc.financeiro.listar({ id_cliente: id }),
            ixc.logins.listar({ id_cliente: id }),
        ]));

        const results = await Promise.all(promises);

        const dashboardData = results.reduce((acc, [cliente, contratos, faturas, logins]) => {
            acc.clientes.push({ id: cliente.id, nome: cliente.razao, endereco: `${cliente.endereco}, ${cliente.numero}` });
            contratos.forEach(c => acc.contratos.push({ id: c.id, plano: c.descricao_aux_plano_venda, status: c.status, pdf_link: `/contrato/${c.id}` }));
            faturas.forEach(f => acc.faturas.push({ id: f.id, vencimento: f.data_vencimento, valor: f.valor, status: f.status === 'A' ? 'aberto' : 'pago', pix_code: f.pix_txid, linha_digitavel: f.linha_digitavel }));
            logins.forEach(l => acc.logins.push({ id: l.id, login: l.login, status: l.online === 'S' ? 'online' : 'offline', sinal_ont: l.sinal_ultimo_atendimento, uptime: l.tempo_conectado, contrato_id: l.id_contrato }));
            return acc;
        }, {
            clientes: [], contratos: [], faturas: [], logins: [], notas: [],
            consumo: { // Consumo ainda é mockado pois não há endpoint no SDK
                total_download_bytes: 580 * 1024 * 1024 * 1024,
                total_upload_bytes: 290 * 1024 * 1024 * 1024,
                history: MOCKED_CONSUMPTION_HISTORY
            }
        } as any);

        res.json(dashboardData);

  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    res.status(500).json({ error: 'Falha ao carregar dados do painel' });
  }
});

// --- Rotas de Ação ---

app.post('/api/trocar-senha', verifyToken, async (req: any, res) => {
    if (req.user.isDev) return res.json({ message: 'Senha alterada com sucesso! (Modo DEV)' });

    const { newPassword } = req.body;
    const clientId = req.user.ids[0]; // Assume que a troca é para a conta principal

    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
    }
    try {
        await ixc.clientes.alterarSenhaHotsite(clientId, newPassword);
        res.json({ message: 'Senha alterada com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: 'Não foi possível alterar a senha.' });
    }
});

app.post('/api/desbloqueio-confianca', verifyToken, async (req: any, res) => {
    if (req.user.isDev) return res.json({ message: 'Desbloqueio solicitado com sucesso! (Modo DEV)' });
    
    // Supondo que o desbloqueio seja para o primeiro contrato encontrado
    try {
        const clientIds: number[] = req.user.ids;
        const contratos = await ixc.contratos.buscarContratosPorIdCliente(clientIds[0]);
        if (!contratos || contratos.length === 0) {
            return res.status(404).json({ error: 'Nenhum contrato encontrado para solicitar desbloqueio.' });
        }
        await ixc.contratos.desbloqueioConfianca(contratos[0].id);
        res.json({ message: 'Desbloqueio de confiança solicitado com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: 'Não foi possível solicitar o desbloqueio.' });
    }
});


app.post('/api/logins/:id/:action', verifyToken, async (req: any, res) => {
    if (req.user.isDev) return res.json({ message: 'Ação executada com sucesso! (Modo DEV)' });

    const { id, action } = req.params;
    const loginId = parseInt(id, 10);

    try {
        let result;
        switch (action) {
            case 'limpar-mac':
                await ixc.logins.limparMac(loginId);
                result = { message: 'MAC limpo com sucesso!' };
                break;
            case 'desconectar':
                await ixc.logins.desconectarSessao(loginId);
                result = { message: 'Sessão desconectada com sucesso!' };
                break;
            case 'diagnostico':
                const diag = await ixc.logins.obterDiagnostico(loginId);
                result = { message: 'Diagnóstico concluído.', consumo: { download: diag.download_atual, upload: diag.upload_atual } };
                break;
            default:
                return res.status(400).json({ error: 'Ação inválida.' });
        }
        res.json(result);
    } catch (error) {
        console.error(`Erro na ação ${action} para login ${loginId}:`, error);
        res.status(500).json({ error: `Falha ao executar a ação: ${action}` });
    }
});


// Exporta o app para a Vercel
export default app;

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
        { id: 'rad_2', login: 'escritorio@fibra', status: 'offline', uptime: '0d 0h', contrato_id: 102 },
    ],
    notas: [],
    consumo: {
        total_download_bytes: 750 * 1024 * 1024 * 1024, // 750 GB
        total_upload_bytes: 320 * 1024 * 1024 * 1024, // 320 GB
        history: MOCKED_CONSUMPTION_HISTORY,
    },
};