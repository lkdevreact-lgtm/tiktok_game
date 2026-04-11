/**
 * migrate-to-supabase.js
 * Chạy 1 lần để chuyển dữ liệu từ JSON files → Supabase tables.
 * Usage: node migrate-to-supabase.js
 */
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

function readJSON(file) {
  const p = join(__dirname, "data", file);
  if (!existsSync(p)) return [];
  return JSON.parse(readFileSync(p, "utf8"));
}

// ── camelCase → snake_case helper for models ─────────────────
function modelToRow(m) {
  return {
    id:                 m.id,
    filename:           m.filename || null,
    label:              m.label,
    emoji:              m.emoji || "🚀",
    icon_url:           m.iconUrl || null,
    role:               m.role || "ship",
    path:               m.path || null,
    scale:              m.scale ?? 0.25,
    gun_tip_offset:     m.gunTipOffset ?? 0.4,
    rotation_y:         m.rotationY ?? 0,
    bullet_color:       m.bulletColor || "#00f5ff",
    damage:             m.damage ?? 1,
    fire_rate:          m.fireRate ?? 1.0,
    max_shots:          m.maxShots ?? 20,
    gifts:              m.gifts || [],
    heal_gifts:         m.healGifts || [],
    shield_gifts:       m.shieldGifts || [],
    laser_gifts:        m.laserGifts || [],
    missile_gifts:      m.missileGifts || [],
    nuclear_gifts:      m.nuclearGifts || [],
    weapons:            m.weapons || {},
    heal_amount:        m.healAmount ?? 3,
    shield_duration:    m.shieldDuration ?? 5,
    nuclear_kill_count: m.nuclearKillCount ?? 0,
    built_in:           m.builtIn ?? false,
    active:             m.active ?? true,
    trigger_code:       m.triggerCode || null,
    uploaded_at:        m.uploadedAt || new Date().toISOString(),
    updated_at:         m.updatedAt || new Date().toISOString(),
  };
}

function giftToRow(g) {
  return {
    gift_id:          g.giftId,
    gift_name:        g.giftName,
    image:            g.image || null,
    diamonds:         g.diamonds ?? 0,
    max_repeat_count: g.maxRepeatCount ?? 1,
    active:           g.active ?? false,
  };
}

function triggerToRow(t) {
  return {
    id:       t.id,
    type:     t.type,
    content:  t.content || null,
    ship_id:  t.shipId || null,
    quantity: t.quantity ?? 1,
  };
}

async function migrate() {
  console.log("🚀 Starting migration...\n");

  // ── Models ──────────────────────────────────────────────────
  const models = readJSON("models.json");
  if (models.length) {
    const rows = models.map(modelToRow);
    const { error } = await supabase.from("models").upsert(rows, { onConflict: "id" });
    if (error) console.error("❌ Models error:", error.message);
    else console.log(`✅ Models: ${rows.length} records migrated`);
  }

  // ── Gifts ───────────────────────────────────────────────────
  const gifts = readJSON("gifts.json");
  if (gifts.length) {
    const rows = gifts.map(giftToRow);
    const { error } = await supabase.from("gifts").upsert(rows, { onConflict: "gift_id" });
    if (error) console.error("❌ Gifts error:", error.message);
    else console.log(`✅ Gifts: ${rows.length} records migrated`);
  }

  // ── Triggers ────────────────────────────────────────────────
  const triggers = readJSON("triggers.json");
  if (triggers.length) {
    const rows = triggers.map(triggerToRow);
    const { error } = await supabase.from("triggers").upsert(rows, { onConflict: "id" });
    if (error) console.error("❌ Triggers error:", error.message);
    else console.log(`✅ Triggers: ${rows.length} records migrated`);
  }

  console.log("\n🎉 Migration complete!");
}

migrate().catch(console.error);
