"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRouter = void 0;
var express_1 = require("express");
var jwt = require("jsonwebtoken");
var authMiddleware_1 = require("../../src/middleware/authMiddleware");
var createRouter = function (ixc, JWT_SECRET, DEV_DASHBOARD_DATA, MOCKED_CONSUMPTION_HISTORY) {
    var router = (0, express_1.Router)();
    router.get('/', function (req, res) {
        res.send('API is running');
    });
    // Rota de Login com Unificação de Contas
    router.post('/login', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, email, password, devToken, clientesIniciais, clienteInicial, todosClientes, clientIds, token, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = req.body, email = _a.email, password = _a.password;
                    // Modo DEV
                    if (email === 'dev@fibernet.com' && password === 'dev') {
                        devToken = jwt.sign({ ids: [7, 300], email: 'dev@fibernet.com', isDev: true }, JWT_SECRET, { expiresIn: '1d' });
                        return [2 /*return*/, res.json({ token: devToken })];
                    }
                    if (!email || !password) {
                        return [2 /*return*/, res.status(400).json({ error: 'Email e senha são obrigatórios' })];
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, ixc.clientes.filtrarClientes({ hotsite_email: email })];
                case 2:
                    clientesIniciais = _b.sent();
                    clienteInicial = clientesIniciais === null || clientesIniciais === void 0 ? void 0 : clientesIniciais[0];
                    if (!clienteInicial || clienteInicial.senha !== password) { // A senha no IXC é em texto plano no campo 'senha' do cliente
                        return [2 /*return*/, res.status(401).json({ error: 'Credenciais inválidas' })];
                    }
                    return [4 /*yield*/, ixc.clientes.filtrarClientes({ cnpj_cpf: clienteInicial.cnpj_cpf })];
                case 3:
                    todosClientes = _b.sent();
                    clientIds = todosClientes.map(function (c) { return c.id; });
                    token = jwt.sign({ ids: clientIds, email: clienteInicial.hotsite_email }, JWT_SECRET, { expiresIn: '1d' });
                    res.json({ token: token });
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _b.sent();
                    console.error('Erro no login:', error_1);
                    res.status(500).json({ error: 'Erro interno do servidor durante o login' });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); });
    // Nova Rota para o Fluxo de Dados Completo
    router.post('/full-data', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, email, password, clientesIniciais, clienteInicial, ID_CLIENTE, SENHA_API, CPF, contratos, IDS_CONTRATOS, logins, IDS_LOGINS, consumoInternet, allConsumoPromises, allConsumoResults, faturas, IDS_FATURAS, ordensServico, ontInfoPromises, allOntInfo, pixData, boletoData, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = req.body, email = _a.email, password = _a.password;
                    if (!email || !password) {
                        return [2 /*return*/, res.status(400).json({ error: 'Email e senha são obrigatórios' })];
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 10, , 11]);
                    return [4 /*yield*/, ixc.clientes.filtrarClientes({ hotsite_email: email })];
                case 2:
                    clientesIniciais = _b.sent();
                    clienteInicial = clientesIniciais === null || clientesIniciais === void 0 ? void 0 : clientesIniciais[0];
                    // Passo 1.2: Validar Senha
                    if (!clienteInicial || clienteInicial.senha !== password) {
                        return [2 /*return*/, res.status(401).json({ error: 'Credenciais inválidas' })];
                    }
                    ID_CLIENTE = clienteInicial.id;
                    SENHA_API = clienteInicial.senha;
                    CPF = clienteInicial.cnpj_cpf;
                    return [4 /*yield*/, ixc.contratos.buscarContratosPorIdCliente(ID_CLIENTE)];
                case 3:
                    contratos = _b.sent();
                    IDS_CONTRATOS = contratos.map(function (c) { return c.id; });
                    return [4 /*yield*/, ixc.logins.listar({ id_cliente: ID_CLIENTE })];
                case 4:
                    logins = _b.sent();
                    IDS_LOGINS = logins.map(function (l) { return l.id; });
                    consumoInternet = {
                        total_download_bytes: 0,
                        total_upload_bytes: 0,
                        history: { daily: [], monthly: [] }
                    };
                    if (!(logins.length > 0)) return [3 /*break*/, 6];
                    allConsumoPromises = logins.map(function (login) { return ixc.consumo.getConsumoCompleto(login); });
                    return [4 /*yield*/, Promise.all(allConsumoPromises)];
                case 5:
                    allConsumoResults = _b.sent();
                    consumoInternet = allConsumoResults.reduce(function (acc, currentConsumo) {
                        acc.total_download_bytes += currentConsumo.total_download_bytes;
                        acc.total_upload_bytes += currentConsumo.total_upload_bytes;
                        // For history, a simple concatenation for now. More sophisticated merging might be needed.
                        acc.history.daily = acc.history.daily.concat(currentConsumo.history.daily);
                        acc.history.monthly = acc.history.monthly.concat(currentConsumo.history.monthly);
                        return acc;
                    }, { total_download_bytes: 0, total_upload_bytes: 0, history: { daily: [], monthly: [] } });
                    _b.label = 6;
                case 6: return [4 /*yield*/, ixc.financeiro.listar({ id_cliente: ID_CLIENTE })];
                case 7:
                    faturas = _b.sent();
                    IDS_FATURAS = faturas.map(function (f) { return f.id; });
                    return [4 /*yield*/, ixc.ordensServico.listarOrdensServico(ID_CLIENTE)];
                case 8:
                    ordensServico = _b.sent();
                    ontInfoPromises = logins.map(function (login) { return ixc.ont.listarOntInfo(login.id); });
                    return [4 /*yield*/, Promise.all(ontInfoPromises)];
                case 9:
                    allOntInfo = (_b.sent()).flat();
                    pixData = IDS_FATURAS.length > 0 ? "Mocked PIX for Fatura ".concat(IDS_FATURAS[0]) : 'No PIX generated';
                    boletoData = IDS_FATURAS.length > 0 ? "Mocked Boleto for Fatura ".concat(IDS_FATURAS[0]) : 'No Boleto generated';
                    res.json({
                        auth: {
                            ID_CLIENTE: ID_CLIENTE,
                            SENHA_API: SENHA_API,
                            CPF: CPF,
                        },
                        cadastral: {
                            contratos: contratos,
                            logins: logins,
                            ordensServico: ordensServico,
                            ontInfo: allOntInfo, // Add ontInfo here
                        },
                        consumoInternet: consumoInternet,
                        financeiro: {
                            faturas: faturas,
                            pixData: pixData,
                            boletoData: boletoData,
                        },
                    });
                    return [3 /*break*/, 11];
                case 10:
                    error_2 = _b.sent();
                    console.error('Erro no fluxo de dados completo:', error_2);
                    res.status(500).json({ error: 'Erro interno do servidor durante o fluxo de dados completo' });
                    return [3 /*break*/, 11];
                case 11: return [2 /*return*/];
            }
        });
    }); });
    // Rota de Dashboard Unificado
    router.get('/dashboard', authMiddleware_1.verifyToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
        var clientIds, promises, results, dashboardData, allLogins, allConsumoPromises, allConsumoResults, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Modo DEV
                    if (req.user.isDev) {
                        return [2 /*return*/, res.json(DEV_DASHBOARD_DATA)];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    clientIds = req.user.ids;
                    promises = clientIds.map(function (id) { return Promise.all([
                        ixc.clientes.buscarClientesPorId(id),
                        ixc.contratos.buscarContratosPorIdCliente(id),
                        ixc.financeiro.listar({ id_cliente: id }),
                        ixc.logins.listar({ id_cliente: id }),
                        ixc.ordensServico.listarOrdensServico(id),
                        ixc.ont.listarOntInfo(id), // Add this line
                    ]); });
                    return [4 /*yield*/, Promise.all(promises)];
                case 2:
                    results = _a.sent();
                    dashboardData = results.reduce(function (acc, _a) {
                        var cliente = _a[0], contratos = _a[1], faturas = _a[2], logins = _a[3], ordensServico = _a[4], ontInfo = _a[5];
                        acc.clientes.push({ id: cliente.id, nome: cliente.razao, endereco: "".concat(cliente.endereco, ", ").concat(cliente.numero) });
                        contratos.forEach(function (c) { return acc.contratos.push({ id: c.id, plano: c.descricao_aux_plano_venda, status: c.status, pdf_link: "/contrato/".concat(c.id) }); });
                        faturas.forEach(function (f) { return acc.faturas.push({ id: f.id, vencimento: f.data_vencimento, valor: f.valor, status: f.status === 'A' ? 'aberto' : 'pago', pix_code: f.pix_txid, linha_digitavel: f.linha_digitavel }); });
                        logins.forEach(function (l) { return acc.logins.push({ id: l.id, login: l.login, status: l.online === 'S' ? 'online' : 'offline', sinal_ont: l.sinal_ultimo_atendimento, uptime: l.tempo_conectado, contrato_id: l.id_contrato }); });
                        ordensServico.forEach(function (os) { return acc.ordensServico.push(os); });
                        ontInfo.forEach(function (ont) { return acc.ontInfo.push(ont); }); // Add this line
                        return acc;
                    }, {
                        clientes: [], contratos: [], faturas: [], logins: [], notas: [], ordensServico: [], ontInfo: [], // Initialize ontInfo array
                        consumo: {
                            total_download_bytes: 0,
                            total_upload_bytes: 0,
                            history: { daily: [], monthly: [] }
                        }
                    });
                    allLogins = dashboardData.logins;
                    if (!(allLogins.length > 0)) return [3 /*break*/, 4];
                    allConsumoPromises = allLogins.map(function (login) { return ixc.consumo.getConsumoCompleto(login); });
                    return [4 /*yield*/, Promise.all(allConsumoPromises)];
                case 3:
                    allConsumoResults = _a.sent();
                    dashboardData.consumo = allConsumoResults.reduce(function (acc, currentConsumo) {
                        acc.total_download_bytes += currentConsumo.total_download_bytes;
                        acc.total_upload_bytes += currentConsumo.total_upload_bytes;
                        acc.history.daily = acc.history.daily.concat(currentConsumo.history.daily);
                        acc.history.monthly = acc.history.monthly.concat(currentConsumo.history.monthly);
                        return acc;
                    }, { total_download_bytes: 0, total_upload_bytes: 0, history: { daily: [], monthly: [] } });
                    _a.label = 4;
                case 4:
                    res.json(dashboardData);
                    return [3 /*break*/, 6];
                case 5:
                    error_3 = _a.sent();
                    console.error('Erro ao buscar dados do dashboard:', error_3);
                    res.status(500).json({ error: 'Falha ao carregar dados do painel' });
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); });
    // --- Rotas de Ação ---
    router.post('/trocar-senha', authMiddleware_1.verifyToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
        var newPassword, clientId, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (req.user.isDev)
                        return [2 /*return*/, res.json({ message: 'Senha alterada com sucesso! (Modo DEV)' })];
                    newPassword = req.body.newPassword;
                    clientId = req.user.ids[0];
                    if (!newPassword || newPassword.length < 6) {
                        return [2 /*return*/, res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' })];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, ixc.clientes.alterarSenhaHotsite(clientId, newPassword)];
                case 2:
                    _a.sent();
                    res.json({ message: 'Senha alterada com sucesso!' });
                    return [3 /*break*/, 4];
                case 3:
                    error_4 = _a.sent();
                    res.status(500).json({ error: 'Não foi possível alterar a senha.' });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    router.post('/desbloqueio-confianca', authMiddleware_1.verifyToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
        var clientIds, contratos, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (req.user.isDev)
                        return [2 /*return*/, res.json({ message: 'Desbloqueio solicitado com sucesso! (Modo DEV)' })];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    clientIds = req.user.ids;
                    return [4 /*yield*/, ixc.contratos.buscarContratosPorIdCliente(clientIds[0])];
                case 2:
                    contratos = _a.sent();
                    if (!contratos || contratos.length === 0) {
                        return [2 /*return*/, res.status(404).json({ error: 'Nenhum contrato encontrado para solicitar desbloqueio.' })];
                    }
                    return [4 /*yield*/, ixc.contratos.desbloqueioConfianca(contratos[0].id)];
                case 3:
                    _a.sent();
                    res.json({ message: 'Desbloqueio de confiança solicitado com sucesso!' });
                    return [3 /*break*/, 5];
                case 4:
                    error_5 = _a.sent();
                    res.status(500).json({ error: 'Não foi possível solicitar o desbloqueio.' });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); });
    router.post('/logins/:id/:action', authMiddleware_1.verifyToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, id, action, loginId, result, _b, error_6;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (req.user.isDev)
                        return [2 /*return*/, res.json({ message: 'Ação executada com sucesso! (Modo DEV)' })];
                    _a = req.params, id = _a.id, action = _a.action;
                    loginId = parseInt(id, 10);
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 8, , 9]);
                    result = void 0;
                    _b = action;
                    switch (_b) {
                        case 'limpar-mac': return [3 /*break*/, 2];
                        case 'desconectar': return [3 /*break*/, 4];
                    }
                    return [3 /*break*/, 6];
                case 2: return [4 /*yield*/, ixc.logins.limparMac(loginId)];
                case 3:
                    _c.sent();
                    result = { message: 'MAC limpo com sucesso!' };
                    return [3 /*break*/, 7];
                case 4: return [4 /*yield*/, ixc.logins.desconectarSessao(loginId)];
                case 5:
                    _c.sent();
                    result = { message: 'Sessão desconectada com sucesso!' };
                    return [3 /*break*/, 7];
                case 6: return [2 /*return*/, res.status(400).json({ error: 'Ação inválida.' })];
                case 7:
                    res.json(result);
                    return [3 /*break*/, 9];
                case 8:
                    error_6 = _c.sent();
                    console.error("Erro na a\u00E7\u00E3o ".concat(action, " para login ").concat(loginId, ":"), error_6);
                    res.status(500).json({ error: "Falha ao executar a a\u00E7\u00E3o: ".concat(action) });
                    return [3 /*break*/, 9];
                case 9: return [2 /*return*/];
            }
        });
    }); });
    // Nova Rota para Imprimir Nota
    router.get('/nota/:id/imprimir', authMiddleware_1.verifyToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
        var id, nota, pdfBuffer, error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (req.user.isDev)
                        return [2 /*return*/, res.status(200).send('Mocked PDF Content (DEV Mode)')];
                    id = req.params.id;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, ixc.notas.imprimirNota(parseInt(id, 10), 'S')];
                case 2:
                    nota = _a.sent();
                    if (nota && nota.base64_document) {
                        pdfBuffer = Buffer.from(nota.base64_document, 'base64');
                        res.setHeader('Content-Type', 'application/pdf');
                        res.setHeader('Content-Disposition', "inline; filename=nota-".concat(id, ".pdf"));
                        res.send(pdfBuffer);
                    }
                    else {
                        res.status(404).json({ error: 'Nota não encontrada ou documento não disponível.' });
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_7 = _a.sent();
                    console.error('Erro ao imprimir nota:', error_7);
                    res.status(500).json({ error: 'Erro interno do servidor ao imprimir nota.' });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    // Nova Rota para Criar Ticket
    router.post('/ticket/create', authMiddleware_1.verifyToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
        var ticketPayload, result, error_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (req.user.isDev)
                        return [2 /*return*/, res.json({ message: 'Ticket criado com sucesso! (Modo DEV)', id: 'DEV-TICKET-123' })];
                    ticketPayload = req.body;
                    // Basic validation
                    if (!ticketPayload.id_cliente || !ticketPayload.titulo || !ticketPayload.menssagem) {
                        return [2 /*return*/, res.status(400).json({ error: 'id_cliente, titulo e menssagem são obrigatórios para criar um ticket.' })];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, ixc.tickets.criarTicket(ticketPayload)];
                case 2:
                    result = _a.sent();
                    res.status(201).json({ message: 'Ticket criado com sucesso!', ticket: result });
                    return [3 /*break*/, 4];
                case 3:
                    error_8 = _a.sent();
                    console.error('Erro ao criar ticket:', error_8);
                    res.status(500).json({ error: 'Erro interno do servidor ao criar ticket.' });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    return router;
};
exports.createRouter = createRouter;
