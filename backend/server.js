import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { initSocket } from "./socket/socket.js";
import apiRoutes from "./routes/index.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: "*" }));
app.use(express.json());

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