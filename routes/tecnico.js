// src/routes/tecnico.js
const express = require("express");
const router = express.Router();
const TecnicoController = require("./controllers/tecnicoController");
const { verifyToken } = require("./middleware/authMiddleware");

// Todas as rotas de suporte são protegidas pelo JWT
router.use(verifyToken);

// Endpoint: POST /api/v1/tecnico/teste
// Executa um Ping ou Traceroute
router.post("/teste", TecnicoController.executarTesteConexao);

// Endpoint: POST /api/v1/tecnico/desbloqueio
// Solicita Liberação em Confiança
router.post("/desbloqueio", TecnicoController.desbloqueioEmConfianca);

module.exports = router;
