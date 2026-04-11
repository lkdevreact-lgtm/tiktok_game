/**
 * donationController.js
 * Ghi nhận donations và trả bảng xếp hạng leaderboard
 */
import supabase from "../config/supabase.js";

/**
 * Ghi 1 record donation — gọi từ tiktokService khi nhận gift event
 */
export async function recordDonation({
  streamerUsername,
  viewerUniqueId,
  viewerNickname,
  viewerAvatar,
  giftId,
  giftName,
  diamonds,
  repeatCount,
}) {
  const totalDiamonds = (diamonds || 0) * (repeatCount || 1);
  try {
    const { error } = await supabase.from("donations").insert({
      streamer_username: streamerUsername,
      viewer_unique_id: viewerUniqueId,
      viewer_nickname: viewerNickname || null,
      viewer_avatar: viewerAvatar || null,
      gift_id: giftId,
      gift_name: giftName,
      diamonds: diamonds || 0,
      repeat_count: repeatCount || 1,
      total_diamonds: totalDiamonds,
    });
    if (error) throw error;
  } catch (err) {
    console.error("recordDonation error:", err.message);
  }
}

/**
 * GET /api/leaderboard/:username
 * Trả bảng xếp hạng viewer donate cho streamer, aggregate theo viewer_unique_id
 */
export async function getLeaderboard(req, res) {
  const { username } = req.params;
  if (!username) return res.status(400).json({ error: "username is required" });

  try {
    // Dùng RPC hoặc raw query để aggregate
    // Supabase JS client không hỗ trợ GROUP BY nên dùng rpc
    const { data, error } = await supabase.rpc("get_leaderboard", {
      p_streamer: username,
    });

    if (error) {
      // Fallback: nếu chưa tạo rpc function thì dùng cách thủ công
      console.warn("RPC not found, using fallback query:", error.message);
      return await getLeaderboardFallback(username, res);
    }

    res.json(data);
  } catch (err) {
    console.error("getLeaderboard error:", err.message);
    res.status(500).json({ error: "Could not get leaderboard" });
  }
}

/**
 * Fallback: lấy tất cả donations rồi aggregate ở JS
 */
async function getLeaderboardFallback(username, res) {
  try {
    const { data, error } = await supabase
      .from("donations")
      .select("*")
      .eq("streamer_username", username);

    if (error) throw error;

    // Aggregate by viewer_unique_id
    const map = {};
    (data || []).forEach((d) => {
      const key = d.viewer_unique_id;
      if (!map[key]) {
        map[key] = {
          viewer_unique_id: key,
          viewer_nickname: d.viewer_nickname,
          viewer_avatar: d.viewer_avatar,
          total_diamonds: 0,
          donation_count: 0,
        };
      }
      map[key].total_diamonds += d.total_diamonds || 0;
      map[key].donation_count += 1;
      // Cập nhật nickname/avatar nếu mới hơn
      if (d.viewer_nickname) map[key].viewer_nickname = d.viewer_nickname;
      if (d.viewer_avatar) map[key].viewer_avatar = d.viewer_avatar;
    });

    const leaderboard = Object.values(map)
      .sort((a, b) => b.total_diamonds - a.total_diamonds)
      .slice(0, 100); // top 100

    res.json(leaderboard);
  } catch (err) {
    console.error("getLeaderboardFallback error:", err.message);
    res.status(500).json({ error: "Could not get leaderboard" });
  }
}
