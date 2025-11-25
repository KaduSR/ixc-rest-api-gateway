import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ixcService } from "../../services/ixcService";

const router = Router();

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // modo DEV: credenciais de desenvolvimento
  if (email === "dev@fibernet.com" && password === "dev") {
    const token = jwt.sign({ ids: [7], email, isDev: true }, process.env.JWT_SECRET || "devsecret", { expiresIn: "1d" });
    return res.json({ token });
  }

  if (!email || !password) {
    return res.status(400).json({ error: "Email e senha são obrigatórios" });
  }

  try {
    const cliente = await ixcService.buscarClientePorEmail(email);

    if (!cliente || cliente.hotsite_senha !== password) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    // For now, just use the single client ID.
    // A more complete implementation would find all clients with the same CPF/CNPJ.
    const clientIds = [cliente.id];

    const token = jwt.sign(
      { ids: clientIds, email: cliente.hotsite_email },
      process.env.JWT_SECRET || "devsecret",
      { expiresIn: "1d" }
    );
    res.json({ token });
  } catch (error) {
    console.error("Erro no login:", error);
    res
      .status(500)
      .json({ error: "Erro interno do servidor durante o login" });
  }
});

export default router;