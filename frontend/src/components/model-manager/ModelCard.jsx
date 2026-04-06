import { useState, useEffect, useRef } from "react";
import { btnBase, FIRE_RATE_OPTIONS } from "../ui/styles";
import RoleBadge from "../ui/RoleBadge";
import ToggleSwitch from "../ui/ToggleSwitch";
import EditForm from "./EditForm";
import { FaEdit, FaCamera, FaCube } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { API_URL } from "../../utils/constant";

const DEFAULT_SHIP_IMG = "/images/default_spaceship.jpg";
const DEFAULT_BOSS_IMG = "/images/evil_boss.png";

function ModelAvatar({ iconUrl, isBoss, modelId, onIconUploaded, active }) {
  const inputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [hovered, setHovered] = useState(false);

  const defaultImg = isBoss ? DEFAULT_BOSS_IMG : DEFAULT_SHIP_IMG;
  const src = iconUrl || defaultImg;

  const handleUpload = async (e) => {
    const f = e.target.files?.[0];
    if (!f || !modelId) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("iconImage", f);
      const res  = await fetch(`${API_URL}/api/models/${modelId}/icon`, { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.iconUrl) onIconUploaded?.(data.iconUrl);
    } catch { /* ignore */ }
    finally { setUploading(false); if (inputRef.current) inputRef.current.value = ""; }
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Click để đổi ảnh icon"
      style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        overflow: "hidden", cursor: "pointer", position: "relative",
        border: `1.5px solid ${active ? "rgba(0,245,255,0.4)" : "rgba(255,255,255,0.12)"}`,
        opacity: active ? 1 : 0.5,
      }}
    >
      <img src={src} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      {hovered && (
        <div style={{
          position: "absolute", inset: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {uploading
            ? <span style={{ fontSize: 9, color: "#fff" }}>...</span>
            : <FaCamera size={12} color="#fff" />
          }
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: "none" }} />
    </div>
  );
}

/** Nút upload file GLB mới để thay thế model 3D */
function ReplaceGLBButton({ modelId, onReplaced }) {
  const inputRef = useRef();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const f = e.target.files?.[0];
    if (!f || !modelId) return;
    if (!f.name.toLowerCase().endsWith(".glb")) { alert("Chỉ hỗ trợ file .glb"); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res  = await fetch(`${API_URL}/api/models/${modelId}/glb`, { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.model) onReplaced?.(data.model);
    } catch { /* ignore */ }
    finally { setUploading(false); if (inputRef.current) inputRef.current.value = ""; }
  };

  return (
    <>
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        title="Thay file 3D (.glb)"
        style={{
          ...btnBase,
          background: uploading ? "rgba(167,139,250,0.18)" : "rgba(167,139,250,0.08)",
          border: "1px solid rgba(167,139,250,0.3)",
          color: "#a78bfa",
        }}
        className="flex items-center justify-center"
      >
        {uploading ? <span style={{ fontSize: 10 }}>⏳</span> : <FaCube size={13} />}
      </button>
      <input ref={inputRef} type="file" accept=".glb" onChange={handleUpload} style={{ display: "none" }} />
    </>
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
    healGifts: model.healGifts || [],
    shieldGifts: model.shieldGifts || [],
    iconUrl: model.iconUrl || null,
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
      healGifts: model.healGifts || [],
      shieldGifts: model.shieldGifts || [],
      iconUrl: model.iconUrl || null,
    });
  }, [
    model.label, model.scale, model.gunTipOffset, model.rotationY,
    model.bulletColor, model.damage, model.fireRate,
    model.gifts, model.healGifts, model.shieldGifts, model.iconUrl,
  ]);

  const isBoss  = model.role === "boss";
  const isActive = isBoss ? isActiveBoss : model.active;
  const color   = model.bulletColor || "#00f5ff";

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
      healGifts:    local.healGifts,
      shieldGifts:  local.shieldGifts,
    });
    setExpanded(false);
  };

  return (
    <div
      className={`rounded-[10px] px-3 py-2.5 flex flex-col gap-2 transition-all duration-200 ${isActive ? "opacity-100" : "opacity-60"}`}
      style={isActive
        ? { background: `${color}08`, border: `1px solid ${color}33` }
        : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)" }
      }
    >
      {/* ── Top row ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

        {/* Avatar ảnh (inline, nhỏ) */}
        <ModelAvatar
          iconUrl={local.iconUrl}
          isBoss={isBoss}
          modelId={model.id}
          active={isActive}
          onIconUploaded={(url) => {
            setLocal((p) => ({ ...p, iconUrl: url }));
            onUpdate?.(model.id, { iconUrl: url });
          }}
        />

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name row */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2, flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: isActive ? "#e0e8ff" : "rgba(180,200,255,0.45)" }}>
              {model.label}
            </span>
            <RoleBadge role={model.role} />
            {isBoss && isActiveBoss && (
              <span style={{
                fontSize: "0.48rem", textTransform: "uppercase",
                color: "#ff4466", background: "rgba(255,0,66,0.12)",
                border: "1px solid rgba(255,0,66,0.3)",
                borderRadius: 4, padding: "1px 5px",
              }}>ACTIVE</span>
            )}
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[
              `Scale: ${model.scale}`,
              `Dmg: ${model.damage ?? 1}`,
              `Rate: ${fireRateLabel(model.fireRate ?? 1)}`,
              `Rot: ${model.rotationY}°`,
            ].map((t) => (
              <span key={t} style={{ fontSize: "0.57rem", color: "rgba(180,200,255,0.38)" }}>{t}</span>
            ))}
            <span style={{ fontSize: "0.57rem", color, fontWeight: 700 }}>● {color}</span>
          </div>

          {/* Gifts count (ship only) */}
          {!isBoss && (
            <div style={{ marginTop: 1, fontSize: "0.55rem", color: model.gifts?.length ? "var(--color-gold)" : "rgba(180,200,255,0.2)" }}>
              🎁 {model.gifts?.length ? `${model.gifts.length} quà gắn` : "Chưa gắn quà"}
            </div>
          )}
        </div>

        {/* ── Action buttons ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
          {/* Edit params */}
          <button
            onClick={() => setExpanded((v) => !v)}
            title="Sửa thông số"
            style={{
              ...btnBase,
              background: expanded ? "rgba(0,245,255,0.18)" : "rgba(0,245,255,0.08)",
              border: "1px solid rgba(0,245,255,0.3)",
              color: "var(--color-cyan)",
            }}
            className="flex items-center justify-center"
          >
            {expanded ? <IoClose size={17} /> : <FaEdit size={13} />}
          </button>

          {/* Replace GLB file */}
          <ReplaceGLBButton
            modelId={model.id}
            onReplaced={(updated) => {
              onUpdate?.(model.id, { path: updated.path, filename: updated.filename, builtIn: false });
            }}
          />

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
              title={isActiveBoss ? "Đang là Active Boss" : "Dùng làm Boss trong game"}
            />
          )}

          {/* Delete – tất cả models đều có thể xóa */}
          {onDelete && (
            <button
              onClick={() => {
                if (window.confirm(`Xóa "${model.label}"?`)) onDelete(model.id);
              }}
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
        <EditForm local={local} setLocal={setLocal} onSave={handleSave} isBoss={isBoss} />
      )}
    </div>
  );
}
