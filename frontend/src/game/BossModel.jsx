import { useRef, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

// Preload boss model ngay khi module được import
useGLTF.preload("/models/spaceship_boss.glb");

/**
 * BossModel — load spaceship_boss.glb và expose group ref ra ngoài
 * @param {Object} props
 * @param {React.MutableRefObject} props.bossRef  - ref sẽ được set = group Three.js của boss
 * @param {number} [props.scale=3.5]              - scale model
 */
export default function BossModel({ bossRef: externalRef, scale = 3.5 }) {
  const { scene: gltfScene } = useGLTF("/models/spaceship_boss.glb");
  const groupRef = useRef();

  useEffect(() => {
    if (!groupRef.current) return;

    const cloned = gltfScene.clone(true);
    cloned.name = "boss_model";
    cloned.scale.setScalar(scale);

    // Giữ nguyên material gốc của GLB
    cloned.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.needsUpdate = true;
      }
    });

    groupRef.current.add(cloned);

    // Expose Three.js group ra ngoài để game loop dùng
    if (externalRef) externalRef.current = groupRef.current;

    return () => {
      groupRef.current?.remove(cloned);
    };
  }, [gltfScene, externalRef, scale]);

  return <group ref={groupRef} />;
}
