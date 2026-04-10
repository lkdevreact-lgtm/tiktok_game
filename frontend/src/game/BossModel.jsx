import { useRef, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

useGLTF.preload("/models/spaceship_boss.glb");

/**
 * BossModel — load boss GLB động theo url prop
 * @param {React.MutableRefObject} bossRef - ref sẽ được set = group Three.js của boss
 * @param {number}  [scale=4.5]            - scale model
 * @param {string}  [url]                  - đường dẫn GLB, mặc định boss built-in
 */
export default function BossModel({
  bossRef: externalRef,
  scale = 4.5,
  url = "/models/spaceship_boss.glb",
}) {
  const { scene: gltfScene } = useGLTF(url);
  const groupRef = useRef();

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    const cloned = gltfScene.clone(true);
    cloned.name = "boss_model";
    cloned.scale.setScalar(scale);

    cloned.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.needsUpdate = true;
      }
    });

    group.add(cloned);

    if (externalRef) externalRef.current = group;

    return () => {
      group.remove(cloned);
    };
  }, [gltfScene, externalRef, scale]);

  return <group ref={groupRef} />;
}
