// src/controllers/tecnicoController.js
const ixcService = require("./services/ixc");

/**
 * @desc Executa o teste de Ping ou Traceroute no login do cliente.
 * @route POST /api/v1/tecnico/teste
 * @body {string} tipo (opcional, 'ping' ou 'traceroute', padrão 'ping')
 */
exports.executarTesteConexao = async (req, res) => {
  const clienteId = req.user.id; // ID do JWT
  const tipoTeste = req.body.tipo === "traceroute" ? "traceroute" : "ping";

  try {
    // 1. Busca o Login (radusuarios)
    const loginData = await ixcService.getLoginDoCliente(clienteId);

    if (!loginData || !loginData.id) {
      return res.status(404).json({
        message: "Nenhum login ativo encontrado para este cliente.",
        details:
          "O cliente não possui um login PPPoE/Hotspot ativo (radusuarios) associado para realizar o teste. O teste só funciona para clientes com Login Ativo.",
      });
    }

    const idLogin = loginData.id;
    const login = loginData.login;
    const ipOnline = loginData.ip_online || "N/A";
    const nomeConcentrador = loginData.servidor_radius;

    // 2. Executa o Teste no IXC
    const resultadoTeste = await ixcService.executarTesteTecnico(
      idLogin,
      tipoTeste
    );

    // O resultado detalhado virá no campo msg_ping ou msg_traceroute do objeto resultadoRaw
    const resultadoDetalhado =
      resultadoTeste.resultadoRaw[`msg_${tipoTeste}`] ||
      "Nenhuma resposta detalhada do concentrador.";

    res.json({
      success: true,
      message: `Teste de ${tipoTeste.toUpperCase()} executado no login ${login}.`,
      ipConcentrador: nomeConcentrador,
      ipAtual: ipOnline,
      loginId: idLogin,
      resultado: resultadoDetalhado,
    });
  } catch (error) {
    console.error(
      `[TecnicoController] Erro ao executar teste ${tipoTeste} para o cliente ${clienteId}:`,
      error.message
    );
    res.status(500).json({
      error: "Erro interno ao executar o teste técnico.",
      details: error.message.includes("IXC:") ? error.message : undefined,
    });
  }
};

/**
 * @desc Tenta desbloquear o cliente (Liberação em Confiança).
 * @route POST /api/v1/tecnico/desbloqueio
 */
exports.desbloqueioEmConfianca = async (req, res) => {
  const clienteId = req.user.id; // ID do JWT

  // O desbloqueio por confiança é geralmente feito na entidade 'cliente' com um método PUT/editar
  // Verificamos a documentação do IXC para o campo correto. Geralmente é o 'status_ativacao'
  // ou um endpoint/ação específica para HotSite.

  // No IXC, a liberação em confiança é tipicamente a alteração do status do contrato ou do login.
  // Vamos supor que precisamos alterar a coluna 'liberacao_bloqueio_manual' em cliente_contrato
  // ou usar um endpoint específico de desbloqueio.

  // Como a Liberação em Confiança varia muito, e o IXC normalmente tem um endpoint/comando
  // específico que roda uma rotina, vamos buscar o **Contrato Ativo** e tentar **EDITAR**
  // o campo de desbloqueio, se houver, ou a opção mais genérica que o IXC oferece:

  try {
    // 1. Busca o Contrato Ativo
    const contrato = await ixcService.getContratos(clienteId);

    if (!contrato || !contrato.id) {
      return res.status(404).json({
        message: "Nenhum contrato ativo encontrado para este cliente.",
        details:
          "O cliente deve ter um contrato ativo para solicitar desbloqueio.",
      });
    }

    // 2. Tenta fazer a Liberação em Confiança na entidade cliente_contrato
    // No IXC, muitos provedores usam o campo 'liberacao_bloqueio_manual' ou 'status'
    // para controle manual. A forma mais segura é buscar uma **ação de Liberação em Confiança**
    // via webhook ou via um campo específico.

    // Como não temos um endpoint 'desbloqueio_confianca' nativo, usaremos uma edição
    // no campo 'liberacao_bloqueio_manual' se o contrato estiver bloqueado.

    // **IMPORTANTE**: Esta é uma suposição baseada em arquitetura. O campo exato
    // e a lógica de desbloqueio devem ser confirmados com a documentação do seu IXC.

    if (contrato.status_internet !== "D") {
      return res.status(400).json({
        message: "Seu serviço não está bloqueado (Desabilitado).",
        statusAtual: contrato.status_internet,
      });
    }

    const payloadDesbloqueio = {
      id: contrato.id,
      // 💡 Este é um campo de SUGESTÃO para simular a Liberação em Confiança
      // Você DEVE verificar o campo exato que o IXC utiliza para LIBERAÇÃO em CONFIANÇA
      liberacao_bloqueio_manual: "S",
      // Muitos também editam o campo status_internet para 'A' (Ativo), mas isso
      // pode ser desfeito pelo IXC automaticamente logo em seguida. A edição
      // do campo de bloqueio manual é a ação mais comum.
    };

    await ixcService.ixcRequest("cliente_contrato", "put", payloadDesbloqueio);

    res.json({
      success: true,
      message:
        "Sua Liberação em Confiança foi solicitada e deve ser processada em até 5 minutos. Verifique sua conexão.",
      idContrato: contrato.id,
    });
  } catch (error) {
    console.error(
      `[TecnicoController] Erro ao tentar desbloqueio para o cliente ${clienteId}:`,
      error.message
    );
    res.status(500).json({
      error: "Erro interno ao tentar o desbloqueio.",
      details: error.message.includes("IXC:") ? error.message : undefined,
    });
  }
};
