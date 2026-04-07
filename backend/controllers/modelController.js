/**
 * modelController.js
 * CRUD logic cho models (đọc/ghi models.json + upload GLB + upload icon image)
 */
import { readFileSync, unlinkSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import multer from "multer";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const MODELS_DIR = join(__dirname, "../../frontend/public/models");
export const ICONS_DIR  = join(__dirname, "../../frontend/public/images/icons");
export const MODELS_DB  = join(__dirname, "../data/models.json");

// Đảm bảo thư mục icons tồn tại
if (!existsSync(ICONS_DIR)) mkdirSync(ICONS_DIR, { recursive: true });

// ── JSON DB helpers ────────────────────────────────────────────
export function readDB() {
  try {
    if (!existsSync(MODELS_DB)) return [];
    return JSON.parse(readFileSync(MODELS_DB, "utf8"));
  } catch {
    return [];
  }
}

export function writeDB(data) {
  writeFileSync(MODELS_DB, JSON.stringify(data, null, 2), "utf8");
}

// ── Multer: GLB model upload ───────────────────────────────────
const glbStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, MODELS_DIR),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `custom_${Date.now()}_${safe}`);
  },
});

export const upload = multer({
  storage: glbStorage,
  limits: { fileSize: 150 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.originalname.toLowerCase().endsWith(".glb")) cb(null, true);
    else cb(new Error("Only .glb files are allowed"));
  },
});

// ── Multer: Icon image upload ──────────────────────────────────
const iconStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, ICONS_DIR),
  filename: (_req, file, cb) => {
    const ext  = file.originalname.split(".").pop().toLowerCase();
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `icon_${Date.now()}_${safe}`);
  },
});

export const uploadIcon = multer({
  storage: iconStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only image files are allowed (jpg, png, webp, gif, svg)"));
  },
});

// ── Multer: Upload GLB + optional icon in same request ─────────
export const uploadModelWithIcon = multer({
  storage: multer.diskStorage({
    destination: (_req, file, cb) => {
      if (file.fieldname === "file") cb(null, MODELS_DIR);
      else cb(null, ICONS_DIR);
    },
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      const prefix = file.fieldname === "file" ? "custom" : "icon";
      cb(null, `${prefix}_${Date.now()}_${safe}`);
    },
  }),
  limits: { fileSize: 150 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.fieldname === "file") {
      if (file.originalname.toLowerCase().endsWith(".glb")) cb(null, true);
      else cb(new Error("Only .glb files are allowed"));
    } else {
      const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
      if (allowed.includes(file.mimetype)) cb(null, true);
      else cb(new Error("Only image files allowed for icon"));
    }
  },
});

// ── Controllers ────────────────────────────────────────────────

/**
 * GET /api/models
 * Trả về toàn bộ models (built-in + custom)
 */
export function getModels(req, res) {
  res.json(readDB());
}

/**
 * POST /api/models/upload
 * Upload file .glb + append metadata vào models.json
 */
export function uploadModel(req, res) {
  // req.files khi dùng fields(), req.file khi dùng single()
  const glbFile  = req.files?.["file"]?.[0] ?? req.file;
  const iconFile = req.files?.["iconImage"]?.[0] ?? null;

  if (!glbFile) return res.status(400).json({ error: "No file uploaded" });

  const filename = glbFile.filename;
  const id       = filename.replace(".glb", "");

  // Parse gifts array từ JSON string hoặc array
  let gifts = [];
  try {
    const raw = req.body.gifts;
    if (raw) gifts = typeof raw === "string" ? JSON.parse(raw) : raw;
    gifts = gifts.map(Number).filter(Boolean);
  } catch { gifts = []; }

  // Icon URL nếu có upload ảnh
  let iconUrl = req.body.iconUrl || null;
  if (iconFile) iconUrl = `/images/icons/${iconFile.filename}`;

  const model = {
    id,
    filename,
    label:        req.body.label        || glbFile.originalname.replace(".glb", ""),
    emoji:        req.body.emoji        || "🚀",
    iconUrl,
    role:         req.body.role         || "ship",
    path:         `/models/${filename}`,
    scale:        parseFloat(req.body.scale)        || 0.25,
    gunTipOffset: parseFloat(req.body.gunTipOffset) || 0.4,
    rotationY:    parseFloat(req.body.rotationY)    || 0,
    bulletColor:  req.body.bulletColor  || "#00f5ff",
    damage:       parseInt(req.body.damage)         || 1,
    fireRate:     parseFloat(req.body.fireRate)     || 1.0,
    maxShots:     parseInt(req.body.maxShots)       || 20,
    gifts,
    builtIn:      false,
    active:       true,
    uploadedAt:   new Date().toISOString(),
  };

  const db = readDB();
  db.push(model);
  writeDB(db);

  res.json(model);
}

/**
 * POST /api/models/:id/icon
 * Upload ảnh icon cho model đã tồn tại
 */
export function uploadModelIcon(req, res) {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ error: "No icon file uploaded" });

  const db  = readDB();
  const idx = db.findIndex((m) => m.id === id);
  if (idx === -1) return res.status(404).json({ error: "Model not found" });

  // Xóa icon cũ nếu là custom
  if (db[idx].iconUrl && db[idx].iconUrl.startsWith("/images/icons/")) {
    const oldFile = join(ICONS_DIR, db[idx].iconUrl.replace("/images/icons/", ""));
    try { if (existsSync(oldFile)) unlinkSync(oldFile); } catch { /* ignore */ }
  }

  db[idx].iconUrl    = `/images/icons/${req.file.filename}`;
  db[idx].updatedAt  = new Date().toISOString();
  writeDB(db);

  res.json({ ok: true, iconUrl: db[idx].iconUrl });
}

/**
 * PUT /api/models/:id
 * Cập nhật thông số model → ghi lại models.json
 */
export function updateModel(req, res) {
  const { id } = req.params;
  const db  = readDB();
  const idx = db.findIndex((m) => m.id === id);
  if (idx === -1) return res.status(404).json({ error: "Model not found" });

  const allowed = [
    "label", "emoji", "iconUrl", "role", "scale", "gunTipOffset",
    "rotationY", "bulletColor", "damage", "fireRate", "maxShots", "gifts", "active",
    "healGifts", "shieldGifts",
  ];
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) db[idx][key] = req.body[key];
  });
  db[idx].updatedAt = new Date().toISOString();

  writeDB(db);
  res.json(db[idx]);
}

/**
 * POST /api/models/:id/glb
 * Thay thế file .glb của model (kể cả builtIn)
 */
export function replaceModelGLB(req, res) {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ error: "No GLB file uploaded" });

  const db  = readDB();
  const idx = db.findIndex((m) => m.id === id);
  if (idx === -1) return res.status(404).json({ error: "Model not found" });

  // Xóa file GLB cũ nếu là custom (không xóa built-in)
  if (!db[idx].builtIn && db[idx].filename) {
    try { unlinkSync(join(MODELS_DIR, db[idx].filename)); } catch { /* ignore */ }
  }

  db[idx].filename  = req.file.filename;
  db[idx].path      = `/models/${req.file.filename}`;
  db[idx].builtIn   = false; // sau khi thay GLB mới thì không còn là built-in nữa
  db[idx].updatedAt = new Date().toISOString();
  writeDB(db);

  res.json({ ok: true, path: db[idx].path, model: db[idx] });
}

/**
 * DELETE /api/models/:id
 * Xóa model khỏi models.json
 * Custom model: xóa file .glb vật lý
 * builtIn model: chỉ xóa khỏi DB (giữ file gốc)
 */
export function deleteModel(req, res) {
  const { id } = req.params;
  const db  = readDB();
  const idx = db.findIndex((m) => m.id === id);
  if (idx === -1) return res.status(404).json({ error: "Model not found" });

  const model = db[idx];

  // Xóa file GLB nếu là model custom
  if (!model.builtIn && model.filename) {
    try { unlinkSync(join(MODELS_DIR, model.filename)); } catch { /* ignore */ }
  }

  // Xóa icon nếu là icon custom
  if (model.iconUrl && model.iconUrl.startsWith("/images/icons/")) {
    const iconFile = join(ICONS_DIR, model.iconUrl.replace("/images/icons/", ""));
    try { if (existsSync(iconFile)) unlinkSync(iconFile); } catch { /* ignore */ }
  }

  db.splice(idx, 1);
  writeDB(db);

  res.json({ ok: true, deleted: id });
}
