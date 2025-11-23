// src/routes/cliente.js
const express = require("express");
const router = express.Router();
const ClienteController = require("./controllers/clienteController");
const { verifyToken } = require("./middleware/authMiddleware");

// Todas as rotas de cliente/perfil são protegidas pelo JWT
router.use(verifyToken);

// ENDPOINT 1. Detalhes do Contrato/Plano
router.get("/detalhes-contrato", ClienteController.getDetalhesContrato);

// ENDPOINT 2. Dados Cadastrais (Perfil)
router.get("/dados-cadastrais", ClienteController.getDadosCadastrais);
router.put("/dados-cadastrais", ClienteController.atualizarDadosCadastrais); // Usa PUT para edição

// Endpoints de segurança (já existentes)
router.post("/alterar-senha", ClienteController.alterarSenha);
router.get("/dados-login", ClienteController.getDadosLogin);

module.exports = router;
