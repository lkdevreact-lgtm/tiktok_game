import { WebcastPushConnection } from "tiktok-live-connector";

// Map of socketId -> TikTok connection
const connections = new Map();

export async function connectTikTok(username, socketId, io) {
  // Disconnect existing connection for this socket
  if (connections.has(socketId)) {
    await disconnectTikTok(socketId);
  }

  const tiktok = new WebcastPushConnection(username, {
    processInitialData: false,
    enableExtendedGiftInfo: true,
    enableWebsocketUpgrade: true,
    requestPollingIntervalMs: 2000,
    clientParams: {
      app_language: "en-US",
      device_platform: "web",
    },
  });

  connections.set(socketId, tiktok);

  tiktok.on("gift", (data) => {
    // ── Streak filter ──────────────────────────────────────────
    // Gift streakable (giftType 1, VD: Rose) gửi 2 event cho 1 lần tap:
    //   Event 1: repeatEnd=false (streak bắt đầu)
    //   Event 2: repeatEnd=true  (streak kết thúc)
    // Chỉ xử lý event cuối (repeatEnd=true) để tránh gọi 2 lần.
    if (data.giftType === 1 && !data.repeatEnd) {
      return;
    }

    const giftData = {
      giftId: data.giftId,
      giftName: data.giftName,
      diamonds: data.diamondCount || 0,
      userId: data.userId,
      uniqueId: data.uniqueId,
      nickname: data.nickname,
      repeatCount: data.repeatCount || 1,
      imgUrl: data.giftPictureUrl || null,
      avatarUrl: data.profilePictureUrl || null,
    };

    console.log(
      `🎁 Gift from @${giftData.uniqueId}: ${giftData.giftName} x${giftData.repeatCount}`
    );

    // Emit to specific socket
    io.to(socketId).emit("gift_received", giftData);
  });

  tiktok.on("chat", (data) => {
    const chatData = {
      comment: data.comment || "",
      userId: data.userId,
      uniqueId: data.uniqueId,
      nickname: data.nickname,
      avatarUrl: data.profilePictureUrl || null,
    };
    io.to(socketId).emit("chat_received", chatData);
  });

  tiktok.on("like", (data) => {
    const likeData = {
      likeCount: data.likeCount || 1,         // số like lần này
      totalLikeCount: data.totalLikeCount || 0, // tổng like session
      userId: data.userId,
      uniqueId: data.uniqueId,
      nickname: data.nickname,
    };
    io.to(socketId).emit("like_received", likeData);
  });

  tiktok.on("disconnected", () => {
    console.log(`📡 TikTok disconnected for socket ${socketId}`);
    io.to(socketId).emit("tiktok_disconnected", {});
    connections.delete(socketId);
  });

  tiktok.on("error", (err) => {
    console.error(`⚠️ TikTok error for socket ${socketId}:`, err.message);
    io.to(socketId).emit("tiktok_error", { message: err.message });
  });

  // Connect and return
  const state = await tiktok.connect();
  console.log(`✅ Connected to @${username}, roomId: ${state.roomId}`);
  return state;
}

export async function disconnectTikTok(socketId) {
  if (connections.has(socketId)) {
    try {
      const tiktok = connections.get(socketId);
      tiktok.disconnect();
    } catch (_) { }
    connections.delete(socketId);
  }
}
