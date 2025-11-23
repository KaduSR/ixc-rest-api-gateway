// src/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

/**
 * Middleware para verificar a validade do JWT e anexar os dados do usuário (req.user).
 */
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Token não fornecido." });
  }

  const parts = authHeader.split(" ");
  // Verifica se o formato é 'Bearer <token>'
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return res
      .status(401)
      .json({ error: "Formato do token inválido. Use 'Bearer <token>'" });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Anexa os dados do usuário decodificado ao objeto de requisição
    req.user = decoded;
    next();
  } catch (err) {
    // Erros de JWT: 'TokenExpiredError', 'JsonWebTokenError'
    return res.status(401).json({ error: "Token inválido ou expirado." });
  }
};
