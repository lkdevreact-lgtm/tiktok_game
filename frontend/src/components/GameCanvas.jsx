import { useRef, useEffect, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { useGame } from "../store/gameStore";
import GameScene from "../game/GameScene";
import SidebarSetting from "./SidebarSetting";
import socket from "../socket/socketClient";

export default function GameCanvas() {
  const {
    bossHp, gameStatus, setGameStatus, setBossHp,
    giftMapping, username, shipCount,
    notifications, addNotification, resetGame,
  } = useGame();

  const spawnShipRef = useRef(null);

  const handleGiftSpawn = useCallback((fn) => {
    spawnShipRef.current = fn;
  }, []);

  // Listen for TikTok gifts via socket
  useEffect(() => {
    const handleGift = (data) => {
      const { giftId, giftName, uniqueId, nickname, imgUrl } = data;
      const config = giftMapping[giftId];
      if (!config || !config.active) return;

      addNotification({ user: nickname || uniqueId || "Viewer", giftName, imgUrl });

      const count = data.repeatCount || 1;
      const times = Math.min(count, 5);
      for (let i = 0; i < times; i++) {
        setTimeout(() => {
          spawnShipRef.current?.({
            type: config.spaceship || "spaceship_1",
            damage: config.damage || 1,
            fireRate: config.fireRate || 1.0,
            nickname: nickname || uniqueId || "Viewer",
            avatarUrl: imgUrl || "",
          });
        }, i * 150);
      }
    };
    socket.on("gift_received", handleGift);
    return () => socket.off("gift_received", handleGift);
  }, [giftMapping, addNotification]);

  // Dev: expose simulate helper
  useEffect(() => {
    window.__simulateGift = (giftId = 5655) => {
      const config = giftMapping[giftId];
      if (config && config.active && spawnShipRef.current) {
        addNotification({ user: "Test User", giftName: "Rose", imgUrl: null });
        spawnShipRef.current({
          type: config.spaceship || "spaceship_1",
          damage: config.damage || 1,
          fireRate: config.fireRate || 1.0,
          nickname: "Test User",
          avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=test",
        });
      }
    };
    return () => { delete window.__simulateGift; };
  }, [giftMapping, addNotification]);

  const handleReset = () => { setBossHp(100); resetGame(); };

  const hpPercent = Math.max(0, Math.min(100, bossHp));
  const hpColor   = hpPercent > 50 ? "#ff3366" : hpPercent > 25 ? "#ff6600" : "#ff0000";

  const handleSimulate = () => {
    const config = giftMapping[5655];
    if (config && spawnShipRef.current) {
      addNotification({ user: "Test User", giftName: "Rose", imgUrl: null });
      spawnShipRef.current({
        type: config.spaceship || "spaceship_1",
        damage: config.damage || 1,
        fireRate: config.fireRate || 1.0,
        nickname: "Test User",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=simulate",
      });
    }
  };

  return (
    <div className="fixed inset-0 flex">
      {/* 3D Canvas area */}
      <div className="flex-1 relative">
        <Canvas
          camera={{ position: [0, 1.5, 9], fov: 55 }}
          gl={{ antialias: true, alpha: false }}
          style={{ background: "#000" }}
        >
          <GameScene onGiftSpawn={handleGiftSpawn} />
        </Canvas>

        {/* ── HUD ── */}
        <div className="absolute top-0 left-0 right-0 flex items-center gap-4 px-5 py-4 pointer-events-none z-10">
          {/* Boss HP */}
          <div className="flex-1 max-w-[500px]">
            <div
              className="text-[0.65rem] uppercase tracking-widest mb-1"
              style={{ fontFamily: "var(--font-game)", color: "var(--color-danger)" }}
            >
              ⚠️ BOSS HP
            </div>
            <div
              className="h-[14px] rounded-[7px] overflow-hidden"
              style={{ background: "rgba(255,51,102,0.15)", border: "1px solid rgba(255,51,102,0.4)" }}
            >
              <div
                className="h-full rounded-[7px] transition-[width] duration-300 ease-out boss-hp-glow"
                style={{
                  width: `${hpPercent}%`,
                  background: `linear-gradient(90deg, ${hpColor}, ${hpColor}88)`,
                }}
              />
            </div>
            <div
              className="text-[0.65rem] mt-0.5"
              style={{ color: "rgba(255,80,80,0.7)", fontFamily: "var(--font-game)" }}
            >
              {hpPercent.toFixed(1)}%
            </div>
          </div>

          <div
            className="text-[0.75rem] whitespace-nowrap"
            style={{ fontFamily: "var(--font-game)", color: "var(--color-cyan)" }}
          >
            🚀 Ships: {shipCount}
          </div>
          <div
            className="text-[0.65rem] whitespace-nowrap"
            style={{ fontFamily: "var(--font-game)", color: "rgba(180,200,255,0.5)" }}
          >
            @{username}
          </div>
        </div>

        {/* ── Gift Notification Feed ── */}
        <div className="absolute bottom-5 left-5 flex flex-col-reverse gap-2 pointer-events-none z-[15] max-h-60 overflow-hidden">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="flex items-center gap-2 px-[14px] py-2 rounded-[30px] text-[0.8rem] animate-slide-in animate-fade-out"
              style={{
                background: "rgba(5,15,30,0.88)",
                border: "1px solid var(--color-border)",
                backdropFilter: "blur(8px)",
              }}
            >
              {n.imgUrl ? (
                <img src={n.imgUrl} alt={n.giftName} className="w-6 h-6 rounded" />
              ) : (
                <span>🎁</span>
              )}
              <span className="font-semibold" style={{ color: "var(--color-cyan)" }}>{n.user}</span>
              <span style={{ color: "rgba(180,200,255,0.6)" }}>sent</span>
              <span style={{ color: "var(--color-gold)" }}>{n.giftName}</span>
            </div>
          ))}
        </div>

        {/* ── Dev: Simulate Gift Button ── */}
        <button
          id="btn-simulate-gift"
          onClick={handleSimulate}
          className="absolute bottom-5 right-[316px] rounded-lg px-4 py-2 text-[0.65rem] tracking-widest cursor-pointer z-[15] transition-colors duration-200"
          style={{
            background: "rgba(0,245,255,0.12)",
            border: "1px solid rgba(0,245,255,0.35)",
            color: "var(--color-cyan)",
            fontFamily: "var(--font-game)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,245,255,0.22)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,245,255,0.12)"; }}
        >
          🎁 SIMULATE GIFT
        </button>

        {/* ── Win / Lose Screen ── */}
        {(gameStatus === "win" || gameStatus === "lose") && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-5 z-20 animate-fade-in"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          >
            <div
              className={`text-5xl font-black animate-pulse-scale ${gameStatus === "win" ? "neon-success" : "neon-danger"}`}
              style={{
                fontFamily: "var(--font-game)",
                textShadow: gameStatus === "win"
                  ? "0 0 40px var(--color-success)"
                  : "0 0 40px var(--color-danger)",
                color: gameStatus === "win" ? "var(--color-success)" : "var(--color-danger)",
              }}
            >
              {gameStatus === "win" ? "🏆 YOU WIN!" : "💀 GAME OVER"}
            </div>

            <div className="text-[0.9rem] text-center" style={{ color: "rgba(180,200,255,0.7)", fontFamily: "var(--font-ui)" }}>
              {gameStatus === "win"
                ? "The boss has been defeated! Your viewers are amazing! 🎉"
                : "The boss reached you... Try again! 💪"}
            </div>

            <button
              id="btn-reset-game"
              onClick={handleReset}
              className="rounded-lg px-8 py-3 text-black font-bold text-[0.85rem] uppercase tracking-widest cursor-pointer
                         transition-all duration-150 hover:-translate-y-0.5"
              style={{
                fontFamily: "var(--font-game)",
                background: "linear-gradient(135deg, var(--color-cyan), #0088aa)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,245,255,0.5)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
            >
              🔄 Play Again
            </button>
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <SidebarSetting />
    </div>
  );
}
