/**
 * triggerController.js
 * CRUD cho triggers (Supabase)
 */
import supabase from "../config/supabase.js";

function rowToTrigger(r) {
  return {
    id:       r.id,
    type:     r.type,
    content:  r.content,
    shipId:   r.ship_id,
    quantity: r.quantity,
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

/**
 * GET /api/triggers
 */
export async function getTriggers(req, res) {
  try {
    const { data, error } = await supabase.from("triggers").select("*");
    if (error) throw error;
    res.json(data.map(rowToTrigger));
  } catch (err) {
    console.error("getTriggers error:", err.message);
    res.status(500).json({ error: "Could not read triggers" });
  }
}

/**
 * PUT /api/triggers
 * Body: array of trigger objects → replace all triggers
 */
export async function saveTriggers(req, res) {
  const triggers = req.body;
  if (!Array.isArray(triggers)) {
    return res.status(400).json({ error: "Body must be an array of triggers" });
  }

  try {
    // Delete all existing triggers
    await supabase.from("triggers").delete().neq("id", "");

    // Insert new ones
    if (triggers.length > 0) {
      const rows = triggers.map(triggerToRow);
      const { error } = await supabase.from("triggers").upsert(rows, { onConflict: "id" });
      if (error) throw error;
    }

    res.json({ ok: true, triggers });
  } catch (err) {
    console.error("saveTriggers error:", err.message);
    res.status(500).json({ error: "Could not save triggers" });
  }
}
