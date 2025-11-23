// src/controllers/suporteController.js
const ixcService = require("../services/ixc");

/**
 * @desc Lista todos os tickets do cliente logado.
 * @route GET /api/v1/suporte/tickets
 * @queryParam status - 'abertos' ou 'todos'. Padrão: 'abertos'.
 */
exports.getMeusTickets = async (req, res) => {
  const clienteId = req.user.id; // ID do JWT
  // Mapeia o query param para o parâmetro do IXC ('S' ou 'T')
  const statusFilter = req.query.status === "todos" ? "T" : "S";

  try {
    const tickets = await ixcService.getTickets(clienteId, statusFilter);

    if (!tickets || tickets.length === 0) {
      return res.json({
        message: "Nenhum ticket encontrado.",
        tickets: [],
      });
    }

    // Mapeamento/limpeza básica dos dados do IXC para o frontend
    const ticketsFormatados = tickets.map((t) => ({
      id: t.id,
      protocolo: t.protocolo,
      titulo: t.titulo,
      assunto: t.assunto,
      setor: t.setor,
      dataAbertura: t.data_criacao,
      // Status 'F' = Finalizado (Fechado) no campo 'status' do IXC
      status: t.status === "F" ? "Finalizado" : "Em Atendimento",
    }));

    res.json({
      total: ticketsFormatados.length,
      tickets: ticketsFormatados,
    });
  } catch (error) {
    console.error(
      `[SuporteController] Erro ao buscar tickets para o cliente ${clienteId}:`,
      error.message
    );
    res.status(500).json({ error: "Erro interno ao buscar tickets." });
  }
};

/**
 * @desc Cria um novo ticket de suporte.
 * @route POST /api/v1/suporte/ticket/abrir
 * @body {string} titulo, {string} mensagem, {string} idAssunto (opcional)
 */
exports.abrirTicket = async (req, res) => {
  const clienteId = req.user.id; // ID do JWT
  const clienteEmail = req.user.email;
  const { titulo, mensagem, idAssunto, idContrato } = req.body;

  if (!titulo || !mensagem) {
    return res
      .status(400)
      .json({ message: "Título e mensagem do chamado são obrigatórios." });
  }

  // Dados que serão passados para o Service
  const ticketData = {
    titulo,
    mensagem,
    idAssunto,
    idContrato,
    email: clienteEmail, // Passa o email para preencher no payload do IXC
  };

  try {
    const resultado = await ixcService.createTicket(ticketData, clienteId);

    if (resultado.success) {
      res.status(201).json({
        message: "Ticket de suporte aberto com sucesso!",
        protocolo: resultado.protocolo,
        idTicket: resultado.idTicket,
      });
    } else {
      // Caso o service retorne sucesso: false (mesmo que não deva)
      res.status(500).json({ message: "Falha ao criar ticket na API IXC." });
    }
  } catch (error) {
    console.error(
      `[SuporteController] Erro ao abrir ticket para o cliente ${clienteId}:`,
      error.message
    );
    // Erros do IXC (ex: idAssunto inválido, campos obrigatórios)
    res.status(500).json({
      error: "Erro interno ao processar o chamado.",
      details: error.message.includes("IXC:") ? error.message : undefined,
    });
  }
};
