import "dotenv/config";
import axios from "axios";

const IXC_BASE = process.env.IXC_BASE_URL;
const IXC_AUTH = process.env.IXC_AUTH_BASIC;

if (!IXC_BASE) {
  console.warn("IXC_BASE_URL não configurado; ixcService ficará em modo mock.");
}

export const ixcService = {
  // retorna cliente por id: mock ou chamada real se IXC_BASE definido
  async buscarClientesPorId(id: number) {
    if (!IXC_BASE)
      return {
        id,
        razao: `Cliente ${id}`,
        endereco: "Rua Falsa",
        numero: "123",
        cnpj_cpf: "000",
      };
    const url = `${IXC_BASE}/cliente`;
    const body = {
      qtype: "cliente.id",
      query: String(id),
      oper: "=",
      page: "1",
      sortname: "cliente.id",
      sortorder: "asc",
    };
    const resp = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: IXC_AUTH,
        ixcsoft: "listar",
      },
    });
    const registros = resp.data.registros || [];
    return (
      registros[0] || { id, razao: `Cliente ${id}`, endereco: "", numero: "" }
    );
  },

  async buscarContratosPorIdCliente(id_cliente: number) {
    if (!IXC_BASE)
      return [
        {
          id: 1,
          descricao_aux_plano_venda: "Plano Mock",
          status: "A",
          id_cliente,
        },
      ];
    const url = `${IXC_BASE}/cliente_contrato`;
    const body = {
      qtype: "cliente_contrato.id_cliente",
      query: String(id_cliente),
      oper: "=",
      page: "1",
      sortname: "cliente_contrato.id",
      sortorder: "asc",
    };
    const resp = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: IXC_AUTH,
        ixcsoft: "listar",
      },
    });
    return resp.data.registros || [];
  },

  async financeiroListar(id_cliente: number) {
    if (!IXC_BASE) return [];
    const url = `${IXC_BASE}/fn_areceber`;
    const body = {
      qtype: "fn_areceber.id_cliente",
      query: String(id_cliente),
      oper: "=",
      page: "1",
      sortname: "fn_areceber.id",
      sortorder: "desc",
    };
    const resp = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: IXC_AUTH,
        ixcsoft: "listar",
      },
    });
    return resp.data.registros || [];
  },

  async loginsListar(id_cliente: number) {
    if (!IXC_BASE) return [];
    const url = `${IXC_BASE}/radusuarios`;
    const body = {
      qtype: "radusuarios.id_cliente",
      query: String(id_cliente),
      oper: "=",
      page: "1",
      sortname: "radusuarios.id",
      sortorder: "desc",
    };
    const resp = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: IXC_AUTH,
        ixcsoft: "listar",
      },
    });
    return resp.data.registros || [];
  },

  async ordensServicoListar(id_cliente: number) {
    if (!IXC_BASE) return [];
    const url = `${IXC_BASE}/su_oss_chamado`;
    const body = {
      qtype: "id_cliente",
      query: String(id_cliente),
      oper: "=",
      page: "1",
      rp: "1000",
      sortname: "su_oss_chamado.id",
      sortorder: "desc",
    };
    const resp = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: IXC_AUTH,
        ixcsoft: "listar",
      },
    });
    return resp.data.registros || [];
  },

  async ontListar(id_login: number) {
    if (!IXC_BASE) return [];
    const url = `${IXC_BASE}/radpop_radio_cliente_fibra`;
    const body = {
      qtype: "id_login",
      query: String(id_login),
      oper: "=",
      page: "1",
      rp: "1000",
      sortname: "radpop_radio_cliente_fibra.id",
      sortorder: "desc",
    };
    const resp = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: IXC_AUTH,
        ixcsoft: "listar",
      },
    });
    return resp.data.registros || [];
  },

  async buscarClientePorEmail(email: string) {
    if (!IXC_BASE) return null;
    const url = `${IXC_BASE}/cliente`;
    const body = {
      qtype: "cliente.hotsite_email",
      query: email,
      oper: "=",
      page: "1",
      rp: "1",
      sortname: "cliente.id",
      sortorder: "desc"
    };
    const resp = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: IXC_AUTH,
        ixcsoft: "listar",
      },
    });
    const registros = resp.data.registros || [];
    return registros[0] || null;
  },

  async getConsumoCompleto(login: any) {
    // O endpoint real do consumo do IXC pode diferir. Aqui deixamos mock ou fallback
    if (!IXC_BASE) {
      return {
        total_download_bytes: 0,
        total_upload_bytes: 0,
        history: { daily: [], monthly: [] },
      };
    }
    // Se o IXC tiver endpoint pra consumo, faça chamada aqui — placeholder:
    return {
      total_download_bytes: 0,
      total_upload_bytes: 0,
      history: { daily: [], monthly: [] },
    };
  },
};
