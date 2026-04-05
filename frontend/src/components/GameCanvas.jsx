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

  // Receive spawn function from GameScene
  const handleGiftSpawn = useCallback((fn) => {
    spawnShipRef.current = fn;
  }, []);

  // ── Listen for TikTok gifts via socket ──
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
          if (spawnShipRef.current) {
            spawnShipRef.current({
              type: config.spaceship || "spaceship_1",
              damage: config.damage || 1,
              fireRate: config.fireRate || 1.0,
            });
          }
        }, i * 150);
      }
    };

    socket.on("gift_received", handleGift);
    return () => socket.off("gift_received", handleGift);
  }, [giftMapping, addNotification]);

  // ── Dev: expose simulate helper via console ──
  useEffect(() => {
    window.__simulateGift = (giftId = 5655) => {
      const config = giftMapping[giftId];
      if (config && config.active && spawnShipRef.current) {
        addNotification({ user: "Test User", giftName: "Rose", imgUrl: null });
        spawnShipRef.current({
          type: config.spaceship || "spaceship_1",
          damage: config.damage || 1,
          fireRate: config.fireRate || 1.0,
        });
      }
    };
    return () => { delete window.__simulateGift; };
  }, [giftMapping, addNotification]);

  const handleReset = () => {
    setBossHp(100);
    resetGame();
  };

  const hpPercent = Math.max(0, Math.min(100, bossHp));
  const hpColor = hpPercent > 50 ? "#ff3366" : hpPercent > 25 ? "#ff6600" : "#ff0000";

  const handleSimulate = () => {
    const config = giftMapping[5655];
    if (config && spawnShipRef.current) {
      addNotification({ user: "Test User", giftName: "Rose", imgUrl: null });
      spawnShipRef.current({
        type: config.spaceship || "spaceship_1",
        damage: config.damage || 1,
        fireRate: config.fireRate || 1.0,
      });
    }
  };

  return (
    <div className="game-wrapper">
      {/* 3D Canvas */}
      <div className="game-canvas-area">
        <Canvas
          camera={{ position: [0, 1.5, 9], fov: 55 }}
          gl={{ antialias: true, alpha: false }}
          style={{ background: "#000" }}
        >
          <GameScene onGiftSpawn={handleGiftSpawn} />
        </Canvas>

        {/* ── HUD ── */}
        <div className="hud">
          <div className="boss-hp-bar-wrap">
            <div className="hud-boss-label">⚠️ BOSS HP</div>
            <div className="boss-hp-bar-bg">
              <div
                className="boss-hp-bar-fill"
                style={{
                  width: `${hpPercent}%`,
                  background: `linear-gradient(90deg, ${hpColor}, ${hpColor}88)`,
                }}
              />
            </div>
            <div style={{ fontSize: "0.65rem", color: "rgba(255,80,80,0.7)", marginTop: "2px", fontFamily: "var(--font-game)" }}>
              {hpPercent.toFixed(1)}%
            </div>
          </div>

          <div className="hud-ships-count">🚀 Ships: {shipCount}</div>
          <div className="hud-username">@{username}</div>
        </div>

        {/* ── Gift Notification Feed ── */}
        <div className="gift-feed">
          {notifications.map((n) => (
            <div key={n.id} className="gift-notification">
              {n.imgUrl ? (
                <img src={n.imgUrl} alt={n.giftName} />
              ) : (
                <span>🎁</span>
              )}
              <span className="notif-user">{n.user}</span>
              <span style={{ color: "rgba(180,200,255,0.6)" }}>sent</span>
              <span className="notif-gift">{n.giftName}</span>
            </div>
          ))}
        </div>

        {/* ── Dev: Simulate Gift Button ── */}
        <button
          id="btn-simulate-gift"
          onClick={handleSimulate}
          style={{
            position: "absolute",
            bottom: 20,
            right: 316,
            background: "rgba(0,245,255,0.12)",
            border: "1px solid rgba(0,245,255,0.35)",
            borderRadius: "8px",
            padding: "8px 16px",
            color: "var(--color-cyan)",
            fontFamily: "var(--font-game)",
            fontSize: "0.65rem",
            cursor: "pointer",
            letterSpacing: "0.08em",
            zIndex: 15,
            transition: "background 0.2s",
          }}
          onMouseEnter={e => e.target.style.background = "rgba(0,245,255,0.22)"}
          onMouseLeave={e => e.target.style.background = "rgba(0,245,255,0.12)"}
        >
          🎁 SIMULATE GIFT
        </button>

        {/* ── Win / Lose Screen ── */}
        {(gameStatus === "win" || gameStatus === "lose") && (
          <div className="game-result-overlay">
            <div className={`result-title ${gameStatus}`}>
              {gameStatus === "win" ? "🏆 YOU WIN!" : "💀 GAME OVER"}
            </div>
            <div style={{ color: "rgba(180,200,255,0.7)", fontFamily: "var(--font-ui)", fontSize: "0.9rem", textAlign: "center" }}>
              {gameStatus === "win"
                ? "The boss has been defeated! Your viewers are amazing! 🎉"
                : "The boss reached you... Try again! 💪"}
            </div>
            <button id="btn-reset-game" className="btn-reset" onClick={handleReset}>
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
