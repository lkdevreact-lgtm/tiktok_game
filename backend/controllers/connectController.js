import { connectTikTok, disconnectTikTok } from "../services/tiktokService.js";
import { getIO } from "../socket/socket.js";
import { loadSettingsForUser } from "./userSettingsController.js";

export async function handleConnect(req, res) {
  const { username, socketId } = req.body;

  if (!username || !socketId) {
    return res.status(400).json({ error: "username and socketId are required" });
  }

  const io = getIO();
  if (!io) {
    return res.status(500).json({ error: "Socket server not initialized" });
  }

  try {
    const state = await connectTikTok(username, socketId, io);

    // Load user settings nếu có
    const userSettings = await loadSettingsForUser(username);

    io.to(socketId).emit("tiktok_connected", { username });
    return res.json({ success: true, roomId: state.roomId, userSettings });
  } catch (err) {
    console.error("Connect error:", err.message);
    io.to(socketId).emit("tiktok_error", { message: err.message });
    return res.status(500).json({ error: err.message });
  }
}

export async function handleDisconnect(req, res) {
  const { socketId } = req.body;
  if (!socketId) return res.status(400).json({ error: "socketId required" });

  await disconnectTikTok(socketId);
  return res.json({ success: true });
}

