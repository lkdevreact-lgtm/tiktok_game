
import { useEffect, useRef } from "react";
import ToggleSwitch from "./ui/ToggleSwitch";
import { useGifts } from "../hooks/useGifts";

export default function SidebarSetting({ isOpen, onClose }) {
  const { gifts, toggleGiftActive } = useGifts();
  const panelRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
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
          position: "fixed", top: 0, right: 0, bottom: 0, width: 300,
          display: "flex", flexDirection: "column",
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: "1px solid rgba(0,245,255,0.15)", fontFamily: "var(--font-game)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-success)", boxShadow: "0 0 8px var(--color-success)", flexShrink: 0, display: "inline-block" }} />
            <span style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--color-cyan)" }}>
              Gift Config
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "rgba(200,220,255,0.7)", cursor: "pointer", padding: "4px 10px", fontSize: "0.8rem", transition: "background 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
          >
            ✕
          </button>
        </div>

        {/* Subtitle */}
        <div style={{ padding: "8px 18px 4px", fontSize: "0.6rem", color: "rgba(180,200,255,0.35)", fontFamily: "var(--font-game)", letterSpacing: "0.05em" }}>
          Bật/tắt quà để hiển thị trong danh sách chọn của Model Manager
        </div>

        {/* Active count */}
        <div style={{ padding: "0 18px 8px", fontSize: "0.63rem", color: "rgba(0,245,255,0.6)" }}>
          ✅ {gifts.filter((g) => g.active).length}/{gifts.length} quà đang active
        </div>

        {/* Scroll area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
          {gifts.length === 0 && (
            <div style={{ fontSize: "0.75rem", textAlign: "center", padding: 20, color: "rgba(180,200,255,0.3)" }}>
              Loading gifts...
            </div>
          )}

          {gifts.map((gift) => (
            <div
              key={gift.giftId}
              style={{
                borderRadius: 10, padding: "8px 12px",
                display: "flex", alignItems: "center", gap: 10,
                background: gift.active ? "rgba(0,245,255,0.05)" : "rgba(255,255,255,0.015)",
                border: `1px solid ${gift.active ? "rgba(0,245,255,0.2)" : "rgba(255,255,255,0.06)"}`,
                transition: "border-color 0.2s, background 0.2s",
                opacity: gift.active ? 1 : 0.55,
              }}
            >
              {/* Gift image */}
              {gift.image ? (
                <img src={gift.image} alt={gift.giftName} style={{ width: 36, height: 36, borderRadius: 8, objectFit: "contain", background: "rgba(255,255,255,0.05)", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, background: "rgba(255,255,255,0.05)", flexShrink: 0 }}>
                  🎁
                </div>
              )}

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 600, color: gift.active ? "#e0e8ff" : "rgba(180,200,255,0.45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {gift.giftName}
                </div>
                <div style={{ fontSize: "0.65rem", color: "var(--color-gold)", marginTop: 1 }}>
                  💎 {gift.diamonds}
                </div>
              </div>

              {/* Toggle */}
              <ToggleSwitch
                value={gift.active}
                onChange={() => toggleGiftActive(gift.giftId)}
                title={gift.active ? "Tắt khỏi danh sách chọn" : "Bật lại trong danh sách chọn"}
              />
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
