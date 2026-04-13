import { useRef, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { assetUrl } from "../utils/constant";

useGLTF.preload(assetUrl("/models/spaceship_boss.glb"));

// Pre-load texture một lần duy nhất
const bossTexture = new THREE.TextureLoader().load(
  "/images/texture-pink.jpg",
  (tex) => {
    tex.encoding = THREE.sRGBEncoding;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
  }
);

/**
 * BossModel — load boss GLB động theo url prop
 * @param {React.MutableRefObject} bossRef - ref sẽ được set = group Three.js của boss
 * @param {number}  [scale=4.5]            - scale model
 * @param {string}  [url]                  - đường dẫn GLB, mặc định boss built-in
 */
export default function BossModel({
  bossRef: externalRef,
  scale = 4.5,
  url = assetUrl("/models/spaceship_boss.glb"),
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
        const applyTex = (m) => {
          const nm = m.clone();
          nm.map = bossTexture;
          // Nhân color tối để texture trắng → xám thép, không phủ chói
          nm.color = new THREE.Color(0.45, 0.45, 0.45);
          // Chất liệu kim loại thực tế
          nm.metalness = 0.75;
          nm.roughness  = 0.45;
          // Bỏ emissiveMap — tránh glow sai
          nm.emissiveMap      = null;
          nm.emissive         = new THREE.Color(0x000000);
          nm.emissiveIntensity = 0;
          nm.needsUpdate = true;
          return nm;
        };
        child.material = Array.isArray(child.material)
          ? child.material.map(applyTex)
          : applyTex(child.material);
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

