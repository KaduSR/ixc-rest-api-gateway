// src/controllers/crudController.js
const ixc = require("../services/ixc");

/**
 * @desc Método GET: Lista ou filtra registros de qualquer entidade.
 * @route GET /api/v1/data/:entity
 */
exports.listRecords = async (req, res) => {
  // A entidade (cliente, su_ticket, fn_areceber, etc.) vem da URL
  const { entity } = req.params;
  // Os filtros (qtype, query, oper, page, rp, etc.) vêm dos Query Params
  const queryParams = req.query;

  if (!entity) {
    return res.status(400).json({ error: "Entidade não especificada." });
  }

  try {
    const data = await ixc.list(entity, queryParams);
    return res.json(data);
  } catch (error) {
    res
      .status(500)
      .json({ error: `Erro ao listar ${entity}: ${error.message}` });
  }
};

/**
 * @desc Método POST/PUT: Insere ou Edita um registro.
 * @route POST /api/v1/data/:entity/:action (action: inserir ou editar)
 */
exports.manageRecord = async (req, res) => {
  const { entity, action } = req.params; // action é 'inserir' ou 'editar'
  const data = req.body; // O payload da IXC está no corpo

  if (!entity || !action) {
    return res
      .status(400)
      .json({ error: "Entidade ou ação (inserir/editar) não especificada." });
  }

  try {
    // action será usado como header 'ixcsoft'
    const resultado = await ixc.post(entity, data, action);
    return res.status(200).json({
      message: `Registro de ${entity} ${action} com sucesso.`,
      resultado,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: `Falha ao ${action} ${entity}: ${error.message}` });
  }
};

/**
 * @desc Método DELETE: Deleta um registro.
 * @route DELETE /api/v1/data/:entity/:id
 */
exports.deleteRecord = async (req, res) => {
  const { entity, id } = req.params;

  if (!entity || !id) {
    return res.status(400).json({ error: "Entidade e ID são obrigatórios." });
  }

  try {
    const resultado = await ixc.delete(entity, id);
    return res.status(200).json({
      message: `Registro de ${entity} (ID: ${id}) deletado com sucesso.`,
      resultado,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: `Falha ao deletar ${entity}: ${error.message}` });
  }
};
