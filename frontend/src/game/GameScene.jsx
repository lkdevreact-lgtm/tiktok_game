import { useRef, useEffect, useCallback, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Stars, Html } from "@react-three/drei";
import * as THREE from "three";
import { useGame } from "../store/gameStore";
import { useModels } from "../store/modelStore";
import { createBullet, createExplosion } from "./models";
import BossModel from "./BossModel";
import { useShipModels } from "../hooks/useShipModels";

const MAX_SHIPS = 50;
const BOSS_START_X = -11;
const BOSS_END_X = 4.2;
const BOSS_SPEED = 0.0004;
const BULLET_SPEED = 0.07;

// AudioPool: 8 instances → nhiều tàu bắn cùng lúc vẫn phát đủ số lần
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
  audio.play().catch(() => {});
}

export default function GameScene({ onGiftSpawn }) {
  const { scene } = useThree();
  const { setBossHp, setGameStatus, setShipCount, gameStatus } = useGame();
  const { activeBossModel } = useModels();
  const { cloneShipMesh, getBulletColor } = useShipModels();

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
  // Flash đỏ boss: lưu materials gốc 1 lần, debounce restore
  const bossOrigMatsRef = useRef(null); // null = đang không flash
  const bossFlashTimeoutRef = useRef(null);

  const [shipLabels, setShipLabels] = useState([]);

  // ── Spawn Ship ───────────────────────────────────────────────
  const spawnShip = useCallback(
    ({ type, damage, fireRate, nickname = "", avatarUrl = "" }) => {
      if (shipsRef.current.length >= MAX_SHIPS) {
        const oldest = shipsRef.current.shift();
        scene.remove(oldest.mesh);
        setShipLabels((prev) => prev.filter((l) => l.mesh !== oldest.mesh));
      }

      const mesh = cloneShipMesh(type);

      const y = (Math.random() - 0.5) * 3.5;
      const z = (Math.random() - 0.5) * 1.5;
      mesh.position.set(6.0, y, z);
      // Rotation được apply per-ship trong useShipModels.js (SHIP_ROTATIONS)

      scene.add(mesh);

      const id = `ship-${Date.now()}-${Math.random()}`;
      shipsRef.current.push({
        id,
        mesh,
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
        { id, mesh, nickname, avatarUrl },
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
    spawnShip({ type: "spaceship_1", damage: 1, fireRate: 1.0 });
    spawnShip({ type: "spaceship_2", damage: 3, fireRate: 0.5 });

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
      bossRef.current.position.set(BOSS_START_X, 0, 0);
      bossRef.current.rotation.y = Math.PI / 2;
      bossInitializedRef.current = true;
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
        .multiplyScalar(BULLET_SPEED);

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
    [scene],
  );

  // ── Reset ────────────────────────────────────────────────────
  const doReset = useCallback(() => {
    shipsRef.current.forEach((s) => scene.remove(s.mesh));
    shipsRef.current = [];
    bulletsRef.current.forEach((b) => scene.remove(b.mesh));
    bulletsRef.current = [];
    explosionsRef.current.forEach((p) => scene.remove(p.mesh));
    explosionsRef.current = [];

    // Clear ship labels (avatar + tên người donate cũ)
    setShipLabels([]);

    if (bossRef.current) {
      bossRef.current.position.set(BOSS_START_X, 0, 0);
      bossRef.current.rotation.y = Math.PI / 2;
    }

    bossHpRef.current = 100;
    setBossHp(100);
    setShipCount(0);

    spawnShipFn.current?.({ type: "spaceship_1", damage: 1, fireRate: 1.0 });
    spawnShipFn.current?.({ type: "spaceship_2", damage: 3, fireRate: 0.5 });

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
    boss.position.x += BOSS_SPEED * 60 * delta;

    if (boss.position.x >= BOSS_END_X) {
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

      if (bullet.mesh.position.x < -8 || bullet.mesh.position.x > 7) {
        deadBullets.add(idx);
        return;
      }

      if (bossBox.containsPoint(bullet.mesh.position)) {
        bossHpRef.current = Math.max(0, bossHpRef.current - bullet.damage);
        setBossHp(Math.round(bossHpRef.current * 10) / 10);

        const exps = createExplosion(
          bullet.mesh.position.clone(),
          getBulletColor(bullet.ownerType),
        );
        exps.forEach(({ mesh }) => scene.add(mesh));
        explosionsRef.current.push(...exps);

        deadBullets.add(idx);

        // Flash đỏ toàn thân boss — debounce để tránh race condition
        if (!bossOrigMatsRef.current) {
          const saved = [];
          boss.traverse((child) => {
            if (child.isMesh) {
              saved.push({ mesh: child, mat: child.material });
              child.material = new THREE.MeshBasicMaterial({
                color: 0xff1111,
                transparent: true,
                opacity: 0.2,
              });
            }
          });
          bossOrigMatsRef.current = saved;
        }
        if (bossFlashTimeoutRef.current)
          clearTimeout(bossFlashTimeoutRef.current);
        bossFlashTimeoutRef.current = setTimeout(() => {
          bossOrigMatsRef.current?.forEach(({ mesh, mat }) => {
            if (mesh) mesh.material = mat;
          });
          bossOrigMatsRef.current = null;
          bossFlashTimeoutRef.current = null;
        }, 150);

        if (bossHpRef.current <= 0) {
          statusRef.current = "win";
          gameActiveRef.current = false;
          setGameStatus("win");
          prevGameStatus.current = "win";
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
      <Stars radius={80} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <BossModel
        bossRef={bossRef}
        url={activeBossModel?.path ?? "/models/spaceship_boss.glb"}
        scale={activeBossModel?.scale ?? 4.5}
      />

      {/* Avatar + tên user nổi trên mỗi tàu */}
      {shipLabels.map(({ id, mesh, nickname, avatarUrl }) =>
        nickname || avatarUrl ? (
          <Html
            key={id}
            position={[0, 0.55, 0]}
            center
            occlude={false}
            style={{ pointerEvents: "none" }}
            ref={(el) => {
              // gắn label vào mesh để nó follow tàu
              if (el && mesh) mesh.add(el.parent || el);
            }}
          >
            <Html
              portal={{ current: null }}
              position={mesh.position.toArray()}
              center
            >
              {null}
            </Html>
          </Html>
        ) : null
      )}

      {/* Render labels bằng Html đính vào scene position của từng tàu */}
      {shipLabels
        .filter((l) => l.nickname || l.avatarUrl)
        .map(({ id, mesh, nickname, avatarUrl }) => (
          <ShipLabel key={id} mesh={mesh} nickname={nickname} avatarUrl={avatarUrl} />
        ))}
    </>
  );
}

function ShipLabel({ mesh, nickname, avatarUrl }) {
  const groupRef = useRef();

  // Theo dõi vị trí mesh trong game loop
  useFrame(() => {
    if (groupRef.current && mesh) {
      groupRef.current.position.copy(mesh.position);
    }
  });

  return (
    <group ref={groupRef}>
      <Html
        center
        distanceFactor={8}
        occlude={false}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2px",
          transform: "translateY(-52px)",
        }}>
          {avatarUrl && (
            <img
              src={avatarUrl}
              alt={nickname}
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: "1.5px solid rgba(0,245,255,0.8)",
                objectFit: "cover",
                boxShadow: "0 0 6px rgba(0,245,255,0.5)",
              }}
            />
          )}
          {nickname && (
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#fff",
              textShadow: "0 0 6px rgba(0,245,255,0.9), 0 1px 2px rgba(0,0,0,0.8)",
              whiteSpace: "nowrap",
              letterSpacing: "0.02em",
            }}>
              {nickname.length > 12 ? nickname.slice(0, 12) + "…" : nickname}
            </span>
          )}
        </div>
      </Html>
    </group>
  );
}
