import request from "supertest";
import express from "express";
import dashboardRoutes from "../../api/routes/dashboardRoutes";

jest.mock('../../services/cache/supabaseClient', () => ({
  cacheGet: jest.fn().mockResolvedValue(null),
  cacheSet: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../services/ixcService', () => ({
  ixcService: {
    clientes: { listar: jest.fn().mockResolvedValue([{ id: 1, nome: 'Teste' }]) },
    consumo: { listar: jest.fn().mockResolvedValue([{ id: 1, consumo: 100 }]) },
    contratos: { listar: jest.fn().mockResolvedValue([{ id: 1, tipo: 'Plano' }]) },
  }
}));

jest.mock('../../middleware/authMiddleware', () => ({
  authMiddleware: jest.fn((req, res, next) => next()),
}));

const app = express();
app.use(express.json());
app.use("/dashboard", dashboardRoutes);

describe("Dashboard API", () => {
  it("should return dashboard data for given clientIds", async () => {
    const res = await request(app)
      .get("/dashboard?clientIds=1")
      .expect(200);

    expect(res.body.clientes).toHaveLength(1);
    expect(res.body.consumos).toHaveLength(1);
    expect(res.body.contratos).toHaveLength(1);
    expect(res.body.aiInsights).toBeDefined();
  });

  it("should return empty arrays for no clientIds", async () => {
    // Need to adjust the mock to return empty arrays for this case
    const { ixcService } = require('../../services/ixcService');
    ixcService.clientes.listar.mockResolvedValue([]);
    ixcService.consumo.listar.mockResolvedValue([]);
    ixcService.contratos.listar.mockResolvedValue([]);

    const res = await request(app)
      .get("/dashboard")
      .expect(200);

    expect(res.body.clientes).toHaveLength(0);
    expect(res.body.consumos).toHaveLength(0);
    expect(res.body.contratos).toHaveLength(0);
  });
});