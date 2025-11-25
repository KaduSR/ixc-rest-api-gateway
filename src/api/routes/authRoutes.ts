import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ixcService } from "../../services/ixcService";

const router = Router();

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email e senha são obrigatórios" });
  }

  try {
    // 1. Busca o cliente no IXC pelo email
    const cliente = await ixcService.buscarClientePorEmail(email);

    // 2. Verifica se encontrou
    if (!cliente) {
      return res.status(401).json({ error: "Cliente não encontrado" });
    }

    // 3. Valida a senha (o IXC retorna a senha do hotsite em texto plano no campo 'senha')
    if (cliente.senha !== password) {
      return res.status(401).json({ error: "Senha incorreta" });
    }

    // 4. Gera o token JWT
    const clientIds = [cliente.id];
    const token = jwt.sign(
      { ids: clientIds, email: cliente.email || email },
      process.env.JWT_SECRET || "secret_padrao_seguro", // Use uma chave forte em produção
      { expiresIn: "1d" }
    );

    return res.json({
      token,
      user: {
        id: cliente.id,
        nome: cliente.razao || cliente.fantasia,
        email: cliente.email,
      },
    });
  } catch (error) {
    console.error("Erro interno no login:", error);
    return res.status(500).json({ error: "Erro ao processar login" });
  }
});

export default router;
