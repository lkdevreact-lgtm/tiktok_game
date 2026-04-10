import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { assetUrl } from "../utils/constant";

useGLTF.preload(assetUrl("/models/spaceship_boss.glb"));

function BossMini() {
  const { scene } = useGLTF(assetUrl("/models/spaceship_boss.glb"));
  const model = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((child) => {
      if (child.isMesh && child.material) child.material.needsUpdate = true;
    });
    return c;
  }, [scene]);

  return (
    <group rotation={[0.10, 0, 0]}>
      <primitive object={model} scale={5.35} />
    </group>
  );
}

export default function BossHudPreview({ size = 40 }) {
  return (
    <Canvas
      className="block"
      style={{ width: size, height: size }}
      camera={{ position: [0, 0.15, 3.4], fov: 18 }}
      gl={{ alpha: true, antialias: true }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      <ambientLight intensity={1.15} />
      <directionalLight position={[3, 2, 4]} intensity={1.4} />
      <directionalLight position={[-2, 1, 2]} intensity={0.35} color="#ff6688" />
      <Suspense fallback={null}>
        <BossMini />
      </Suspense>
    </Canvas>
  );
}
