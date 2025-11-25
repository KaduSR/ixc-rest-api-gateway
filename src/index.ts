import "dotenv/config";
import express from "express";

import routes from "./api/routes";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";

const app = express();
app.use(express.json());

// API routes
app.use("/api", routes);

// Optional: swagger if you add openapi.yaml under src/swagger/openapi.yaml
try {
  const swaggerPath = path.join(__dirname, "swagger", "openapi.yaml");
  const swaggerDocument = YAML.load(swaggerPath);
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (err) {
  // ignore if no swagger file
}

// start
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(
    `🚀 API rodando na porta ${PORT} (base: ${
      process.env.API_BASE_URL || "http://localhost:" + PORT
    })`
  );
});
