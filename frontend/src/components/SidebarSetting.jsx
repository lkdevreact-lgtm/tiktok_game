import { useEffect, useState, useRef } from "react";
import { useGame } from "../store/gameStore";
import { useModels } from "../store/modelStore";
import socket from "../socket/socketClient";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";



const DAMAGE_OPTIONS = [1, 2, 3, 4, 5];
const FIRE_RATE_OPTIONS = [
  { value: 0.3, label: "Slow" },
  { value: 0.5, label: "Normal" },
  { value: 1.0, label: "Fast" },
  { value: 1.5, label: "Rapid" },
  { value: 2.0, label: "Turbo" },
];

export default function SidebarSetting({ isOpen, onClose }) {
  const { giftMapping, updateGiftMapping } = useGame();
  const { shipModels } = useModels();
  const [gifts, setGifts] = useState([]);
  const panelRef = useRef(null);

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

  // Close on backdrop click
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

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
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(4px)",
          zIndex: 90,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
      />

      {/* Sliding Panel */}
      <aside
        ref={panelRef}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 320,
          display: "flex",
          flexDirection: "column",
          background: "rgba(4,10,28,0.97)",
          borderLeft: "1px solid rgba(0,245,255,0.18)",
          backdropFilter: "blur(24px)",
          zIndex: 100,
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: isOpen ? "-8px 0 40px rgba(0,0,0,0.6)" : "none",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 18px",
            borderBottom: "1px solid rgba(0,245,255,0.15)",
            fontFamily: "var(--font-game)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--color-success)",
                boxShadow: "0 0 8px var(--color-success)",
                flexShrink: 0,
                display: "inline-block",
              }}
            />
            <span
              style={{
                fontSize: "0.7rem",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "var(--color-cyan)",
              }}
            >
              Gift Config
            </span>
          </div>
          <button
            onClick={onClose}
            title="Close"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8,
              color: "rgba(200,220,255,0.7)",
              cursor: "pointer",
              padding: "4px 10px",
              fontSize: "0.8rem",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
          >
            ✕
          </button>
        </div>

        {/* Scroll area */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "12px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {gifts.length === 0 && (
            <div
              style={{
                fontSize: "0.75rem",
                textAlign: "center",
                padding: 20,
                color: "rgba(180,200,255,0.3)",
              }}
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
                style={{
                  borderRadius: 10,
                  padding: "10px 12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  background: isActive ? "rgba(0,245,255,0.06)" : "rgba(0,245,255,0.03)",
                  border: `1px solid ${isActive ? "rgba(0,245,255,0.35)" : "rgba(0,245,255,0.1)"}`,
                  transition: "border-color 0.2s, background 0.2s",
                }}
              >
                {/* Top row */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {gift.image ? (
                    <img
                      src={gift.image}
                      alt={gift.giftName}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        objectFit: "contain",
                        background: "rgba(255,255,255,0.05)",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                        background: "rgba(255,255,255,0.05)",
                        flexShrink: 0,
                      }}
                    >
                      🎁
                    </div>
                  )}

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#e0e8ff", marginBottom: 2 }}>
                      {gift.giftName}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "var(--color-gold)" }}>
                      💎 {gift.diamonds}
                    </div>
                  </div>

                  {/* Toggle switch */}
                  <button
                    onClick={() => handleToggle(gift.giftId)}
                    title={isActive ? "Deactivate" : "Activate"}
                    style={{
                      width: 36,
                      height: 20,
                      borderRadius: 10,
                      position: "relative",
                      flexShrink: 0,
                      cursor: "pointer",
                      transition: "background 0.2s, border-color 0.2s",
                      background: isActive ? "var(--color-cyan)" : "rgba(255,255,255,0.1)",
                      border: `1px solid ${isActive ? "var(--color-cyan)" : "rgba(255,255,255,0.2)"}`,
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: 2,
                        left: isActive ? "calc(100% - 18px)" : 2,
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        background: "#fff",
                        transition: "left 0.2s",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
                      }}
                    />
                  </button>
                </div>

                {/* Controls (only when active) */}
                {isActive && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {[
                      {
                        label: "Ship",
                        field: "spaceship",
                        value: config.spaceship || "spaceship_1",
                        options: shipModels.map((m) => ({ value: m.id, label: `${m.emoji || "🚀"} ${m.label}` })),
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
                          style={{
                            display: "block",
                            fontSize: "0.6rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            marginBottom: 4,
                            fontFamily: "var(--font-game)",
                            color: "rgba(180,200,255,0.5)",
                          }}
                        >
                          {label}
                        </label>
                        <select
                          style={{
                            width: "100%",
                            borderRadius: 4,
                            fontSize: "0.72rem",
                            padding: "4px 6px",
                            outline: "none",
                            color: "#e0e8ff",
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
    </>
  );
}
