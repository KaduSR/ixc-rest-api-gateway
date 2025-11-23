// src/controllers/clienteController.js
const ixcService = require("../services/ixc");
const md5 = require("md5");

// =========================================================
// MÓDULO DE SEGURANÇA (SENHA E LOGIN)
// =========================================================

/**
 * @desc Altera a senha de acesso (hotsite) do cliente.
 * @route POST /api/v1/cliente/alterar-senha
 */
exports.alterarSenha = async (req, res) => {
  const clienteId = req.user.id;
  const { senhaAtual, novaSenha } = req.body;

  if (!senhaAtual || !novaSenha) {
    return res
      .status(400)
      .json({ message: "Senha atual e nova senha são obrigatórias." });
  }

  if (novaSenha.length < 6) {
    return res
      .status(400)
      .json({ message: "A nova senha deve ter pelo menos 6 caracteres." });
  }

  try {
    // 1. Busca os dados do cliente (para verificar a senha atual)
    const cliente = await ixcService.getDadosCliente(clienteId);

    if (!cliente) {
      return res.status(404).json({ message: "Cliente não encontrado." });
    }

    // 2. Lógica CRÍTICA: Verifica a senha atual
    let senhaCorreta = false;
    if (cliente.hotsite_senha_md5 === "S") {
      senhaCorreta = cliente.hotsite_senha === md5(senhaAtual);
    } else {
      senhaCorreta = cliente.hotsite_senha === senhaAtual;
    }

    if (!senhaCorreta) {
      return res.status(401).json({ message: "Senha atual incorreta." });
    }

    // 3. Altera a senha no IXC
    await ixcService.alterarSenhaHotsite(clienteId, novaSenha);

    res.json({
      success: true,
      message:
        "Senha de acesso alterada com sucesso! Você precisará logar novamente com a nova senha.",
    });
  } catch (error) {
    console.error(
      `[ClienteController] Erro ao alterar senha para o cliente ${clienteId}:`,
      error.message
    );
    res.status(500).json({
      error: "Erro interno ao alterar a senha.",
      details: error.message.includes("IXC:") ? error.message : undefined,
    });
  }
};

/**
 * @desc Retorna os dados de login PPPoE/Hotspot do cliente.
 * @route GET /api/v1/cliente/dados-login
 */
exports.getDadosLogin = async (req, res) => {
  const clienteId = req.user.id;

  try {
    const loginData = await ixcService.getLoginDoCliente(clienteId);

    if (!loginData || !loginData.id) {
      return res.status(404).json({
        message: "Nenhum login de internet ativo encontrado para este cliente.",
      });
    }

    const dadosLogin = {
      idLogin: loginData.id,
      login: loginData.login,
      // 🚨 NUNCA expose a senha
      status: loginData.ativo === "S" ? "Ativo" : "Inativo",
      online: loginData.online === "SS" ? "Online" : "Offline",
      ipOnline: loginData.ip_online || "N/A",
      mac: loginData.mac || "N/A",
      concentrador: loginData.servidor_radius || "N/A",
      dataCadastro: loginData.data_cadastro || "N/A",
    };

    res.json({
      success: true,
      message: `Dados do login ${dadosLogin.login} recuperados.`,
      dadosLogin: dadosLogin,
    });
  } catch (error) {
    console.error(
      `[ClienteController] Erro ao buscar dados de login para o cliente ${clienteId}:`,
      error.message
    );
    res.status(500).json({
      error: "Erro interno ao buscar os dados do login.",
      details: error.message.includes("IXC:") ? error.message : undefined,
    });
  }
};

// =========================================================
// MÓDULO 1. DETALHES DO CONTRATO/PLANO 💡 NOVO
// =========================================================

/**
 * @desc Retorna os detalhes do contrato principal e do plano.
 * @route GET /api/v1/cliente/detalhes-contrato
 */
exports.getDetalhesContrato = async (req, res) => {
  const clienteId = req.user.id;

  try {
    const detalhes = await ixcService.getDetalhesContratoCompleto(clienteId);

    if (!detalhes) {
      return res.status(404).json({
        message: "Nenhum contrato ativo encontrado para este cliente.",
      });
    }

    // Mapeia e organiza os dados para a resposta
    const contratoFormatado = {
      idContrato: detalhes.id,
      contratoNumero: detalhes.contrato,
      status: detalhes.status === "A" ? "Ativo" : detalhes.status,
      dataAtivacao: detalhes.data_ativacao,
      dataFim: detalhes.data_final_contrato,
      valorMensal: detalhes.valor_plano,
      plano: detalhes.plano, // Detalhes do plano
      login: detalhes.login, // Detalhes do login (PPPoE/Hotspot)

      bloqueado: detalhes.status_internet === "B" ? true : false,
      motivoBloqueio:
        detalhes.status_internet_obs ||
        (detalhes.status_internet === "B"
          ? "Bloqueio padrão por inadimplência."
          : "Nenhum"),
      // linkPDF: `.../contratos/visualizar/id_contrato/${detalhes.id}`, // Sugestão para gerar o link se tiver o endpoint
    };

    res.json({
      success: true,
      message: "Detalhes do contrato recuperados.",
      contrato: contratoFormatado,
    });
  } catch (error) {
    console.error(
      `[ClienteController] Erro ao buscar detalhes do contrato para o cliente ${clienteId}:`,
      error.message
    );
    res.status(500).json({
      error: "Erro interno ao buscar detalhes do contrato.",
      details: error.message.includes("IXC:") ? error.message : undefined,
    });
  }
};

// =========================================================
// MÓDULO 2. DADOS CADASTRAIS (ENDEREÇO/CONTATO) 💡 NOVO
// =========================================================

/**
 * @desc Retorna os dados cadastrais e de endereço do cliente.
 * @route GET /api/v1/cliente/dados-cadastrais
 */
exports.getDadosCadastrais = async (req, res) => {
  const clienteId = req.user.id;

  try {
    const dadosCadastrais = await ixcService.getDadosCadastrais(clienteId);

    if (!dadosCadastrais) {
      return res
        .status(404)
        .json({ message: "Dados cadastrais não encontrados." });
    }

    res.json({
      success: true,
      dados: dadosCadastrais,
    });
  } catch (error) {
    console.error(
      `[ClienteController] Erro ao buscar dados cadastrais para o cliente ${clienteId}:`,
      error.message
    );
    res.status(500).json({
      error: "Erro interno ao buscar dados cadastrais.",
      details: error.message.includes("IXC:") ? error.message : undefined,
    });
  }
};

/**
 * @desc Atualiza os dados cadastrais (endereço e contato) do cliente.
 * @route PUT /api/v1/cliente/dados-cadastrais
 * @body {object} dados - Campos a serem atualizados (estrutura deve seguir o GET).
 */
exports.atualizarDadosCadastrais = async (req, res) => {
  const clienteId = req.user.id;
  const dados = req.body;

  if (Object.keys(dados).length === 0) {
    return res
      .status(400)
      .json({ message: "Nenhum dado para atualização fornecido." });
  }

  try {
    // 💡 Validação de E-mail (Exemplo Básico)
    if (
      dados.contatos?.emailHotsite &&
      !/\S+@\S+\.\S+/.test(dados.contatos.emailHotsite)
    ) {
      return res
        .status(400)
        .json({ message: "O e-mail do hotsite está em um formato inválido." });
    }

    // 💡 Validação de CEP (Exemplo Básico)
    if (
      dados.enderecoInstalacao?.cep &&
      dados.enderecoInstalacao.cep.length < 8
    ) {
      return res
        .status(400)
        .json({ message: "O CEP deve ter pelo menos 8 dígitos." });
    }

    const resultado = await ixcService.atualizarDadosCadastrais(
      clienteId,
      dados
    );

    res.json({
      success: true,
      message:
        "Seus dados de contato e/ou endereço foram atualizados com sucesso!",
    });
  } catch (error) {
    console.error(
      `[ClienteController] Erro ao atualizar dados cadastrais para o cliente ${clienteId}:`,
      error.message
    );
    // Erros de validação do IXC (ex: CEP inválido, CNPJ existente, etc.)
    res.status(500).json({
      error: "Erro interno ao atualizar os dados.",
      details: error.message.includes("IXC:")
        ? error.message.replace("IXC: ", "")
        : error.message,
    });
  }
};
