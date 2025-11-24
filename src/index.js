"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var clientes_1 = require("./resources/clientes");
var contratos_1 = require("./resources/contratos");
// FIX: Updated import to use the renamed 'Financeiros' class.
var financeiro_1 = require("./resources/financeiro");
var logins_1 = require("./resources/logins");
var consumo_1 = require("./resources/consumo"); // Import ConsumoResource
var ordens_servico_1 = require("./resources/ordens_servico"); // Import OrdensServicoResource
var ont_1 = require("./resources/ont"); // Import OntResource
var notas_1 = require("./resources/notas"); // Import NotasResource
var tickets_1 = require("./resources/tickets"); // Import TicketsResource
/**
 * Classe principal para interação com a API IXC.
 *
 * Esta classe fornece acesso a diferentes recursos, como `Clientes`, `Contratos`, etc.
 * configurados através de um token de autenticação e uma URL base.
 */
var Ixc = /** @class */ (function () {
    /**
     * Inicializa a classe `Ixc` com as configurações fornecidas.
     *
     * @param config Configurações da API.
     * @param config.token Token de autenticação para a API.
     * @param config.baseUrl URL base para acessar a API.
     */
    function Ixc(config) {
        this.clientes = new clientes_1.Clientes(config);
        this.contratos = new contratos_1.Contratos(config);
        // FIX: Updated instantiation to use the renamed 'Financeiros' class.
        this.financeiro = new financeiro_1.Financeiros(config);
        this.logins = new logins_1.Logins(config);
        this.consumo = new consumo_1.ConsumoResource(config); // Instantiate ConsumoResource
        this.ordensServico = new ordens_servico_1.OrdensServicoResource(config); // Instantiate OrdensServicoResource
        this.ont = new ont_1.OntResource(config); // Instantiate OntResource
        this.notas = new notas_1.NotasResource(config); // Instantiate NotasResource
        this.tickets = new tickets_1.TicketsResource(config); // Instantiate TicketsResource
    }
    return Ixc;
}());
exports.default = Ixc;
