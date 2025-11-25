import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function verifyToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const parts = authHeader.split(" ");
  if (parts.length !== 2) return res.status(401).json({ error: "Token malformado" });

  const scheme = parts[0];
  const token = parts[1];

  if (!/^Bearer$/i.test(scheme)) return res.status(401).json({ error: "Token malformado" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "devsecret");
    (req as any).user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido" });
  }
}