import { useRef, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

// Preload tất cả ship models
useGLTF.preload("/models/spaceship_1.glb");
useGLTF.preload("/models/spaceship_2.glb");
useGLTF.preload("/models/spaceship_3.glb");

/** Scale của từng loại tàu */
export const SHIP_SCALES = {
  spaceship_1: 0.25,
  spaceship_2: 0.25,
  spaceship_3: 0.25,
};

/** Offset gun_tip (mũi tàu) theo trục X local */
export const GUN_TIP_OFFSET = {
  spaceship_1: 0.4,
  spaceship_2: 0.4,
  spaceship_3: 0.5,
};

/** Màu đạn theo loại tàu */
export const SHIP_BULLET_COLORS = {
  spaceship_1: 0x00f5ff,
  spaceship_2: 0xbf00ff,
  spaceship_3: 0xffaa00,
};

/**
 * Custom hook — load 3 ship GLB models và trả về hàm cloneShipMesh(type)
 * Dùng trong GameScene để spawn tàu imperative (không qua JSX).
 *
 * @returns {{ cloneShipMesh: (type: string) => THREE.Group }}
 */
export function useShipModels() {
  const { scene: glb1 } = useGLTF("/models/spaceship_1.glb");
  const { scene: glb2 } = useGLTF("/models/spaceship_2.glb");
  const { scene: glb3 } = useGLTF("/models/spaceship_3.glb");

  // Lưu ref để cloneShipMesh luôn dùng bản mới nhất mà không cần re-render
  const glbRef = useRef({});
  useEffect(() => {
    glbRef.current = {
      spaceship_1: glb1,
      spaceship_2: glb2,
      spaceship_3: glb3,
    };
  }, [glb1, glb2, glb3]);

  /**
   * Clone scene GLB của tàu và chuẩn bị sẵn cho game loop:
   * - Scale đúng kích thước
   * - Giữ nguyên material gốc
   * - Thêm Object3D gun_tip ở mũi tàu
   *
   * @param {string} type - "spaceship_1" | "spaceship_2" | "spaceship_3"
   * @returns {THREE.Group}
   */
  function cloneShipMesh(type) {
    const glbScene = glbRef.current[type];

    if (!glbScene) {
      // Fallback nếu GLB chưa load (rất hiếm vì đã preload)
      const geo = new THREE.BoxGeometry(0.3, 0.1, 0.1);
      const mat = new THREE.MeshStandardMaterial({ color: 0x00f5ff });
      return new THREE.Mesh(geo, mat);
    }

    const mesh = glbScene.clone(true);
    mesh.scale.setScalar(SHIP_SCALES[type] ?? 0.25);

    // Giữ nguyên material gốc của GLB
    mesh.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.needsUpdate = true;
      }
    });

    // Thêm gun_tip ảo để bullet spawn đúng vị trí mũi tàu
    const gunTip = new THREE.Object3D();
    gunTip.name = "gun_tip";
    gunTip.position.set(GUN_TIP_OFFSET[type] ?? 0.4, 0, 0);
    mesh.add(gunTip);

    return mesh;
  }

  return { cloneShipMesh };
}
