import { useState, useEffect } from "react";
import { btnBase, FIRE_RATE_OPTIONS } from "../ui/styles";
import RoleBadge from "../ui/RoleBadge";
import ToggleSwitch from "../ui/ToggleSwitch";
import EditForm from "./EditForm";
import { FaEdit } from "react-icons/fa";
import { IoClose } from "react-icons/io5";


function ModelBadge({ emoji, color, active }) {
  return (
    <div
      className={`w-[42px] h-[42px] rounded-[10px] flex items-center justify-center text-[20px] shrink-0 transition-all duration-200 ${active ? "opacity-100" : "opacity-45"}`}
      style={{
        background: `${color}14`,
        border: `1.5px solid ${active ? color + "66" : "rgba(255,255,255,0.1)"}`,
        boxShadow: active ? `0 0 10px ${color}22` : "none",
      }}
    >
      {emoji}
    </div>
  );
}

function fireRateLabel(v) {
  const found = FIRE_RATE_OPTIONS.find((o) => o.value === v);
  return found ? found.label.split(" ")[0] : `${v}`;
}

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
    label: model.label,
    scale: model.scale,
    gunTipOffset: model.gunTipOffset,
    rotationY: model.rotationY,
    bulletColor: model.bulletColor || "#00f5ff",
    damage: model.damage ?? 1,
    fireRate: model.fireRate ?? 1.0,
    gifts: model.gifts || [],
  });

  useEffect(() => {
    setLocal({
      label: model.label,
      scale: model.scale,
      gunTipOffset: model.gunTipOffset,
      rotationY: model.rotationY,
      bulletColor: model.bulletColor || "#00f5ff",
      damage: model.damage ?? 1,
      fireRate: model.fireRate ?? 1.0,
      gifts: model.gifts || [],
    });
  }, [
    model.label,
    model.scale,
    model.gunTipOffset,
    model.rotationY,
    model.bulletColor,
    model.damage,
    model.fireRate,
    model.gifts,
  ]);

  const isBoss = model.role === "boss";
  const isActive = isBoss ? isActiveBoss : model.active;
  const color = model.bulletColor || "#00f5ff";

  const handleSave = () => {
    onUpdate?.(model.id, {
      label: local.label,
      scale: parseFloat(local.scale),
      gunTipOffset: parseFloat(local.gunTipOffset),
      rotationY: parseFloat(local.rotationY),
      bulletColor: local.bulletColor,
      damage: Number(local.damage),
      fireRate: Number(local.fireRate),
      gifts: local.gifts,
    });
    setExpanded(false);
  };

  return (
    <div
      className={`rounded-[10px] px-3 py-2.5 flex flex-col gap-2 transition-all duration-200 ${isActive ? "opacity-100" : "opacity-65"} ${!isActive ? "bg-[#FFFFFF05] border border-[#FFFFFF14]" : ""}`}
      style={
        isActive
          ? {
              background: `${color}08`,
              border: `1px solid ${color}33`,
            }
          : undefined
      }
    >
      {/* ── Top row ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ModelBadge
          emoji={model.emoji || "🚀"}
          color={color}
          active={isActive}
        />

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              marginBottom: 3,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: "0.82rem",
                fontWeight: 600,
                color: isActive ? "#e0e8ff" : "rgba(180,200,255,0.5)",
              }}
            >
              {model.label}
            </span>
            <RoleBadge role={model.role} />
            {isBoss && isActiveBoss && (
              <span
                style={{
                  fontSize: "0.5rem",
                  textTransform: "uppercase",
                  color: "#ff4466",
                  background: "rgba(255,0,66,0.12)",
                  border: "1px solid rgba(255,0,66,0.3)",
                  borderRadius: 4,
                  padding: "1px 5px",
                }}
              >
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
              <span
                key={t}
                style={{ fontSize: "0.6rem", color: "rgba(180,200,255,0.4)" }}
              >
                {t}
              </span>
            ))}
            <span style={{ fontSize: "0.6rem", color, fontWeight: 700 }}>
              ● {color}
            </span>
          </div>

          {/* Gifts count (ship only) */}
          {!isBoss && (
            <div
              style={{
                marginTop: 2,
                fontSize: "0.58rem",
                color: model.gifts?.length
                  ? "var(--color-gold)"
                  : "rgba(180,200,255,0.25)",
              }}
            >
              🎁{" "}
              {model.gifts?.length
                ? `${model.gifts.length} quà gắn`
                : "Chưa gắn quà"}
            </div>
          )}
        </div>

        {/* ── Action buttons ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setExpanded((v) => !v)}
            title="Sửa thông số"
            style={{
              ...btnBase,
              background: expanded
                ? "rgba(0,245,255,0.18)"
                : "rgba(0,245,255,0.08)",
              border: "1px solid rgba(0,245,255,0.3)",
              color: "var(--color-cyan)",
            }}
            className="flex items-center justify-center"
          >
            {expanded ? <IoClose size={18}/> : <FaEdit size={15} />}
          </button>

          {/* Toggle active (ship) */}
          {!isBoss && onToggleShip && (
            <ToggleSwitch
              value={isActive}
              onChange={() => onToggleShip(model.id)}
              title={isActive ? "Tắt ship" : "Bật ship"}
            />
          )}

          {/* Toggle active boss */}
          {isBoss && onSetActiveBoss && (
            <ToggleSwitch
              value={isActiveBoss}
              onChange={() => !isActiveBoss && onSetActiveBoss(model.id)}
              title={
                isActiveBoss
                  ? "Đang là Active Boss"
                  : "Dùng làm Boss trong game"
              }
            />
          )}

          {/* Delete custom */}
          {onDelete && (
            <button
              onClick={() => onDelete(model.id)}
              title="Xóa model"
              style={{
                ...btnBase,
                background: "rgba(255,51,102,0.08)",
                border: "1px solid rgba(255,51,102,0.3)",
                color: "#ff5577",
              }}
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
