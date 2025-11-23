// src/controllers/authController.js
const jwt = require("jsonwebtoken");
const ixc = require("../services/ixc");

/**
 * @desc Autentica o usuário e retorna um JWT.
 * @route POST /api/v1/auth/login
 */
exports.login = async (req, res) => {
  // Espera { login: "email@mail.com", senha: "senha_pura" }
  const { login, senha } = req.body;

  if (!login || !senha)
    return res.status(400).json({ message: "Login e senha obrigatórios" });

  try {
    // Chama o método de autenticação que busca por hotsite_email e valida hotsite_senha
    const cliente = await ixc.authenticate(login, senha);

    if (!cliente)
      return res.status(401).json({ message: "Credenciais inválidas" });

    // Geração e emissão do JWT
    const token = jwt.sign(
      { id: cliente.id, email: cliente.email, nome: cliente.nome_razaosocial },
      process.env.JWT_SECRET,
      { expiresIn: "24h" } // O token expira em 24 horas
    );

    // Retorna o token para ser usado nas requisições protegidas
    res.json({
      token,
      nome: cliente.nome_razaosocial,
      email: cliente.email,
      id_cliente: cliente.id,
    });
  } catch (error) {
    console.error("[AuthController] Erro no login:", error.message);
    res.status(500).json({ message: "Erro interno no servidor." });
  }
};
