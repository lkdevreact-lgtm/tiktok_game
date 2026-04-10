/**
 * useShipModels.js
 * Dynamic ship model loader — đọc danh sách models từ modelStore.
 * Hỗ trợ cả built-in GLB và custom GLB được upload.
 */
import { useRef, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useModels } from "./useModels";
import { assetUrl } from "../utils/constant";

useGLTF.preload(assetUrl("/models/spaceship_1.glb"));
useGLTF.preload(assetUrl("/models/spaceship_2.glb"));
useGLTF.preload(assetUrl("/models/spaceship_3.glb"));

try {
  const cached = JSON.parse(localStorage.getItem("modelsCache") || "[]");
  cached.forEach((m) => {
    if (!m.builtIn && m.path) {
      useGLTF.clear(assetUrl(m.path));
    }
  });
} catch (_) {console.log(_);
}

export const SHIP_BULLET_COLORS = {
  spaceship_1: 0x00f5ff,
  spaceship_2: 0xbf00ff,
  spaceship_3: 0xffaa00,
};

// Theo dõi các URL đã thất bại để không thử lại liên tục
const failedUrls = new Set();

function useGlbScene(url) {
  // Nếu URL này đã biết lỗi, trả về null thay vì crash
  if (failedUrls.has(url)) return null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { scene } = useGLTF(url);
    return scene;
  } catch (err) {
    // useGLTF dùng Suspense — nếu throw Error (không phải Promise) → lỗi thật
    if (err instanceof Error) {
      console.warn(`[useShipModels] Failed to load ${url}:`, err.message);
      failedUrls.add(url);
      return null;
    }
    // Nếu throw Promise → đang load (Suspense) → rethrow bình thường
    throw err;
  }
}


export function useShipModels() {
  const { allShipModels: shipModels } = useModels();
  const MAX_MODELS = 8;
  const urlSlots = Array.from({ length: MAX_MODELS }, (_, i) =>
    assetUrl(shipModels[i]?.path ?? "/models/spaceship_1.glb")
  );

  const s0 = useGlbScene(urlSlots[0]);
  const s1 = useGlbScene(urlSlots[1]);
  const s2 = useGlbScene(urlSlots[2]);
  const s3 = useGlbScene(urlSlots[3]);
  const s4 = useGlbScene(urlSlots[4]);
  const s5 = useGlbScene(urlSlots[5]);
  const s6 = useGlbScene(urlSlots[6]);
  const s7 = useGlbScene(urlSlots[7]);

  const scenesArray = [s0, s1, s2, s3, s4, s5, s6, s7];

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
      const geo = new THREE.BoxGeometry(0.3, 0.1, 0.1);
      const mat = new THREE.MeshStandardMaterial({ color: 0x00f5ff });
      return new THREE.Mesh(geo, mat);
    }

    const { scene: glbScene, meta } = entry;
    const mesh = glbScene.clone(true);
    mesh.scale.setScalar(meta.scale ?? 0.25);

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
