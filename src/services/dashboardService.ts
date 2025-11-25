import { ixcService } from "./ixcService";
import { cacheGet, cacheSet } from "./cache/supabaseClient";
import { Gemini } from "./ai/gemini";
import { DashboardData } from "../types/dashboard/DashboardData";

export class DashboardService {
  constructor(private ixc = ixcService) {}

  async gerarDashboard(clientIds: number[]): Promise<DashboardData> {
    const cacheKey = `dashboard:${clientIds.join(",")}`;
    const cached = await cacheGet<DashboardData>(cacheKey);
    if (cached) return cached;

    // coleta paralela por cliente
    const promises = clientIds.map(async (id) => {
      const cliente = await this.ixc.buscarClientesPorId(id);
      const contratos = await this.ixc.buscarContratosPorIdCliente(id);
      const faturas = await this.ixc.financeiroListar(id);
      const logins = await this.ixc.loginsListar(id);
      const ordens = await this.ixc.ordensServicoListar(id);
      const ontInfo = [];
      // se tiver logins, buscar ont info por login
      for (const l of logins) {
        const ont = await this.ixc.ontListar(l.id);
        ontInfo.push(...(ont || []));
      }
      return { cliente, contratos, faturas, logins, ordens, ontInfo };
    });

    const results = await Promise.all(promises);

    // montar DashboardData
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
        history: { daily: [], monthly: [] }
      }
    };

    for (const r of results) {
      dashboard.clientes.push({
        id: r.cliente.id,
        nome: r.cliente.razao || r.cliente.fantasia || `Cliente ${r.cliente.id}`,
        endereco: `${r.cliente.endereco || ""}${r.cliente.numero ? ", " + r.cliente.numero : ""}`
      });

      r.contratos.forEach((c: any) => dashboard.contratos.push({
        id: c.id, plano: c.descricao_aux_plano_venda, status: c.status, pdf_link: `/contrato/${c.id}`
      }));

      r.faturas.forEach((f: any) => dashboard.faturas.push({
        id: f.id, vencimento: f.data_vencimento || f.vencimento, valor: f.valor, status: f.status === "A" ? "aberto" : "pago", pix_code: f.pix_txid, linha_digitavel: f.linha_digitavel
      }));

      r.logins.forEach((l: any) => dashboard.logins.push({
        raw: l.id,
        id: l.id,
        login: l.login,
        status: (l.online === "S" ? "online" : "offline"),
        sinal_ont: l.sinal_ultimo_atendimento,
        uptime: l.tempo_conectado,
        contrato_id: l.id_contrato
      }));

      dashboard.ordensServico.push(...r.ordens);
      dashboard.ontInfo.push(...r.ontInfo);
    }

    // consumo: se tiver logins, agregar consumo por login
    const allLogins = dashboard.logins;
    if (allLogins.length > 0) {
      const consumoPromises = allLogins.map((ln: any) => this.ixc.getConsumoCompleto ? this.ixc.getConsumoCompleto(ln) : Promise.resolve({
        total_download_bytes: 0, total_upload_bytes: 0, history: { daily: [], monthly: [] }
      }));
      const consumoResults = await Promise.all(consumoPromises);
      for (const c of consumoResults) {
        dashboard.consumo.total_download_bytes += c.total_download_bytes || 0;
        dashboard.consumo.total_upload_bytes += c.total_upload_bytes || 0;
        dashboard.consumo.history.daily.push(...(c.history?.daily || []));
        dashboard.consumo.history.monthly.push(...(c.history?.monthly || []));
      }
    }

    // IA insights (opcional)
    const ai = await Gemini.analyzeDashboard(dashboard).catch((e) => ({ insights: [], summary: "AI failed: " + (e as Error).message }));
    // anexar insights em notas (ou entregue via outro campo)
    dashboard.notas = [{ id: "ai-insights", ...ai } as any];

    // cache
    await cacheSet(cacheKey, dashboard, 60); // TTL 60s (ajuste conforme necessário)

    return dashboard;
  }
}