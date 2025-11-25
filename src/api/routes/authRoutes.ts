import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ixcService } from "../../services/ixcService";

const router = Router();

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email e senha são obrigatórios" });
  }

  // Bypass para ambiente de desenvolvimento (opcional, mantenha se usar)
  if (email === "dev@fibernet.com" && password === "dev") {
    const token = jwt.sign(
      { ids: [7], email, isDev: true },
      process.env.JWT_SECRET || "devsecret",
      { expiresIn: "1d" }
    );
    return res.json({ token });
  }

  try {
    // 1. Busca os dados do cliente usando o TOKEN DE ADMIN do Gateway
    const cliente = await ixcService.buscarClientePorEmail(email);

    // 2. Verifica se o cliente existe
    if (!cliente) {
      return res
        .status(401)
        .json({ error: "Cliente não encontrado ou credenciais inválidas" });
    }

    // 3. Compara a senha enviada pelo usuário com a senha retornada do banco do IXC
    // Nota: O campo padrão de senha do hotsite no IXC é 'senha'.
    // Se o seu IXC usa um campo personalizado, altere 'cliente.senha' abaixo.
    if (cliente.senha !== password) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    // 4. Se chegou aqui, a senha está correta. Gera o Token do seu Gateway.
    const clientIds = [cliente.id];

    const token = jwt.sign(
      { ids: clientIds, email: cliente.email || email },
      process.env.JWT_SECRET || "devsecret",
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
    return res
      .status(500)
      .json({ error: "Erro interno do servidor ao processar login" });
  }
});

export default router;
