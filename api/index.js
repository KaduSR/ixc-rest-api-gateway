"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var dotenv = require("dotenv");
dotenv.config();
var express = require("express");
var cors = require("cors");
var index_1 = require("../src/index");
var routes_1 = require("../src/api/routes");
var app = express();
app.use(cors());
app.use(express.json());
var _a = process.env, IXC_API_URL = _a.IXC_API_URL, IXC_ADMIN_TOKEN = _a.IXC_ADMIN_TOKEN, JWT_SECRET = _a.JWT_SECRET;
if (!IXC_API_URL || !IXC_ADMIN_TOKEN || !JWT_SECRET) {
    console.error('Variáveis de ambiente ausentes. Verifique seu arquivo .env');
}
var ixc = new index_1.default({
    baseUrl: IXC_API_URL,
    token: IXC_ADMIN_TOKEN,
});
// === DADOS MOCKADOS PARA MODO DEV ===
var MOCKED_CONSUMPTION_HISTORY = {
    daily: Array.from({ length: 7 }, function (_, i) { return ({ data: "2025-11-".concat(18 + i), download_bytes: Math.random() * 25 * 1024 * 1024 * 1024, upload_bytes: Math.random() * 10 * 1024 * 1024 * 1024 }); }),
    monthly: Array.from({ length: 6 }, function (_, i) { return ({ mes_ano: "2025-".concat(11 - i), download_bytes: Math.random() * 600 * 1024 * 1024 * 1024, upload_bytes: Math.random() * 250 * 1024 * 1024 * 1024 }); }),
};
var DEV_DASHBOARD_DATA = {
    clientes: [
        { id: 7, razao: 'Cliente Principal Dev', endereco: 'Rua dos Testes, 123', cnpj_cpf: '12345678900', fantasia: 'Principal Dev', fone: '11999999999', email: 'dev@fibernet.com' },
        { id: 300, razao: 'Cliente Secundário Dev', endereco: 'Avenida da Simulação, 456', cnpj_cpf: '00987654321', fantasia: 'Secundário Dev', fone: '11888888888', email: 'dev2@fibernet.com' },
    ],
    contratos: [
        { id: 101, descricao_aux_plano_venda: 'Fibra 500 Mega - Casa', status: 'A', desbloqueio_confianca: 'N', id_cliente: 7, login: 'login101' },
        { id: 102, descricao_aux_plano_venda: 'Fibra 300 Mega - Escritório', status: 'S', desbloqueio_confianca: 'N', id_cliente: 300, login: 'login102' },
    ],
    faturas: [
        { id: 1, documento: 'DOC1', data_emissao: '01/08/2025', data_vencimento: '10/08/2025', valor: '99.90', status: 'A', linha_digitavel: '12345...', pix_txid: 'PIX_CODE_1', boleto: '#', id_cliente: 7 },
        { id: 2, documento: 'DOC2', data_emissao: '01/07/2025', data_vencimento: '10/07/2025', valor: '99.90', status: 'B', linha_digitavel: '', pix_txid: '', boleto: '#', id_cliente: 7 },
        { id: 3, documento: 'DOC3', data_emissao: '01/08/2025', data_vencimento: '10/08/2025', valor: '79.90', status: 'A', linha_digitavel: '67890...', pix_txid: 'PIX_CODE_2', boleto: '#', id_cliente: 300 },
        { id: 4, documento: 'DOC4', data_emissao: '01/05/2025', data_vencimento: '01/06/2025', valor: '99.90', status: 'A', linha_digitavel: '', pix_txid: '', boleto: '#', id_cliente: 300 },
    ],
    logins: [
        { id: 1, login: 'cliente@fibra', online: 'S', uptime: '15d 4h', id_contrato: 101, id_cliente: 7, upload_atual: '10000000000', download_atual: '50000000000' },
        { id: 2, login: 'escritorio@fibra', online: 'N', uptime: '0d 0h', id_contrato: 102, id_cliente: 300, upload_atual: '0', download_atual: '0' },
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
var apiRouter = (0, routes_1.createRouter)(ixc, JWT_SECRET, DEV_DASHBOARD_DATA, MOCKED_CONSUMPTION_HISTORY);
app.use('/api', apiRouter);
// Exporta o app para a Vercel
exports.default = app;
if (process.env.NODE_ENV !== 'production') {
    var port_1 = process.env.PORT || 3000;
    app.listen(port_1, function () {
        console.log("Server running on port ".concat(port_1));
    });
}
