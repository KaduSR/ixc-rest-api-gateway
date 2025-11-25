import "dotenv/config";
import axios from "axios";
import { Cliente } from "../resources/clientes/types";

// Definição das URLs e Token
const getBaseUrl = () => {
  const url = process.env.IXC_API_URL || process.env.IXC_BASE_URL || "";
  return url.endsWith("/") ? url.slice(0, -1) : url;
};

const IXC_TOKEN = process.env.IXC_ADMIN_TOKEN || process.env.IXC_AUTH_BASIC;

if (!getBaseUrl() || !IXC_TOKEN) {
  console.warn(
    "⚠️ Variáveis de ambiente do IXC não configuradas corretamente."
  );
}

// Helper para gerar os headers de autenticação
const getHeaders = () => {
  const token = IXC_TOKEN?.includes("Basic") ? IXC_TOKEN : `Basic ${IXC_TOKEN}`;
  return {
    "Content-Type": "application/json",
    Authorization: token,
    ixcsoft: "listar",
  };
};

// Helper genérico para requisições POST ao IXC
const fetchIxc = async (endpoint: string, payload: any) => {
  const baseUrl = getBaseUrl();
  if (!baseUrl) return [];

  const url = `${baseUrl}/${endpoint}`;

  try {
    const resp = await axios.post(url, payload, { headers: getHeaders() });
    return resp.data.registros || [];
  } catch (error: any) {
    console.error(`Erro na requisição IXC (${endpoint}):`, error.message);
    return [];
  }
};

export const ixcService = {
  /**
   * Busca cliente por email (Login)
   */
  async buscarClientePorEmail(email: string): Promise<Cliente | null> {
    const registros = await fetchIxc("cliente", {
      qtype: "cliente.hotsite_email",
      query: email,
      oper: "=",
      page: "1",
      rp: "1",
      sortname: "cliente.id",
      sortorder: "desc",
    });

    if (registros && registros.length > 0) {
      return registros[0] as Cliente;
    }
    return null;
  },

  async buscarClientesPorId(id: number) {
    const registros = await fetchIxc("cliente", {
      qtype: "cliente.id",
      query: String(id),
      oper: "=",
      page: "1",
      rp: "1",
      sortname: "cliente.id",
      sortorder: "asc",
    });
    return registros[0] || null;
  },

  async buscarContratosPorIdCliente(id_cliente: number) {
    return await fetchIxc("cliente_contrato", {
      qtype: "cliente_contrato.id_cliente",
      query: String(id_cliente),
      oper: "=",
      page: "1",
      rp: "100",
      sortname: "cliente_contrato.id",
      sortorder: "desc",
    });
  },

  async financeiroListar(id_cliente: number) {
    return await fetchIxc("fn_areceber", {
      qtype: "fn_areceber.id_cliente",
      query: String(id_cliente),
      oper: "=",
      page: "1",
      rp: "50",
      sortname: "fn_areceber.data_vencimento",
      sortorder: "desc",
    });
  },

  async loginsListar(id_cliente: number) {
    return await fetchIxc("radusuarios", {
      qtype: "radusuarios.id_cliente",
      query: String(id_cliente),
      oper: "=",
      page: "1",
      rp: "20",
      sortname: "radusuarios.id",
      sortorder: "desc",
    });
  },

  async ordensServicoListar(id_cliente: number) {
    return await fetchIxc("su_oss_chamado", {
      qtype: "su_oss_chamado.id_cliente",
      query: String(id_cliente),
      oper: "=",
      page: "1",
      rp: "20",
      sortname: "su_oss_chamado.id",
      sortorder: "desc",
    });
  },

  async ontListar(id_login: number) {
    return await fetchIxc("radpop_radio_cliente_fibra", {
      qtype: "radpop_radio_cliente_fibra.id_login",
      query: String(id_login),
      oper: "=",
      page: "1",
      rp: "1",
      sortname: "radpop_radio_cliente_fibra.id",
      sortorder: "desc",
    });
  },

  /**
   * Busca o consumo completo (Totais + Histórico)
   * Agora implementado para buscar dados reais.
   */
  async getConsumoCompleto(login: any) {
    const loginId = login.id;
    if (!loginId) {
      return {
        total_download_bytes: 0,
        total_upload_bytes: 0,
        history: { daily: [], monthly: [] },
      };
    }

    // 1. Buscar totais acumulados do próprio objeto login
    const totalDownload = parseFloat(login.download_atual || "0");
    const totalUpload = parseFloat(login.upload_atual || "0");

    // 2. Buscar históricos em paralelo
    const [dailyRes, monthlyRes] = await Promise.all([
      fetchIxc("radusuarios_consumo_d", {
        qtype: "radusuarios.id",
        query: String(loginId),
        oper: "=",
        page: "1",
        rp: "30", // Últimos 30 dias
        sortname: "data",
        sortorder: "desc",
      }),
      fetchIxc("radusuarios_consumo_m", {
        qtype: "radusuarios.id",
        query: String(loginId),
        oper: "=",
        page: "1",
        rp: "12", // Últimos 12 meses
        sortname: "mes_ano",
        sortorder: "desc",
      }),
    ]);

    // 3. Mapear respostas
    const daily = dailyRes.map((d: any) => ({
      data: d.data,
      download_bytes: parseFloat(d.download_bytes || "0"),
      upload_bytes: parseFloat(d.upload_bytes || "0"),
    }));

    const monthly = monthlyRes.map((m: any) => ({
      mes_ano: m.mes_ano,
      download_bytes: parseFloat(m.download_bytes || "0"),
      upload_bytes: parseFloat(m.upload_bytes || "0"),
    }));

    return {
      total_download_bytes: totalDownload,
      total_upload_bytes: totalUpload,
      history: { daily, monthly },
    };
  },
};
