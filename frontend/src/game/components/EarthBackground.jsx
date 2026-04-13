import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

export default function EarthBackground() {
  const groupRef = useRef();
  const atmosphereRef = useRef();

  const { scene: earthScene } = useGLTF("/models/earth.glb");

  // Clone scene để tránh mutation gốc
  const cloned = earthScene.clone(true);

  // Earth luôn phải ở PHÍA SAU toàn bộ game objects
  cloned.traverse((child) => {
    if (child.isMesh) {
      child.raycast = () => { };
      child.castShadow = false;
      child.receiveShadow = false;
      // renderOrder âm → vẽ trước (hiển thị sau / phía dưới) tất cả objects khác
      child.renderOrder = -100;
      if (child.material) {
        const mats = Array.isArray(child.material)
          ? child.material
          : [child.material];
        mats.forEach((m) => {
          m.roughness = 0.7;
          m.metalness = 0.1;
          // KHÔNG ghi vào depth buffer → objects phía trên KHÔNG bị Earth che
          m.depthWrite = false;
          m.needsUpdate = true;
        });
      }
    }
  });

  useFrame(({ clock }) => {
    if (groupRef.current) {
      // Xoay trục Y chậm (1 vòng ~120 giây)
      groupRef.current.rotation.y = clock.elapsedTime * 0.052;
      // Nghiêng nhẹ theo trục X (giống trục nghiêng Trái Đất 23.5°)
      groupRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.015) * 0.08 + 0.41;
    }
    if (atmosphereRef.current) {
      // Pulse nhẹ lớp khí quyển
      const pulse = 1.0 + Math.sin(clock.elapsedTime * 0.8) * 0.003;
      atmosphereRef.current.scale.setScalar(pulse);
      atmosphereRef.current.material.opacity =
        0.08 + Math.sin(clock.elapsedTime * 0.5) * 0.02;
    }
  });

  return (
    <group
      position={[0.5, -2, -8]}
      rotation={[0, 0, 0]}
    >
      {/* Earth model */}
      <group ref={groupRef}>
        <primitive object={cloned} scale={0.028}/>
      </group>

      {/* Lớp khí quyển (atmosphere glow) */}
      {/* <mesh ref={atmosphereRef} scale={1.0} renderOrder={-100}>
        <sphereGeometry args={[10.8, 32, 32]} />
        <meshBasicMaterial
          transparent
          // opacity={0.08}
          // color={new THREE.Color(0x3388ff)}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh> */}

      {/* Viền sáng nhẹ phía sau (rim light effect) */}
      <mesh renderOrder={-100}>
        <sphereGeometry args={[11.2, 32, 32]} />
        <meshBasicMaterial
          // color={new THREE.Color(0x0055cc)}
          transparent
          opacity={0}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// Preload asset
useGLTF.preload("/models/earth.glb");
