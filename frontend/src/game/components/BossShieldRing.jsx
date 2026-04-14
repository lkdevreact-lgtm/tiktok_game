import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, useGLTF } from "@react-three/drei";
import { useGame } from "../../hooks/useGame";
import { assetUrl } from "../../utils/constant";

useGLTF.preload(assetUrl("/models/shield.glb"));

export default function BossShieldRing({
  bossRef,
  shieldEndTime,
  shieldDuration = 5,
  shieldScale = 3.5,
  shieldOffset = [7.5, 0.6, 12],
  isMobile = false,
}) {
  const { bossShield } = useGame();
  const groupRef = useRef();
  const [msLeft, setMsLeft] = useState(0);

  const { scene: shieldScene } = useGLTF(assetUrl("/models/shield.glb"));

  // Countdown based on shieldEndTime
  useEffect(() => {
    if (!bossShield || !shieldEndTime) return;
    const iv = setInterval(() => {
      const left = shieldEndTime - Date.now();
      setMsLeft(Math.max(0, left));
      if (left <= 0) clearInterval(iv);
    }, 100);
    return () => clearInterval(iv);
  }, [bossShield, shieldEndTime]);

  // Follow boss position every frame
  useFrame(() => {
    if (groupRef.current && bossRef.current) {
      if (isMobile) {
        groupRef.current.position
          .copy(bossRef.current.position)
          .add({ x: 0, y: -2.75, z: shieldOffset[2] });
      } else {
        groupRef.current.position
          .copy(bossRef.current.position)
          .add({ x: shieldOffset[0], y: shieldOffset[1], z: shieldOffset[2] });
      }
    }
  });

  if (!bossShield) return null;

  const secsLeft = Math.ceil(msLeft / 1000);
  const totalMs = shieldDuration * 1000;
  const pct = Math.min(1, Math.max(0, msLeft / totalMs));
  const isLow = secsLeft <= 2 && msLeft > 0;

  return (
    <group ref={groupRef} scale={shieldScale}>
      {/* Render shield model as-is, xoay theo layout mobile */}
      <primitive object={shieldScene} rotation={isMobile ? [0, 0, -Math.PI / 2] : [0, 0, 0]} scale={[2, 0.8, 2]} />

      <Html
        center
        position={[0, 2.5, 0]}
        distanceFactor={10}
        occlude={false}
        zIndexRange={[10, 10]}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <svg width="64" height="64" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(0,245,255,0.15)" strokeWidth="4" />
            <circle
              cx="32" cy="32" r="28"
              fill="none"
              stroke={isLow ? "#ff6600" : "#00f5ff"}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 28}
              strokeDashoffset={(2 * Math.PI * 28) * (1 - pct)}
              style={{
                transition: "stroke-dashoffset 0.15s linear, stroke 0.5s",
                filter: `drop-shadow(0 0 5px ${isLow ? "#ff6600" : "#00f5ff"})`,
              }}
            />
          </svg>
          <span style={{
            color: isLow ? "#ff8800" : "#00f5ff",
            fontSize: 14,
            fontWeight: 900,
            textShadow: `0 0 10px ${isLow ? "#ff6600" : "#00f5ff"}`,
            marginTop: -4,
          }}>
            🛡️ {secsLeft}s
          </span>
        </div>
      </Html>
    </group>
  );
}
