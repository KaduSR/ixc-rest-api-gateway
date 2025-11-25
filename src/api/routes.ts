import { Router } from "express";
import authRoutes from "./routes/authRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);

router.get("/", (_, res) => res.json({ status: "ok", message: "IXC API Gateway is running", timestamp: new Date().toISOString() }));

export default router;