// VERSÃO LIMPA PARA COPIAR
import "dotenv/config";
import axios from "axios";
import { Cliente } from "../resources/clientes/types";

const IXC_BASE = process.env.IXC_API_URL || process.env.IXC_BASE_URL;
const IXC_TOKEN = process.env.IXC_ADMIN_TOKEN || process.env.IXC_AUTH_BASIC;

export const ixcService = {
  async buscarClientePorEmail(email: string): Promise<Cliente | null> {
    if (!IXC_BASE || !IXC_TOKEN) return null;

    const baseUrl = IXC_BASE.endsWith("/") ? IXC_BASE.slice(0, -1) : IXC_BASE;
    const url = `${baseUrl}/cliente`;
    const authHeader = IXC_TOKEN.includes("Basic")
      ? IXC_TOKEN
      : `Basic ${IXC_TOKEN}`;

    const body = {
      qtype: "cliente.hotsite_email",
      query: email,
      oper: "=",
      page: "1",
      rp: "1",
      sortname: "cliente.id",
      sortorder: "desc",
    };

    try {
      const resp = await axios.post(url, body, {
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
          ixcsoft: "listar",
        },
      });

      const registros = resp.data.registros;

      if (registros && Array.isArray(registros) && registros.length > 0) {
        return registros[0] as Cliente;
      }

      return null;
    } catch (error: any) {
      console.error("Erro ao buscar cliente no IXC:", error.message);
      return null;
    }
  },

  // Métodos auxiliares mantidos
  async buscarClientesPorId(id: number) {
    return { id } as any;
  },
  async buscarContratosPorIdCliente(id: number) {
    return [];
  },
  async financeiroListar(id: number) {
    return [];
  },
  async loginsListar(id: number) {
    return [];
  },
  async ordensServicoListar(id: number) {
    return [];
  },
  async ontListar(id: number) {
    return [];
  },
  async getConsumoCompleto(login: any) {
    return {
      total_download_bytes: 0,
      total_upload_bytes: 0,
      history: { daily: [], monthly: [] },
    };
  },
};
