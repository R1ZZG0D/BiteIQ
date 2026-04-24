import express from "express";
import cors from "cors";
import { ZodError } from "zod";
import { config } from "./config.js";
import { createRepository } from "./repositories/storage.js";
import { createApiRouter } from "./routes/api.js";

const repository = await createRepository();
const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: "1mb" }));
app.use("/api", createApiRouter(repository));

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

app.use((error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: "Invalid request input.",
      details: error.flatten()
    });
    return;
  }

  console.error(error);
  res.status(500).json({
    error: error.message || "Unexpected server error."
  });
});

app.listen(config.port, () => {
  console.log(`Food Intelligence API listening on http://localhost:${config.port}`);
});
