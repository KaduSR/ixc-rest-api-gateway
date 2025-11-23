// src/services/ixc.js
const axios = require("axios");
const { Buffer } = require("node:buffer");
const md5 = require("md5");
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

    const clienteRes = await this.ixcRequest("cliente", "get", null, payload);
    const cliente = clienteRes.registros?.[0];

    if (!cliente) {
      return null;
    }

    let senhaCorreta = false;

    if (cliente.hotsite_senha_md5 === "S") {
      senhaCorreta = cliente.hotsite_senha === md5(senha);
    } else {
      senhaCorreta = cliente.hotsite_senha === senha;
    }

    if (!senhaCorreta) {
      return null;
    }

    return {
      id: cliente.id,
      nome: cliente.razao || cliente.fantasia || cliente.nome_razaosocial,
      email: cliente.hotsite_email,
      cpf_cnpj: cliente.cnpj_cpf,
    };
  }

  // =========================================================
  // MÉTODOS DE DADOS DO CLIENTE (PARA DASHBOARD E PERFIL)
  // =========================================================

  /**
   * Busca os dados completos do cliente.
   * @param {string} idCliente - ID do cliente IXC.
   */
  async getDadosCliente(idCliente) {
    const payload = {
      qtype: "cliente.id",
      query: idCliente,
      oper: "=",
      rp: "1",
    };
    const res = await this.ixcRequest("cliente", "get", null, payload);
    return res.registros?.[0] || null;
  }

  // =========================================================
  // MÉTODOS DE CONTRATO E PLANO 💡 NOVO
  // =========================================================

  /**
   * Busca o contrato ativo principal, detalhes do plano e login associado.
   * @param {string} idCliente - ID do cliente IXC.
   */
  async getDetalhesContratoCompleto(idCliente) {
    // 1. Busca o contrato ativo principal
    const contratoPayload = {
      qtype: "cliente_contrato.id_cliente",
      query: idCliente,
      oper: "=",
      rp: "1",
      sort: "cliente_contrato.id",
      sortorder: "desc",
      filtrar_status_ativo: "S", // Contratos Ativos
    };

    const resContrato = await this.ixcRequest(
      "cliente_contrato",
      "get",
      null,
      contratoPayload
    );
    const contrato = resContrato.registros?.[0];

    if (!contrato) {
      return null;
    }

    // 2. Busca detalhes do Plano (vd_contrato_plano_venda)
    let plano = {};
    if (contrato.id_vd_contrato_plano_venda) {
      const planoPayload = {
        qtype: "vd_contrato_plano_venda.id",
        query: contrato.id_vd_contrato_plano_venda,
        oper: "=",
        rp: "1",
      };
      const resPlano = await this.ixcRequest(
        "vd_contrato_plano_venda",
        "get",
        null,
        planoPayload
      );
      plano = resPlano.registros?.[0] || {};
    }

    // 3. Busca o login principal (radusuarios) para dados de consumo/status
    const loginData = await this.getLoginDoCliente(idCliente);

    return {
      ...contrato,
      plano: {
        id: plano.id,
        descricao: plano.descricao,
        download: plano.velocidade_download,
        upload: plano.velocidade_upload,
        // Adicione mais campos do plano conforme necessário (Ex: tipo_banda)
      },
      login: loginData
        ? {
            idLogin: loginData.id,
            login: loginData.login,
            online: loginData.online === "SS" ? "Online" : "Offline",
            ip: loginData.ip_online || "N/A",
            // Adicione mais campos do login conforme necessário
          }
        : null,
    };
  }

  // =========================================================
  // MÉTODOS DE DADOS CADASTRAIS (CLIENTE) 💡 NOVO
  // =========================================================

  /**
   * Busca os dados cadastrais completos do cliente para visualização.
   * @param {string} idCliente - ID do cliente IXC.
   */
  async getDadosCadastrais(idCliente) {
    // Reutiliza o método getDadosCliente, que busca a tabela 'cliente'
    const cliente = await this.getDadosCliente(idCliente);

    if (!cliente) {
      return null;
    }

    // Mapeia e organiza os dados essenciais para o perfil
    return {
      id: cliente.id,
      nome: cliente.razao || cliente.fantasia || cliente.nome_razaosocial,
      cpfCnpj: cliente.cnpj_cpf,
      rgIe: cliente.ie_identidade,
      dataNascimento: cliente.data_nascimento,

      contatos: {
        emailHotsite: cliente.hotsite_email,
        emailNotificacao: cliente.email_nfe, // E-mail para NF/boletos
        telefonePrincipal: cliente.telefone_celular || cliente.fone,
        telefoneComercial: cliente.telefone_comercial,
      },

      enderecoInstalacao: {
        cep: cliente.cep,
        logradouro: cliente.endereco,
        numero: cliente.numero,
        complemento: cliente.complemento,
        bairro: cliente.bairro,
        cidade: cliente.cidade,
        uf: cliente.estado,
        referencia: cliente.referencia,
      },
    };
  }

  /**
   * Atualiza os dados cadastrais do cliente (apenas campos permitidos).
   * @param {string} idCliente - ID do cliente IXC.
   * @param {object} dados - Dados para atualização.
   */
  async atualizarDadosCadastrais(idCliente, dados) {
    const payload = {
      id: idCliente,
      // Contatos
      telefone_celular: dados.contatos?.telefonePrincipal,
      telefone_comercial: dados.contatos?.telefoneComercial,
      email_nfe: dados.contatos?.emailNotificacao,
      hotsite_email: dados.contatos?.emailHotsite,

      // Endereço (tabela 'cliente' do IXC)
      cep: dados.enderecoInstalacao?.cep,
      endereco: dados.enderecoInstalacao?.logradouro,
      numero: dados.enderecoInstalacao?.numero,
      complemento: dados.enderecoInstalacao?.complemento,
      bairro: dados.enderecoInstalacao?.bairro,
      cidade: dados.enderecoInstalacao?.cidade,
      estado: dados.enderecoInstalacao?.uf,
      referencia: dados.enderecoInstalacao?.referencia,

      // Data de alteração do registro para compliance/rastreio
      data_ultima_alteracao: new Date().toISOString().split("T")[0],
    };

    // Remove campos nulos/vazios/undefined para não sobrescrever dados
    Object.keys(payload).forEach(
      (key) =>
        (payload[key] === undefined || payload[key] === null) &&
        delete payload[key]
    );

    // A chamada para EDIÇÃO é um PUT (POST com header ixcsoft: editar)
    const res = await this.ixcRequest("cliente", "put", payload);

    if (res.error) {
      throw new Error(`IXC: ${res.error}`);
    }

    return { success: true, idCliente: res.id };
  }

  // =========================================================
  // MÉTODOS DE ALTERAÇÃO DE SENHA (CENTRAL DO ASSINANTE)
  // =========================================================

  /**
   * Altera a senha do hotsite do cliente.
   * @param {string} idCliente - ID do cliente IXC.
   * @param {string} novaSenha - A nova senha em texto puro.
   */
  async alterarSenhaHotsite(idCliente, novaSenha) {
    const senhaMD5 = md5(novaSenha);

    const payload = {
      id: idCliente,
      hotsite_senha: senhaMD5,
      hotsite_senha_md5: "S",
    };

    const res = await this.ixcRequest("cliente", "put", payload);

    if (res.error) {
      throw new Error(`IXC: ${res.error}`);
    }

    return { success: true, message: "Senha alterada com sucesso!" };
  }

  // =========================================================
  // MÉTODOS DE TESTE TÉCNICO E DADOS DE LOGIN
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
      rp: "1",
      filtrar_status_ativo: "S",
    };

    const res = await this.ixcRequest("radusuarios", "get", null, payload);
    return res.registros?.[0] || null;
  }

  // ... (outros métodos como getFaturas, getPaymentLinkOrBoleto, getTickets, createTicket)
}

// Exporta uma instância única (Singleton)
module.exports = new IXCService();
