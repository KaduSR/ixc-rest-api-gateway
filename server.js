// server.js
// ===========================================================
// SERVIDOR IXC GATEWAY
// ===========================================================

require("dotenv").config(); // Para carregar .env
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

// Importa o serviço IXC (para garantir que a conexão está ok)
const ixcService = require("./src/services/ixc");

// Importa as Rotas e o Middleware
const authRoutes = require("./src/routes/auth");
const dashboardRoutes = require("./src/routes/dashboard");
const financeiroRoutes = require("./src/routes/financeiro");
const suporteRoutes = require("./src/routes/suporte");
// 💡 NOVA ROTA
const tecnicoRoutes = require("./src/routes/tecnico");
const { verifyToken } = require("./src/middleware/authMiddleware");

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
    service: "Authentication, Dashboard, Financeiro, Suporte & Técnico Ready",
    ixc_url: process.env.IXC_API_URL,
    version: "v1",
    endpoints: [
      "POST /api/v1/auth/login",
      "GET /api/v1/dashboard/data (Protegida por JWT)",
      "GET /api/v1/financeiro/faturas (Protegida por JWT)",
      "GET /api/v1/financeiro/fatura/:id/pagamento (Protegida por JWT)",
      "GET /api/v1/suporte/tickets?status=abertos|todos (Protegida por JWT)",
      "POST /api/v1/suporte/ticket/abrir (Protegida por JWT)",
      // 💡 NOVOS
      "POST /api/v1/tecnico/teste (Protegida por JWT)",
      "POST /api/v1/tecnico/desbloqueio (Protegida por JWT)",
    ],
  });
});

// INTEGRAÇÃO DAS ROTAS
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/financeiro", financeiroRoutes);
app.use("/api/v1/suporte", suporteRoutes);
// 💡 INTEGRAÇÃO DA ROTA TÉCNICA
app.use("/api/v1/tecnico", tecnicoRoutes);

// ----------------------------------------------------
// 4. INICIA O SERVIDOR
// ----------------------------------------------------
app.listen(PORT, () => {
  console.log(`\n==============================================`);
  console.log(`🚀 API Gateway IXC rodando na porta ${PORT}`);
  console.log(`🔗 Conectado à API IXC: ${process.env.IXC_API_URL}`);
  console.log(`✅ Fluxo Técnico (Testes/Desbloqueio) prontos.`);
  console.log(`==============================================\n`);
});
