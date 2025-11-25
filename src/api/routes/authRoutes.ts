import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";

const router = Router();

router.post("/login", (req: Request, res: Response) => {
  const { email, password } = req.body;

  // modo DEV: credenciais de desenvolvimento
  if (email === "dev@fibernet.com" && password === "dev") {
    const token = jwt.sign({ ids: [7], email, isDev: true }, process.env.JWT_SECRET || "devsecret", { expiresIn: "1d" });
    return res.json({ token });
  }

  // Em produção: integrar com ixcService (omiti por simplicidade)
  return res.status(401).json({ error: "Credenciais inválidas" });
});

export default router;