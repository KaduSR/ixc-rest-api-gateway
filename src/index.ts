import { Clientes } from "./resources/clientes";
import { Contratos } from "./resources/contratos";
// FIX: Updated import to use the renamed 'Financeiros' class.
import { Financeiros } from "./resources/financeiro";
import { Logins } from "./resources/logins";

/**
 * Classe principal para interação com a API IXC.
 * 
 * Esta classe fornece acesso a diferentes recursos, como `Clientes`, `Contratos`, etc.
 * configurados através de um token de autenticação e uma URL base.
 */
export default class Ixc {
    /** Recurso para gerenciar clientes. */
    clientes: Clientes;

    /** Recurso para gerenciar contratos. */
    contratos: Contratos;

    /** Recurso para gerenciar o financeiro (contas a receber). */
    // FIX: Updated type to use the renamed 'Financeiros' class.
    financeiro: Financeiros;

    /** Recurso para gerenciar logins de conexão (radusuarios). */
    logins: Logins;

    /**
     * Inicializa a classe `Ixc` com as configurações fornecidas.
     * 
     * @param config Configurações da API.
     * @param config.token Token de autenticação para a API.
     * @param config.baseUrl URL base para acessar a API.
     */
    constructor(config: { token: string; baseUrl: string }) {
        this.clientes = new Clientes(config);
        this.contratos = new Contratos(config);
        // FIX: Updated instantiation to use the renamed 'Financeiros' class.
        this.financeiro = new Financeiros(config);
        this.logins = new Logins(config);
    }
}