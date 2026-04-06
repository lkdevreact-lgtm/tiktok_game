/**
 * ModelCard.jsx
 * Card hiển thị một model (ship hoặc boss) với các action buttons
 */
import { useState, useEffect } from "react";
import { btnBase, FIRE_RATE_OPTIONS } from "../ui/styles";
import RoleBadge from "../ui/RoleBadge";
import EditForm from "./EditForm";

// ── Model emoji badge ─────────────────────────────────────────
function ModelBadge({ emoji, color, active }) {
  return (
    <div
      style={{
        width: 42,
        height: 42,
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 20,
        flexShrink: 0,
        background: `${color}14`,
        border: `1.5px solid ${active ? color + "66" : "rgba(255,255,255,0.1)"}`,
        boxShadow: active ? `0 0 10px ${color}22` : "none",
        opacity: active ? 1 : 0.45,
        transition: "all 0.2s",
      }}
    >
      {emoji}
    </div>
  );
}

// ── Fire rate label helper ─────────────────────────────────────
function fireRateLabel(v) {
  const found = FIRE_RATE_OPTIONS.find((o) => o.value === v);
  return found ? found.label.split(" ")[0] : `${v}`;
}

// ── ModelCard ─────────────────────────────────────────────────
export default function ModelCard({
  model,
  isActiveBoss = false,
  onUpdate,
  onDelete,
  onToggleShip,
  onSetActiveBoss,
}) {
  const [expanded, setExpanded] = useState(false);
  const [local, setLocal] = useState({
    label:        model.label,
    scale:        model.scale,
    gunTipOffset: model.gunTipOffset,
    rotationY:    model.rotationY,
    bulletColor:  model.bulletColor || "#00f5ff",
    damage:       model.damage ?? 1,
    fireRate:     model.fireRate ?? 1.0,
    gifts:        model.gifts || [],
  });

  // Sync khi model thay đổi từ bên ngoài
  useEffect(() => {
    setLocal({
      label:        model.label,
      scale:        model.scale,
      gunTipOffset: model.gunTipOffset,
      rotationY:    model.rotationY,
      bulletColor:  model.bulletColor || "#00f5ff",
      damage:       model.damage ?? 1,
      fireRate:     model.fireRate ?? 1.0,
      gifts:        model.gifts || [],
    });
  }, [model.label, model.scale, model.gunTipOffset, model.rotationY, model.bulletColor, model.damage, model.fireRate, model.gifts]);

  const isBoss   = model.role === "boss";
  const isActive = isBoss ? isActiveBoss : model.active;
  const color    = model.bulletColor || "#00f5ff";

  const handleSave = () => {
    onUpdate?.(model.id, {
      label:        local.label,
      scale:        parseFloat(local.scale),
      gunTipOffset: parseFloat(local.gunTipOffset),
      rotationY:    parseFloat(local.rotationY),
      bulletColor:  local.bulletColor,
      damage:       Number(local.damage),
      fireRate:     Number(local.fireRate),
      gifts:        local.gifts,
    });
    setExpanded(false);
  };

  return (
    <div
      style={{
        borderRadius: 10,
        padding: "10px 12px",
        background: isActive ? `${color}08` : "rgba(255,255,255,0.02)",
        border: `1px solid ${isActive ? color + "33" : "rgba(255,255,255,0.08)"}`,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        opacity: isActive ? 1 : 0.65,
        transition: "all 0.2s",
      }}
    >
      {/* ── Top row ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ModelBadge emoji={model.emoji || "🚀"} color={color} active={isActive} />

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3, flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: isActive ? "#e0e8ff" : "rgba(180,200,255,0.5)" }}>
              {model.label}
            </span>
            <RoleBadge role={model.role} />
            {isBoss && isActiveBoss && (
              <span style={{ fontSize: "0.5rem", textTransform: "uppercase", color: "#ff4466", background: "rgba(255,0,66,0.12)", border: "1px solid rgba(255,0,66,0.3)", borderRadius: 4, padding: "1px 5px" }}>
                ACTIVE
              </span>
            )}
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              `Scale: ${model.scale}`,
              `Dmg: ${model.damage ?? 1}`,
              `Rate: ${fireRateLabel(model.fireRate ?? 1)}`,
              `Rot: ${model.rotationY}°`,
            ].map((t) => (
              <span key={t} style={{ fontSize: "0.6rem", color: "rgba(180,200,255,0.4)" }}>{t}</span>
            ))}
            <span style={{ fontSize: "0.6rem", color, fontWeight: 700 }}>● {color}</span>
          </div>

          {/* Gifts count (ship only) */}
          {!isBoss && (
            <div style={{ marginTop: 2, fontSize: "0.58rem", color: model.gifts?.length ? "var(--color-gold)" : "rgba(180,200,255,0.25)" }}>
              🎁 {model.gifts?.length ? `${model.gifts.length} quà gắn` : "Chưa gắn quà"}
            </div>
          )}
        </div>

        {/* ── Action buttons ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
          {/* Edit */}
          <button
            onClick={() => setExpanded((v) => !v)}
            title="Sửa thông số"
            style={{
              ...btnBase,
              background: expanded ? "rgba(0,245,255,0.18)" : "rgba(0,245,255,0.08)",
              border: "1px solid rgba(0,245,255,0.3)",
              color: "var(--color-cyan)",
            }}
          >
            {expanded ? "↑" : "✏️"}
          </button>

          {/* Toggle active (ship) */}
          {!isBoss && onToggleShip && (
            <button
              onClick={() => onToggleShip(model.id)}
              title={isActive ? "Tắt ship" : "Bật ship"}
              style={{
                ...btnBase,
                background: isActive ? "rgba(0,245,255,0.12)" : "rgba(255,255,255,0.06)",
                border: `1px solid ${isActive ? "rgba(0,245,255,0.4)" : "rgba(255,255,255,0.15)"}`,
                color: isActive ? "var(--color-cyan)" : "rgba(180,200,255,0.4)",
              }}
            >
              {isActive ? "✅" : "⭕"}
            </button>
          )}

          {/* Set active boss */}
          {isBoss && onSetActiveBoss && !isActiveBoss && (
            <button
              onClick={() => onSetActiveBoss(model.id)}
              title="Dùng làm Boss trong game"
              style={{ ...btnBase, background: "rgba(255,68,102,0.1)", border: "1px solid rgba(255,68,102,0.35)", color: "#ff7799" }}
            >
              ⭕
            </button>
          )}
          {isBoss && isActiveBoss && (
            <button
              disabled
              title="Đang là Active Boss"
              style={{ ...btnBase, background: "rgba(255,68,102,0.18)", border: "1px solid rgba(255,68,102,0.5)", color: "#ff4466", cursor: "default" }}
            >
              ✅
            </button>
          )}

          {/* Delete custom */}
          {onDelete && (
            <button
              onClick={() => onDelete(model.id)}
              title="Xóa model"
              style={{ ...btnBase, background: "rgba(255,51,102,0.08)", border: "1px solid rgba(255,51,102,0.3)", color: "#ff5577" }}
            >
              🗑
            </button>
          )}
        </div>
      </div>

      {/* ── Edit form ── */}
      {expanded && (
        <EditForm
          local={local}
          setLocal={setLocal}
          onSave={handleSave}
          isBoss={isBoss}
        />
      )}
    </div>
  );
}
