import { useState, useCallback, useEffect, useRef } from "react";
import FloatingText from "./FloatingText";

export default function DamageManager({ onRegister }) {
  const [damages, setDamages] = useState([]);
  const damageId = useRef(0);

  const addDamage = useCallback((amount, position, type = "damage", color = "#ff3366") => {
    const id = ++damageId.current;
    
    // Thêm offset ngẫu nhiên nhẹ để số không đè lên nhau
    const offsetPos = position.clone();
    offsetPos.x += (Math.random() - 0.5) * 1.5;
    offsetPos.y += (Math.random() - 0.5) * 1.5;
    offsetPos.z += (Math.random() - 0.5) * 1.5;

    setDamages((prev) => [
      ...prev,
      { id, amount, position: offsetPos, type, color },
    ]);
  }, []);

  const removeDamage = useCallback((id) => {
    setDamages((prev) => prev.filter((d) => d.id !== id));
  }, []);

  useEffect(() => {
    if (onRegister) {
      onRegister(addDamage);
    }
  }, [onRegister, addDamage]);

  return (
    <group name="damage_manager">
      {damages.map((d) => (
        <FloatingText
          key={d.id}
          id={d.id}
          amount={d.amount}
          position={d.position}
          type={d.type}
          color={d.color}
          onComplete={removeDamage}
        />
      ))}
    </group>
  );
}
