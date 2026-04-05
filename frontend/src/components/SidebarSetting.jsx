import { useEffect, useState } from "react";
import { useGame } from "../store/gameStore";
import socket from "../socket/socketClient";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

const SPACESHIP_OPTIONS = [
  { value: "spaceship_1", label: "🔵 Fighter" },
  { value: "spaceship_2", label: "🟣 Cruiser" },
  { value: "spaceship_3", label: "🟡 Destroyer" },
];

const DAMAGE_OPTIONS = [1, 2, 3, 4, 5];
const FIRE_RATE_OPTIONS = [
  { value: 0.3, label: "Slow" },
  { value: 0.5, label: "Normal" },
  { value: 1.0, label: "Fast" },
  { value: 1.5, label: "Rapid" },
  { value: 2.0, label: "Turbo" },
];

export default function SidebarSetting() {
  const { giftMapping, updateGiftMapping } = useGame();
  const [gifts, setGifts] = useState([]);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/gifts`)
      .then((r) => r.json())
      .then((data) => {
        const active = data.filter((g) => g.diamonds && g.active !== false);
        active.sort((a, b) => (a.diamonds || 0) - (b.diamonds || 0));
        setGifts(active);
      })
      .catch(() => {});
  }, []);

  const handleToggle = (giftId) => {
    const current = giftMapping[giftId];
    const isActive = current?.active ?? false;
    updateGiftMapping(giftId, { active: !isActive });
    socket.emit("update_gift_mapping", {
      mapping: { ...giftMapping, [giftId]: { ...current, active: !isActive } },
    });
  };

  const handleChange = (giftId, field, value) => {
    const current = giftMapping[giftId] || { spaceship: "spaceship_1", damage: 1, fireRate: 1.0, active: true };
    const updated = { ...current, [field]: value };
    updateGiftMapping(giftId, updated);
    socket.emit("update_gift_mapping", { mapping: { ...giftMapping, [giftId]: updated } });
  };

  return (
    <aside
      className="w-[300px] flex flex-col overflow-hidden"
      style={{
        background: "rgba(2,8,20,0.92)",
        borderLeft: "1px solid var(--color-border)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-4 text-[0.7rem] uppercase tracking-[0.15em]"
        style={{
          borderBottom: "1px solid var(--color-border)",
          fontFamily: "var(--font-game)",
          color: "var(--color-cyan)",
        }}
      >
        <span
          className="w-2 h-2 rounded-full flex-shrink-0 animate-blink"
          style={{ background: "var(--color-success)", boxShadow: "0 0 8px var(--color-success)" }}
        />
        Gift Config
      </div>

      {/* Scroll area */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {gifts.length === 0 && (
          <div
            className="text-[0.75rem] text-center p-5"
            style={{ color: "rgba(180,200,255,0.3)" }}
          >
            Loading gifts...
          </div>
        )}

        {gifts.map((gift) => {
          const config   = giftMapping[gift.giftId] || {};
          const isActive = config.active ?? false;

          return (
            <div
              key={gift.giftId}
              className="rounded-lg p-[10px_12px] flex flex-col gap-2 transition-colors duration-200"
              style={{
                background: isActive ? "rgba(0,245,255,0.06)" : "rgba(0,245,255,0.03)",
                border: `1px solid ${isActive ? "rgba(0,245,255,0.35)" : "rgba(0,245,255,0.1)"}`,
              }}
            >
              {/* Top row */}
              <div className="flex items-center gap-[10px]">
                {gift.image ? (
                  <img
                    src={gift.image}
                    alt={gift.giftName}
                    className="w-9 h-9 rounded-md object-contain"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  />
                ) : (
                  <div
                    className="w-9 h-9 rounded-md flex items-center justify-center text-xl"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  >
                    🎁
                  </div>
                )}

                <div className="flex-1">
                  <div className="text-[0.8rem] font-semibold text-[#e0e8ff] mb-0.5">
                    {gift.giftName}
                  </div>
                  <div className="text-[0.68rem]" style={{ color: "var(--color-gold)" }}>
                    💎 {gift.diamonds}
                  </div>
                </div>

                {/* Toggle switch */}
                <button
                  onClick={() => handleToggle(gift.giftId)}
                  title={isActive ? "Deactivate" : "Activate"}
                  className={`gift-toggle-thumb w-9 h-5 rounded-[10px] relative flex-shrink-0 cursor-pointer transition-colors duration-200 ${isActive ? "on" : ""}`}
                  style={{
                    background: isActive ? "var(--color-cyan)" : "rgba(255,255,255,0.1)",
                    border: `1px solid ${isActive ? "var(--color-cyan)" : "rgba(255,255,255,0.2)"}`,
                  }}
                />
              </div>

              {/* Controls (only when active) */}
              {isActive && (
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    {
                      label: "Ship",
                      field: "spaceship",
                      value: config.spaceship || "spaceship_1",
                      options: SPACESHIP_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
                    },
                    {
                      label: "Dmg",
                      field: "damage",
                      value: config.damage ?? 1,
                      options: DAMAGE_OPTIONS.map((d) => ({ value: d, label: d })),
                      parseNum: true,
                    },
                    {
                      label: "Fire Rate",
                      field: "fireRate",
                      value: config.fireRate ?? 1.0,
                      options: FIRE_RATE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
                      parseNum: true,
                    },
                  ].map(({ label, field, value, options, parseNum }) => (
                    <div key={field}>
                      <label
                        className="block text-[0.6rem] uppercase tracking-[0.08em] mb-1"
                        style={{ fontFamily: "var(--font-game)", color: "rgba(180,200,255,0.5)" }}
                      >
                        {label}
                      </label>
                      <select
                        className="w-full rounded text-[0.72rem] px-1.5 py-1 outline-none text-[#e0e8ff]"
                        style={{
                          background: "rgba(0,0,0,0.4)",
                          border: "1px solid var(--color-border)",
                        }}
                        value={value}
                        onChange={(e) =>
                          handleChange(gift.giftId, field, parseNum ? Number(e.target.value) : e.target.value)
                        }
                      >
                        {options.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
