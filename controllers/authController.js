// src/controllers/authController.js
const jwt = require("jsonwebtoken"); // Certifique-se de instalar: npm install jsonwebtoken
const ixcService = require("./services/ixc");

exports.login = async (req, res) => {
  const { login, senha } = req.body;
  if (!login || !senha) {
    return res.status(400).json({ message: "Login e senha obrigatórios." });
  }

  try {
    // 1. Tenta autenticar no IXC
    const cliente = await ixcService.authenticate(login, senha);

    if (!cliente) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    // 2. Gera o JWT (JSON Web Token)
    const token = jwt.sign(
      {
        id: cliente.id,
        email: cliente.email,
        nome: cliente.nome,
      },
      process.env.JWT_SECRET || "sua-chave-secreta-padrao-muito-forte",
      { expiresIn: "24h" } // O token expira em 24 horas
    );

    // 3. Responde com o token e dados básicos do cliente
    res.json({
      token,
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
        email: cliente.email,
      },
      message: "Login realizado com sucesso!",
    });
  } catch (error) {
    console.error("[AuthController] Erro no login:", error.message);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};
