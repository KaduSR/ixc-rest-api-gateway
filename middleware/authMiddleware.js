// src/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

/**
 * Middleware para verificar o token JWT e anexar o ID do usuário à requisição.
 */
exports.verifyToken = (req, res, next) => {
  // 1. Pega o token do header da requisição (Authorization: Bearer <token>)
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: "Acesso negado. Token não fornecido.",
    });
  }

  // O header é geralmente "Bearer [token]", então separamos o token
  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      error: "Formato de token inválido (Esperado: Bearer <token>).",
    });
  }

  try {
    // 2. Verifica e decodifica o token
    // Usa a mesma chave secreta definida no authController.js e .env
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "sua-chave-secreta-padrao-muito-forte"
    );

    // 3. Anexa o ID do usuário e outros dados à requisição para uso posterior
    req.user = {
      id: decoded.id, // O ID do cliente IXC que está logado
      email: decoded.email,
      nome: decoded.nome,
    };

    // 4. Continua para a próxima função (controller)
    next();
  } catch (err) {
    console.error("[AuthMiddleware] Erro na validação do token:", err.message);
    // Erros comuns: TokenExpiredError, JsonWebTokenError
    return res.status(401).json({
      error: "Token inválido ou expirado. Faça login novamente.",
    });
  }
};
