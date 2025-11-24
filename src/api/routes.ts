import { Router } from 'express';
import jwt from 'jsonwebtoken';
import Ixc from '../../src/index';
import { verifyToken } from '../../src/middleware/authMiddleware';
import { DashboardData } from '../../types';

export const createRouter = (ixc: Ixc, JWT_SECRET: string, DEV_DASHBOARD_DATA: DashboardData, MOCKED_CONSUMPTION_HISTORY: any) => {
    const router = Router();

    router.get('/', (req, res) => {
        res.send('API is running');
    });

    // Rota de Login com Unificação de Contas
    router.post('/login', async (req, res) => {
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

    // Nova Rota para o Fluxo de Dados Completo
    router.post('/full-data', async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios' });
        }

        try {
            // Passo 1.1: Buscar Cliente
            const clientesIniciais = await ixc.clientes.filtrarClientes({ hotsite_email: email });
            const clienteInicial = clientesIniciais?.[0];

            // Passo 1.2: Validar Senha
            if (!clienteInicial || clienteInicial.senha !== password) {
                return res.status(401).json({ error: 'Credenciais inválidas' });
            }

            const ID_CLIENTE = clienteInicial.id;
            const SENHA_API = clienteInicial.senha; // Assuming SENHA_API is the same as hotsite password for now
            const CPF = clienteInicial.cnpj_cpf;

            // Passo 2.1: Buscar Contratos
            const contratos = await ixc.contratos.buscarContratosPorIdCliente(ID_CLIENTE);
            const IDS_CONTRATOS = contratos.map(c => c.id);

            // Passo 2.2: Buscar Logins (RADUsuarios)
            const logins = await ixc.logins.listar({ id_cliente: ID_CLIENTE });
            const IDS_LOGINS = logins.map(l => l.id);

            // Passo 3: Módulo de Consumo de Internet (Mockado por enquanto)
            const consumoInternet = {
                total: 'Mocked Total Consumption',
                diario: 'Mocked Daily Consumption',
                mensal: 'Mocked Monthly Consumption',
            };

            // Passo 4.1: Buscar Títulos (Faturas)
            const faturas = await ixc.financeiro.listar({ id_cliente: ID_CLIENTE });
            const IDS_FATURAS = faturas.map(f => f.id);

            // Passo 4.2: Gerar PIX (Mockado por enquanto)
            const pixData = IDS_FATURAS.length > 0 ? `Mocked PIX for Fatura ${IDS_FATURAS[0]}` : 'No PIX generated';

            // Passo 4.3: Gerar Boleto (Mockado por enquanto)
            const boletoData = IDS_FATURAS.length > 0 ? `Mocked Boleto for Fatura ${IDS_FATURAS[0]}` : 'No Boleto generated';


            res.json({
                auth: {
                    ID_CLIENTE,
                    SENHA_API,
                    CPF,
                },
                cadastral: {
                    contratos,
                    logins,
                },
                consumoInternet,
                financeiro: {
                    faturas,
                    pixData,
                    boletoData,
                },
            });

        } catch (error) {
            console.error('Erro no fluxo de dados completo:', error);
            res.status(500).json({ error: 'Erro interno do servidor durante o fluxo de dados completo' });
        }
    });

    // Rota de Dashboard Unificado
    router.get('/dashboard', verifyToken, async (req: any, res) => {
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

    router.post('/trocar-senha', verifyToken, async (req: any, res) => {
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

    router.post('/desbloqueio-confianca', verifyToken, async (req: any, res) => {
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

    router.post('/logins/:id/:action', verifyToken, async (req: any, res) => {
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
                default:
                    return res.status(400).json({ error: 'Ação inválida.' });
            }
            res.json(result);
        } catch (error) {
            console.error(`Erro na ação ${action} para login ${loginId}:`, error);
            res.status(500).json({ error: `Falha ao executar a ação: ${action}` });
        }
    });

    return router;
};