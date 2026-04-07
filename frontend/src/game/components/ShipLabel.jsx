import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";

/**
 * ShipLabel — hiển thị avatar, nickname và HP bar (shots) cho mỗi tàu con.
 * Theo dõi vị trí mesh trong game loop để label luôn đúng vị trí.
 */
export default function ShipLabel({ mesh, aliveRef, nickname, avatarUrl, shotsRef, maxShots }) {
  const groupRef = useRef();
  const [visible, setVisible] = useState(true);
  const [shotsDisplay, setShotsDisplay] = useState(maxShots ?? 20);

  useFrame(() => {
    if (!groupRef.current || !mesh) return;
    if (aliveRef && !aliveRef.current) {
      if (visible) setVisible(false);
      return;
    }
    groupRef.current.position.copy(mesh.position);
    // Cập nhật số đạn hiển thị khi thay đổi
    if (shotsRef && shotsRef.current !== shotsDisplay) {
      setShotsDisplay(shotsRef.current);
    }
  });

  if (!visible) return null;

  const pct = maxShots ? Math.max(0, shotsDisplay / maxShots) : 1;
  const hpColor = pct > 0.5 ? "#00f5ff" : pct > 0.25 ? "#ffaa00" : "#ff4466";
  const hasInfo = nickname || avatarUrl;

  return (
    <group ref={groupRef}>
      <Html
        center
        distanceFactor={8}
        occlude={false}
        zIndexRange={[10, 10]}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <div className="flex flex-col items-center gap-0.5 -translate-y-[52px]">
          {avatarUrl && (
            <img
              src={avatarUrl}
              alt={nickname}
              className="w-7 h-7 rounded-full object-cover"
              style={{
                border: "1.5px solid rgba(0,245,255,0.8)",
                boxShadow: "0 0 6px rgba(0,245,255,0.5)",
              }}
            />
          )}
          {nickname && (
            <span
              className="text-[10px] font-bold text-white whitespace-nowrap tracking-[0.02em]"
              style={{ textShadow: "0 0 6px rgba(0,245,255,0.9), 0 1px 2px rgba(0,0,0,0.8)" }}
            >
              {nickname.length > 12 ? nickname.slice(0, 12) + "…" : nickname}
            </span>
          )}

          {/* HP / Shots bar */}
          {maxShots && (
            <div
              style={{
                width: hasInfo ? 60 : 40,
                height: 4,
                borderRadius: 3,
                background: "rgba(255,255,255,0.12)",
                overflow: "hidden",
                marginTop: hasInfo ? 1 : 0,
              }}
            >
              <div
                style={{
                  width: `${pct * 100}%`,
                  height: "100%",
                  borderRadius: 3,
                  background: hpColor,
                  boxShadow: `0 0 4px ${hpColor}`,
                  transition: "width 0.15s ease-out, background 0.3s",
                }}
              />
            </div>
          )}

          {/* Số phát còn lại */}
          {maxShots && (
            <span
              style={{
                fontSize: 8,
                color: hpColor,
                textShadow: `0 0 4px ${hpColor}`,
                fontWeight: 700,
                letterSpacing: "0.04em",
                lineHeight: 1,
              }}
            >
              {shotsDisplay}/{maxShots}
            </span>
          )}
        </div>
      </Html>
    </group>
  );
}
