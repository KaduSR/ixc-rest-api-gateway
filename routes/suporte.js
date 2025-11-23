// src/routes/suporte.js
const express = require("express");
const router = express.Router();
const SuporteController = require("../controllers/suporteController");
// Removidas as linhas de importação e uso do verifyToken

// Endpoint: GET /api/v1/suporte/tickets?status=abertos|todos
router.get("/tickets", SuporteController.getMeusTickets);

// Endpoint: POST /api/v1/suporte/ticket/abrir
router.post("/ticket/abrir", SuporteController.abrirTicket);

module.exports = router;
