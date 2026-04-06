import { useRef, useEffect, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { useGame } from "../store/gameStore";
import { useModels } from "../store/modelStore";
import GameScene from "../game/GameScene";
import Navbar from "./Navbar";
import socket from "../socket/socketClient";

export default function GameCanvas() {
  const {
    bossHp,
    gameStatus,
    setGameStatus,
    setBossHp,
    notifications,
    addNotification,
    resetGame,
  } = useGame();

  const { giftModelMap } = useModels();
  const spawnShipRef = useRef(null);
  const giftModelMapRef = useRef(giftModelMap);
  useEffect(() => {
    giftModelMapRef.current = giftModelMap;
  }, [giftModelMap]);

  const handleGiftSpawn = useCallback((fn) => {
    spawnShipRef.current = fn;
  }, []);
  useEffect(() => {
    const handleGift = (data) => {
      const {
        giftId,
        giftName,
        uniqueId,
        nickname,
        imgUrl,
        avatarUrl: senderAvatar,
        profilePictureUrl,
      } = data;

      const model = giftModelMapRef.current[String(giftId)];
      if (!model) return;

      addNotification({
        user: nickname || uniqueId || "Viewer",
        giftName,
        imgUrl,
      });

      const shipAvatar = senderAvatar || profilePictureUrl || "";
      const count = data.repeatCount || 1;
      const times = Math.min(count, 5);

      for (let i = 0; i < times; i++) {
        setTimeout(() => {
          spawnShipRef.current?.({
            type: model.id,
            damage: model.damage ?? 1,
            fireRate: model.fireRate ?? 1.0,
            nickname: nickname || uniqueId || "Viewer",
            avatarUrl: shipAvatar,
          });
        }, i * 150);
      }
    };

    socket.on("gift_received", handleGift);
    return () => socket.off("gift_received", handleGift);
  }, [addNotification]);

  // Dev: expose simulate helper
  useEffect(() => {
    window.__simulateGift = (giftId = 5655) => {
      const model = giftModelMapRef.current[String(giftId)];
      if (model && spawnShipRef.current) {
        addNotification({ user: "Test User", giftName: "Rose", imgUrl: null });
        spawnShipRef.current({
          type: model.id,
          damage: model.damage ?? 1,
          fireRate: model.fireRate ?? 1.0,
          nickname: "Test User",
          avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=test",
        });
      }
    };
    return () => {
      delete window.__simulateGift;
    };
  }, [addNotification]);

  const handleReset = () => {
    setBossHp(100);
    resetGame();
  };

  // Dev: simulate với ship đầu tiên có gift
  const handleSimulate = () => {
    const firstEntry = Object.values(giftModelMapRef.current)[0];
    const model = firstEntry || null;
    if (model && spawnShipRef.current) {
      addNotification({
        user: "Test User",
        giftName: "Test Gift",
        imgUrl: null,
      });
      spawnShipRef.current({
        type: model.id,
        damage: model.damage ?? 1,
        fireRate: model.fireRate ?? 1.0,
        nickname: "Test User",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=simulate",
      });
    } else {
      // Fallback: spawn ship_1 nếu chưa có mapping
      spawnShipRef.current?.({
        type: "spaceship_1",
        damage: 1,
        fireRate: 1.0,
        nickname: "Test User",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=simulate",
      });
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col">
      <Navbar />
      <div className="flex-1 relative mt-14">
        <Canvas
          camera={{ position: [0, 1.5, 9], fov: 55 }}
          gl={{ antialias: true, alpha: false }}
          style={{ background: "#000" }}
        >
          <GameScene onGiftSpawn={handleGiftSpawn} />
        </Canvas>

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
                <img
                  src={n.imgUrl}
                  alt={n.giftName}
                  className="w-6 h-6 rounded"
                />
              ) : (
                <span>🎁</span>
              )}
              <span
                className="font-semibold"
                style={{ color: "var(--color-cyan)" }}
              >
                {n.user}
              </span>
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
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0,245,255,0.22)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(0,245,255,0.12)";
          }}
        >
          🎁 SIMULATE GIFT
        </button>

        {/* ── Win / Lose Screen ── */}
        {(gameStatus === "win" || gameStatus === "lose") && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-5 z-20 animate-fade-in"
            style={{
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(8px)",
            }}
          >
            <div
              className={`text-5xl font-black animate-pulse-scale ${gameStatus === "win" ? "neon-success" : "neon-danger"}`}
              style={{
                fontFamily: "var(--font-game)",
                textShadow:
                  gameStatus === "win"
                    ? "0 0 40px var(--color-success)"
                    : "0 0 40px var(--color-danger)",
                color:
                  gameStatus === "win"
                    ? "var(--color-success)"
                    : "var(--color-danger)",
              }}
            >
              {gameStatus === "win" ? "🏆 YOU WIN!" : "💀 GAME OVER"}
            </div>

            <div
              className="text-[0.9rem] text-center"
              style={{
                color: "rgba(180,200,255,0.7)",
                fontFamily: "var(--font-ui)",
              }}
            >
              {gameStatus === "win"
                ? "The boss has been defeated! Your viewers are amazing! 🎉"
                : "The boss reached you... Try again! 💪"}
            </div>

            <button
              id="btn-reset-game"
              onClick={handleReset}
              className="rounded-lg px-8 py-3 text-black font-bold text-[0.85rem] uppercase tracking-widest cursor-pointer transition-all duration-150 hover:-translate-y-0.5"
              style={{
                fontFamily: "var(--font-game)",
                background:
                  "linear-gradient(135deg, var(--color-cyan), #0088aa)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 8px 30px rgba(0,245,255,0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              🔄 Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
