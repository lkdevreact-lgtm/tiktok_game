import { useRef, useEffect, useCallback, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Stars, Html } from "@react-three/drei";
import * as THREE from "three";
import { useGame } from "../hooks/useGame";
import { createBullet, createExplosion } from "./models";
import BossModel from "./BossModel";
import { useShipModels } from "../hooks/useShipModels";
import { useModels } from "../hooks/useModels";
import { SETTINGS_GAME } from "../utils/constant";


const ATTACK_POOL_SIZE = 10;
const attackPool = Array.from({ length: ATTACK_POOL_SIZE }, () => {
  const a = new Audio("/sound/sound_attack.mp3");
  a.volume = 0.35;
  return a;
});
let attackPoolIdx = 0;
function playAttackSound() {
  const audio = attackPool[attackPoolIdx];
  attackPoolIdx = (attackPoolIdx + 1) % ATTACK_POOL_SIZE;
  audio.currentTime = 0;
  audio.play().catch(() => { });
}

export default function GameScene({ onGiftSpawn, onBossHeal, onBossShield }) {
  const { scene } = useThree();
  const { setBossHp, setGameStatus, setShipCount, setBossShield, gameStatus } =
    useGame();
  const { activeBossModel, shipModels } = useModels();
  const { cloneShipMesh, getBulletColor } = useShipModels();
  // Giữ ref để dùng trong callback không stale
  const shipModelsRef = useRef(shipModels);
  useEffect(() => {
    shipModelsRef.current = shipModels;
  }, [shipModels]);

  // ── Refs game state (sync, không trigger re-render) ──────────
  const bossRef = useRef(null);
  const bossHpRef = useRef(100);
  const shipsRef = useRef([]);
  const bulletsRef = useRef([]);
  const explosionsRef = useRef([]);
  const gameActiveRef = useRef(false);
  const statusRef = useRef("idle");
  const prevGameStatus = useRef("idle");
  const spawnShipFn = useRef(null);
  // === Material flash system ===
  // Lưu materials GỐC 1 lần duy nhất (không bị ghi đè bởi flash)
  const bossOrigMatsRef = useRef(null); // { mesh, mat }[] - chỉ lưu 1 lần khi boss mount
  // Trạng thái flash hiện tại: "none" | "red" | "green"
  const bossFlashStateRef = useRef("none");
  const bossFlashTimeoutRef = useRef(null);
  const bossGreenFlashRef = useRef(null);
  // Shield state
  const bossShieldActiveRef = useRef(false);
  const bossShieldTimerRef = useRef(null);
  const bossShieldEndRef = useRef(0); // timestamp kết thúc shield (ms)
  const healCooldownRef = useRef(false); // chống spam heal
  // Heal sound
  const healAudio = useRef(new Audio("/sound/heal_sound.mp3"));
  healAudio.current.volume = 0.5;
  // Slot-based spawn: chia màn hình thành NUM_Y_SLOTS rãnh, tàu mới vào rãnh tiếp theo
  const NUM_Y_SLOTS = 10;
  const Y_RANGE = 8; // tổng chiều cao an toàn (~±2.2)
  const spawnSlotRef = useRef(0);

  const [shipLabels, setShipLabels] = useState([]);

  // ── Spawn Ship ───────────────────────────────────────────────
  const spawnShip = useCallback(
    ({ type, damage, fireRate, nickname = "", avatarUrl = "" }) => {
      if (shipsRef.current.length >= SETTINGS_GAME.MAX_SHIPS) {
        const oldest = shipsRef.current.shift();
        // Đánh dấu ship cũ là dead trước khi remove khỏi scene
        if (oldest.aliveRef) oldest.aliveRef.current = false;
        scene.remove(oldest.mesh);
        setShipLabels((prev) => prev.filter((l) => l.id !== oldest.id));
      }

      const mesh = cloneShipMesh(type);

      // Slot-based Y: chia đều từ trên xuống dưới, xoay vòng qua các rãnh
      const slotIdx = spawnSlotRef.current % NUM_Y_SLOTS;
      spawnSlotRef.current += 1;
      const slotY = -Y_RANGE / 2 + (slotIdx + 0.5) * (Y_RANGE / NUM_Y_SLOTS);
      const y = slotY + (Math.random() - 0.5) * 0.3; // jitter nhỏ cho tự nhiên
      const z = (Math.random() - 0.5) * 2.0; // ~±1.0, tránh bị cắt ngang
      mesh.position.set(7.0, y, z);

      scene.add(mesh);

      const id = `ship-${Date.now()}-${Math.random()}`;
      const aliveRef = { current: true };
      shipsRef.current.push({
        id,
        mesh,
        aliveRef,
        type,
        damage,
        fireRate,
        fireTimer: Math.random(),
        baseY: y,
        hoverPhase: Math.random() * Math.PI * 2,
        nickname,
        avatarUrl,
      });

      setShipLabels((prev) => [
        ...prev,
        { id, mesh, aliveRef, nickname, avatarUrl },
      ]);
      setShipCount(shipsRef.current.length);
    },
    [scene, setShipCount, cloneShipMesh],
  );

  useEffect(() => {
    spawnShipFn.current = spawnShip;
  }, [spawnShip]);

  useEffect(() => {
    if (onGiftSpawn) onGiftSpawn((args) => spawnShipFn.current?.(args));
  }, [onGiftSpawn]);

  // ── Boss Heal ────────────────────────────────────────────────
  useEffect(() => {
    if (!onBossHeal) return;
    onBossHeal(() => {
      // Debounce: chống spam, chỉ cho hồi mỗi 500ms
      if (healCooldownRef.current) return;
      healCooldownRef.current = true;
      setTimeout(() => {
        healCooldownRef.current = false;
      }, 500);

      const HEAL_AMOUNT = 3; // +3% HP mỗi lần
      bossHpRef.current = Math.min(100, bossHpRef.current + HEAL_AMOUNT);
      setBossHp(Math.round(bossHpRef.current * 10) / 10);

      // Phát sound hồi máu
      healAudio.current.currentTime = 0;
      healAudio.current.play().catch(() => { });

      // Flash xanh lá
      const boss = bossRef.current;
      if (!boss) return;

      // Đảm bảo origMats đã được lưu trước khi flash
      if (!bossOrigMatsRef.current) {
        const saved = [];
        boss.traverse((child) => {
          if (child.isMesh)
            saved.push({ mesh: child, mat: child.material.clone() });
        });
        bossOrigMatsRef.current = saved;
      }

      // Clear timeout flash đỏ + flash xanh cũ
      if (bossFlashTimeoutRef.current)
        clearTimeout(bossFlashTimeoutRef.current);
      if (bossGreenFlashRef.current) clearTimeout(bossGreenFlashRef.current);

      // Áp flash xanh
      bossFlashStateRef.current = "green";
      boss.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshBasicMaterial({
            color: 0x00ff66,
            transparent: true,
            opacity: 0.5,
          });
        }
      });

      bossGreenFlashRef.current = setTimeout(() => {
        // Restore về originals
        bossOrigMatsRef.current?.forEach(({ mesh, mat }) => {
          if (mesh) mesh.material = mat.clone();
        });
        bossFlashStateRef.current = "none";
        bossGreenFlashRef.current = null;
      }, 400);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onBossHeal]);

  // ── Boss Shield (cộng dồn thời gian) ───────────────────────
  const [shieldEndTime, setShieldEndTime] = useState(0); // timestamp ms

  useEffect(() => {
    if (!onBossShield) return;
    onBossShield(() => {
      const ADD_MS = 5000; // +5 giây mỗi lần
      const MAX_MS = 30000; // tối đa 30 giây
      const now = Date.now();

      // Tính thời gian còn lại hiện tại, cộng thêm 5s và giới hạn 30s
      const remaining = bossShieldActiveRef.current
        ? Math.max(0, bossShieldEndRef.current - now)
        : 0;
      const newDuration = Math.min(remaining + ADD_MS, MAX_MS);
      const newEnd = now + newDuration;

      bossShieldActiveRef.current = true;
      bossShieldEndRef.current = newEnd;
      setBossShield(true);
      setShieldEndTime(newEnd);

      if (bossShieldTimerRef.current) clearTimeout(bossShieldTimerRef.current);
      bossShieldTimerRef.current = setTimeout(() => {
        bossShieldActiveRef.current = false;
        bossShieldEndRef.current = 0;
        setBossShield(false);
        setShieldEndTime(0);
        bossShieldTimerRef.current = null;
      }, newDuration);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onBossShield]);

  // ── Init scene (lights + starter ships) ─────────────────────
  useEffect(() => {
    const ambient = new THREE.AmbientLight(0xffffff, 3.0);
    const dirLight = new THREE.DirectionalLight(0xffffff, 4);
    dirLight.position.set(5, 5, 5);
    const bossLight = new THREE.DirectionalLight(0xffffff, 3);
    bossLight.position.set(-8, 2, 4);
    const pointCyan = new THREE.PointLight(0x00f5ff, 1.5, 25);
    pointCyan.position.set(2, 2, 3);
    const pointRed = new THREE.PointLight(0xff4466, 1.5, 25);
    pointRed.position.set(-6, 0, 2);

    scene.add(ambient, dirLight, bossLight, pointCyan, pointRed);

    // Spawn 2 ship đầu đang active từ model store
    const initShips = shipModelsRef.current.slice(0, 2);
    initShips.forEach((m) => {
      spawnShip({
        type: m.id,
        damage: m.damage ?? 1,
        fireRate: m.fireRate ?? 1.0,
      });
    });

    bossHpRef.current = 100;
    gameActiveRef.current = true;
    statusRef.current = "playing";
    prevGameStatus.current = "playing";

    return () => {
      scene.remove(ambient, dirLight, bossLight, pointCyan, pointRed);
      shipsRef.current.forEach((s) => scene.remove(s.mesh));
      bulletsRef.current.forEach((b) => scene.remove(b.mesh));
      explosionsRef.current.forEach((p) => scene.remove(p.mesh));
      shipsRef.current = [];
      bulletsRef.current = [];
      explosionsRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);

  // ── Set boss initial position khi BossModel mount xong ───────
  const bossInitializedRef = useRef(false);
  useEffect(() => {
    if (bossRef.current && !bossInitializedRef.current) {
      bossRef.current.position.set(SETTINGS_GAME.BOSS_START_X, 0, 0);
      bossRef.current.rotation.y = Math.PI / 2;
      bossInitializedRef.current = true;

      // Lưu materials GỐC ngay khi boss mount (trước khi bất kỳ flash nào xảy ra)
      const saved = [];
      bossRef.current.traverse((child) => {
        if (child.isMesh)
          saved.push({ mesh: child, mat: child.material.clone() });
      });
      bossOrigMatsRef.current = saved;
    }
  });

  // ── Fire Bullet ──────────────────────────────────────────────
  const fireBullet = useCallback(
    (ship) => {
      if (!bossRef.current) return;

      const gunTip = ship.mesh.getObjectByName("gun_tip");
      const startPos = new THREE.Vector3();
      if (gunTip) gunTip.getWorldPosition(startPos);
      else ship.mesh.getWorldPosition(startPos);

      const bossPos = new THREE.Vector3();
      bossRef.current.getWorldPosition(bossPos);

      const velocity = new THREE.Vector3()
        .subVectors(bossPos, startPos)
        .normalize()
        .multiplyScalar(SETTINGS_GAME.BULLET_SPEED);

      const color = getBulletColor(ship.type);
      const bulletMesh = createBullet(color);
      bulletMesh.position.copy(startPos);
      bulletMesh.lookAt(bossPos);

      scene.add(bulletMesh);
      bulletsRef.current.push({
        mesh: bulletMesh,
        velocity: velocity.clone(),
        damage: ship.damage * 0.01,
        ownerType: ship.type,
      });
    },
    [scene, getBulletColor],
  );

  // ── Reset ────────────────────────────────────────────────────
  const doReset = useCallback(() => {
    // Đánh dấu tất cả ships là dead trước khi remove
    shipsRef.current.forEach((s) => {
      if (s.aliveRef) s.aliveRef.current = false;
      scene.remove(s.mesh);
    });
    shipsRef.current = [];
    bulletsRef.current.forEach((b) => scene.remove(b.mesh));
    bulletsRef.current = [];
    explosionsRef.current.forEach((p) => scene.remove(p.mesh));
    explosionsRef.current = [];

    // Clear ship labels (avatar + tên người donate cũ)
    setShipLabels([]);

    // ── Dọn flash state ──────────────────────────────────────
    if (bossFlashTimeoutRef.current) {
      clearTimeout(bossFlashTimeoutRef.current);
      bossFlashTimeoutRef.current = null;
    }
    if (bossGreenFlashRef.current) {
      clearTimeout(bossGreenFlashRef.current);
      bossGreenFlashRef.current = null;
    }
    bossFlashStateRef.current = "none";

    if (bossRef.current) {
      bossRef.current.position.set(SETTINGS_GAME.BOSS_START_X, 0, 0);
      bossRef.current.rotation.y = Math.PI / 2;

      // Restore materials về gốc trước khi bắt đầu lại
      bossOrigMatsRef.current?.forEach(({ mesh, mat }) => {
        if (mesh) mesh.material = mat.clone();
      });
    }

    bossHpRef.current = 100;
    setBossHp(100);
    setShipCount(0);

    // Spawn lại 2 ship đầu đang active
    const resetShips = shipModelsRef.current.slice(0, 2);
    resetShips.forEach((m) => {
      spawnShipFn.current?.({
        type: m.id,
        damage: m.damage ?? 1,
        fireRate: m.fireRate ?? 1.0,
      });
    });

    gameActiveRef.current = true;
    statusRef.current = "playing";
  }, [scene, setBossHp, setShipCount]);

  useEffect(() => {
    if (
      gameStatus === "playing" &&
      (prevGameStatus.current === "win" || prevGameStatus.current === "lose")
    ) {
      doReset();
    }
    prevGameStatus.current = gameStatus;
  }, [gameStatus, doReset]);

  // ── Game Loop ────────────────────────────────────────────────
  useFrame((_, delta) => {
    if (!gameActiveRef.current || statusRef.current !== "playing") return;

    const boss = bossRef.current;
    if (!boss) return;

    // Boss tiến về phía phải
    boss.position.x += SETTINGS_GAME.BOSS_SPEED * 60 * delta;

    if (boss.position.x >= SETTINGS_GAME.BOSS_END_X) {
      statusRef.current = "lose";
      gameActiveRef.current = false;
      setGameStatus("lose");
      prevGameStatus.current = "lose";
      return;
    }

    // Tàu: hover + bắn
    shipsRef.current.forEach((ship) => {
      ship.hoverPhase += delta * 1.5;
      ship.mesh.position.y = ship.baseY + Math.sin(ship.hoverPhase) * 0.07;

      ship.fireTimer += delta;
      if (ship.fireTimer >= 1 / ship.fireRate) {
        ship.fireTimer = 0;
        fireBullet(ship);
        playAttackSound();
      }
    });

    // Collision detection
    const bossBox = new THREE.Box3().setFromObject(boss);
    bossBox.expandByScalar(0.12);
    const deadBullets = new Set();

    bulletsRef.current.forEach((bullet, idx) => {
      bullet.mesh.position.add(bullet.velocity);

      if (bullet.mesh.position.x < -8 || bullet.mesh.position.x > 14) {
        deadBullets.add(idx);
        return;
      }

      if (bossBox.containsPoint(bullet.mesh.position)) {
        // Nếu boss đang có khiên: đạn nổ nhưng không gây sát thương
        if (!bossShieldActiveRef.current) {
          bossHpRef.current = Math.max(0, bossHpRef.current - bullet.damage);
          setBossHp(Math.round(bossHpRef.current * 10) / 10);
        }

        const exps = createExplosion(
          bullet.mesh.position.clone(),
          bossShieldActiveRef.current
            ? "#00f5ff"
            : getBulletColor(bullet.ownerType),
        );
        exps.forEach(({ mesh }) => scene.add(mesh));
        explosionsRef.current.push(...exps);

        deadBullets.add(idx);

        // Flash đỏ chỉ khi không có khiên
        if (!bossShieldActiveRef.current) {
          // Lưu materials gốc 1 lần duy nhất (không dùng material hiện tại vì có thể đang flash)
          if (!bossOrigMatsRef.current) {
            const saved = [];
            boss.traverse((child) => {
              if (child.isMesh)
                saved.push({ mesh: child, mat: child.material.clone() });
            });
            bossOrigMatsRef.current = saved;
          }

          // Clear timeout flash xanh để không bị conflict
          if (bossGreenFlashRef.current)
            clearTimeout(bossGreenFlashRef.current);
          if (bossFlashTimeoutRef.current)
            clearTimeout(bossFlashTimeoutRef.current);

          // Áp flash đỏ
          bossFlashStateRef.current = "red";
          boss.traverse((child) => {
            if (child.isMesh) {
              child.material = new THREE.MeshBasicMaterial({
                color: 0xff1111,
                transparent: true,
                opacity: 0.25,
              });
            }
          });

          bossFlashTimeoutRef.current = setTimeout(() => {
            // Chỉ restore nếu flash state vẫn là đỏ (không bị override bởi flash xanh)
            if (bossFlashStateRef.current === "red") {
              bossOrigMatsRef.current?.forEach(({ mesh, mat }) => {
                if (mesh) mesh.material = mat.clone();
              });
              bossFlashStateRef.current = "none";
            }
            bossFlashTimeoutRef.current = null;
          }, 150);

          if (bossHpRef.current <= 0) {
            statusRef.current = "win";
            gameActiveRef.current = false;
            setGameStatus("win");
            prevGameStatus.current = "win";
          }
        }
      }
    });

    if (deadBullets.size > 0) {
      bulletsRef.current = bulletsRef.current.filter((b, idx) => {
        if (deadBullets.has(idx)) {
          scene.remove(b.mesh);
          return false;
        }
        return true;
      });
    }

    // Explosion particles
    const deadParticles = [];
    explosionsRef.current.forEach((p, idx) => {
      p.mesh.position.add(p.velocity);
      p.life -= delta * 2.5;
      if (p.mesh.material) p.mesh.material.opacity = Math.max(0, p.life);
      p.mesh.scale.setScalar(Math.max(0.01, p.life + 0.2));
      if (p.life <= 0) deadParticles.push(idx);
    });
    deadParticles.reverse().forEach((idx) => {
      scene.remove(explosionsRef.current[idx].mesh);
      explosionsRef.current.splice(idx, 1);
    });
  });

  return (
    <>
      <Stars
        radius={80}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />
      <BossModel
        bossRef={bossRef}
        url={activeBossModel?.path ?? "/models/spaceship_boss.glb"}
        scale={activeBossModel?.scale ?? 4.5}
      />
      <BossLabel bossRef={bossRef} />
      <BossShieldRing bossRef={bossRef} shieldEndTime={shieldEndTime} />

      {/* Render labels bằng Html đính vào scene position của từng tàu */}
      {shipLabels
        .filter((l) => l.nickname || l.avatarUrl)
        .map(({ id, mesh, aliveRef, nickname, avatarUrl }) => (
          <ShipLabel
            key={id}
            mesh={mesh}
            aliveRef={aliveRef}
            nickname={nickname}
            avatarUrl={avatarUrl}
          />
        ))}
    </>
  );
}

function ShipLabel({ mesh, aliveRef, nickname, avatarUrl }) {
  const groupRef = useRef();
  const [visible, setVisible] = useState(true);

  // Theo dõi vị trí mesh trong game loop
  useFrame(() => {
    if (!groupRef.current || !mesh) return;
    // Ẩn label ngay khi ship bị đánh dấu dead
    if (aliveRef && !aliveRef.current) {
      if (visible) setVisible(false);
      return;
    }
    groupRef.current.position.copy(mesh.position);
  });

  if (!visible) return null;

  return (
    <group ref={groupRef}>
      <Html
        center
        distanceFactor={8}
        occlude={false}
        zIndexRange={[10, 10]}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <div className="flex flex-col items-center gap-0.5 -translate-y-[52px]">
          {avatarUrl && (
            <img
              src={avatarUrl}
              alt={nickname}
              className="w-7 h-7 rounded-full object-cover"
              style={{
                border: "1.5px solid rgba(0,245,255,0.8)",
                boxShadow: "0 0 6px rgba(0,245,255,0.5)",
              }}
            />
          )}
          {nickname && (
            <span
              className="text-[10px] font-bold text-white whitespace-nowrap tracking-[0.02em]"
              style={{
                textShadow:
                  "0 0 6px rgba(0,245,255,0.9), 0 1px 2px rgba(0,0,0,0.8)",
              }}
            >
              {nickname.length > 12 ? nickname.slice(0, 12) + "…" : nickname}
            </span>
          )}
        </div>
      </Html>
    </group>
  );
}

function BossLabel({ bossRef }) {
  const { bossHp } = useGame();
  const groupRef = useRef();

  // Theo dõi vị trí boss trong game loop
  useFrame(() => {
    if (groupRef.current && bossRef.current) {
      groupRef.current.position.copy(bossRef.current.position);
    }
  });

  const hpPercent = Math.max(0, Math.min(100, bossHp));
  const hpColor =
    hpPercent > 50 ? "#ff3366" : hpPercent > 25 ? "#ff6600" : "#ff0000";

  return (
    <group ref={groupRef}>
      <Html
        center
        distanceFactor={10}
        occlude={false}
        zIndexRange={[9, 9]}
        style={{ pointerEvents: "none", userSelect: "none" }}
        className="relative"
      >
        <div className=" absolute -top-64 -left-80 -translate-1/2 flex items-center gap-3 justify-center">
          <img
            src="/images/evil_boss.png"
            alt="Boss"
            className="w-14 h-14 rounded-full border-2 object-cover shadow-[0_0_12px_rgba(255,51,102,0.6)]"
          />

          <div className="flex flex-col items-start gap-[5px] px-3 py-2 rounded-[10px] border border-[rgba(255,51,102,0.3)] bg-[rgba(10,10,15,0.75)] backdrop-blur-[4px]">
            <span
              className="text-[13px] font-extrabold text-white uppercase tracking-[0.05em] whitespace-nowrap"
              style={{ textShadow: "0 0 6px rgba(255,51,102,0.9)" }}
            >
              Space ship boss{" "}
              <span className="ml-2" style={{ color: hpColor }}>
                {hpPercent.toFixed(1)}%
              </span>
            </span>
            <div className="w-[460px] h-2 rounded bg-white/10 overflow-hidden">
              <div
                className="h-full transition-[width] duration-200 ease-out"
                style={{
                  width: `${hpPercent}%`,
                  background: `linear-gradient(90deg, ${hpColor}, #ff0055)`,
                  boxShadow: `0 0 8px ${hpColor}`,
                }}
              />
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}

function BossShieldRing({ bossRef, shieldEndTime }) {
  const { bossShield } = useGame();
  const groupRef = useRef();
  const [msLeft, setMsLeft] = useState(0);
  const maxMsRef = useRef(5000); // useRef thay vì useState vì không cần re-render

  useFrame(() => {
    if (groupRef.current && bossRef.current) {
      groupRef.current.position.copy(bossRef.current.position);
    }
  });

  // Countdown dựa trên shieldEndTime – chỉ gọi setState trong callback của interval
  useEffect(() => {
    if (!bossShield || !shieldEndTime) return;

    // Cập nhật max thông qua ref (không re-render)
    const remaining = Math.max(0, shieldEndTime - Date.now());
    maxMsRef.current = Math.max(remaining, 5000);

    const iv = setInterval(() => {
      const left = shieldEndTime - Date.now();
      setMsLeft(Math.max(0, left)); // ← setState chỉ trong callback
      if (left <= 0) clearInterval(iv);
    }, 100);
    return () => clearInterval(iv);
  }, [bossShield, shieldEndTime]);

  if (!bossShield) return null;

  const secsLeft = Math.ceil(msLeft / 1000);
  // pct: tỉ lệ thời gian còn lại so với tổng duration ban đầu khi shield bắt đầu
  // Dùng msLeft và shieldEndTime để tính ngược (không cần ref trong render)
  const pct = Math.min(1, Math.max(0, msLeft / 30000)); // normalize trên 30s max
  const r = 110;
  const circ = 2 * Math.PI * r;

  return (
    <group ref={groupRef}>
      <Html
        center
        distanceFactor={10}
        occlude={false}
        zIndexRange={[10, 10]}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <div className="w-[240px] h-[240px] relative flex items-center justify-center">
          {/* Spinning outer ring */}
          <div
            className="absolute inset-0 rounded-full border-[3px] border-[rgba(0,245,255,0.8)]"
            style={{
              boxShadow:
                "0 0 28px rgba(0,245,255,0.7), inset 0 0 28px rgba(0,245,255,0.15)",
              animation: "shieldSpin 2s linear infinite",
            }}
          />
          {/* Inner dashed ring */}
          <div
            className="absolute rounded-full border-[1.5px] border-dashed border-[rgba(0,245,255,0.4)]"
            style={{
              inset: 12,
              animation: "shieldSpin 3s linear infinite reverse",
            }}
          />
          {/* SVG arc */}
          <svg width="240" height="240" className="absolute inset-0 -rotate-90">
            <circle
              cx="120"
              cy="120"
              r={r}
              fill="none"
              stroke="rgba(0,245,255,0.12)"
              strokeWidth="6"
            />
            <circle
              cx="120"
              cy="120"
              r={r}
              fill="none"
              stroke={pct > 0.3 ? "#00f5ff" : "#ff6600"}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - pct)}
              style={{
                transition: "stroke-dashoffset 0.15s linear, stroke 0.5s",
                filter: "drop-shadow(0 0 6px #00f5ff)",
              }}
            />
          </svg>
          {/* Center */}
          <div className="flex flex-col items-center gap-1 z-[1]">
            <span
              className="text-4xl leading-none"
              style={{ filter: "drop-shadow(0 0 10px rgba(0,245,255,0.9))" }}
            >
              🛡️
            </span>
            <span
              className="text-[20px] font-black tracking-[0.05em]"
              style={{
                color: pct > 0.3 ? "#00f5ff" : "#ff8800",
                textShadow:
                  "0 0 12px rgba(0,245,255,1), 0 0 24px rgba(0,245,255,0.6)",
              }}
            >
              {secsLeft}s
            </span>
          </div>
        </div>
        <style>{`
          @keyframes shieldSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </Html>
    </group>
  );
}
