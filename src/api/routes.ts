import { Router } from "express";
import authRoutes from "./routes/authRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import { getPixCode } from "./controllers/financeiroController"; // Importe o novo controller
import { verifyToken } from "../middleware/authMiddleware";

const router = Router();

router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);

// Nova rota para PIX (Protegida pelo Token JWT do seu gateway)
router.get("/faturas/:id/pix", verifyToken, getPixCode);

// Rota Raiz
router.get("/", (_, res) =>
  res.json({
    status: "ok",
    message: "IXC API Gateway is running",
    timestamp: new Date().toISOString(),
  })
);

// Rota Health (Adicionada para corrigir o erro 404)
router.get("/health", (_, res) =>
  res.json({
    status: "ok",
    message: "Healthy",
    timestamp: new Date().toISOString(),
  })
);

export default router;
