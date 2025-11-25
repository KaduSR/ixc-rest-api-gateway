import { Router } from 'express';
import * as jwt from 'jsonwebtoken';
import Ixc from '../../src/index';
import { verifyToken } from '../../src/middleware/authMiddleware';
import { DashboardData, Cliente, Contrato, Fatura, Login, OrdemServico, OntInfo } from '../../types';
import { Consumo } from '../resources/consumo/types';
import { TicketCreatePayload } from '../../src/resources/tickets/types';

export const createRouter = (ixc: Ixc, JWT_SECRET: string, DEV_DASHBOARD_DATA: DashboardData, MOCKED_CONSUMPTION_HISTORY: any) => {
    const router = Router();

    router.get('/', (req, res) => {
        res.send('API is running');
    });

    // ... (mantenha o código existente até a linha 163)

    // CORREÇÃO: Adicionar type assertions explícitas
    router.get('/dashboard', verifyToken, async (req: any, res) => {
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
                ixc.ont.listarOntInfo(id),
            ]));

            const results = await Promise.all(promises);

            const dashboardData: DashboardData = results.reduce((acc, [cliente, contratos, faturas, logins, ordensServico, ontInfo]) => {
                // CORREÇÃO: Type assertions explícitas
                acc.clientes.push({ 
                    id: cliente.id, 
                    nome: cliente.razao, 
                    endereco: `${cliente.endereco}, ${cliente.numero}` 
                } as any);

                contratos.forEach(c => acc.contratos.push({ 
                    id: c.id, 
                    plano: c.descricao_aux_plano_venda, 
                    status: c.status, 
                    pdf_link: `/contrato/${c.id}` 
                } as any));

                faturas.forEach(f => acc.faturas.push({ 
                    id: f.id, 
                    vencimento: f.data_vencimento, 
                    valor: f.valor, 
                    status: f.status === 'A' ? 'aberto' : 'pago', 
                    pix_code: f.pix_txid, 
                    linha_digitavel: f.linha_digitavel 
                } as any));

                logins.forEach(l => acc.logins.push({ 
                    id: l.id, 
                    login: l.login, 
                    status: l.online === 'S' ? 'online' : 'offline', 
                    sinal_ont: l.sinal_ultimo_atendimento, 
                    uptime: l.tempo_conectado, 
                    contrato_id: l.id_contrato 
                } as any));

                ordensServico.forEach(os => acc.ordensServico.push(os));
                
                ontInfo.forEach(ont => acc.ontInfo.push(ont));

                return acc;
            }, {
                clientes: [] as any[],
                contratos: [] as any[],
                faturas: [] as any[],
                logins: [] as any[],
                notas: [] as any[],
                ordensServico: [] as OrdemServico[],
                ontInfo: [] as OntInfo[],
                consumo: {
                    total_download_bytes: 0,
                    total_upload_bytes: 0,
                    history: { daily: [], monthly: [] }
                }
            });

            // Buscar consumo
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

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            console.error('Erro ao buscar dados do dashboard:', errorMessage);
            res.status(500).json({ error: 'Falha ao carregar dados do painel' });
        }
    });

    // ... (resto do código)

    return router;
};
