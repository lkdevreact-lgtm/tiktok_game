/**
 * giftController.js
 * CRUD logic cho gifts (đọc/ghi gifts.json)
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GIFTS_DB  = join(__dirname, "../data/gifts.json");

function readGiftsDB() {
  try {
    if (!existsSync(GIFTS_DB)) return [];
    return JSON.parse(readFileSync(GIFTS_DB, "utf8"));
  } catch {
    return [];
  }
}

function writeGiftsDB(data) {
  writeFileSync(GIFTS_DB, JSON.stringify(data, null, 2), "utf8");
}

/**
 * GET /api/gifts
 * Trả về toàn bộ gifts
 */
export function getGifts(req, res) {
  try {
    res.json(readGiftsDB());
  } catch {
    res.status(500).json({ error: "Could not read gifts data" });
  }
}

/**
 * PUT /api/gifts/:giftId
 * Toggle active field của một gift → persist vào gifts.json
 * Body: { active: boolean }
 */
export function updateGift(req, res) {
  const giftId = parseInt(req.params.giftId);
  if (isNaN(giftId)) return res.status(400).json({ error: "Invalid giftId" });

  const db  = readGiftsDB();
  const idx = db.findIndex((g) => g.giftId === giftId);
  if (idx === -1) return res.status(404).json({ error: "Gift not found" });

  // Chỉ cho phép update active field
  if (req.body.active !== undefined) {
    db[idx].active = Boolean(req.body.active);
  }

  writeGiftsDB(db);
  res.json(db[idx]);
}
