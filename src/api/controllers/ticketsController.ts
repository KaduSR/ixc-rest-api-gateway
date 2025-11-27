// src/api/controllers/ticketsController.ts
import { Request, Response } from "express";
import { z } from "zod";
import { ixcService } from "../../services/ixcService";

// Schema de validação
const criarTicketSchema = z.object({
  assunto: z
    .string()
    .min(5, "Assunto deve ter no mínimo 5 caracteres")
    .max(200),
  mensagem: z
    .string()
    .min(10, "Mensagem deve ter no mínimo 10 caracteres")
    .max(5000),
  prioridade: z.enum(["B", "N", "M", "A", "U"]).optional().default("N"),
  tipo: z.enum(["T", "I", "O"]).optional().default("O"), // Telefone, Internet, Outros
  contratoId: z.number().optional(),
  loginId: z.number().optional(),
});

/**
 * Cria um novo ticket de atendimento
 */
export async function criarTicket(req: any, res: Response) {
  try {
    // 1. Validar dados
    const validacao = criarTicketSchema.safeParse(req.body);

    if (!validacao.success) {
      return res.status(400).json({
        error: "Dados inválidos",
        detalhes: validacao.error.errors.map((e) => ({
          campo: e.path.join("."),
          mensagem: e.message,
        })),
      });
    }

    const { assunto, mensagem, prioridade, tipo, contratoId, loginId } =
      validacao.data;
    const clienteId = req.user?.ids?.[0];

    if (!clienteId) {
      return res.status(401).json({
        error: "Cliente não identificado",
      });
    }

    // 2. Buscar dados do cliente
    const cliente = await ixcService.buscarClientesPorId(clienteId);
    if (!cliente) {
      return res.status(404).json({
        error: "Cliente não encontrado",
      });
    }

    // 3. Preparar payload para o IXC
    const ticketPayload = {
      id_cliente: String(clienteId),
      id_contrato: contratoId ? String(contratoId) : undefined,
      id_login: loginId ? String(loginId) : undefined,
      titulo: assunto,
      menssagem: mensagem, // Sim, a API do IXC tem esse typo
      prioridade: prioridade,
      id_ticket_origem: tipo,
      status: "A", // Aberto
      origem_endereco: "C", // Cliente
      endereco: cliente.endereco || "",
      atualizar_cliente: "N",
      su_status: "S",
      interacao_pendente: "S",
    };

    // 4. Criar ticket no IXC
    const resultado = await ixcService.criarTicket(ticketPayload);

    if (!resultado || !resultado.id) {
      throw new Error("Falha ao criar ticket no IXC");
    }

    // 5. Retornar sucesso
    return res.status(201).json({
      success: true,
      message: "Atendimento criado com sucesso!",
      ticket: {
        id: resultado.id,
        protocolo: resultado.protocolo || resultado.id,
        status: "Aberto",
        dataAbertura: new Date().toISOString(),
        mensagem: "Seu atendimento foi registrado e será processado em breve.",
      },
    });
  } catch (error: any) {
    console.error("Erro ao criar ticket:", error);

    // Tratamento de erros específicos do IXC
    if (error.message?.includes("IXC")) {
      return res.status(502).json({
        error: "Erro ao comunicar com o sistema de atendimento",
        detalhes: "Tente novamente em alguns instantes",
      });
    }

    return res.status(500).json({
      error: "Erro ao criar atendimento",
      detalhes: error.message,
    });
  }
}

/**
 * Lista tipos de atendimento disponíveis
 */
export async function listarTiposAtendimento(req: Request, res: Response) {
  return res.json({
    success: true,
    tipos: [
      {
        id: "T",
        nome: "Telefone",
        descricao: "Problemas com telefonia",
        icone: "phone",
      },
      {
        id: "I",
        nome: "Internet",
        descricao: "Problemas com conexão de internet",
        icone: "wifi",
      },
      {
        id: "O",
        nome: "Outros",
        descricao: "Outros assuntos",
        icone: "help-circle",
      },
    ],
    prioridades: [
      { id: "B", nome: "Baixa", cor: "success" },
      { id: "N", nome: "Normal", cor: "info" },
      { id: "M", nome: "Média", cor: "warning" },
      { id: "A", nome: "Alta", cor: "danger" },
      { id: "U", nome: "Urgente", cor: "danger" },
    ],
  });
}

/**
 * Busca histórico de tickets do cliente
 */
export async function listarTickets(req: any, res: Response) {
  try {
    const clienteId = req.user?.ids?.[0];

    if (!clienteId) {
      return res.status(401).json({
        error: "Cliente não identificado",
      });
    }

    // Busca as ordens de serviço (tickets) do cliente
    const tickets = await ixcService.ordensServicoListar(clienteId);

    return res.json({
      success: true,
      total: tickets.length,
      tickets: tickets.map((t: any) => ({
        id: t.id,
        protocolo: t.protocolo,
        assunto: t.id_assunto || "Não especificado",
        status: formatarStatusTicket(t.status),
        dataAbertura: t.data_abertura,
        dataFechamento: t.data_fechamento,
      })),
    });
  } catch (error) {
    console.error("Erro ao listar tickets:", error);
    return res.status(500).json({
      error: "Erro ao buscar histórico de atendimentos",
    });
  }
}

// Função auxiliar
function formatarStatusTicket(status: string): string {
  const statusMap: Record<string, string> = {
    A: "Aberto",
    T: "Em Atendimento",
    F: "Fechado",
    C: "Cancelado",
  };
  return statusMap[status] || status;
}
