// src/services/ixc.js
const axios = require("axios");
const { Buffer } = require("node:buffer");
const md5 = require("md5"); // Certifique-se de instalar: npm install md5
const jwt = require("jsonwebtoken");

class IXCService {
  constructor() {
    const credentials = process.env.IXC_ADMIN_TOKEN;
    const baseURL = process.env.IXC_API_URL;

    if (!credentials || !baseURL) {
      throw new Error(
        "IXC_ADMIN_TOKEN ou IXC_API_URL estão faltando. Verifique as variáveis de ambiente."
      );
    }

    const tokenBase64 = Buffer.from(credentials).toString("base64");
    this.authHeader = `Basic ${tokenBase64}`;

    this.api = axios.create({
      baseURL: baseURL,
      headers: {
        Authorization: this.authHeader,
        "Content-Type": "application/json",
      },
      // Configuração para aceitar certificados auto-assinados (útil para IXC)
      httpsAgent: new (require("https").Agent)({
        rejectUnauthorized: false,
      }),
      timeout: 15000,
    });
  }

  // =========================================================
  // MÉTODO BASE CORRIGIDO (O CORAÇÃO DO GATEWAY)
  // =========================================================

  /**
   * Mapeia requisições REST (GET, POST, PUT, DELETE) para o formato do IXC.
   */
  async ixcRequest(endpoint, method, data = {}, params = {}) {
    try {
      let config = {
        url: `/${endpoint}`,
        data: data,
        headers: {},
      };

      if (method === "get") {
        // 💡 IXC LISTAGEM: POST com header ixcsoft: listar e filtros no corpo
        config.method = "post";
        config.headers.ixcsoft = "listar";
        config.data = params;
      } else if (method === "post") {
        // 💡 IXC CRIAÇÃO: POST com header ixcsoft: inserir
        config.method = "post";
        config.headers.ixcsoft = "inserir";
      } else if (method === "put") {
        // 💡 IXC EDIÇÃO: POST com header ixcsoft: editar
        config.method = "post";
        config.headers.ixcsoft = "editar";
        if (!data.id)
          throw new Error("ID do registro é obrigatório para edição.");
      } else if (method === "delete") {
        // IXC DELEÇÃO: DELETE /endpoint/ID
        const idRegistro = params.id || data.id;
        if (!idRegistro)
          throw new Error("ID do registro é obrigatório para exclusão.");
        config.method = "delete";
        config.url = `/${endpoint}/${idRegistro}`;
        config.data = undefined;
      } else {
        throw new Error(`Método ${method.toUpperCase()} não suportado.`);
      }

      const response = await this.api(config);
      return response.data;
    } catch (error) {
      const errorData = error.response ? error.response.data : error.message;
      // Re-lança um erro mais limpo para ser tratado pelo controller
      throw new Error(errorData || "Erro interno ao comunicar com a API IXC.");
    }
  }

  // =========================================================
  // MÉTODOS DE AUTENTICAÇÃO
  // =========================================================

  /**
   * Tenta autenticar um cliente usando login e senha do hotsite.
   */
  async authenticate(login, senha) {
    const payload = {
      qtype: "cliente.hotsite_login",
      query: login,
      oper: "=",
      limit: 1,
    };

    // Usa o método base para listar o cliente pelo login
    const clienteRes = await this.ixcRequest("cliente", "get", null, payload);
    const cliente = clienteRes.registros?.[0];

    if (!cliente) {
      return null; // Cliente não encontrado ou login inválido
    }

    // 💡 Lógica CRÍTICA: Verifica a senha no IXC
    let senhaCorreta = false;

    // O campo 'hotsite_senha_md5' indica se a senha está em MD5
    if (cliente.hotsite_senha_md5 === "S") {
      senhaCorreta = cliente.hotsite_senha === md5(senha);
    } else {
      // Se 'hotsite_senha_md5' for 'N', a senha é comparada em texto puro
      senhaCorreta = cliente.hotsite_senha === senha;
    }

    if (!senhaCorreta) {
      return null; // Senha incorreta
    }

    // Retorna os dados essenciais para o Controller/JWT
    return {
      id: cliente.id,
      nome: cliente.razao || cliente.fantasia || cliente.nome_razaosocial,
      email: cliente.hotsite_email,
      cpf_cnpj: cliente.cnpj_cpf,
    };
  }

  // =========================================================
  // MÉTODOS DE DADOS DO CLIENTE (PARA DASHBOARD)
  // =========================================================

  /**
   * Busca os contratos ativos do cliente.
   * @param {string} idCliente - ID do cliente IXC.
   */
  async getContratos(idCliente) {
    const payload = {
      qtype: "cliente_contrato.id_cliente",
      query: idCliente,
      oper: "=",
      rp: "1", // Pega apenas 1 contrato (o principal, geralmente o mais recente)
      sort: "cliente_contrato.id",
      sortorder: "desc",
      filtrar_status_ativo: "S", // Filtra apenas por contratos ativos
    };

    // O retorno é o registro do contrato
    const res = await this.ixcRequest("cliente_contrato", "get", null, payload);
    return res.registros?.[0] || null;
  }

  /**
   * Busca as faturas (títulos a receber) do cliente.
   * @param {string} idCliente - ID do cliente IXC.
   * @param {string} status - A (Abertas) ou R (Recebidas).
   */
  async getFaturas(idCliente, status = "A") {
    const payload = {
      qtype: "fn_areceber.id_cliente",
      query: idCliente,
      oper: "=",
      rp: "10", // Limita a 10 faturas (Ex.: 5 abertas e 5 pagas)
      sort: "fn_areceber.data_vencimento",
      sortorder: "desc",
      filtrar_status_aberto: status === "A" ? "S" : "N",
      filtrar_status_recebido: status === "R" ? "S" : "N",
    };

    // O retorno é uma lista de faturas
    const res = await this.ixcRequest("fn_areceber", "get", null, payload);
    return res.registros || [];
  }

  // =========================================================
  // MÉTODOS DE COBRANÇA E BOLETO
  // =========================================================

  /**
   * Busca o link do Gateway de pagamento ou gera o boleto em Base64.
   * @param {string} idFatura - ID do título (fn_areceber.id).
   */
  async getPaymentLinkOrBoleto(idFatura) {
    if (!idFatura) {
      throw new Error("ID da fatura é obrigatório para gerar o pagamento.");
    }

    // 1. Tenta buscar o link do Gateway (PIX, cartão, etc.)
    try {
      const payloadLink = {
        id_cobranca: idFatura,
        // O IXC usa um endpoint especial 'get_boleto' para boletos/links
      };

      // Tenta a chamada do boleto/link
      // O get_boleto não usa o header ixcsoft, então redefinimos o config no ixcRequest
      const response = await this.ixcRequest(
        "get_boleto",
        "post",
        payloadLink,
        {
          ixcsoft: "get_boleto", // Pode ser necessário especificar o header aqui
        }
      );

      // Se o IXC retornar um link (gateway_link, pix_link, etc.), priorizamos ele
      if (response.gateway_link || response.pix_link) {
        return {
          tipo: "link",
          link: response.gateway_link || response.pix_link,
          message: "Link de pagamento/gateway gerado com sucesso.",
        };
      }

      // 2. Se não houver link, tenta gerar o PDF Base64
      const payloadBoleto = {
        id_cobranca: idFatura,
        tipo_boleto: "arquivo", // Parâmetro para retornar o arquivo
        base64: "S", // Parâmetro para retornar em Base64
      };

      const responseBoleto = await this.ixcRequest(
        "get_boleto",
        "post",
        payloadBoleto,
        {
          ixcsoft: "get_boleto",
        }
      );

      if (responseBoleto.base64) {
        return {
          tipo: "boleto_pdf",
          base64: responseBoleto.base64,
          message: "Boleto PDF (Base64) gerado com sucesso.",
        };
      }

      // Se nada funcionar
      return {
        tipo: "erro",
        message:
          "Não foi possível gerar link de pagamento ou boleto para esta fatura. Título já pago ou cancelado.",
      };
    } catch (error) {
      console.error(
        "[IXC Service - Boleto] Falha ao buscar boleto:",
        error.message
      );
      // O erro pode ser um título já pago, por exemplo
      throw new Error("Falha na API IXC: " + error.message);
    }
  }

  // =========================================================
  // MÉTODOS DE SUPORTE (su_ticket)
  // =========================================================

  /**
   * Busca os tickets/chamados do cliente.
   * @param {string} idCliente - ID do cliente IXC.
   * @param {string} status - S (Somente Abertos/Em Andamento) ou T (Todos, incluindo Fechados).
   */
  async getTickets(idCliente, status = "S") {
    const payload = {
      qtype: "su_ticket.id_cliente",
      query: idCliente,
      oper: "=",
      rp: "20", // Limita a 20 tickets
      sort: "su_ticket.id",
      sortorder: "desc",
      // O campo 'filtrar_status_ativo' define se o ticket está ativo ('S') ou todos ('N')
      filtrar_status_ativo: status === "S" ? "S" : "N",
    };

    const res = await this.ixcRequest("su_ticket", "get", null, payload);
    return res.registros || [];
  }

  /**
   * Cria um novo ticket de suporte no IXC.
   * @param {object} ticketData - Dados do ticket (titulo, mensagem, idAssunto).
   * @param {string} idCliente - ID do cliente IXC.
   */
  async createTicket(ticketData, idCliente) {
    const now = new Date().toISOString().split("T")[0]; // Formato YYYY-MM-DD

    // Mapeamento dos dados mínimos e essenciais para o IXC
    const payload = {
      id_cliente: idCliente,
      id_assunto: ticketData.idAssunto || 0, // ID do Assunto/Setor (veja a tabela su_assunto)
      titulo: ticketData.titulo,
      menssagem: ticketData.mensagem, // Sim, "menssagem" com SS

      // Valores fixos para abertura pelo Portal/Hotsite
      tipo: "C", // C = Chamado
      origem_cadastro: "P", // P = Portal do Cliente
      id_ticket_origem: "I", // I = Internet
      status: "T", // T = Em Atendimento/Em Aberto
      prioridade: "M", // M = Média

      // Datas e status iniciais
      data_criacao: now,
      data_ultima_alteracao: now,
      su_status: "N", // Status no setor: N = Novo
      mensagens_nao_lida_sup: "1", // Para alertar o atendente

      // Se tiver contrato, preencha para facilitar o atendimento
      id_contrato: ticketData.idContrato || "",

      // Dados de contato (opcional, mas bom ter no payload)
      cliente_email: ticketData.email || "",
    };

    // A chamada para CRIAÇÃO é um POST com header ixcsoft: inserir
    const res = await this.ixcRequest("su_ticket", "post", payload);

    if (res.error) {
      throw new Error(`IXC: ${res.error}`);
    }

    return {
      success: true,
      idTicket: res.id,
      protocolo: res.protocolo,
    };
  }

  // =========================================================
  // MÉTODOS DE TESTE TÉCNICO
  // =========================================================

  /**
   * Busca o login do cliente na tabela radusuarios.
   * @param {string} idCliente - ID do cliente IXC.
   */
  async getLoginDoCliente(idCliente) {
    const payload = {
      qtype: "radusuarios.id_cliente",
      query: idCliente,
      oper: "=",
      rp: "1", // Pega apenas o primeiro login associado
      filtrar_status_ativo: "S", // Busca apenas logins ativos
    };

    // O retorno é o registro do login
    const res = await this.ixcRequest("radusuarios", "get", null, payload);
    return res.registros?.[0] || null;
  }

  /**
   * Executa um teste de Ping/Traceroute no IXC.
   * @param {string} idLogin - ID do login (radusuarios.id).
   * @param {string} tipoTeste - 'ping' ou 'traceroute'.
   */
  async executarTesteTecnico(idLogin, tipoTeste = "ping") {
    if (!idLogin) {
      throw new Error("ID do login é obrigatório para o teste.");
    }

    // O endpoint especial 'radusuarios_ping_traceroute' é usado para comandos
    const payload = {
      id: idLogin,
      tipo_operacao: tipoTeste === "traceroute" ? "traceroute" : "ping",
    };

    // O IXC usa um POST normal para este comando
    const res = await this.ixcRequest(
      "radusuarios_ping_traceroute",
      "post",
      payload,
      {
        ixcsoft: "ping_traceroute", // Header de comando para teste
      }
    );

    if (res.error) {
      throw new Error(`IXC: ${res.error}`);
    }

    // O retorno 'msg_ping' ou 'msg_traceroute' contém o resultado do teste
    return {
      success: true,
      resultadoRaw: res,
      message:
        res.msg_ping ||
        res.msg_traceroute ||
        "Teste executado com sucesso. Verifique o resultado.",
    };
  }
}

// Exporta uma instância única (Singleton)
module.exports = new IXCService();
