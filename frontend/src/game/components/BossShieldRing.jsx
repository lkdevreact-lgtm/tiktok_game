import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useGame } from "../../hooks/useGame";

/**
 * BossShieldRing — vòng khiên quay quanh boss với countdown SVG arc.
 * Hiện khi boss có khiên, ẩn khi hết thời gian.
 */
export default function BossShieldRing({ bossRef, shieldEndTime }) {
  const { bossShield } = useGame();
  const groupRef = useRef();
  const [msLeft, setMsLeft] = useState(0);
  const maxMsRef = useRef(5000);

  useFrame(() => {
    if (groupRef.current && bossRef.current) {
      groupRef.current.position.copy(bossRef.current.position);
    }
  });

  // Countdown dựa trên shieldEndTime
  useEffect(() => {
    if (!bossShield || !shieldEndTime) return;

    const remaining = Math.max(0, shieldEndTime - Date.now());
    maxMsRef.current = Math.max(remaining, 5000);

    const iv = setInterval(() => {
      const left = shieldEndTime - Date.now();
      setMsLeft(Math.max(0, left));
      if (left <= 0) clearInterval(iv);
    }, 100);
    return () => clearInterval(iv);
  }, [bossShield, shieldEndTime]);

  if (!bossShield) return null;

  const secsLeft = Math.ceil(msLeft / 1000);
  const pct = Math.min(1, Math.max(0, msLeft / 30000));
  const r = 110;
  const circ = 2 * Math.PI * r;

  return (
    <group ref={groupRef}>
      <Html
        center
        distanceFactor={10}
        occlude={false}
        zIndexRange={[10, 10]}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <div className="w-[240px] h-[240px] relative flex items-center justify-center">
          {/* Spinning outer ring */}
          <div
            className="absolute inset-0 rounded-full border-[3px] border-[rgba(0,245,255,0.8)]"
            style={{
              boxShadow: "0 0 28px rgba(0,245,255,0.7), inset 0 0 28px rgba(0,245,255,0.15)",
              animation: "shieldSpin 2s linear infinite",
            }}
          />
          {/* Inner dashed ring */}
          <div
            className="absolute rounded-full border-[1.5px] border-dashed border-[rgba(0,245,255,0.4)]"
            style={{
              inset: 12,
              animation: "shieldSpin 3s linear infinite reverse",
            }}
          />
          {/* SVG arc countdown */}
          <svg width="240" height="240" className="absolute inset-0 -rotate-90">
            <circle cx="120" cy="120" r={r} fill="none" stroke="rgba(0,245,255,0.12)" strokeWidth="6" />
            <circle
              cx="120" cy="120" r={r}
              fill="none"
              stroke={pct > 0.3 ? "#00f5ff" : "#ff6600"}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - pct)}
              style={{
                transition: "stroke-dashoffset 0.15s linear, stroke 0.5s",
                filter: "drop-shadow(0 0 6px #00f5ff)",
              }}
            />
          </svg>
          {/* Center */}
          <div className="flex flex-col items-center gap-1 z-[1]">
            <span className="text-4xl leading-none" style={{ filter: "drop-shadow(0 0 10px rgba(0,245,255,0.9))" }}>
              🛡️
            </span>
            <span
              className="text-[20px] font-black tracking-[0.05em]"
              style={{
                color: pct > 0.3 ? "#00f5ff" : "#ff8800",
                textShadow: "0 0 12px rgba(0,245,255,1), 0 0 24px rgba(0,245,255,0.6)",
              }}
            >
              {secsLeft}s
            </span>
          </div>
        </div>
        <style>{`
          @keyframes shieldSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </Html>
    </group>
  );
}
