import express from "express";
import { handleConnect, handleDisconnect } from "../controllers/connectController.js";
import { readFileSync, readdirSync, unlinkSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import multer from "multer";

const router = express.Router();
const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Multer: lưu GLB vào frontend/public/models/ ──
const MODELS_DIR = join(__dirname, "../../frontend/public/models");
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, MODELS_DIR),
  filename: (_req, file, cb) => {
    // Sanitize + prefix timestamp để tránh trùng tên
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `custom_${Date.now()}_${safeName}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 150 * 1024 * 1024 }, // 150 MB
  fileFilter: (_req, file, cb) => {
    if (file.originalname.toLowerCase().endsWith(".glb")) cb(null, true);
    else cb(new Error("Only .glb files are allowed"));
  },
});

// Serve gift data
router.get("/gifts", (req, res) => {
  try {
    const giftsPath = join(__dirname, "../data/gifts.json");
    const gifts = JSON.parse(readFileSync(giftsPath, "utf8"));
    res.json(gifts);
  } catch (err) {
    res.status(500).json({ error: "Could not read gifts data" });
  }
});

// TikTok connection
router.post("/connect", handleConnect);
router.post("/disconnect", handleDisconnect);

// ── Upload GLB model ──
router.post("/upload-model", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const url = `/models/${req.file.filename}`;
  res.json({ url, filename: req.file.filename, originalName: req.file.originalname });
});

// ── List custom models ──
router.get("/models", (req, res) => {
  try {
    const files = readdirSync(MODELS_DIR)
      .filter((f) => f.startsWith("custom_") && f.endsWith(".glb"))
      .map((f) => ({ filename: f, url: `/models/${f}` }));
    res.json(files);
  } catch {
    res.json([]);
  }
});

// ── Delete custom model ──
router.delete("/models/:filename", (req, res) => {
  const { filename } = req.params;
  if (!filename.startsWith("custom_") || !filename.endsWith(".glb")) {
    return res.status(403).json({ error: "Can only delete custom models" });
  }
  try {
    unlinkSync(join(MODELS_DIR, filename));
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: "File not found" });
  }
});

export default router;
