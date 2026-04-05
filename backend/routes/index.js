import express from "express";
import { handleConnect, handleDisconnect } from "../controllers/connectController.js";
import { readFileSync, unlinkSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import multer from "multer";

const router = express.Router();
const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Paths ──────────────────────────────────────────────────────
const MODELS_DIR = join(__dirname, "../../frontend/public/models");
const MODELS_DB  = join(__dirname, "../data/models.json");

// ── JSON DB helpers ────────────────────────────────────────────
function readDB() {
  try {
    if (!existsSync(MODELS_DB)) return [];
    return JSON.parse(readFileSync(MODELS_DB, "utf8"));
  } catch {
    return [];
  }
}

function writeDB(data) {
  writeFileSync(MODELS_DB, JSON.stringify(data, null, 2), "utf8");
}

// ── Multer: upload GLB → frontend/public/models/ ──────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, MODELS_DIR),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `custom_${Date.now()}_${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 150 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.originalname.toLowerCase().endsWith(".glb")) cb(null, true);
    else cb(new Error("Only .glb files are allowed"));
  },
});

// ══════════════════════════════════════════════════════════════
// Gift data
// ══════════════════════════════════════════════════════════════
router.get("/gifts", (req, res) => {
  try {
    const gifts = JSON.parse(readFileSync(join(__dirname, "../data/gifts.json"), "utf8"));
    res.json(gifts);
  } catch {
    res.status(500).json({ error: "Could not read gifts data" });
  }
});

// ── TikTok connection ─────────────────────────────────────────
router.post("/connect", handleConnect);
router.post("/disconnect", handleDisconnect);

// ══════════════════════════════════════════════════════════════
// Models CRUD — tất cả đều đọc/ghi models.json
// ══════════════════════════════════════════════════════════════

/**
 * GET /api/models
 * Trả về toàn bộ models (built-in + custom)
 */
router.get("/models", (req, res) => {
  res.json(readDB());
});

/**
 * POST /api/models/upload
 * Upload file .glb + append metadata vào models.json
 * Body (multipart/form-data): file + label, emoji, role, scale, gunTipOffset, rotationY, bulletColor
 */
router.post("/models/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const filename = req.file.filename;
  const id       = filename.replace(".glb", "");

  const model = {
    id,
    filename,
    label:        req.body.label        || req.file.originalname.replace(".glb", ""),
    emoji:        req.body.emoji        || "🚀",
    role:         req.body.role         || "ship",
    path:         `/models/${filename}`,
    scale:        parseFloat(req.body.scale)        || 0.25,
    gunTipOffset: parseFloat(req.body.gunTipOffset) || 0.4,
    rotationY:    parseFloat(req.body.rotationY)    || 0,
    bulletColor:  req.body.bulletColor  || "#00f5ff",
    builtIn:      false,
    uploadedAt:   new Date().toISOString(),
  };

  const db = readDB();
  db.push(model);
  writeDB(db);

  res.json(model);
});

/**
 * PUT /api/models/:id
 * Cập nhật thông số model → ghi lại models.json
 */
router.put("/models/:id", (req, res) => {
  const { id } = req.params;
  const db  = readDB();
  const idx = db.findIndex((m) => m.id === id);
  if (idx === -1) return res.status(404).json({ error: "Model not found" });

  const allowed = ["label", "emoji", "role", "scale", "gunTipOffset", "rotationY", "bulletColor"];
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) db[idx][key] = req.body[key];
  });
  db[idx].updatedAt = new Date().toISOString();

  writeDB(db);
  res.json(db[idx]);
});

/**
 * DELETE /api/models/:id
 * Xóa model khỏi models.json
 * Nếu là custom (builtIn=false) thì xóa cả file .glb
 * Nếu là built-in thì chỉ xóa khỏi JSON (file .glb giữ nguyên)
 */
router.delete("/models/:id", (req, res) => {
  const { id } = req.params;
  const db  = readDB();
  const idx = db.findIndex((m) => m.id === id);
  if (idx === -1) return res.status(404).json({ error: "Model not found" });

  const model = db[idx];

  // Xóa file GLB chỉ với custom models
  if (!model.builtIn && model.filename) {
    try { unlinkSync(join(MODELS_DIR, model.filename)); } catch { /* bỏ qua nếu đã xóa */ }
  }

  db.splice(idx, 1);
  writeDB(db);

  res.json({ ok: true, deleted: id });
});

export default router;
