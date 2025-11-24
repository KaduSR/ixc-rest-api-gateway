import { Router } from 'express';
import * as jwt from 'jsonwebtoken';
import Ixc from '../../src/index';
import { verifyToken } from '../../src/middleware/authMiddleware';
import { DashboardData } from '../../types';
import { OntInfo } from '../../src/resources/ont/types'; // Import OntInfo type
import { Consumo } from '../resources/consumo/types'; // Import Consumo type
import { TicketCreatePayload } from '../../src/resources/tickets/types'; // Import TicketCreatePayload type

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

            // Passo 3: Módulo de Consumo de Internet
            let consumoInternet: Consumo = {
                total_download_bytes: 0,
                total_upload_bytes: 0,
                history: { daily: [], monthly: [] }
            };

            if (logins.length > 0) {
                // Fetch consumption for each login and aggregate
                const allConsumoPromises = logins.map(login => ixc.consumo.getConsumoCompleto(login));
                const allConsumoResults = await Promise.all(allConsumoPromises);

                consumoInternet = allConsumoResults.reduce((acc, currentConsumo) => {
                    acc.total_download_bytes += currentConsumo.total_download_bytes;
                    acc.total_upload_bytes += currentConsumo.total_upload_bytes;
                    // For history, a simple concatenation for now. More sophisticated merging might be needed.
                    acc.history.daily = acc.history.daily.concat(currentConsumo.history.daily);
                    acc.history.monthly = acc.history.monthly.concat(currentConsumo.history.monthly);
                    return acc;
                }, { total_download_bytes: 0, total_upload_bytes: 0, history: { daily: [], monthly: [] } });
            }

            // Passo 4.1: Buscar Títulos (Faturas)
            const faturas = await ixc.financeiro.listar({ id_cliente: ID_CLIENTE });
            const IDS_FATURAS = faturas.map(f => f.id);

            // Passo 4.4: Buscar Ordens de Serviço
            const ordensServico = await ixc.ordensServico.listarOrdensServico(ID_CLIENTE);

            // Passo 4.5: Buscar Informações da ONT para cada login
            const ontInfoPromises = logins.map(login => ixc.ont.listarOntInfo(login.id));
            const allOntInfo = (await Promise.all(ontInfoPromises)).flat(); // Flatten array of arrays

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
                    ordensServico,
                    ontInfo: allOntInfo, // Add ontInfo here
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
                ixc.ordensServico.listarOrdensServico(id),
                ixc.ont.listarOntInfo(id), // Add this line
            ]));

            const results = await Promise.all(promises);

            const dashboardData: DashboardData = results.reduce((acc, [cliente, contratos, faturas, logins, ordensServico, ontInfo]) => { // Add ontInfo here
                acc.clientes.push({ id: cliente.id, nome: cliente.razao, endereco: `${cliente.endereco}, ${cliente.numero}` });
                contratos.forEach(c => acc.contratos.push({ id: c.id, plano: c.descricao_aux_plano_venda, status: c.status, pdf_link: `/contrato/${c.id}` }));
                faturas.forEach(f => acc.faturas.push({ id: f.id, vencimento: f.data_vencimento, valor: f.valor, status: f.status === 'A' ? 'aberto' : 'pago', pix_code: f.pix_txid, linha_digitavel: f.linha_digitavel }));
                logins.forEach(l => acc.logins.push({ id: l.id, login: l.login, status: l.online === 'S' ? 'online' : 'offline', sinal_ont: l.sinal_ultimo_atendimento, uptime: l.tempo_conectado, contrato_id: l.id_contrato }));
                ordensServico.forEach(os => acc.ordensServico.push(os));
                ontInfo.forEach(ont => acc.ontInfo.push(ont)); // Add this line
                return acc;
            }, {
                clientes: [], contratos: [], faturas: [], logins: [], notas: [], ordensServico: [], ontInfo: [], // Initialize ontInfo array
                consumo: { // Initialize with empty consumption
                    total_download_bytes: 0,
                    total_upload_bytes: 0,
                    history: { daily: [], monthly: [] }
                }
            });

            // Fetch and aggregate consumption for all logins after collecting them
            const allLogins = dashboardData.logins;
            if (allLogins.length > 0) {
                const allConsumoPromises = allLogins.map((login: any) => ixc.consumo.getConsumoCompleto(login));
                const allConsumoResults = await Promise.all(allConsumoPromises);

                dashboardData.consumo = allConsumoResults.reduce((acc, currentConsumo) => {
                    acc.total_download_bytes += currentConsumo.total_download_bytes;
                    acc.total_upload_bytes += currentConsumo.total_upload_bytes;
                    acc.history.daily = acc.history.daily.concat(currentConsumo.history.daily);
                    acc.history.monthly = acc.history.monthly.concat(currentConsumo.history.monthly);
                    return acc;
                }, { total_download_bytes: 0, total_upload_bytes: 0, history: { daily: [], monthly: [] } });
            }

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

    // Nova Rota para Imprimir Nota
    router.get('/nota/:id/imprimir', verifyToken, async (req: any, res) => {
        if (req.user.isDev) return res.status(200).send('Mocked PDF Content (DEV Mode)');

        const { id } = req.params;
        try {
            const nota = await ixc.notas.imprimirNota(parseInt(id, 10), 'S');
            if (nota && nota.base64_document) {
                const pdfBuffer = Buffer.from(nota.base64_document, 'base64');
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `inline; filename=nota-${id}.pdf`);
                res.send(pdfBuffer);
            } else {
                res.status(404).json({ error: 'Nota não encontrada ou documento não disponível.' });
            }
        } catch (error) {
            console.error('Erro ao imprimir nota:', error);
            res.status(500).json({ error: 'Erro interno do servidor ao imprimir nota.' });
        }
    });

    // Nova Rota para Criar Ticket
    router.post('/ticket/create', verifyToken, async (req: any, res) => {
        if (req.user.isDev) return res.json({ message: 'Ticket criado com sucesso! (Modo DEV)', id: 'DEV-TICKET-123' });

        const ticketPayload: TicketCreatePayload = req.body;
        // Basic validation
        if (!ticketPayload.id_cliente || !ticketPayload.titulo || !ticketPayload.menssagem) {
            return res.status(400).json({ error: 'id_cliente, titulo e menssagem são obrigatórios para criar um ticket.' });
        }

        try {
            const result = await ixc.tickets.criarTicket(ticketPayload);
            res.status(201).json({ message: 'Ticket criado com sucesso!', ticket: result });
        } catch (error) {
            console.error('Erro ao criar ticket:', error);
            res.status(500).json({ error: 'Erro interno do servidor ao criar ticket.' });
        }
    });

    return router;
};