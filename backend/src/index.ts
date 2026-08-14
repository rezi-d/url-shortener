import "dotenv/config";
import express from "express";
import cors from "cors";
import urlRoutes from "./routes/urls";
import { redirectByCode } from "./controllers/urlController";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// API routes (management: create/list/update/delete/analytics)
app.use("/api/urls", urlRoutes);

// Public redirect route - must come after /api/urls to avoid collisions
app.get("/:code", redirectByCode);

app.listen(PORT, () => {
  console.log(`[server] listening on port ${PORT}`);
});
