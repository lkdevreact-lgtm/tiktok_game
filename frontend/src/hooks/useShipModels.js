/**
 * useShipModels.js
 * Dynamic ship model loader — đọc danh sách models từ modelStore.
 * Hỗ trợ cả built-in GLB và custom GLB được upload.
 */
import { useRef, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useModels } from "../store/modelStore";

// Preload built-in models ngay khi module import
useGLTF.preload("/models/spaceship_1.glb");
useGLTF.preload("/models/spaceship_2.glb");
useGLTF.preload("/models/spaceship_3.glb");

// Xóa cache lỗi cho tất cả custom models từ localStorage
// để tránh lỗi "Unexpected token '<'" khi Suspense cache giữ 404 cũ
try {
  const cached = JSON.parse(localStorage.getItem("modelsCache") || "[]");
  cached.forEach((m) => {
    if (!m.builtIn && m.path) {
      useGLTF.clear(m.path);
    }
  });
} catch (_) {}

export const SHIP_BULLET_COLORS = {
  spaceship_1: 0x00f5ff,
  spaceship_2: 0xbf00ff,
  spaceship_3: 0xffaa00,
};

/**
 * Inner hook — load 1 GLB và trả về THREE.Scene
 * Tách ra để gọi theo URL động (hook rules: gọi ở top level)
 */
function useGlbScene(url) {
  const { scene } = useGLTF(url);
  return scene;
}

/**
 * Custom hook — load tất cả ship models và trả về hàm cloneShipMesh(type)
 */
export function useShipModels() {
  const { allShipModels: shipModels } = useModels();

  // Load tối đa 8 model (React hooks không cho dynamic count)
  // Slots 0–7: built-in (0-2) + custom (3-7)
  const MAX_MODELS = 8;
  const urlSlots = Array.from({ length: MAX_MODELS }, (_, i) =>
    shipModels[i]?.path ?? "/models/spaceship_1.glb"
  );

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const s0 = useGlbScene(urlSlots[0]);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const s1 = useGlbScene(urlSlots[1]);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const s2 = useGlbScene(urlSlots[2]);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const s3 = useGlbScene(urlSlots[3]);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const s4 = useGlbScene(urlSlots[4]);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const s5 = useGlbScene(urlSlots[5]);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const s6 = useGlbScene(urlSlots[6]);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const s7 = useGlbScene(urlSlots[7]);

  const scenesArray = [s0, s1, s2, s3, s4, s5, s6, s7];

  // Map id → { scene, meta }
  const glbRef = useRef({});
  useEffect(() => {
    const map = {};
    shipModels.forEach((model, i) => {
      if (i < MAX_MODELS && scenesArray[i]) {
        map[model.id] = { scene: scenesArray[i], meta: model };
      }
    });
    glbRef.current = map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipModels, s0, s1, s2, s3, s4, s5, s6, s7]);

  /**
   * Clone scene GLB và chuẩn bị cho game loop
   * @param {string} type - model id ("spaceship_1", "custom_...", etc)
   * @returns {THREE.Group}
   */
  function cloneShipMesh(type) {
    const entry = glbRef.current[type];

    if (!entry?.scene) {
      // Fallback: cube placeholder
      const geo = new THREE.BoxGeometry(0.3, 0.1, 0.1);
      const mat = new THREE.MeshStandardMaterial({ color: 0x00f5ff });
      return new THREE.Mesh(geo, mat);
    }

    const { scene: glbScene, meta } = entry;
    const mesh = glbScene.clone(true);
    mesh.scale.setScalar(meta.scale ?? 0.25);

    // Rotation
    const ry = ((meta.rotationY ?? 0) * Math.PI) / 180;
    mesh.rotation.set(0, ry, 0);

    // Material update
    mesh.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.needsUpdate = true;
      }
    });

    // Gun tip
    const gunTip = new THREE.Object3D();
    gunTip.name = "gun_tip";
    gunTip.position.set(meta.gunTipOffset ?? 0.4, 0, 0);
    mesh.add(gunTip);

    return mesh;
  }

  /**
   * Lấy bullet color hex number theo model id
   */
  function getBulletColor(type) {
    const entry = glbRef.current[type];
    if (entry?.meta?.bulletColor) {
      return parseInt(entry.meta.bulletColor.replace("#", ""), 16);
    }
    return SHIP_BULLET_COLORS[type] ?? 0x00f5ff;
  }

  return { cloneShipMesh, getBulletColor };
}
