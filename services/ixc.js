// src/services/ixc.js
const axios = require("axios");
const { Buffer } = require("node:buffer");
const md5 = require("md5"); // Certifique-se de instalar: npm install md5

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
}

// Exporta uma instância única (Singleton)
module.exports = new IXCService();
