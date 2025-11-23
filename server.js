// src/server.js

const express = require("express");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { verifyToken } = require("./middleware/authMiddleware");

// --- 1. Carregar Variáveis de Ambiente
dotenv.config();

// --- 2. Inicialização do Express
const app = express();
const PORT = process.env.PORT || 10000;
const API_URL = "/api/v1";

// --- 3. Middlewares Globais
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Configuração de Rate Limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requisições
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// --- 4. Definição das Rotas
const authRoutes = require("./routes/auth");
const clienteRoutes = require("./routes/cliente");
const suporteRoutes = require("./routes/suporte");
const tecnicoRoutes = require("./routes/tecnico");
const crudRoutes = require("./routes/crud");

// Rotas sem Autenticação (Login)
app.use(`${API_URL}/auth`, authRoutes);

// Rotas Protegidas (JWT)
app.use(verifyToken); // Aplica o middleware JWT em todas as rotas a seguir
app.use(`${API_URL}/cliente`, clienteRoutes);
app.use(`${API_URL}/suporte`, suporteRoutes);
app.use(`${API_URL}/tecnico`, tecnicoRoutes);
app.use(`${API_URL}/data`, crudRoutes);

// --- 5. Inicialização do Servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
