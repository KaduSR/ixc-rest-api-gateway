import { ixcService } from "./ixcService";
import { cacheGet, cacheSet } from "./cache/supabaseClient";
import { Gemini } from "./ai/gemini";
import { DashboardData } from "../types/dashboard/DashboardData";

// Função auxiliar para formatar bytes
function formatBytes(bytes: number, decimals = 2): string {
  if (!+bytes) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export class DashboardService {
  constructor(private ixc = ixcService) {}

  async gerarDashboard(clientIds: number[]): Promise<DashboardData> {
    // Tenta buscar do cache primeiro
    const cacheKey = `dashboard:${clientIds.join(",")}`;
    const cached = await cacheGet<DashboardData>(cacheKey);
    if (cached) return cached;

    // Coleta de dados paralela por cliente
    const promises = clientIds.map(async (id) => {
      try {
        const cliente = await this.ixc.buscarClientesPorId(id);

        if (!cliente) return null;

        const contratos = await this.ixc.buscarContratosPorIdCliente(id);
        const faturas = await this.ixc.financeiroListar(id);
        const logins = await this.ixc.loginsListar(id);
        const ordens = await this.ixc.ordensServicoListar(id);

        const ontInfo = [];
        for (const l of logins) {
          const ont = await this.ixc.ontListar(l.id);
          ontInfo.push(...(ont || []));
        }

        return { cliente, contratos, faturas, logins, ordens, ontInfo };
      } catch (error) {
        console.error(`Erro ao processar cliente ${id}:`, error);
        return null;
      }
    });

    const results = await Promise.all(promises);

    // Estrutura inicial do Dashboard
    const dashboard: DashboardData = {
      clientes: [],
      contratos: [],
      faturas: [],
      logins: [],
      notas: [],
      ordensServico: [],
      ontInfo: [],
      consumo: {
        total_download_bytes: 0,
        total_upload_bytes: 0,
        // Inicializa os campos formatados
        total_download: "0 Bytes",
        total_upload: "0 Bytes",
        history: { daily: [], monthly: [] },
      },
    };

    // Processamento dos resultados
    for (const r of results) {
      if (!r || !r.cliente) continue;

      dashboard.clientes.push({
        id: r.cliente.id,
        nome:
          r.cliente.razao || r.cliente.fantasia || `Cliente ${r.cliente.id}`,
        endereco: `${r.cliente.endereco || ""}${
          r.cliente.numero ? ", " + r.cliente.numero : ""
        }`,
      });

      r.contratos.forEach((c: any) =>
        dashboard.contratos.push({
          id: c.id,
          plano: c.descricao_aux_plano_venda,
          status: c.status,
          pdf_link: `/contrato/${c.id}`,
        })
      );

      r.faturas.forEach((f: any) =>
        dashboard.faturas.push({
          id: f.id,
          vencimento: f.data_vencimento || f.vencimento,
          valor: f.valor,
          status: f.status === "A" ? "aberto" : "pago",
          pix_code: f.pix_txid,
          linha_digitavel: f.linha_digitavel,
        })
      );

      r.logins.forEach((l: any) =>
        dashboard.logins.push({
          raw: l.id,
          id: l.id,
          login: l.login,
          status: l.online === "S" ? "online" : "offline",
          sinal_ont: l.sinal_ultimo_atendimento,
          uptime: l.tempo_conectado,
          contrato_id: l.id_contrato,
        })
      );

      dashboard.ordensServico.push(...r.ordens);
      dashboard.ontInfo.push(...r.ontInfo);
    }

    // Cálculo de consumo agregado
    const allLogins = dashboard.logins;
    if (allLogins.length > 0) {
      const consumoPromises = allLogins.map((ln: any) =>
        this.ixc.getConsumoCompleto(ln)
      );

      const consumoResults = await Promise.all(consumoPromises);

      for (const c of consumoResults) {
        dashboard.consumo.total_download_bytes += c.total_download_bytes || 0;
        dashboard.consumo.total_upload_bytes += c.total_upload_bytes || 0;
        dashboard.consumo.history.daily.push(...(c.history?.daily || []));
        dashboard.consumo.history.monthly.push(...(c.history?.monthly || []));
      }

      // APLICAÇÃO DA FORMATAÇÃO AQUI
      dashboard.consumo.total_download = formatBytes(
        dashboard.consumo.total_download_bytes
      );
      dashboard.consumo.total_upload = formatBytes(
        dashboard.consumo.total_upload_bytes
      );
    }

    // Geração de Insights com IA
    try {
      const ai = await Gemini.analyzeDashboard(dashboard);
      dashboard.notas = [{ id: "ai-insights", ...ai } as any];
    } catch (e) {
      dashboard.notas = [];
    }

    // Salva no cache
    await cacheSet(cacheKey, dashboard, 60);

    return dashboard;
  }
}
