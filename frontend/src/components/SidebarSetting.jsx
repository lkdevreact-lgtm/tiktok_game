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
        // Sort by diamonds
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
    socket.emit("update_gift_mapping", {
      mapping: { ...giftMapping, [giftId]: updated },
    });
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="dot" />
        Gift Config
      </div>
      <div className="sidebar-scroll">
        {gifts.length === 0 && (
          <div style={{ color: "rgba(180,200,255,0.3)", fontSize: "0.75rem", textAlign: "center", padding: "20px" }}>
            Loading gifts...
          </div>
        )}
        {gifts.map((gift) => {
          const config = giftMapping[gift.giftId] || {};
          const isActive = config.active ?? false;
          return (
            <div key={gift.giftId} className={`gift-card ${isActive ? "active" : ""}`}>
              <div className="gift-card-top">
                {gift.image ? (
                  <img src={gift.image} alt={gift.giftName} className="gift-img" />
                ) : (
                  <div className="gift-img-placeholder">🎁</div>
                )}
                <div className="gift-info">
                  <div className="gift-name">{gift.giftName}</div>
                  <div className="gift-diamonds">💎 {gift.diamonds}</div>
                </div>
                <button
                  className={`gift-toggle ${isActive ? "on" : ""}`}
                  onClick={() => handleToggle(gift.giftId)}
                  title={isActive ? "Deactivate" : "Activate"}
                />
              </div>

              {isActive && (
                <div className="gift-card-controls">
                  <div className="ctrl-group">
                    <label>Ship</label>
                    <select
                      value={config.spaceship || "spaceship_1"}
                      onChange={(e) => handleChange(gift.giftId, "spaceship", e.target.value)}
                    >
                      {SPACESHIP_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="ctrl-group">
                    <label>Dmg</label>
                    <select
                      value={config.damage ?? 1}
                      onChange={(e) => handleChange(gift.giftId, "damage", Number(e.target.value))}
                    >
                      {DAMAGE_OPTIONS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="ctrl-group">
                    <label>Fire Rate</label>
                    <select
                      value={config.fireRate ?? 1.0}
                      onChange={(e) => handleChange(gift.giftId, "fireRate", Number(e.target.value))}
                    >
                      {FIRE_RATE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
