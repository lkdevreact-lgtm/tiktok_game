import { useRef, useEffect, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { useGame } from "../hooks/useGame";
import GameScene from "../game/GameScene";
import Navbar from "./Navbar";
import socket from "../socket/socketClient";
import { useModels } from "../hooks/useModels";
import { IMAGES } from "../utils/constant";
import BossGiftPanel from "./BossGiftPanel";
import ShipGiftPanel from "./ShipGiftPanel";

export default function GameCanvas() {
  const { gameStatus, setBossHp, notifications, addNotification, resetGame } =
    useGame();
  const { giftModelMap, bossHealGiftMap, bossShieldGiftMap } = useModels();

  const spawnShipRef = useRef(null);
  const bossHealRef = useRef(null);
  const bossShieldRef = useRef(null);
  const giftModelMapRef = useRef(giftModelMap);
  const bossHealGiftMapRef = useRef(bossHealGiftMap);
  const bossShieldGiftMapRef = useRef(bossShieldGiftMap);

  useEffect(() => {
    giftModelMapRef.current = giftModelMap;
  }, [giftModelMap]);
  useEffect(() => {
    bossHealGiftMapRef.current = bossHealGiftMap;
  }, [bossHealGiftMap]);
  useEffect(() => {
    bossShieldGiftMapRef.current = bossShieldGiftMap;
  }, [bossShieldGiftMap]);

  const handleGiftSpawn = useCallback((fn) => {
    spawnShipRef.current = fn;
  }, []);
  const handleBossHeal = useCallback((fn) => {
    bossHealRef.current = fn;
  }, []);
  const handleBossShield = useCallback((fn) => {
    bossShieldRef.current = fn;
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

      if (bossHealGiftMapRef.current[String(giftId)]) {
        addNotification({
          user: nickname || uniqueId || "Viewer",
          giftName,
          imgUrl,
          type: "heal",
        });
        bossHealRef.current?.();
        return;
      }
      if (bossShieldGiftMapRef.current[String(giftId)]) {
        addNotification({
          user: nickname || uniqueId || "Viewer",
          giftName,
          imgUrl,
          type: "shield",
        });
        bossShieldRef.current?.();
        return;
      }

      const model = giftModelMapRef.current[String(giftId)];
      if (!model) return;

      addNotification({
        user: nickname || uniqueId || "Viewer",
        giftName,
        imgUrl,
      });

      const shipAvatar = senderAvatar || profilePictureUrl || "";
      const times = Math.min(data.repeatCount || 1, 5);
      for (let i = 0; i < times; i++) {
        setTimeout(() => {
          spawnShipRef.current?.({
            type: model.id,
            damage: model.damage ?? 1,
            fireRate: model.fireRate ?? 1.0,
            maxShots: model.maxShots ?? 20,
            nickname: nickname || uniqueId || "Viewer",
            avatarUrl: shipAvatar,
          });
        }, i * 150);
      }
    };

    socket.on("gift_received", handleGift);
    return () => socket.off("gift_received", handleGift);
  }, [addNotification]);

  useEffect(() => {
    window.__simulateGift = (giftId = 5655) => {
      const model = giftModelMapRef.current[String(giftId)];
      if (model && spawnShipRef.current) {
        addNotification({ user: "Test User", giftName: "Rose", imgUrl: null });
        spawnShipRef.current({
          type: model.id,
          damage: model.damage ?? 1,
          fireRate: model.fireRate ?? 1.0,
          maxShots: model.maxShots ?? 20,
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

  const handleSimulate = () => {
    const model = Object.values(giftModelMapRef.current)[0] || null;
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
        maxShots: model.maxShots ?? 20,
        nickname: "Test User",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=simulate",
      });
    } else {
      spawnShipRef.current?.({
        type: "spaceship_1",
        damage: 1,
        fireRate: 1.0,
        maxShots: 20,
        nickname: "Test User",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=simulate",
      });
    }
  };

  const isOver = gameStatus === "win" || gameStatus === "lose";
  const isWin = gameStatus === "win";

  return (
    <div className="fixed inset-0 flex flex-col">
      <Navbar />

      <div className="flex-1 relative mt-14">
        <Canvas
          camera={{ position: [0, 1.5, 9], fov: 55 }}
          gl={{ antialias: true, alpha: false }}
          style={{ background: "#000" }}
        >
          <GameScene
            onGiftSpawn={handleGiftSpawn}
            onBossHeal={handleBossHeal}
            onBossShield={handleBossShield}
          />
        </Canvas>

        {/* Gift info panels */}
        <BossGiftPanel />
        <ShipGiftPanel />

        <div className="absolute bottom-5 left-5 flex flex-col-reverse gap-2 pointer-events-none z-[15] max-h-60 overflow-hidden">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="
                flex items-center gap-2 px-[14px] py-2 rounded-[30px] text-[0.8rem]
                animate-slide-in animate-fade-out
                bg-[rgba(5,15,30,0.88)] border border-[var(--color-border)] backdrop-blur-[8px]
              "
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
              <span className="font-semibold text-[var(--color-cyan)]">
                {n.user}
              </span>
              <span className="text-white/60">sent</span>
              <span className="text-[var(--color-gold)]">{n.giftName}</span>
            </div>
          ))}
        </div>

        {/* Dev Test Buttons */}
        <div className="absolute bottom-5 right-[316px] flex gap-2 z-[15]">
          <button
            id="btn-simulate-gift"
            onClick={handleSimulate}
            className="
              uppercase rounded-lg px-4 py-2 text-[0.65rem] tracking-widest cursor-pointer
              font-[var(--font-game)] transition-colors duration-200
              bg-[rgba(0,245,255,0.12)] border border-[rgba(0,245,255,0.35)] text-[var(--color-cyan)]
              hover:bg-[rgba(0,245,255,0.22)]
            "
          >
            🎁 Test Gift
          </button>

          <button
            id="btn-test-heal"
            onClick={() => bossHealRef.current?.()}
            className="
              uppercase rounded-lg px-4 py-2 text-[0.65rem] tracking-widest cursor-pointer
              font-[var(--font-game)] transition-colors duration-200
              bg-[rgba(74,222,128,0.12)] border border-[rgba(74,222,128,0.35)] text-green-400
              hover:bg-[rgba(74,222,128,0.22)]
            "
          >
            💚 Test Heal
          </button>

          <button
            id="btn-test-shield"
            onClick={() => bossShieldRef.current?.()}
            className="
              uppercase rounded-lg px-4 py-2 text-[0.65rem] tracking-widest cursor-pointer
              font-[var(--font-game)] transition-colors duration-200
              bg-[rgba(0,245,255,0.06)] border border-[rgba(0,245,255,0.5)] text-cyan-400
              hover:bg-[rgba(0,245,255,0.18)]
            "
          >
            🛡️ Test Shield
          </button>
        </div>

        {/* Win / Lose overlay */}
        {isOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 z-20 animate-fade-in bg-black/70 backdrop-blur-[8px]">
            <div
              className={`text-5xl font-black animate-pulse-scale font-[var(--font-game)] ${isWin ? "neon-success" : "neon-danger"}`}
              style={{
                color: isWin ? "var(--color-success)" : "var(--color-danger)",
                textShadow: isWin
                  ? "0 0 40px var(--color-success)"
                  : "0 0 40px var(--color-danger)",
              }}
            >
              {isWin ? "🏆 YOU WIN!" : "💀 GAME OVER"}
            </div>

            <div className="text-[0.9rem] text-center text-white/70 font-[var(--font-ui)]">
              {isWin
                ? "The boss has been defeated! Your viewers are amazing! 🎉"
                : "The boss reached you... Try again! 💪"}
            </div>

            <button
              id="btn-reset-game"
              onClick={handleReset}
              className="relative hover:scale-105 cursor-pointer transition-transform duration-300 ease-in-out"
            >
              <img src={IMAGES.GAME_BUTTON} alt="" className="w-[60%] m-auto object-contain"/>
              <p className="absolute inset-0 top-5.5 flex items-center text-xl justify-center font-semibold text-white"
                style={{ textShadow: "0 0 8px rgba(255,255,255,0.8), 0 2px 4px rgba(0,0,0,0.9)" }}>
                Play Again
              </p>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
