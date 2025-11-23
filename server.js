// server.js
// ----------------------------------------------------
// 1. SETUP DO SERVIDOR E DEPENDÊNCIAS
// ----------------------------------------------------
require("dotenv").config(); // Para carregar .env
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

// Requer dependências necessárias que o passo 2 introduziu
const md5 = require("md5"); // Para autenticação
const jwt = require("jsonwebtoken"); // Para geração de token

// Importa o serviço IXC (para garantir que a conexão está ok)
const ixcService = require("./src/services/ixc");

// Importa as Rotas
const authRoutes = require("./src/routes/auth");

// ----------------------------------------------------
// 2. MIDDLEWARES GERAIS
// ----------------------------------------------------
app.use(express.json()); // Body parser para JSON
app.use(cors()); // Permite requisições de outras origens (CORS)

// ----------------------------------------------------
// 3. ROTAS DA API
// ----------------------------------------------------

// Rota de saúde (Health check)
app.get("/", (req, res) => {
  res.status(200).json({
    status: "API Gateway Online",
    service: "Authentication Ready",
    ixc_url: process.env.IXC_API_URL,
    version: "v1",
    endpoints: ["POST /api/v1/auth/login"],
  });
});

// 💡 INTEGRAÇÃO DAS NOVAS ROTAS DE AUTENTICAÇÃO
app.use("/api/v1/auth", authRoutes);

// ----------------------------------------------------
// 4. INICIA O SERVIDOR
// ----------------------------------------------------
app.listen(PORT, () => {
  console.log(`\n==============================================`);
  console.log(`🚀 API Gateway IXC rodando na porta ${PORT}`);
  console.log(`🔗 Conectado à API IXC: ${process.env.IXC_API_URL}`);
  console.log(`✅ Fluxo de Autenticação (Login) pronto.`);
  console.log(`==============================================\n`);
});
