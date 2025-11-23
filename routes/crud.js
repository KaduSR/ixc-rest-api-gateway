// src/routes/crud.js
const express = require("express");
const router = express.Router();
const CrudController = require("../controllers/crudController");

// =========================================================
// Rota Única para Listar / Filtrar (GET)
// Ex: GET /api/v1/data/cliente?qtype=cliente.id&query=1&oper==
// Cobre: cliente, su_ticket, fn_areceber, cliente_contrato, radusuarios, radpop_radio_cliente_fibra
// =========================================================
router.get("/:entity", CrudController.listRecords);

// =========================================================
// Rota Única para Inserir / Editar (POST)
// Ex: POST /api/v1/data/su_ticket/inserir
// Ex: POST /api/v1/data/cliente/editar (com id no body)
// =========================================================
router.post("/:entity/:action", CrudController.manageRecord);

// =========================================================
// Rota Única para Deletar (DELETE)
// Ex: DELETE /api/v1/data/su_ticket/123
// =========================================================
router.delete("/:entity/:id", CrudController.deleteRecord);

module.exports = router;
