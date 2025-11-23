// src/routes/auth.js
const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/authController");

// Rota POST para Login
// Endpoint final: POST /api/v1/auth/login
router.post("/login", AuthController.login);

module.exports = router;
