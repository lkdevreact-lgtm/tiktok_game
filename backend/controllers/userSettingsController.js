/**
 * userSettingsController.js
 * Lưu & load settings theo username (model, trigger, boss)
 */
import supabase from "../config/supabase.js";

/**
 * GET /api/user-settings/:username
 * Trả settings của username (hoặc null nếu chưa có)
 */
export async function getUserSettings(req, res) {
  const { username } = req.params;
  if (!username) return res.status(400).json({ error: "username is required" });

  try {
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    if (error) throw error;

    if (!data) return res.json(null);

    res.json({
      username: data.username,
      activeBossId: data.active_boss_id,
      triggers: data.triggers || [],
      modelStates: data.model_states || {},
      updatedAt: data.updated_at,
    });
  } catch (err) {
    console.error("getUserSettings error:", err.message);
    res.status(500).json({ error: "Could not read user settings" });
  }
}

/**
 * PUT /api/user-settings/:username
 * Body: { activeBossId, triggers, modelStates }
 */
export async function saveUserSettings(req, res) {
  const { username } = req.params;
  if (!username) return res.status(400).json({ error: "username is required" });

  const { activeBossId, triggers, modelStates } = req.body;

  try {
    const row = {
      username,
      active_boss_id: activeBossId || null,
      triggers: triggers || [],
      model_states: modelStates || {},
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("user_settings")
      .upsert(row, { onConflict: "username" });

    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error("saveUserSettings error:", err.message);
    res.status(500).json({ error: "Could not save user settings" });
  }
}

/**
 * Load settings cho username — gọi nội bộ (từ connectController)
 * Trả object hoặc null
 */
export async function loadSettingsForUser(username) {
  try {
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      username: data.username,
      activeBossId: data.active_boss_id,
      triggers: data.triggers || [],
      modelStates: data.model_states || {},
    };
  } catch (err) {
    console.error("loadSettingsForUser error:", err.message);
    return null;
  }
}
