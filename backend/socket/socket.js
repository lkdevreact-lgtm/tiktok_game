import { Server } from "socket.io";
import { connectTikTok, disconnectTikTok } from "../services/tiktokService.js";

let io;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on("connect_tiktok", async ({ username }) => {
      console.log(`📡 Connecting to TikTok: @${username}`);
      try {
        await connectTikTok(username, socket.id, io);
        socket.emit("tiktok_connected", { username });
      } catch (err) {
        socket.emit("tiktok_error", { message: err.message });
      }
    });

    socket.on("update_gift_mapping", ({ mapping }) => {
      console.log(`🎁 Gift mapping updated by ${socket.id}`);
      // Store mapping per socket if needed
      socket._giftMapping = mapping;
    });

    socket.on("disconnect", () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
      disconnectTikTok(socket.id);
    });
  });

  return io;
}

export function getIO() {
  return io;
}
