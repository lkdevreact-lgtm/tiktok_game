import { useRef, useEffect, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { useGame } from "../hooks/useGame";
import GameScene from "../game/GameScene";
import Navbar from "./Navbar";
import socket from "../socket/socketClient";
import { useModels } from "../hooks/useModels";
import { useTTS } from "../hooks/useTTS";
import { IMAGES } from "../utils/constant";
import BossGiftPanel from "./BossGiftPanel";
import ShipGiftPanel from "./ShipGiftPanel";
import LeaderboardPanel from "./LeaderboardPanel";
import { usePanelSettings } from "../hooks/usePanelSettings";

export default function GameCanvas() {
  const { gameStatus, setBossHp, notifications, addNotification, resetGame } =
    useGame();
  const { settings } = usePanelSettings();
  const {
    giftModelMap,
    commentTriggerMap,
    tapTriggers,
    commentBossTriggerMap,
    tapBossTriggers,
    followTriggers,
    bossHealGiftMap,
    bossShieldGiftMap,
    bossLaserGiftMap,
    bossMissileGiftMap,
    bossNuclearGiftMap,
  } = useModels();

  const spawnShipRef = useRef(null);
  const bossHealRef = useRef(null);
  const bossShieldRef = useRef(null);
  const giftModelMapRef = useRef(giftModelMap);
  const bossHealGiftMapRef = useRef(bossHealGiftMap);
  const bossShieldGiftMapRef = useRef(bossShieldGiftMap);
  const bossLaserGiftMapRef = useRef(bossLaserGiftMap);
  const bossMissileGiftMapRef = useRef(bossMissileGiftMap);
  const bossNuclearGiftMapRef = useRef(bossNuclearGiftMap);
  const commentTriggerMapRef = useRef(commentTriggerMap);
  const tapTriggersRef = useRef(tapTriggers);
  const followTriggersRef = useRef(followTriggers);
  const commentBossTriggerMapRef = useRef(commentBossTriggerMap);
  const tapBossTriggersRef = useRef(tapBossTriggers);

  // Tổng like tích lũy trong phiên (reset khi reconnect)
  const likeAccumulatorRef = useRef(0);
  // Theo dõi đã spawn bao nhiêu con ở mỗi mốc tap trigger
  const tapSpawnedCountRef = useRef({});
  // Theo dõi boss skill tap trigger đã fire mỗi ngưỡng
  const tapBossSpawnedCountRef = useRef({});

  const bossLaserTriggerRef = useRef(null);
  const bossMissileTriggerRef = useRef(null);
  const bossNuclearTriggerRef = useRef(null);

  useEffect(() => {
    giftModelMapRef.current = giftModelMap;
  }, [giftModelMap]);
  useEffect(() => {
    bossHealGiftMapRef.current = bossHealGiftMap;
  }, [bossHealGiftMap]);
  useEffect(() => {
    bossShieldGiftMapRef.current = bossShieldGiftMap;
  }, [bossShieldGiftMap]);
  useEffect(() => {
    bossLaserGiftMapRef.current = bossLaserGiftMap;
  }, [bossLaserGiftMap]);
  useEffect(() => {
    bossMissileGiftMapRef.current = bossMissileGiftMap;
  }, [bossMissileGiftMap]);
  useEffect(() => {
    bossNuclearGiftMapRef.current = bossNuclearGiftMap;
  }, [bossNuclearGiftMap]);
  useEffect(() => {
    commentTriggerMapRef.current = commentTriggerMap;
  }, [commentTriggerMap]);
  useEffect(() => {
    tapTriggersRef.current = tapTriggers;
    tapSpawnedCountRef.current = {};
  }, [tapTriggers]);
  useEffect(() => {
    followTriggersRef.current = followTriggers;
  }, [followTriggers]);
  useEffect(() => {
    commentBossTriggerMapRef.current = commentBossTriggerMap;
  }, [commentBossTriggerMap]);
  useEffect(() => {
    tapBossTriggersRef.current = tapBossTriggers;
    tapBossSpawnedCountRef.current = {};
  }, [tapBossTriggers]);

  const handleGiftSpawn = useCallback((fn) => {
    spawnShipRef.current = fn;
  }, []);
  const handleBossHeal = useCallback((fn) => {
    bossHealRef.current = fn;
  }, []);
  const handleBossShield = useCallback((fn) => {
    bossShieldRef.current = fn;
  }, []);
  const handleBossLaserTrigger = useCallback((fn) => {
    bossLaserTriggerRef.current = fn;
  }, []);
  const handleBossMissileTrigger = useCallback((fn) => {
    bossMissileTriggerRef.current = fn;
  }, []);
  const handleBossNuclearTrigger = useCallback((fn) => {
    bossNuclearTriggerRef.current = fn;
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
      if (bossLaserGiftMapRef.current[String(giftId)]) {
        addNotification({
          user: nickname || uniqueId || "Viewer",
          giftName,
          imgUrl,
          type: "attack",
        });
        bossLaserTriggerRef.current?.();
        return;
      }
      if (bossMissileGiftMapRef.current[String(giftId)]) {
        addNotification({
          user: nickname || uniqueId || "Viewer",
          giftName,
          imgUrl,
          type: "attack",
        });
        bossMissileTriggerRef.current?.();
        return;
      }
      if (bossNuclearGiftMapRef.current[String(giftId)]) {
        addNotification({
          user: nickname || uniqueId || "Viewer",
          giftName,
          imgUrl,
          type: "attack",
        });
        bossNuclearTriggerRef.current?.();
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

  // ── TTS: speak on gift & member join ─────────────────────────
  const { speakWelcome, speakGift } = useTTS();
  const speakWelcomeRef = useRef(speakWelcome);
  const speakGiftRef = useRef(speakGift);
  useEffect(() => { speakWelcomeRef.current = speakWelcome; }, [speakWelcome]);
  useEffect(() => { speakGiftRef.current = speakGift; }, [speakGift]);

  // TTS for gifts
  useEffect(() => {
    const handleGiftTTS = (data) => {
      const name = data.nickname || data.uniqueId || "Viewer";
      const count = data.repeatCount || 1;
      const gift = data.giftName || "quà";
      speakGiftRef.current?.(name, count, gift);
    };
    socket.on("gift_received", handleGiftTTS);
    return () => socket.off("gift_received", handleGiftTTS);
  }, []);

  // TTS for member join
  useEffect(() => {
    const handleMemberJoin = (data) => {
      const name = data.nickname || data.uniqueId || "Viewer";
      speakWelcomeRef.current?.(name);
    };
    socket.on("member_join", handleMemberJoin);
    return () => socket.off("member_join", handleMemberJoin);
  }, []);

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

  // ── Listen for TikTok comments (comment trigger) ─────────────
  // Ship spawned by comment → hiển thị avatar + tên user bình thường
  useEffect(() => {
    const handleChat = (data) => {
      const comment = (data.comment || "").trim();
      if (!comment) return;

      // Kiểm tra xem comment có khớp trigger code không
      const entry = commentTriggerMapRef.current[comment];
      if (!entry) return;

      const { model } = entry;
      const userName = data.nickname || data.uniqueId || "Viewer";
      const userAvatar = data.avatarUrl || "";

      addNotification({
        user: userName,
        giftName: `CMT: "${comment}"`,
        imgUrl: null,
        type: "trigger",
      });

      spawnShipRef.current?.({
        type: model.id,
        damage: model.damage ?? 1,
        fireRate: model.fireRate ?? 1.0,
        maxShots: model.maxShots ?? 20,
        nickname: userName, // Hiển thị tên user thật
        avatarUrl: userAvatar, // Hiển thị avatar user thật
      });
    };

    socket.on("chat_received", handleChat);
    return () => socket.off("chat_received", handleChat);
  }, [addNotification]);

  // ── Listen for TikTok likes (tap trigger) ────────────────────
  // Ship spawned by tap → KHÔNG có avatar + tên (vì là tổng tim tích lũy)
  useEffect(() => {
    const handleLike = (data) => {
      const totalLikes = data.totalLikeCount || 0;
      likeAccumulatorRef.current = totalLikes;

      // Duyệt qua tất cả tap triggers
      const currentTriggers = tapTriggersRef.current;
      currentTriggers.forEach((t) => {
        const { quantity, model } = t;
        if (!quantity || quantity <= 0) return;

        // Tính số lần đã đạt ngưỡng
        const totalSpawns = Math.floor(totalLikes / quantity);
        const key = t.shipId + "_" + quantity;
        const alreadySpawned = tapSpawnedCountRef.current[key] || 0;

        if (totalSpawns > alreadySpawned) {
          const newSpawns = totalSpawns - alreadySpawned;
          tapSpawnedCountRef.current[key] = totalSpawns;

          for (let i = 0; i < Math.min(newSpawns, 5); i++) {
            setTimeout(() => {
              addNotification({
                user: "❤️ Tap",
                giftName: `${totalLikes} tim`,
                imgUrl: null,
                type: "trigger",
              });

              spawnShipRef.current?.({
                type: model.id,
                damage: model.damage ?? 1,
                fireRate: model.fireRate ?? 1.0,
                maxShots: model.maxShots ?? 20,
                nickname: "", // KHÔNG hiển thị tên
                avatarUrl: "", // KHÔNG hiển thị avatar
              });
            }, i * 200);
          }
        }
      });
    };

    socket.on("like_received", handleLike);
    return () => socket.off("like_received", handleLike);
  }, [addNotification]);

  // ── Listen for TikTok follows (follow trigger) ────────────────
  useEffect(() => {
    const handleFollow = (data) => {
      const currentTriggers = followTriggersRef.current;
      if (!currentTriggers || currentTriggers.length === 0) return;

      const userName = data.nickname || data.uniqueId || "Viewer";
      const userAvatar = data.avatarUrl || "";

      currentTriggers.forEach((t) => {
        const { model } = t;
        if (!model) return;

        addNotification({
          user: userName,
          giftName: "Followed!",
          imgUrl: null,
          type: "trigger",
        });

        spawnShipRef.current?.({
          type: model.id,
          damage: model.damage ?? 1,
          fireRate: model.fireRate ?? 1.0,
          maxShots: model.maxShots ?? 20,
          nickname: userName,
          avatarUrl: userAvatar,
        });
      });
    };

    socket.on("follow_received", handleFollow);
    return () => socket.off("follow_received", handleFollow);
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
          orthographic
          camera={{ position: [0, 0, 10], zoom: 80 }}
          gl={{ antialias: true, alpha: false }}
          style={{ background: "#000" }}
        >
          <GameScene
            onGiftSpawn={handleGiftSpawn}
            onBossHeal={handleBossHeal}
            onBossShield={handleBossShield}
            onBossLaser={handleBossLaserTrigger}
            onBossMissile={handleBossMissileTrigger}
            onBossNuclear={handleBossNuclearTrigger}
          />
        </Canvas>

        {/* Gift info panels */}
        <BossGiftPanel visible={settings.showBossGiftPanel} />
        <ShipGiftPanel visible={settings.showShipGiftPanel} />
        <LeaderboardPanel visible={settings.showTopDonorsPanel} />

        <div className="absolute bottom-5 left-5 flex flex-col-reverse gap-2 pointer-events-none z-[15] max-h-60 overflow-hidden">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="
                flex items-center gap-2 px-3.5 py-2 rounded-[30px] text-[0.8rem]
                animate-slide-in animate-fade-out
                bg-[rgba(5,15,30,0.88)] border border-border] backdrop-blur-sm
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
              <span className="font-semibold text-cyan-1">{n.user}</span>
              <span className="text-white/60">sent</span>
              <span className="text-gold">{n.giftName}</span>
            </div>
          ))}
        </div>

        {/* Dev Test Buttons */}
        <div className="absolute bottom-5 right-5 flex gap-2 z-[15]">
          <button
            id="btn-simulate-gift"
            onClick={handleSimulate}
            className="
              uppercase rounded-lg px-4 py-2 text-[0.65rem] tracking-widest cursor-pointer transition-colors duration-200
              bg-[rgba(0,245,255,0.12)] border border-[rgba(0,245,255,0.35)] text-cyan-1
              hover:bg-[rgba(0,245,255,0.22)]
            "
          >
            Test Ship ( User )
          </button>

          <button
            id="btn-test-heal"
            onClick={() => bossHealRef.current?.()}
            className="
              uppercase rounded-lg px-4 py-2 text-[0.65rem] tracking-widest cursor-pointer transition-colors duration-200
              bg-[rgba(74,222,128,0.12)] border border-[rgba(74,222,128,0.35)] text-green-400
              hover:bg-[rgba(74,222,128,0.22)] sm:block hidden
            "
          >
            Test Heal ( Boss )
          </button>

          <button
            onClick={() => bossShieldRef.current?.()}
            className="sm:block hidden uppercase rounded-lg px-4 py-2 text-[0.65rem] tracking-widest cursor-pointer bg-[rgba(0,245,255,0.06)] border border-[rgba(0,245,255,0.5)] text-cyan-400 hover:bg-[rgba(0,245,255,0.18)]"
          >
            Shield ( Boss )
          </button>

          <button
            onClick={() => bossLaserTriggerRef.current?.()}
            className="sm:block hidden uppercase rounded-lg px-4 py-2 text-[0.65rem] tracking-widest cursor-pointer bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.35)] text-red-500 hover:bg-[rgba(239,68,68,0.22)]"
          >
            Laser ( Boss )
          </button>

          <button
            onClick={() => bossMissileTriggerRef.current?.()}
            className="sm:block hidden uppercase rounded-lg px-4 py-2 text-[0.65rem] tracking-widest cursor-pointer bg-[rgba(251,146,60,0.12)] border border-[rgba(251,146,60,0.35)] text-orange-400 hover:bg-[rgba(251,146,60,0.22)]"
          >
            Missile ( Boss )
          </button>

          <button
            onClick={() => bossNuclearTriggerRef.current?.()}
            className="uppercase rounded-lg px-4 py-2 text-[0.65rem] tracking-widest cursor-pointer bg-[rgba(250,204,21,0.12)] border border-[rgba(250,204,21,0.35)] text-yellow-400 hover:bg-[rgba(250,204,21,0.22)]"
          >
            Ultimate ( Boss )
          </button>
        </div>

        {/* Win / Lose overlay */}
        {isOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 z-20 animate-fade-in bg-black/70 backdrop-blur-sm">
            <div
              className={`text-5xl font-black animate-pulse-scale ${isWin ? "neon-success text-success [text-shadow:0_0_40px_var(--color-success)]" : "neon-danger text-danger [text-shadow:0_0_40px_var(--color-danger)]"}`}
            >
              {isWin ? "YOU WIN!" : "GAME OVER"}
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
              <img
                src={IMAGES.GAME_BUTTON}
                alt=""
                className="w-[60%] m-auto object-contain"
              />
              <p
                className="absolute inset-0 top-5.5 flex items-center text-xl justify-center font-semibold text-white"
                style={{
                  textShadow:
                    "0 0 8px rgba(255,255,255,0.8), 0 2px 4px rgba(0,0,0,0.9)",
                }}
              >
                Play Again
              </p>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
