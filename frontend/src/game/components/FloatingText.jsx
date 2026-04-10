import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";

export default function FloatingText({
  id,
  amount,
  position,
  type = "damage",
  color = "#ff3366",
  onComplete,
}) {
  const groupRef = useRef();
  const divRef = useRef(null);
  const lifeRef = useRef(1.0); // 1.0 -> 0.0

  // Kích thước chữ
  const isHeal = type === "heal";
  const isShield = type === "shield";
  const scale = useMemo(
    () => (isShield ? 1.2 : isHeal ? 1.5 : 1.0 + Math.random() * 0.5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id]
  );

  useFrame((_, delta) => {
    if (groupRef.current) {
      // Bay lên trên
      groupRef.current.position.y += delta * (isHeal ? 2.5 : 1.5);
      // Giảm vòng đời
      lifeRef.current -= delta * (isShield ? 0.8 : 0.9);

      if (lifeRef.current <= 0) {
        onComplete(id);
      } else if (divRef.current) {
        // Cập nhật opacity
        const t = lifeRef.current;
        divRef.current.style.opacity = Math.max(0, t);
        // Có thể phóng to chữ lúc đầu rồi nhỏ dần
        const currentScale = scale * (0.8 + t * 0.4);
        divRef.current.style.transform = `translate3d(-50%, -50%, 0) scale(${currentScale})`;
      }
    }
  });

  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]}>
      <Html center zIndexRange={[100, 0]} style={{ pointerEvents: "none" }}>
        <div
          ref={divRef}
          className={`font-black uppercase tracking-wider whitespace-nowrap drop-shadow-xl select-none`}
          style={{
            color: color,
            textShadow: `0 0 10px ${color}, 0 0 20px ${color}`,
            fontSize: isShield ? "1.5rem" : isHeal ? "2rem" : "1.8rem",
          }}
        >
          {isHeal ? `+${amount}` : isShield ? "" : `-${amount}`}
        </div>
      </Html>
    </group>
  );
}
