import { useRef, useEffect, useCallback, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import { useGame } from "../hooks/useGame";
import { createBullet, createExplosion, createExhaustFlare, createHealParticles, createPortal } from "./models";
import BossModel from "./BossModel";
import { useShipModels } from "../hooks/useShipModels";
import { useModels } from "../hooks/useModels";
import { SETTINGS_GAME } from "../utils/constant";
import { playAttackSound, playSpawnSound, playHiddenSound } from "./audio";
import ShipLabel from "./components/ShipLabel";
import BossLabel from "./components/BossLabel";
import BossShieldRing from "./components/BossShieldRing";
import DamageManager from "./components/DamageManager";

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
  const portalsRef = useRef([]);
  const gameActiveRef = useRef(false);
  const statusRef = useRef("idle");
  const prevGameStatus = useRef("idle");
  const spawnShipFn = useRef(null);
  const showDamageRef = useRef(null);
  const bossOrigMatsRef = useRef(null); // { mesh, mat }[] - chỉ lưu 1 lần khi boss mount
  const bossFlashStateRef = useRef("none");
  const bossFlashTimeoutRef = useRef(null);
  const bossGreenFlashRef = useRef(null);
  const bossShieldActiveRef = useRef(false);
  const bossShieldTimerRef = useRef(null);
  const bossShieldEndRef = useRef(0); // timestamp kết thúc shield (ms)
  const healCooldownRef = useRef(false); // chống spam heal
  const healAudio = useRef(new Audio("/sound/heal_sound.mp3"));
  healAudio.current.volume = 0.5;
  const NUM_Y_SLOTS = 10;
  const Y_RANGE = 8; // tổng chiều cao an toàn (~±2.2)
  const spawnSlotRef = useRef(0);

  const tmpVec1 = useRef(new THREE.Vector3());
  const tmpVec2 = useRef(new THREE.Vector3());
  const tmpBossPos = useRef(new THREE.Vector3());

  const [shipLabels, setShipLabels] = useState([]);

  // ── Spawn Ship ───────────────────────────────────────────────
  const spawnShip = useCallback(
    ({ type, damage, fireRate, nickname = "", avatarUrl = "", maxShots = 20 }) => {
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
      // Bắt đầu từ ngoài màn hình bên phải, sẽ bay vào qua animation
      const FLY_IN_START_X = 16.0;
      mesh.position.set(FLY_IN_START_X, y, z);

      // --- SMART AUTO-FLARE INJECTION (ROOT ATTACHMENT VERSION) ---
      // Gắn trực tiếp vào root mesh để duy trì Scale và hướng (+X) chuẩn xác
      const enginePositions = [];
      mesh.updateWorldMatrix(true, true); // Cập nhật matrix để lấy world position chính xác

      mesh.traverse((child) => {
        if (child.isMesh) {
          const name = child.name.toLowerCase();
          const isEngine = name.includes("engine") || name.includes("glow") ||
            name.includes("thruster") || name.includes("fire") ||
            name.includes("nozzle");

          if (isEngine || (child.material && child.material.emissive &&
            (child.material.emissive.r > 0 || child.material.emissive.g > 0 || child.material.emissive.b > 0))) {

            // Lấy vị trí engine trong world space rồi chuyển về local space của ship-root
            const worldPos = new THREE.Vector3();
            child.getWorldPosition(worldPos);
            const localPos = mesh.worldToLocal(worldPos);
            enginePositions.push(localPos.clone());
          }
        }
      });

      // Gắn flare vào root mesh
      enginePositions.forEach(pos => {
        const bulletColor = getBulletColor(type);
        const flare = createExhaustFlare(bulletColor);
        flare.position.copy(pos); // Đặt đúng chỗ động cơ
        // Flare KHÔNG cần bù trừ scale vì nó đã thuộc root mesh (scale ~1.0)
        mesh.add(flare);
      });

      scene.add(mesh);
      playSpawnSound();

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
        baseX: 7.0,
        baseY: y,
        baseZ: z,
        // Orbital movement — phase bắt đầu = 0 để sin(0)=0, tránh giật khi fly-in xong
        orbitPhaseX: 0,
        orbitPhaseY: 0,
        orbitPhaseZ: 0,
        orbitSpeedX: 0.25 + Math.random() * 0.35,
        orbitSpeedY: 0.40 + Math.random() * 0.80,
        orbitSpeedZ: 0.30 + Math.random() * 0.50,
        orbitRadiusX: 0.15 + Math.random() * 0.25,
        orbitRadiusY: 0.20 + Math.random() * 0.35,
        orbitRadiusZ: 0.10 + Math.random() * 0.20,
        recoil: 0,
        recoilTarget: 0,
        nickname,
        avatarUrl,
        // Fly-in animation
        flyInProgress: 0,
        flyInDuration: 1.2,
        // Shots / HP system
        maxShots,
        shotsLeft: maxShots,
        shotsRef: { current: maxShots }, // shared ref cho label đọc
        // Dissolve animation
        dissolving: false,
        dissolveProgress: 0,
      });

      setShipLabels((prev) => [
        ...prev,
        { id, mesh, aliveRef, nickname, avatarUrl, shotsRef: shipsRef.current[shipsRef.current.length - 1].shotsRef, maxShots },
      ]);
      setShipCount(shipsRef.current.length);
    },
    [scene, setShipCount, cloneShipMesh, getBulletColor],
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

      // Không flash toàn bộ boss nữa để tránh che mất model đẹp
      // Chỉ hiện particles và text

      const bossPos = new THREE.Vector3();
      bossRef.current.getWorldPosition(bossPos);

      // Heal Particles
      const healExps = createHealParticles(bossPos);
      healExps.forEach(({ mesh }) => scene.add(mesh));
      explosionsRef.current.push(...healExps);

      // Heal Float Number
      showDamageRef.current?.("3", bossPos.clone(), "heal", "#00ff66");

      // Khôi phục material cũ (nếu lỡ đang flash đỏ trúng đạn)
      if (bossOrigMatsRef.current && bossFlashStateRef.current !== "none") {
        bossOrigMatsRef.current?.forEach(({ mesh, mat }) => {
          if (mesh) mesh.material = mat.clone();
        });
        bossFlashStateRef.current = "none";
      }
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
        maxShots: m.maxShots ?? 20,
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

      // Kích hoạt độ giật
      ship.recoilTarget = 0.15;

      // Trừ số đạn còn lại
      if (ship.shotsLeft > 0) {
        ship.shotsLeft--;
        ship.shotsRef.current = ship.shotsLeft;
        // Khi hết đạn → mở cổng không gian hút tàu vào
        if (ship.shotsLeft <= 0 && !ship.dissolving) {
          ship.dissolving = true;
          ship.aliveRef.current = false;
          playHiddenSound();

          // Tạo hố đen ngay phía SAU đuôi tàu
          const shipPos = new THREE.Vector3();
          ship.mesh.getWorldPosition(shipPos);
          // Đặt portal ở +1.2 so với tàu (trục X) vì portal xuất hiện phía sau đuôi tàu
          const portalPos = shipPos.clone().add(new THREE.Vector3(1.2, 0, 0));

          const shipColor = getBulletColor(ship.type);
          const portal = createPortal(portalPos, shipColor);
          scene.add(portal.group);
          portalsRef.current.push(portal);

          // Ship property settings for animation
          ship.targetPortal = portalPos;
          ship.dissolveProgress = 0;
        }
      }

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
    portalsRef.current.forEach((p) => scene.remove(p.group));
    portalsRef.current = [];

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
        maxShots: m.maxShots ?? 20,
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

    // Tàu: orbital flight + bắn + recoil + engine pulse
    const elapsedTime = _.clock.elapsedTime;
    const pulseIntensity = 2.0 + Math.sin(elapsedTime * 12) * 1.5;

    // Lấy vị trí Boss 1 lần duy nhất trong frame này
    boss.getWorldPosition(tmpBossPos.current);

    shipsRef.current.forEach((ship) => {
      // 0. Fly-in animation
      const isFlyingIn = ship.flyInProgress < 1;
      if (isFlyingIn) {
        ship.flyInProgress = Math.min(1, ship.flyInProgress + delta / ship.flyInDuration);
        const t = ship.flyInProgress;
        const eased = 1 - Math.pow(1 - t, 3);
        const startX = 16.0;
        const currentX = startX + (ship.baseX - startX) * eased;
        ship.mesh.position.set(currentX, ship.baseY, ship.baseZ);
        ship.fireTimer = 0;
        return;
      }

      // 0b. Dissolve (tan biến)
      if (ship.dissolving) {
        // Frame đầu tiên: clone tất cả materials để tránh ô nhiễm shared materials
        // (THREE.js clone() không deep-clone materials → ship mới sẽ dùng lại và bị opacity=0)
        if (!ship._dissolveMatCloned) {
          ship.mesh.traverse((child) => {
            if (child.isMesh) {
              child.material = Array.isArray(child.material)
                ? child.material.map((m) => m.clone())
                : child.material.clone();
            }
          });
          ship._dissolveMatCloned = true;
        }

        ship.dissolveProgress = Math.min(1, ship.dissolveProgress + delta / 1.4);
        const t = ship.dissolveProgress;
        const s = Math.max(0, 1 - Math.pow(t, 2.5));
        ship.mesh.scale.setScalar(s);

        ship.mesh.traverse((child) => {
          if (child.isMesh) {
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach((m) => {
              if (!m.transparent) { m.transparent = true; m.needsUpdate = true; }
              m.opacity = Math.max(0, 1 - t * 1.6);
            });
          }
        });
        return;
      }


      // 1. Cập nhật phase cho 3 trục độc lập
      ship.orbitPhaseX += delta * ship.orbitSpeedX;
      ship.orbitPhaseY += delta * ship.orbitSpeedY;
      ship.orbitPhaseZ += delta * ship.orbitSpeedZ;

      // 2. Chuyển động Orbital cơ sở
      const orbitalX = ship.baseX + Math.sin(ship.orbitPhaseX) * ship.orbitRadiusX;
      const orbitalY = ship.baseY + Math.sin(ship.orbitPhaseY) * ship.orbitRadiusY;
      const orbitalZ = ship.baseZ + Math.sin(ship.orbitPhaseZ) * ship.orbitRadiusZ;

      // 3. Deluxe Slide Recoil (Phase 1: Slide Back, Phase 2: Slide Forward)
      if (ship.recoilTarget > 0) {
        // Phase 1: Lùi lại với tốc độ trung bình (0.8 đơn vị/giây)
        ship.recoil += 0.8 * delta;
        if (ship.recoil >= ship.recoilTarget) {
          ship.recoil = ship.recoilTarget;
          ship.recoilTarget = 0; // Chuyển sang Phase 2 (Trôi về)
        }
      } else if (ship.recoil > 0) {
        // Phase 2: Trôi về từ từ (0.3 đơn vị/giây)
        ship.recoil -= 0.3 * delta;
        if (ship.recoil < 0) ship.recoil = 0;
      }

      // 4. Hướng giật lùi (Boss -> Ship)
      tmpVec1.current.set(orbitalX, orbitalY, orbitalZ);
      tmpVec2.current.subVectors(tmpVec1.current, tmpBossPos.current).normalize();

      // Vị trí cuối = Orbital + Recoil offset
      ship.mesh.position.copy(tmpVec1.current).addScaledVector(tmpVec2.current, ship.recoil);

      // 5. Banking effect
      ship.mesh.rotation.z = Math.sin(ship.orbitPhaseX) * 0.18;

      // 6. Smart Engine Pulse & Emissive Fix + Exhaust Flares Animation
      if (ship.mesh) {
        ship.mesh.traverse((child) => {
          if (child.isMesh) {
            const mat = child.material;
            if (mat && mat.emissive) {
              const name = child.name.toLowerCase();
              const isEngine = name.includes("engine") || name.includes("glow") || name.includes("thruster");

              if (isEngine && mat.emissive.r === 0 && mat.emissive.g === 0 && mat.emissive.b === 0) {
                if (mat.color) mat.emissive.copy(mat.color);
                else mat.emissive.setHex(0x00f5ff);
                mat.emissiveIntensity = 2.0;
              }

              if (mat.emissive.r > 0 || mat.emissive.g > 0 || mat.emissive.b > 0) {
                mat.emissiveIntensity = pulseIntensity;
              }
            }
          }

          // 7. Hoạt ảnh Flickering cho vệt lửa Mega (2 lớp)
          if (child.name === "engine_flare") {
            const seed = ship.baseY * 1000;
            // Biên độ flicker cực mạnh (0.8 -> 1.4)
            const flicker = 1.0 + Math.sin(elapsedTime * 35 + seed) * 0.3;
            child.scale.x = flicker;
            child.scale.y = 1.0 + Math.sin(elapsedTime * 40 + seed) * 0.12;

            const outer = child.getObjectByName("flare_outer");
            const inner = child.getObjectByName("flare_inner");
            if (outer && outer.material) {
              outer.material.opacity = 0.3 + Math.sin(elapsedTime * 30 + seed) * 0.2;
            }
            if (inner && inner.material) {
              inner.material.opacity = 0.7 + Math.sin(elapsedTime * 45 + seed) * 0.25;
            }
          }
        });
      }

      ship.fireTimer += delta;
      if (ship.fireTimer >= 1 / ship.fireRate) {
        ship.fireTimer = 0;
        fireBullet(ship);
        playAttackSound();
      }
    });

    // ── Update tàu bay vào portal + Dọn dẹp ───────────────────
    const dissolvedIds = new Set();
    shipsRef.current.forEach((ship) => {
      if (ship.dissolving) {
        // Tàu bị cuốn vào cực nhanh (tốc độ 2.0 -> 0.5s là bị nuốt sạch trơn)
        ship.dissolveProgress += delta * 2.0;

        if (ship.dissolveProgress < 1.0) {
          if (ship.targetPortal) {
            ship.mesh.position.lerp(ship.targetPortal, delta * 8);
            // Lộn vòng điên loạn
            ship.mesh.rotation.x += delta * 15;
            ship.mesh.rotation.y += delta * 10;
            // Thu nhỏ dần thun lút
            const t = Math.max(0, 1 - ship.dissolveProgress);
            ship.mesh.scale.setScalar(0.25 * t);
          }
        } else {
          // Từ 0.5s trở đi: Tàu biến mất hoàn toàn
          scene.remove(ship.mesh);
          dissolvedIds.add(ship.id);
        }
      }
    });
    if (dissolvedIds.size > 0) {
      shipsRef.current = shipsRef.current.filter((s) => !dissolvedIds.has(s.id));
      setShipLabels((prev) => prev.filter((l) => !dissolvedIds.has(l.id)));
      setShipCount(shipsRef.current.length);
    }

    // ── Ship-to-Ship Separation ───────────────────────────────────────
    // Không cần physics engine — dùng separation force thuần túy trên baseY/baseZ
    const MIN_SHIP_DIST = 1.6; // khoảng cách tối thiểu giữa 2 tàu (world units)
    const SEP_STRENGTH = 2.5; // độ mạnh của lực đẩy
    const Y_LIMIT = Y_RANGE / 2 - 0.2; // giới hạn biên trên/dưới
    const Z_LIMIT = 1.8;

    const activeShips = shipsRef.current.filter(s => s.flyInProgress >= 1);
    for (let i = 0; i < activeShips.length; i++) {
      for (let j = i + 1; j < activeShips.length; j++) {
        const a = activeShips[i];
        const b = activeShips[j];

        const dx = a.mesh.position.x - b.mesh.position.x;
        const dy = a.mesh.position.y - b.mesh.position.y;
        const dz = a.mesh.position.z - b.mesh.position.z;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < MIN_SHIP_DIST * MIN_SHIP_DIST && distSq > 0.0001) {
          const dist = Math.sqrt(distSq);
          // Lực đẩy: càng gần → càng mạnh, scale theo delta
          const force = ((MIN_SHIP_DIST - dist) / MIN_SHIP_DIST) * SEP_STRENGTH * delta;
          const ny = dy / dist;
          const nz = dz / dist;

          // Đẩy baseY/baseZ — không đụng baseX (hướng bay)
          a.baseY = Math.max(-Y_LIMIT, Math.min(Y_LIMIT, a.baseY + ny * force));
          b.baseY = Math.max(-Y_LIMIT, Math.min(Y_LIMIT, b.baseY - ny * force));
          a.baseZ = Math.max(-Z_LIMIT, Math.min(Z_LIMIT, a.baseZ + nz * force));
          b.baseZ = Math.max(-Z_LIMIT, Math.min(Z_LIMIT, b.baseZ - nz * force));
        }
      }
    }
    // ─────────────────────────────────────────────────────────────

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

          showDamageRef.current?.(
            Math.round(bullet.damage * 100),
            bullet.mesh.position.clone(),
            "damage",
            getBulletColor(bullet.ownerType)
          );
        } else {
          showDamageRef.current?.(
            "BLOCKED",
            bullet.mesh.position.clone(),
            "shield",
            "#00f5ff"
          );
        }

        const exps = createExplosion(
          bullet.mesh.position.clone(),
          bossShieldActiveRef.current
            ? "#00f5ff"
            : getBulletColor(bullet.ownerType)
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
      if (p.rotationSpeed) {
        p.mesh.rotation.x += p.rotationSpeed.x;
        p.mesh.rotation.y += p.rotationSpeed.y;
        p.mesh.rotation.z += p.rotationSpeed.z;
      }
      p.life -= delta * 1.5; // Sống lâu hơn (khoảng 0.66s), cháy chậm để nhìn rõ

      if (p.isCoreFlash) {
        // Lõi sáng phình to đều
        const t = 1.0 - p.life;
        p.mesh.scale.setScalar(1 + t * 2.5);
        // Fade out mượt mà toàn thời gian
        if (p.mesh.material) p.mesh.material.opacity = Math.max(0, p.life);
      } else if (p.isShockwave) {
        // Vòng xung kích thổi bùng ra
        const t = 1.0 - p.life;
        p.mesh.scale.setScalar(1 + t * 10);
        if (p.mesh.material) p.mesh.material.opacity = Math.max(0, p.life);
      } else {
        // Mảnh vỡ tiêu tán 
        p.mesh.scale.setScalar(Math.max(0.01, Math.pow(p.life, 2))); // Rút nhỏ theo gia tốc
        // Cản lực để mảnh vụn dội chậm lại tự nhiên
        p.velocity.multiplyScalar(0.9);
        if (p.mesh.material) p.mesh.material.opacity = Math.max(0, p.life);
      }

      if (p.life <= 0) deadParticles.push(idx);
    });
    deadParticles.reverse().forEach((idx) => {
      scene.remove(explosionsRef.current[idx].mesh);
      explosionsRef.current.splice(idx, 1);
    });

    // Portal Update
    const deadPortals = [];
    portalsRef.current.forEach((p, idx) => {
      p.life -= delta;

      // Xoay đĩa bồi tụ siêu nhanh
      p.ringGroup.rotation.z -= delta * 3.0; // Đĩa quay vòng quanh hố đen

      // Lõi phát sáng nhấp nháy ảo ảnh
      p.innerGlow.material.opacity = 0.6 + Math.sin(p.life * 15) * 0.3;

      // Hút bụi không gian vào tâm siêu nhanh
      p.particles.forEach(pm => {
        pm.position.lerp(new THREE.Vector3(0, 0, 0), delta * 8.0); // Tăng tốc độ hút
        if (pm.position.length() < 0.2) {
          // Bị nuốt xong thì nhả ra lại ở ngoài xa để liên tục hút vào
          pm.position.set((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
        }
      });

      // Hoạt ảnh Scale mượt (maxLife = 0.8)
      if (p.life > Math.max(0, p.maxLife - 0.2)) {
        // Mở rộng cực nhanh lúc đầu (tốn 0.2s)
        const t = (p.maxLife - p.life) / 0.2;
        p.group.scale.setScalar(t * 0.5);
      } else if (p.life < 0.2) {
        // Thu hẹp lại và biến mất (tốn 0.2s)
        const t = p.life / 0.2;
        p.group.scale.setScalar(Math.max(0.01, t * 0.5));
      } else {
        // Kích thước chuẩn giữa luồng
        p.group.scale.setScalar(0.5);
      }

      if (p.life <= 0) deadPortals.push(idx);
    });
    deadPortals.reverse().forEach(idx => {
      scene.remove(portalsRef.current[idx].group);
      portalsRef.current.splice(idx, 1);
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
      <DamageManager onRegister={(fn) => { showDamageRef.current = fn; }} />

      {/* Render labels bằng Html đính vào scene position của từng tàu */}
      {shipLabels
        .map(({ id, mesh, aliveRef, nickname, avatarUrl, shotsRef, maxShots }) => (
          <ShipLabel
            key={id}
            mesh={mesh}
            aliveRef={aliveRef}
            nickname={nickname}
            avatarUrl={avatarUrl}
            shotsRef={shotsRef}
            maxShots={maxShots}
          />
        ))}
    </>
  );
}
