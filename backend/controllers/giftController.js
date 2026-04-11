/**
 * giftController.js
 * CRUD logic cho gifts (Supabase)
 */
import supabase from "../config/supabase.js";

// ── Helpers: snake_case ↔ camelCase ────────────────────────────
function rowToGift(r) {
  return {
    giftId:         r.gift_id,
    giftName:       r.gift_name,
    image:          r.image,
    diamonds:       r.diamonds,
    maxRepeatCount: r.max_repeat_count,
    active:         r.active,
  };
}

/**
 * GET /api/gifts
 */
export async function getGifts(req, res) {
  try {
    const { data, error } = await supabase
      .from("gifts")
      .select("*")
      .order("diamonds", { ascending: true });

    if (error) throw error;
    res.json(data.map(rowToGift));
  } catch (err) {
    console.error("getGifts error:", err.message);
    res.status(500).json({ error: "Could not read gifts data" });
  }
}

/**
 * PUT /api/gifts/:giftId
 * Toggle active field
 */
export async function updateGift(req, res) {
  const giftId = parseInt(req.params.giftId);
  if (isNaN(giftId)) return res.status(400).json({ error: "Invalid giftId" });

  try {
    const updates = {};
    if (req.body.active !== undefined) updates.active = Boolean(req.body.active);

    const { data, error } = await supabase
      .from("gifts")
      .update(updates)
      .eq("gift_id", giftId)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Gift not found" });

    res.json(rowToGift(data));
  } catch (err) {
    console.error("updateGift error:", err.message);
    res.status(500).json({ error: "Could not update gift" });
  }
}
