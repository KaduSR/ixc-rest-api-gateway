// server.js (Versão Corrigida e Dinâmica)

// ----------------------------------------------------
// 1. SETUP DO SERVIDOR E DEPENDÊNCIAS
// ----------------------------------------------------
require("dotenv").config(); // Para carregar .env
const express = require("express");
const axios = require("axios");
const cors = require("cors"); // Adicionado CORS para acesso de frontends
const { Buffer } = require("node:buffer"); // Necessário para Buffer
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors()); // Permite acesso de qualquer origem em ambiente de desenvolvimento

// ----------------------------------------------------
// 2. CONFIGURAÇÃO DA API IXC
// ----------------------------------------------------
const API_URL = process.env.IXC_API_URL;
const ADMIN_TOKEN = process.env.IXC_ADMIN_TOKEN;

if (!API_URL || !ADMIN_TOKEN) {
  console.error(
    "ERRO: As variáveis de ambiente IXC_API_URL ou IXC_ADMIN_TOKEN não estão definidas."
  );
  process.exit(1);
}

// Codifica o token em Base64 para o header Basic
const base64Token = Buffer.from(ADMIN_TOKEN).toString("base64");
const authHeader = `Basic ${base64Token}`;

// Configuração padrão do Axios (Cliente HTTP)
const ixcApiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: authHeader,
  },
  // Configuração para aceitar certificados auto-assinados (útil no desenvolvimento/Render)
  httpsAgent: new (require("https").Agent)({
    rejectUnauthorized: false,
  }),
});

// ----------------------------------------------------
// 3. FUNÇÃO DE SERVIÇO GENÉRICA CORRIGIDA (O Coração da Comunicação)
// ----------------------------------------------------
/**
 * Função unificada para todas as requisições à API IXC, corrigindo a lógica
 * dos headers ixcsoft para listagem, inserção e edição.
 * @param {string} endpoint - A entidade (ex: cliente, su_ticket).
 * @param {string} method - O método REST desejado (get, post, put, delete).
 * @param {object} data - O corpo da requisição (para inserir/editar).
 * @param {object} params - Os query params (para listagem/delete por ID).
 */
async function ixcRequest(endpoint, method, data = {}, params = {}) {
  try {
    let config = {
      url: `/${endpoint}`,
      data: data,
      headers: {},
    };

    // Lógica CRUCIAL para mapeamento IXC:
    if (method === "get") {
      // 💡 CORREÇÃO: IXC LISTAGEM é POST com header ixcsoft: listar e filtros no corpo
      config.method = "post";
      config.headers.ixcsoft = "listar";
      // Os query params (qtype, query, rp, etc.) se tornam o corpo do POST
      config.data = params;
    } else if (method === "post") {
      // 💡 CORREÇÃO: IXC CRIAÇÃO é POST com header ixcsoft: inserir
      config.method = "post";
      config.headers.ixcsoft = "inserir";
    } else if (method === "put") {
      // 💡 CORREÇÃO: IXC EDIÇÃO é POST com header ixcsoft: editar
      config.method = "post";
      config.headers.ixcsoft = "editar";
      // ID deve estar no corpo para edição (a rota passa o ID do param para o body)
      if (!data.id)
        throw new Error("ID do registro é obrigatório para edição.");
    } else if (method === "delete") {
      // IXC DELEÇÃO: DELETE /endpoint/ID (método mais comum, mas POST/deletar também funciona)
      const idRegistro = params.id || data.id;
      if (!idRegistro)
        throw new Error("ID do registro é obrigatório para exclusão.");
      config.method = "delete";
      config.url = `/${endpoint}/${idRegistro}`;
      config.data = undefined;
    } else {
      throw new Error(`Método ${method.toUpperCase()} não suportado.`);
    }

    const response = await ixcApiClient(config);
    return response.data;
  } catch (error) {
    const errorData = error.response ? error.response.data : error.message;
    console.error(
      `Falha na requisição IXC (${(
        config.method || method
      ).toUpperCase()} ${endpoint}):`,
      errorData
    );
    throw {
      status: error.response?.status || 500,
      message: errorData || "Erro interno ao comunicar com a API IXC.",
    };
  }
}

// ----------------------------------------------------
// 4. ROTAS DA API DINÂMICAS (Cobre todas as 6 entidades)
// ----------------------------------------------------

const ENTITIES = [
  "cliente",
  "su_ticket",
  "fn_areceber",
  "cliente_contrato",
  "radusuarios",
  "radpop_radio_cliente_fibra",
];

app.get("/", (req, res) => {
  res.status(200).json({
    status: "API Gateway IXC Online",
    ixc_url: API_URL,
    auth_type: "Basic (Admin Token)",
    rotas_dinamicas: "/api/:entity",
  });
});

// Rota Genérica para LISTAGEM/FILTRO (GET /api/:entity)
// Ex: GET /api/cliente?qtype=cliente.id&query=1&oper==
app.get("/api/:entity", async (req, res) => {
  const { entity } = req.params;
  if (!ENTITIES.includes(entity))
    return res.status(404).json({ error: "Entidade não suportada." });

  try {
    // Mapeia para a lógica de POST com ixcsoft: listar (method: 'get' na chamada)
    const resultado = await ixcRequest(entity, "get", null, req.query);
    res.status(200).json(resultado);
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ erro: `Falha ao listar ${entity}.`, detalhes: error.message });
  }
});

// Rota Genérica para CRIAÇÃO (POST /api/:entity)
// Ex: POST /api/su_ticket com o corpo do IXC
app.post("/api/:entity", async (req, res) => {
  const { entity } = req.params;
  if (!ENTITIES.includes(entity))
    return res.status(404).json({ error: "Entidade não suportada." });

  try {
    // Mapeia para a lógica de POST com ixcsoft: inserir (method: 'post' na chamada)
    const resultado = await ixcRequest(entity, "post", req.body);
    res.status(201).json(resultado);
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ erro: `Falha ao inserir ${entity}.`, detalhes: error.message });
  }
});

// Rota Genérica para ATUALIZAÇÃO (PUT /api/:entity/:id)
// Ex: PUT /api/cliente/123 com o corpo de atualização
app.put("/api/:entity/:id", async (req, res) => {
  const { entity, id } = req.params;
  if (!ENTITIES.includes(entity))
    return res.status(404).json({ error: "Entidade não suportada." });

  try {
    // O ID do param é adicionado ao corpo, pois o IXC espera o ID no payload
    const dadosAtualizacao = { ...req.body, id };
    // Mapeia para a lógica de POST com ixcsoft: editar (method: 'put' na chamada)
    const resultado = await ixcRequest(entity, "put", dadosAtualizacao);
    res.status(200).json(resultado);
  } catch (error) {
    res
      .status(error.status || 500)
      .json({
        erro: `Falha ao editar ${entity} (ID: ${id}).`,
        detalhes: error.message,
      });
  }
});

// Rota Genérica para EXCLUSÃO (DELETE /api/:entity/:id)
// Ex: DELETE /api/fn_areceber/456
app.delete("/api/:entity/:id", async (req, res) => {
  const { entity, id } = req.params;
  if (!ENTITIES.includes(entity))
    return res.status(404).json({ error: "Entidade não suportada." });

  try {
    // Mapeia para a lógica de DELETE /endpoint/ID
    await ixcRequest(entity, "delete", null, { id });
    res.status(204).send();
  } catch (error) {
    res
      .status(error.status || 500)
      .json({
        erro: `Falha ao deletar ${entity} (ID: ${id}).`,
        detalhes: error.message,
      });
  }
});

// ----------------------------------------------------
// 5. INICIA O SERVIDOR
// ----------------------------------------------------
app.listen(PORT, () => {
  console.log(`\n==============================================`);
  console.log(`🚀 API Gateway IXC rodando na porta ${PORT}`);
  console.log(`🔗 Conectado à API IXC: ${API_URL}`);
  console.log(`✅ CRUD Dinâmico para ${ENTITIES.length} entidades ativado.`);
  console.log(`==============================================\n`);
});
