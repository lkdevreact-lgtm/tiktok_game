import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { initSocket } from "./socket/socket.js";
import apiRoutes from "./routes/index.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: "*" }));
app.use(express.json());

// Serve static files (models, images) from frontend/public
app.use(express.static(path.join(__dirname, "../frontend/public")));

// Init socket.io
initSocket(httpServer);

// API routes
app.use("/api", apiRoutes);

app.get("/", (req, res) => {
  res.send("TikTok Game Backend running ✅");
});

const PORT = process.env.PORT || 8888;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});