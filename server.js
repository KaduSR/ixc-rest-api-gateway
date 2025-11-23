// src/server.js
// ===========================================================
// SERVIDOR FIBERNET - VERSÃO FINAL CORRIGIDA E OTIMIZADA
// ===========================================================

// Carrega variáveis de ambiente (como PORT, JWT_SECRET, etc.)
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit"); // 💡 ESTE É O MÓDULO FALTANDO
const bodyParser = require("body-parser");

// =========================================================
// IMPORTS DE SERVIÇOS E MIDDLEWARE
// =========================================================
const {
  startScheduler,
  stopScheduler,
} = require("./cron/instabilidadeScheduler");
const { verifyToken } = require("./middleware/authMiddleware");

// =========================================================
// IMPORTS DE ROTAS
// =========================================================
const speedtestRoute = require("./routes/speedtest");
const instabilidadeRoutes = require("./routes/instabilidade");
const authRoutes = require("./routes/auth");
const financeiroRoutes = require("./routes/financeiro");
const dashboardRoutes = require("./routes/dashboard");
const chatbotRoutes = require("./routes/chatbot");

// Importa o Controller CRUD genérico
const crudController = require("./controllers/crudController");

// =========================================================
// INICIALIZAÇÃO EXPRESS
// =========================================================
const app = express();
const PORT = process.env.PORT || 10000;
const NODE_ENV = process.env.NODE_ENV || "development";

// =========================================================
// MIDDLEWARE DE SEGURANÇA E CORS
// =========================================================

// 1. Configuração do Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // Limite de 1000 requisições por IP por windowMs
  message: "Muitas requisições. Tente novamente após 15 minutos.",
});
app.use(limiter);

// 2. Configuração do CORS para ambientes Vercel/Render e local
const whitelist = [
  // Adicione seus domínios de frontend de produção aqui:
  "https://seu-frontend-producao.com.br",
  "http://localhost:3000", // Ambiente de desenvolvimento local
];

const corsOptions = {
  origin: function (origin, callback) {
    if (NODE_ENV === "development" || !origin) {
      // Permite requisições sem 'origin' (ex: apps mobile) ou em dev
      callback(null, true);
    } else if (
      origin.endsWith(".vercel.app") ||
      origin.endsWith(".render.com")
    ) {
      // Permite qualquer subdomínio do Vercel ou Render (ambientes de deploy)
      callback(null, true);
    } else if (whitelist.includes(origin)) {
      // Permite os domínios da lista
      callback(null, true);
    } else {
      callback(new Error(`Não permitido pelo CORS. Origin: ${origin}`));
    }
  },
  credentials: true, // Necessário para cookies ou cabeçalhos de autorização
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// 3. Body Parsers (para JSON e urlencoded)
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json());

// =========================================================
// ROTAS
// =========================================================

// Rotas de Autenticação (sem JWT) - EXIGEM CORPO DA REQUISIÇÃO
app.use("/api/v1/auth", authRoutes);

// Middleware de autenticação JWT para todas as rotas abaixo
app.use(verifyToken);

// Rotas Protegidas (Exigem JWT)
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/financeiro", financeiroRoutes);
app.use("/api/v1/speedtest", speedtestRoute);
app.use("/api/v1/instabilidade", instabilidadeRoutes);
app.use("/api/v1/chatbot", chatbotRoutes);

// Rotas de CRUD Genérico (APIs mais perigosas)
app.get("/api/v1/data/:entity", crudController.listRecords);
app.post("/api/v1/data/:entity/:action", crudController.manageRecord);
app.delete("/api/v1/data/:entity/:id", crudController.deleteRecord);

// =========================================================
// INICIALIZAÇÃO DO SERVIDOR
// =========================================================
const server = app.listen(PORT, () => {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║           SERVIDOR FIBERNET - INICIALIZADO COM SUCESSO     ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log(`\nServidor rodando na porta: ${PORT}`);
  console.log(`Ambiente: ${NODE_ENV}`);
  console.log(`CORS: ATIVO E FUNCIONANDO`);
  console.log(`Frontend permitido: Vercel, Render e Whitelist local.\n`);

  // Iniciar scheduler de monitoramento
  try {
    const interval = process.env.SCHEDULER_INTERVAL || "*/5 * * * *"; // A cada 5 minutos
    startScheduler(interval);
    console.log(`Scheduler de instabilidade iniciado (${interval})`);
  } catch (e) {
    console.error("Erro ao iniciar scheduler:", e.message);
  }

  console.log("Tudo pronto! Seu portal do cliente está online.");
  console.log(
    "══════════════════════════════════════════════════════════════\n"
  );
});

// =========================================================
// GRACEFUL SHUTDOWN (Encerramento Limpo)
// =========================================================
function shutdown() {
  console.log("\nEncerrando servidor...");
  server.close(() => {
    // Para o scheduler antes de sair
    stopScheduler();
    console.log("Servidor Express encerrado.");
    process.exit(0);
  });

  // Força o encerramento se não fechar em 10 segundos
  setTimeout(() => {
    console.error("Forçando o encerramento após timeout.");
    process.exit(1);
  }, 10000);
}

// Interceptadores de Sinais (para o Render/Linux)
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Interceptadores de Erros Críticos (para evitar que o servidor caia)
process.on("uncaughtException", (err) => {
  console.error("[FATAL] uncaughtException:", err);
  shutdown();
});
process.on("unhandledRejection", (reason) => {
  console.error("[FATAL] unhandledRejection:", reason);
  shutdown();
});

module.exports = app;
