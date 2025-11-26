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

const getHeaders = () => {
  const token = IXC_TOKEN?.includes("Basic") ? IXC_TOKEN : `Basic ${IXC_TOKEN}`;
  return {
    "Content-Type": "application/json",
    Authorization: token,
    ixcsoft: "listar",
  };
};

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
  async buscarClientesPorCpf(cpfCnpj: string): Promise<Cliente[]> {
    const cpfLimpo = cpfCnpj.replace(/[^\d]/g, "");

    return (await fetchIxc("cliente", {
      qtype: "cliente.cnpj_cpf",
      query: cpfLimpo,
      oper: "=",
      page: "1",
      rp: "100",
      sortname: "cliente.id",
      sortorder: "desc",
    })) as Cliente[];
  },

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
   * IMPLEMENTAÇÃO REAL DO HISTÓRICO DE CONSUMO
   * Baseada nos JSONs fornecidos: radusuarios_consumo_d e radusuarios_consumo_m
   */
  async getConsumoCompleto(login: any) {
    const loginId = login.id;
    if (!loginId) {
      return {
        total_download_bytes: 0,
        total_upload_bytes: 0,
        history: { daily: [], weekly: [], monthly: [] },
      };
    }

    // 1. Totais acumulados do cadastro do login
    const totalDownload = parseFloat(login.download_atual || "0");
    const totalUpload = parseFloat(login.upload_atual || "0");

    // 2. Buscar históricos em paralelo
    // Usamos 'id_login' como qtype conforme seu exemplo
    const [dailyRes, monthlyRes] = await Promise.all([
      fetchIxc("radusuarios_consumo_d", {
        qtype: "id_login",
        query: String(loginId),
        oper: "=",
        page: "1",
        rp: "30", // Busca os últimos 30 dias (para diário)
        sortname: "data",
        sortorder: "desc", // Vem do mais recente para o mais antigo
      }),
      fetchIxc("radusuarios_consumo_m", {
        qtype: "id_login",
        query: String(loginId),
        oper: "=",
        page: "1",
        rp: "12", // Últimos 12 meses
        sortname: "data", // Geralmente a data de referência do mês
        sortorder: "desc",
      }),
    ]);

    // 3. Mapear respostas (convertendo campos do IXC para nosso padrão)

    // Processa Diário (30 dias)
    // O reverse() coloca na ordem cronológica: [Dia 1, Dia 2 ... Dia 30]
    // IXC retorna: consumo (download), consumo_upload (upload), data
    const daily = dailyRes
      .map((d: any) => ({
        data: d.data ? d.data.split(" ")[0] : d.data, // "2025-11-24 00:00:00" -> "2025-11-24"
        download_bytes: parseFloat(d.consumo || "0"),
        upload_bytes: parseFloat(d.consumo_upload || "0"),
      }))
      .reverse();

    // Processa Semanal (Extrai os últimos 7 dias do array daily já ordenado cronologicamente)
    // Se tiver menos de 7 dias, pega tudo o que tiver.
    const weekly = daily.slice(-7);

    // Processa Mensal
    const monthly = monthlyRes
      .map((m: any) => ({
        // Extrai o "YYYY-MM" da data para usar como label
        mes_ano: m.data ? m.data.substring(0, 7) : "",
        download_bytes: parseFloat(m.consumo || "0"),
        upload_bytes: parseFloat(m.consumo_upload || "0"),
      }))
      .reverse(); // Ordena do mês mais antigo para o atual

    return {
      total_download_bytes: totalDownload,
      total_upload_bytes: totalUpload,
      history: { daily, weekly, monthly },
    };
  },
};
