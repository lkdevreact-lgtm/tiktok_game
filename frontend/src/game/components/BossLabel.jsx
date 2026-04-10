import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useGame } from "../../hooks/useGame";


export default function BossLabel({ bossRef }) {
  const { bossHp } = useGame();
  const groupRef = useRef();

  useFrame(() => {
    if (groupRef.current && bossRef.current) {
      groupRef.current.position.copy(bossRef.current.position);
    }
  });

  const hpPercent = Math.max(0, Math.min(100, bossHp));
  const hpColor =
    hpPercent > 50 ? "#ff3366" : hpPercent > 25 ? "#ff6600" : "#ff0000";

  return (
    <group ref={groupRef}>
      <Html
        center
        occlude={false}
        zIndexRange={[9, 9]}
        style={{ pointerEvents: "none", userSelect: "none" }}
        className="relative"
      >
        <div className=" absolute -top-64 -left-80 -translate-1/2 flex items-center gap-3 justify-center">
          <img
            src="/images/evil_boss.png"
            alt="Boss"
            className="w-14 h-14 rounded-full border-2 object-cover shadow-[0_0_12px_rgba(255,51,102,0.6)]"
          />

          <div className="flex flex-col items-start gap-[5px] px-3 py-2 rounded-[10px] border border-[rgba(255,51,102,0.3)] bg-[rgba(10,10,15,0.75)] backdrop-blur-[4px]">
            <span
              className="text-[13px] font-extrabold text-white uppercase tracking-[0.05em] whitespace-nowrap"
              style={{ textShadow: "0 0 6px rgba(255,51,102,0.9)" }}
            >
              Space ship boss{" "}
              <span className="ml-2" style={{ color: hpColor }}>
                {hpPercent.toFixed(1)}%
              </span>
            </span>
            <div className="w-[460px] h-2 rounded bg-white/10 overflow-hidden">
              <div
                className="h-full transition-[width] duration-200 ease-out"
                style={{
                  width: `${hpPercent}%`,
                  background: `linear-gradient(90deg, ${hpColor}, #ff0055)`,
                  boxShadow: `0 0 8px ${hpColor}`,
                }}
              />
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}
