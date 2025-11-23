// src/services/ixc.js
const axios = require("axios");
const { Buffer } = require("node:buffer");

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
        // Desativa a verificação de SSL se o seu certificado for Self-Signed (Render/Host)
        Accept: "application/json",
      },
      timeout: 15000,
      // Habilita proxy para self-signed, se necessário (depende do ambiente)
      // httpsAgent: new require("https").Agent({ rejectUnauthorized: false }),
    });
  }

  // =========================================================
  // MÉTODOS BASE (CRUD Genérico)
  // =========================================================

  /**
   * Lista ou filtra registros (GET). O corpo são os Query Params.
   */
  async list(endpoint, data = {}) {
    try {
      // O header ixcsoft: 'listar' indica busca
      const response = await this.api.post(endpoint, data, {
        headers: { ixcsoft: "listar" },
      });
      return response.data;
    } catch (error) {
      console.error(`[IXC] Erro ao listar ${endpoint}:`, error.message);
      throw error;
    }
  }

  /**
   * Insere ou edita registros (POST/PUT).
   */
  async post(endpoint, data, ixcsoftAction = "inserir") {
    try {
      // ixcsoftAction pode ser 'inserir', 'editar', etc.
      const response = await this.api.post(endpoint, data, {
        headers: { ixcsoft: ixcsoftAction },
      });
      return response.data;
    } catch (error) {
      console.error(
        `[IXC] Erro ao executar ${ixcsoftAction} em ${endpoint}:`,
        error.message
      );
      // O IXC retorna erros como sucesso 200, então verificamos a resposta
      if (error.response && error.response.data && error.response.data.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  }

  /**
   * Deleta um registro (DELETE).
   */
  async delete(endpoint, id) {
    try {
      // O corpo deve conter apenas o ID do registro a ser deletado
      const response = await this.api.delete(`${endpoint}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`[IXC] Erro ao deletar ${endpoint}/${id}:`, error.message);
      throw error;
    }
  }

  // =========================================================
  // AUTENTICAÇÃO (Login por Email Hotsite e Senha Pura)
  // =========================================================

  /**
   * Tenta autenticar um cliente usando email e senha do hotsite.
   * @param {string} email - O email do cliente (hotsite_email).
   * @param {string} senha - A senha pura do hotsite (hotsite_senha).
   * @returns {object|null} Retorna o objeto cliente essencial ou null.
   */
  async authenticate(email, senha) {
    try {
      // 1. Busca o cliente por email do hotsite
      const busca = await this.list("cliente", {
        qtype: "cliente.hotsite_email",
        query: email,
        oper: "=",
        rp: "1",
      });

      const cliente = busca.registros?.[0];

      if (!cliente) {
        return null; // Cliente não encontrado
      }

      // 2. Compara a senha pura:
      if (cliente.hotsite_senha === senha) {
        // Retorna o objeto cliente com os dados essenciais para o token JWT
        return {
          id: cliente.id,
          email: cliente.hotsite_email,
          nome_razaosocial: cliente.razao || cliente.fantasia,
          // Adicione outros campos necessários aqui
        };
      }

      return null; // Senha incorreta
    } catch (error) {
      console.error("[IXCService] Erro na autenticação:", error.message);
      return null;
    }
  }
}

// Exporta uma única instância para ser usada em toda a aplicação
module.exports = new IXCService();
