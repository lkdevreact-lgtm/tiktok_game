/**
 * triggerController.js
 * CRUD cho triggers (đọc/ghi triggers.json)
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const TRIGGERS_DB = join(__dirname, "../data/triggers.json");

function readTriggers() {
  try {
    if (!existsSync(TRIGGERS_DB)) return [];
    return JSON.parse(readFileSync(TRIGGERS_DB, "utf8"));
  } catch {
    return [];
  }
}

function writeTriggers(data) {
  writeFileSync(TRIGGERS_DB, JSON.stringify(data, null, 2), "utf8");
}

/**
 * GET /api/triggers
 */
export function getTriggers(req, res) {
  res.json(readTriggers());
}

/**
 * PUT /api/triggers
 * Body: array of trigger objects
 */
export function saveTriggers(req, res) {
  const triggers = req.body;
  if (!Array.isArray(triggers)) {
    return res.status(400).json({ error: "Body must be an array of triggers" });
  }
  writeTriggers(triggers);
  res.json({ ok: true, triggers });
}
