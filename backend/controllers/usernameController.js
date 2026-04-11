/**
 * usernameController.js
 * Quản lý lịch sử username đã connect
 */
import supabase from "../config/supabase.js";

/**
 * Upsert username — gọi khi connect TikTok
 * Nếu username đã tồn tại → cập nhật last_seen
 * Nếu chưa → insert mới
 */
export async function saveUsername(username) {
  try {
    const { error } = await supabase
      .from("usernames")
      .upsert(
        { username, last_seen: new Date().toISOString() },
        { onConflict: "username" }
      );
    if (error) throw error;
  } catch (err) {
    console.error("saveUsername error:", err.message);
  }
}

/**
 * GET /api/usernames
 * Trả danh sách tất cả username đã connect, sắp xếp theo last_seen mới nhất
 */
export async function getUsernames(req, res) {
  try {
    const { data, error } = await supabase
      .from("usernames")
      .select("*")
      .order("last_seen", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("getUsernames error:", err.message);
    res.status(500).json({ error: "Could not read usernames" });
  }
}
