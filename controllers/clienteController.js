// src/controllers/clienteController.js
const ixcService = require("../services/ixc");
const md5 = require("md5"); // Certifique-se de instalar: npm install md5

/**
 * @desc Altera a senha de acesso (hotsite) do cliente.
 * @route POST /api/v1/cliente/alterar-senha
 * @body {string} senhaAtual
 * @body {string} novaSenha
 */
exports.alterarSenha = async (req, res) => {
  const clienteId = req.user.id; // ID do JWT
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
    // O campo 'hotsite_senha_md5' indica se a senha está em MD5
    if (cliente.hotsite_senha_md5 === "S") {
      senhaCorreta = cliente.hotsite_senha === md5(senhaAtual);
    } else {
      // Se 'hotsite_senha_md5' for 'N', a senha é comparada em texto puro
      senhaCorreta = cliente.hotsite_senha === senhaAtual;
    }

    if (!senhaCorreta) {
      return res.status(401).json({ message: "Senha atual incorreta." });
    }

    // 3. Altera a senha no IXC (sempre em MD5 para garantir)
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
  const clienteId = req.user.id; // ID do JWT

  try {
    // 1. Busca o Login (radusuarios)
    const loginData = await ixcService.getLoginDoCliente(clienteId);

    if (!loginData || !loginData.id) {
      return res.status(404).json({
        message: "Nenhum login de internet ativo encontrado para este cliente.",
      });
    }

    // Mapeia os dados relevantes
    const dadosLogin = {
      idLogin: loginData.id,
      login: loginData.login,
      // 🚨 NUNCA expose a senha (loginData.senha) por segurança!
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
