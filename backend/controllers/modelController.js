/**
 * modelController.js
 * CRUD logic cho models (Supabase + multer file upload)
 */
import { unlinkSync, existsSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import multer from "multer";
import supabase from "../config/supabase.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const MODELS_DIR = join(__dirname, "../../frontend/public/models");
export const ICONS_DIR  = join(__dirname, "../../frontend/public/images/icons");

// Đảm bảo thư mục icons tồn tại
if (!existsSync(ICONS_DIR)) mkdirSync(ICONS_DIR, { recursive: true });

// ── Unique filename helper ─────────────────────────────────────
function uniqueName(dir, name) {
  const safe = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  if (!existsSync(join(dir, safe))) return safe;
  const dot = safe.lastIndexOf(".");
  const base = dot > 0 ? safe.slice(0, dot) : safe;
  const ext  = dot > 0 ? safe.slice(dot) : "";
  let i = 1;
  while (existsSync(join(dir, `${base}_${i}${ext}`))) i++;
  return `${base}_${i}${ext}`;
}

// ── snake_case ↔ camelCase helpers ─────────────────────────────
function rowToModel(r) {
  return {
    id:               r.id,
    filename:         r.filename,
    label:            r.label,
    emoji:            r.emoji,
    iconUrl:          r.icon_url,
    role:             r.role,
    path:             r.path,
    scale:            r.scale,
    gunTipOffset:     r.gun_tip_offset,
    rotationY:        r.rotation_y,
    bulletColor:      r.bullet_color,
    damage:           r.damage,
    fireRate:         r.fire_rate,
    maxShots:         r.max_shots,
    gifts:            r.gifts,
    healGifts:        r.heal_gifts,
    shieldGifts:      r.shield_gifts,
    laserGifts:       r.laser_gifts,
    missileGifts:     r.missile_gifts,
    nuclearGifts:     r.nuclear_gifts,
    weapons:          r.weapons,
    healAmount:       r.heal_amount,
    shieldDuration:   r.shield_duration,
    nuclearKillCount: r.nuclear_kill_count,
    builtIn:          r.built_in,
    active:           r.active,
    triggerCode:      r.trigger_code,
    uploadedAt:       r.uploaded_at,
    updatedAt:        r.updated_at,
  };
}

// Map camelCase body keys → snake_case DB columns
const ALLOWED_FIELDS = {
  label:            "label",
  emoji:            "emoji",
  iconUrl:          "icon_url",
  role:             "role",
  scale:            "scale",
  gunTipOffset:     "gun_tip_offset",
  rotationY:        "rotation_y",
  bulletColor:      "bullet_color",
  damage:           "damage",
  fireRate:         "fire_rate",
  maxShots:         "max_shots",
  gifts:            "gifts",
  active:           "active",
  healGifts:        "heal_gifts",
  shieldGifts:      "shield_gifts",
  laserGifts:       "laser_gifts",
  missileGifts:     "missile_gifts",
  nuclearGifts:     "nuclear_gifts",
  healAmount:       "heal_amount",
  shieldDuration:   "shield_duration",
  nuclearKillCount: "nuclear_kill_count",
  triggerCode:      "trigger_code",
};

// ── Multer: GLB model upload ───────────────────────────────────
const glbStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, MODELS_DIR),
  filename: (_req, file, cb) => {
    cb(null, uniqueName(MODELS_DIR, file.originalname));
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
    cb(null, uniqueName(ICONS_DIR, file.originalname));
  },
});

export const uploadIcon = multer({
  storage: iconStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
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
      const dir = file.fieldname === "file" ? MODELS_DIR : ICONS_DIR;
      cb(null, uniqueName(dir, file.originalname));
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
 */
export async function getModels(req, res) {
  try {
    const { data, error } = await supabase
      .from("models")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    res.json(data.map(rowToModel));
  } catch (err) {
    console.error("getModels error:", err.message);
    res.status(500).json({ error: "Could not read models" });
  }
}

/**
 * POST /api/models/upload
 */
export async function uploadModel(req, res) {
  const glbFile  = req.files?.["file"]?.[0] ?? req.file;
  const iconFile = req.files?.["iconImage"]?.[0] ?? null;

  if (!glbFile) return res.status(400).json({ error: "No file uploaded" });

  const filename = glbFile.filename;
  const id       = filename.replace(".glb", "");

  let gifts = [];
  try {
    const raw = req.body.gifts;
    if (raw) gifts = typeof raw === "string" ? JSON.parse(raw) : raw;
    gifts = gifts.map(Number).filter(Boolean);
  } catch { gifts = []; }

  let iconUrl = req.body.iconUrl || null;
  if (iconFile) iconUrl = `/images/icons/${iconFile.filename}`;

  const row = {
    id,
    filename,
    label:              req.body.label || glbFile.originalname.replace(".glb", ""),
    emoji:              req.body.emoji || "🚀",
    icon_url:           iconUrl,
    role:               req.body.role || "ship",
    path:               `/models/${filename}`,
    scale:              parseFloat(req.body.scale) || 0.25,
    gun_tip_offset:     parseFloat(req.body.gunTipOffset) || 0.4,
    rotation_y:         parseFloat(req.body.rotationY) || 0,
    bullet_color:       req.body.bulletColor || "#00f5ff",
    damage:             parseInt(req.body.damage) || 1,
    fire_rate:          parseFloat(req.body.fireRate) || 1.0,
    max_shots:          parseInt(req.body.maxShots) || 20,
    gifts,
    heal_gifts:         [],
    shield_gifts:       [],
    laser_gifts:        [],
    missile_gifts:      [],
    nuclear_gifts:      [],
    heal_amount:        parseInt(req.body.healAmount) || 3,
    shield_duration:    parseInt(req.body.shieldDuration) || 5,
    nuclear_kill_count: parseInt(req.body.nuclearKillCount) || 0,
    built_in:           false,
    active:             true,
    uploaded_at:        new Date().toISOString(),
    updated_at:         new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from("models")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    res.json(rowToModel(data));
  } catch (err) {
    console.error("uploadModel error:", err.message);
    res.status(500).json({ error: "Could not save model" });
  }
}

/**
 * POST /api/models/:id/icon
 */
export async function uploadModelIcon(req, res) {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ error: "No icon file uploaded" });

  try {
    // Get current model to delete old icon
    const { data: current } = await supabase
      .from("models")
      .select("icon_url")
      .eq("id", id)
      .single();

    if (!current) return res.status(404).json({ error: "Model not found" });

    // Delete old icon file if custom
    if (current.icon_url && current.icon_url.startsWith("/images/icons/")) {
      const oldFile = join(ICONS_DIR, current.icon_url.replace("/images/icons/", ""));
      try { if (existsSync(oldFile)) unlinkSync(oldFile); } catch { /* ignore */ }
    }

    const newIconUrl = `/images/icons/${req.file.filename}`;
    const { error } = await supabase
      .from("models")
      .update({ icon_url: newIconUrl, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
    res.json({ ok: true, iconUrl: newIconUrl });
  } catch (err) {
    console.error("uploadModelIcon error:", err.message);
    res.status(500).json({ error: "Could not update icon" });
  }
}

/**
 * PUT /api/models/:id
 */
export async function updateModel(req, res) {
  const { id } = req.params;

  const updates = {};
  for (const [camel, snake] of Object.entries(ALLOWED_FIELDS)) {
    if (req.body[camel] !== undefined) updates[snake] = req.body[camel];
  }
  updates.updated_at = new Date().toISOString();

  try {
    const { data, error } = await supabase
      .from("models")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Model not found" });

    res.json(rowToModel(data));
  } catch (err) {
    console.error("updateModel error:", err.message);
    res.status(500).json({ error: "Could not update model" });
  }
}

/**
 * POST /api/models/:id/glb
 */
export async function replaceModelGLB(req, res) {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ error: "No GLB file uploaded" });

  try {
    const { data: current } = await supabase
      .from("models")
      .select("filename, built_in")
      .eq("id", id)
      .single();

    if (!current) return res.status(404).json({ error: "Model not found" });

    // Delete old GLB if custom
    if (!current.built_in && current.filename) {
      try { unlinkSync(join(MODELS_DIR, current.filename)); } catch { /* ignore */ }
    }

    const { data, error } = await supabase
      .from("models")
      .update({
        filename:   req.file.filename,
        path:       `/models/${req.file.filename}`,
        built_in:   false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.json({ ok: true, path: data.path, model: rowToModel(data) });
  } catch (err) {
    console.error("replaceModelGLB error:", err.message);
    res.status(500).json({ error: "Could not replace GLB" });
  }
}

/**
 * DELETE /api/models/:id
 */
export async function deleteModel(req, res) {
  const { id } = req.params;

  try {
    const { data: model } = await supabase
      .from("models")
      .select("*")
      .eq("id", id)
      .single();

    if (!model) return res.status(404).json({ error: "Model not found" });

    // Delete GLB file if custom
    if (!model.built_in && model.filename) {
      try { unlinkSync(join(MODELS_DIR, model.filename)); } catch { /* ignore */ }
    }

    // Delete icon if custom
    if (model.icon_url && model.icon_url.startsWith("/images/icons/")) {
      const iconFile = join(ICONS_DIR, model.icon_url.replace("/images/icons/", ""));
      try { if (existsSync(iconFile)) unlinkSync(iconFile); } catch { /* ignore */ }
    }

    const { error } = await supabase.from("models").delete().eq("id", id);
    if (error) throw error;

    res.json({ ok: true, deleted: id });
  } catch (err) {
    console.error("deleteModel error:", err.message);
    res.status(500).json({ error: "Could not delete model" });
  }
}
