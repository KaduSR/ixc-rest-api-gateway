// server.js

// ----------------------------------------------------
// 1. SETUP DO SERVIDOR
// ----------------------------------------------------
const express = require("express");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ----------------------------------------------------
// 2. CONFIGURAÇÃO DA API IXC (Variáveis de Ambiente)
// ----------------------------------------------------
const API_URL = process.env.IXC_API_URL;
const ADMIN_TOKEN = process.env.IXC_ADMIN_TOKEN;

if (!API_URL || !ADMIN_TOKEN) {
  console.error(
    "ERRO: As variáveis de ambiente IXC_API_URL ou IXC_ADMIN_TOKEN não estão definidas. Verifique o painel do Render."
  );
}

// *** AJUSTE CRUCIAL: Autenticação Base64 com Header Basic ***
// Codifica o token em Base64, conforme exigido pelo seu arquivo Collection
const base64Token = Buffer.from(ADMIN_TOKEN).toString("base64");
const authHeader = `Basic ${base64Token}`;

// Configuração padrão do Axios (Cliente HTTP)
const ixcApiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    // 💡 CORREÇÃO APLICADA: Usa a variável local 'authHeader'
    Authorization: authHeader,
  },
  // Configuração para aceitar certificados auto-assinados
  httpsAgent: new (require("https").Agent)({
    rejectUnauthorized: false,
  }),
});

// ----------------------------------------------------
// 3. FUNÇÃO DE SERVIÇO GENÉRICA (O Coração da Comunicação)
// ----------------------------------------------------
async function ixcRequest(endpoint, method, data = {}, params = {}) {
  try {
    let url = `/${endpoint}`;

    let config = {
      method,
      url,
      params: method === "get" ? params : {},
      data: method === "post" || method === "put" ? data : undefined,
    };

    const idRegistro = data.id || params.id;
    if ((method === "put" || method === "delete") && idRegistro) {
      config.url = `/${endpoint}/${idRegistro}`;
    }

    if (method === "put" && config.data) {
      delete config.data.id;
    }

    const response = await ixcApiClient(config);
    return response.data;
  } catch (error) {
    console.error(
      `Falha na requisição IXC (${method.toUpperCase()} ${endpoint}):`,
      error.response ? error.response.data : error.message
    );
    throw {
      status: error.response ? error.response.status : 500,
      message: error.response
        ? error.response.data
        : "Erro interno ao comunicar com a API IXC.",
    };
  }
}

// ----------------------------------------------------
// 4. ROTAS DA API (Endpoints para seu App/Website)
// ----------------------------------------------------

app.get("/", (req, res) => {
  res.status(200).json({
    status: "API Gateway Online",
    ixc_url: API_URL,
    auth_type: "Basic (Base64)",
  });
});

// --- CRUD PARA CLIENTE ---
app.post("/api/clientes", async (req, res) => {
  try {
    const resultado = await ixcRequest("cliente", "post", req.body);
    res.status(201).json(resultado);
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ erro: "Falha ao inserir cliente.", detalhes: error.message });
  }
});

app.get("/api/clientes", async (req, res) => {
  try {
    const resultado = await ixcRequest("cliente", "get", null, req.query);
    res.status(200).json(resultado);
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ erro: "Falha ao listar clientes.", detalhes: error.message });
  }
});

app.put("/api/clientes/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const dadosAtualizacao = { ...req.body, id };
    const resultado = await ixcRequest("cliente", "put", dadosAtualizacao);
    res.status(200).json(resultado);
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ erro: "Falha ao editar cliente.", detalhes: error.message });
  }
});

app.delete("/api/clientes/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await ixcRequest("cliente", "delete", null, { id });
    res.status(204).send();
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ erro: "Falha ao deletar cliente.", detalhes: error.message });
  }
});

// --- ROTAS GENÉRICAS GET PARA OUTRAS ENTIDADES ---

app.get("/api/tickets", async (req, res) => {
  try {
    const resultado = await ixcRequest("su_ticket", "get", null, req.query);
    res.status(200).json(resultado);
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ erro: "Falha ao listar tickets.", detalhes: error.message });
  }
});

app.get("/api/areceber", async (req, res) => {
  try {
    const resultado = await ixcRequest("fn_areceber", "get", null, req.query);
    res.status(200).json(resultado);
  } catch (error) {
    res.status(error.status || 500).json({
      erro: "Falha ao listar contas a receber.",
      detalhes: error.message,
    });
  }
});

app.get("/api/contratos", async (req, res) => {
  try {
    const resultado = await ixcRequest(
      "cliente_contrato",
      "get",
      null,
      req.query
    );
    res.status(200).json(resultado);
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ erro: "Falha ao listar contratos.", detalhes: error.message });
  }
});

app.get("/api/radusuarios", async (req, res) => {
  try {
    const resultado = await ixcRequest("radusuarios", "get", null, req.query);
    res.status(200).json(resultado);
  } catch (error) {
    res.status(error.status || 500).json({
      erro: "Falha ao listar usuários RADIUS.",
      detalhes: error.message,
    });
  }
});

app.get("/api/equipamentos", async (req, res) => {
  try {
    const resultado = await ixcRequest(
      "radpop_radio_cliente_fibra",
      "get",
      null,
      req.query
    );
    res.status(200).json(resultado);
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ erro: "Falha ao listar equipamentos.", detalhes: error.message });
  }
});

// ----------------------------------------------------
// 5. INICIA O SERVIDOR
// ----------------------------------------------------
app.listen(PORT, () => {
  console.log(`\n==============================================`);
  console.log(`🚀 API Gateway IXC rodando na porta ${PORT}`);
  console.log(`🔗 Conectado à API IXC: ${API_URL}`);
  console.log(`==============================================\n`);
});
