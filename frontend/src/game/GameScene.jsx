import { useRef, useEffect, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import { useGame } from "../store/gameStore";
import {
  createSpaceship1,
  createSpaceship2,
  createSpaceship3,
  createBoss,
  createBullet,
  createExplosion,
} from "./models";

const SHIP_FACTORIES = {
  spaceship_1: createSpaceship1,
  spaceship_2: createSpaceship2,
  spaceship_3: createSpaceship3,
};

const SHIP_BULLET_COLORS = {
  spaceship_1: 0x00f5ff,
  spaceship_2: 0xbf00ff,
  spaceship_3: 0xffaa00,
};

const MAX_SHIPS = 50;
const BOSS_START_X = -5;
const BOSS_END_X = 4.2;
const BOSS_SPEED = 0.003;
const BULLET_SPEED = 0.08;

export default function GameScene({ onGiftSpawn }) {
  const { scene } = useThree();
  const { setBossHp, setGameStatus, setShipCount, gameStatus } = useGame();

  // All game state as mutable refs (not React state — game loop needs sync updates)
  const bossRef       = useRef(null);
  const bossHpRef     = useRef(100);
  const shipsRef      = useRef([]);
  const bulletsRef    = useRef([]);
  const explosionsRef = useRef([]);
  const gameActiveRef = useRef(false);
  const statusRef     = useRef("idle");
  const prevGameStatus= useRef("idle");

  // ── Spawn Ship (stable ref) ─────────────────────────────────
  const spawnShipFn = useRef(null);

  const spawnShip = useCallback(
    ({ type, damage, fireRate }) => {
      if (shipsRef.current.length >= MAX_SHIPS) {
        const oldest = shipsRef.current.shift();
        scene.remove(oldest.mesh);
      }

      const factory = SHIP_FACTORIES[type] || createSpaceship1;
      const mesh = factory();

      const y = (Math.random() - 0.5) * 3.5;
      const z = (Math.random() - 0.5) * 1.5;
      mesh.position.set(4.0, y, z);
      mesh.rotation.y = -Math.PI / 2;

      scene.add(mesh);

      shipsRef.current.push({
        mesh,
        type,
        damage,
        fireRate,
        fireTimer: Math.random(),
        baseY: y,
        hoverPhase: Math.random() * Math.PI * 2,
      });

      setShipCount(shipsRef.current.length);
    },
    [scene, setShipCount]
  );

  // Keep spawnShipFn ref updated
  useEffect(() => {
    spawnShipFn.current = spawnShip;
  }, [spawnShip]);

  // Expose spawn to GameCanvas
  useEffect(() => {
    if (onGiftSpawn) {
      onGiftSpawn((args) => spawnShipFn.current?.(args));
    }
  }, [onGiftSpawn]);

  // ── Init scene once ─────────────────────────────────────────
  useEffect(() => {
    // Lighting
    const ambient = new THREE.AmbientLight(0x111133, 1.5);
    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(5, 5, 5);
    const pointCyan = new THREE.PointLight(0x00f5ff, 2, 20);
    pointCyan.position.set(2, 2, 3);
    const pointRed = new THREE.PointLight(0xff0066, 2, 20);
    pointRed.position.set(-4, 0, 2);

    scene.add(ambient, dirLight, pointCyan, pointRed);

    // Boss
    const boss = createBoss();
    boss.position.set(BOSS_START_X, 0, 0);
    boss.rotation.y = Math.PI / 2;
    scene.add(boss);
    bossRef.current = boss;

    // Starter ships
    spawnShip({ type: "spaceship_1", damage: 1, fireRate: 1.0 });
    spawnShip({ type: "spaceship_2", damage: 3, fireRate: 0.5 });

    bossHpRef.current = 100;
    gameActiveRef.current = true;
    statusRef.current = "playing";
    prevGameStatus.current = "playing";

    return () => {
      // Full cleanup on unmount
      scene.remove(ambient, dirLight, pointCyan, pointRed);
      if (bossRef.current) scene.remove(bossRef.current);
      shipsRef.current.forEach((s) => scene.remove(s.mesh));
      bulletsRef.current.forEach((b) => scene.remove(b.mesh));
      explosionsRef.current.forEach((p) => scene.remove(p.mesh));
      shipsRef.current = [];
      bulletsRef.current = [];
      explosionsRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);

  // ── Fire bullet ─────────────────────────────────────────────
  const fireBullet = useCallback(
    (ship) => {
      if (!bossRef.current) return;

      const gunTip = ship.mesh.getObjectByName("gun_tip");
      const startPos = new THREE.Vector3();
      if (gunTip) {
        gunTip.getWorldPosition(startPos);
      } else {
        ship.mesh.getWorldPosition(startPos);
      }

      const bossPos = new THREE.Vector3();
      bossRef.current.getWorldPosition(bossPos);

      const direction = new THREE.Vector3()
        .subVectors(bossPos, startPos)
        .normalize();
      const velocity = direction.multiplyScalar(BULLET_SPEED);

      const color = SHIP_BULLET_COLORS[ship.type] || 0x00f5ff;
      const bulletMesh = createBullet(color);
      bulletMesh.position.copy(startPos);
      bulletMesh.lookAt(bossPos);

      scene.add(bulletMesh);
      bulletsRef.current.push({
        mesh: bulletMesh,
        velocity: velocity.clone(),
        damage: ship.damage * 0.1,
        ownerType: ship.type,
      });
    },
    [scene]
  );

  // ── Reset helper ────────────────────────────────────────────
  const doReset = useCallback(() => {
    // Clear ships
    shipsRef.current.forEach((s) => scene.remove(s.mesh));
    shipsRef.current = [];
    // Clear bullets
    bulletsRef.current.forEach((b) => scene.remove(b.mesh));
    bulletsRef.current = [];
    // Clear explosions
    explosionsRef.current.forEach((p) => scene.remove(p.mesh));
    explosionsRef.current = [];

    // Reset boss
    if (bossRef.current) {
      bossRef.current.position.set(BOSS_START_X, 0, 0);
      bossRef.current.rotation.y = Math.PI / 2;
    }

    bossHpRef.current = 100;
    setBossHp(100);
    setShipCount(0);

    // Spawn starter ships
    spawnShipFn.current?.({ type: "spaceship_1", damage: 1, fireRate: 1.0 });
    spawnShipFn.current?.({ type: "spaceship_2", damage: 3, fireRate: 0.5 });

    gameActiveRef.current = true;
    statusRef.current = "playing";
  }, [scene, setBossHp, setShipCount]);

  // ── Watch external gameStatus for reset trigger ──────────────
  useEffect(() => {
    // When parent sets gameStatus back to "playing" after win/lose → reset
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

    // Boss moves left → right
    boss.position.x += BOSS_SPEED * 60 * delta;
    boss.rotation.y += 0.01;

    // Animate rings
    const ring = boss.getObjectByName("boss_ring");
    if (ring) ring.rotation.z += 0.02;
    const core = boss.getObjectByName("boss_core");
    if (core) {
      const pulse = 1 + Math.sin(Date.now() * 0.005) * 0.25;
      core.scale.setScalar(pulse);
    }

    // ── Lose check ──
    if (boss.position.x >= BOSS_END_X) {
      statusRef.current = "lose";
      gameActiveRef.current = false;
      setGameStatus("lose");
      prevGameStatus.current = "lose";
      return;
    }

    // ── Ships: hover + fire ──
    shipsRef.current.forEach((ship) => {
      ship.hoverPhase += delta * 1.5;
      ship.mesh.position.y = ship.baseY + Math.sin(ship.hoverPhase) * 0.07;

      ship.fireTimer += delta;
      const fireInterval = 1 / ship.fireRate;
      if (ship.fireTimer >= fireInterval) {
        ship.fireTimer = 0;
        fireBullet(ship);
      }
    });

    // ── Bullets: move + collision ──
    const bossBox = new THREE.Box3().setFromObject(boss);
    bossBox.expandByScalar(0.12);

    const deadBullets = new Set();

    bulletsRef.current.forEach((bullet, idx) => {
      bullet.mesh.position.add(bullet.velocity);

      // Out of bounds
      if (bullet.mesh.position.x < -8 || bullet.mesh.position.x > 7) {
        deadBullets.add(idx);
        return;
      }

      // Hit boss
      if (bossBox.containsPoint(bullet.mesh.position)) {
        bossHpRef.current = Math.max(0, bossHpRef.current - bullet.damage);
        setBossHp(Math.round(bossHpRef.current * 10) / 10);

        // Explosion particles
        const exps = createExplosion(
          bullet.mesh.position.clone(),
          SHIP_BULLET_COLORS[bullet.ownerType] || 0xff6600
        );
        exps.forEach(({ mesh }) => scene.add(mesh));
        explosionsRef.current.push(...exps);

        deadBullets.add(idx);

        // Boss flash
        boss.traverse((child) => {
          if (child.isMesh && child.material) {
            const prev = child.material.emissiveIntensity;
            child.material.emissiveIntensity = 4;
            setTimeout(() => {
              if (child.material) child.material.emissiveIntensity = prev;
            }, 80);
          }
        });

        // Win check
        if (bossHpRef.current <= 0) {
          statusRef.current = "win";
          gameActiveRef.current = false;
          setGameStatus("win");
          prevGameStatus.current = "win";
        }
      }
    });

    // Remove dead bullets
    if (deadBullets.size > 0) {
      bulletsRef.current = bulletsRef.current.filter((b, idx) => {
        if (deadBullets.has(idx)) {
          scene.remove(b.mesh);
          return false;
        }
        return true;
      });
    }

    // ── Explosion particles ──
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
    <Stars radius={80} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
  );
}
