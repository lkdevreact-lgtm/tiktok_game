/**
 * ModelManagerPanel.jsx
 * Quản lý models:
 * - Role: SHIP / BOSS (hiển thị badge rõ ràng)
 * - Active / Inactive toggle (ship: hiện/ẩn trong gift config; boss: chọn boss active)
 * - Edit thông số (scale, gunTip, rotationY, bulletColor, label)
 * - Upload GLB mới với role selector
 * - Xóa custom models
 * - Reset built-in về mặc định
 */
import { useState, useRef, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { useModels } from "../store/modelStore";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8888";

// ── Shared styles ─────────────────────────────────────────────
const inputStyle = {
  width: "100%",
  borderRadius: 6,
  fontSize: "0.75rem",
  padding: "6px 10px",
  outline: "none",
  color: "#e0e8ff",
  background: "rgba(0,0,0,0.35)",
  border: "1px solid rgba(0,245,255,0.2)",
  boxSizing: "border-box",
};

const labelStyle = {
  display: "block",
  fontSize: "0.59rem",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: 4,
  color: "rgba(180,200,255,0.5)",
  fontFamily: "var(--font-game)",
};

const btnBase = {
  borderRadius: 6,
  cursor: "pointer",
  padding: "5px 9px",
  fontSize: "0.68rem",
  lineHeight: 1,
  transition: "background 0.15s",
  flexShrink: 0,
};

// ── Role badge ────────────────────────────────────────────────
function RoleBadge({ role }) {
  const isShip = role === "ship";
  return (
    <span
      style={{
        fontSize: "0.52rem",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        fontFamily: "var(--font-game)",
        fontWeight: 700,
        padding: "2px 7px",
        borderRadius: 4,
        color: isShip ? "#00f5ff" : "#ff4466",
        background: isShip ? "rgba(0,245,255,0.1)" : "rgba(255,0,66,0.12)",
        border: `1px solid ${isShip ? "rgba(0,245,255,0.3)" : "rgba(255,0,66,0.3)"}`,
      }}
    >
      {isShip ? "SHIP" : "BOSS"}
    </span>
  );
}

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

// ── Edit form (shared) ────────────────────────────────────────
function EditForm({ local, setLocal, onSave }) {
  return (
    <div
      style={{
        padding: "12px",
        background: "rgba(0,0,0,0.3)",
        borderRadius: 8,
        border: "1px solid rgba(0,245,255,0.12)",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Display Name</label>
          <input
            style={inputStyle}
            value={local.label}
            onChange={(e) => setLocal((p) => ({ ...p, label: e.target.value }))}
          />
        </div>
        <div>
          <label style={labelStyle}>Scale</label>
          <input
            type="number" step="0.01" min="0.001" max="20"
            style={inputStyle}
            value={local.scale}
            onChange={(e) => setLocal((p) => ({ ...p, scale: e.target.value }))}
          />
        </div>
        <div>
          <label style={labelStyle}>Gun Tip Offset</label>
          <input
            type="number" step="0.05" min="-5" max="10"
            style={inputStyle}
            value={local.gunTipOffset}
            onChange={(e) => setLocal((p) => ({ ...p, gunTipOffset: e.target.value }))}
          />
        </div>
        <div>
          <label style={labelStyle}>Rotation Y (°)</label>
          <input
            type="number" step="5" min="-360" max="360"
            style={inputStyle}
            value={local.rotationY}
            onChange={(e) => setLocal((p) => ({ ...p, rotationY: e.target.value }))}
          />
        </div>
        <div>
          <label style={labelStyle}>Bullet Color</label>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              type="color"
              value={local.bulletColor}
              onChange={(e) => setLocal((p) => ({ ...p, bulletColor: e.target.value }))}
              style={{ width: 34, height: 28, border: "none", borderRadius: 5, cursor: "pointer", background: "transparent", padding: 0, flexShrink: 0 }}
            />
            <input
              style={{ ...inputStyle, flex: 1 }}
              value={local.bulletColor}
              onChange={(e) => setLocal((p) => ({ ...p, bulletColor: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <button
        onClick={onSave}
        style={{
          width: "100%",
          padding: "8px",
          borderRadius: 8,
          border: "none",
          background: "linear-gradient(135deg, var(--color-cyan), #0088aa)",
          color: "#000",
          fontWeight: 700,
          fontSize: "0.74rem",
          cursor: "pointer",
          fontFamily: "var(--font-game)",
        }}
      >
        💾 Save Changes
      </button>
    </div>
  );
}

// ── Single Model Card ─────────────────────────────────────────
function ModelCard({
  model,
  isActiveBoss = false,           // boss: đây có phải active boss không
  onUpdate,
  onReset,
  onDelete,
  onToggleShip,                   // ship: toggle active/inactive
  onSetActiveBoss,                // boss: chọn làm active
}) {
  const [expanded, setExpanded] = useState(false);
  const [local, setLocal] = useState({
    label: model.label,
    scale: model.scale,
    gunTipOffset: model.gunTipOffset,
    rotationY: model.rotationY,
    bulletColor: model.bulletColor || "#00f5ff",
  });

  // Sync khi model thay đổi từ bên ngoài (reset, etc.)
  useEffect(() => {
    setLocal({
      label: model.label,
      scale: model.scale,
      gunTipOffset: model.gunTipOffset,
      rotationY: model.rotationY,
      bulletColor: model.bulletColor || "#00f5ff",
    });
  }, [model.label, model.scale, model.gunTipOffset, model.rotationY, model.bulletColor]);

  const isBoss   = model.role === "boss";
  const isActive = isBoss ? isActiveBoss : model.active;
  const color    = model.bulletColor || "#00f5ff";

  const handleSave = () => {
    onUpdate?.(model.id, {
      label: local.label,
      scale: parseFloat(local.scale),
      gunTipOffset: parseFloat(local.gunTipOffset),
      rotationY: parseFloat(local.rotationY),
      bulletColor: local.bulletColor,
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
            {onReset && (
              <span
                style={{
                  fontSize: "0.5rem", textTransform: "uppercase",
                  color: "#a78bfa", background: "rgba(167,139,250,0.12)",
                  border: "1px solid rgba(167,139,250,0.3)", borderRadius: 4, padding: "1px 5px",
                }}
              >
                MODIFIED
              </span>
            )}
            {isBoss && isActiveBoss && (
              <span
                style={{
                  fontSize: "0.5rem", textTransform: "uppercase",
                  color: "#ff4466", background: "rgba(255,0,66,0.12)",
                  border: "1px solid rgba(255,0,66,0.3)", borderRadius: 4, padding: "1px 5px",
                }}
              >
                ACTIVE
              </span>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              `Scale: ${model.scale}`,
              `Gun: ${model.gunTipOffset}`,
              `Rot: ${model.rotationY}°`,
            ].map((t) => (
              <span key={t} style={{ fontSize: "0.6rem", color: "rgba(180,200,255,0.4)" }}>{t}</span>
            ))}
            <span style={{ fontSize: "0.6rem", color, fontWeight: 700 }}>● {color}</span>
          </div>
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

          {/* Active toggle (ship) */}
          {!isBoss && onToggleShip && (
            <button
              onClick={() => onToggleShip(model.id)}
              title={isActive ? "Tắt (ẩn trong gift config)" : "Bật (hiện trong gift config)"}
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
              style={{
                ...btnBase,
                background: "rgba(255,68,102,0.1)",
                border: "1px solid rgba(255,68,102,0.35)",
                color: "#ff7799",
              }}
            >
              ⭕
            </button>
          )}
          {isBoss && isActiveBoss && (
            <button
              disabled
              title="Đang là Active Boss"
              style={{
                ...btnBase,
                background: "rgba(255,68,102,0.18)",
                border: "1px solid rgba(255,68,102,0.5)",
                color: "#ff4466",
                cursor: "default",
              }}
            >
              ✅
            </button>
          )}

          {/* Reset built-in */}
          {onReset && (
            <button
              onClick={() => { onReset(model.id); setExpanded(false); }}
              title="Reset về mặc định"
              style={{
                ...btnBase,
                background: "rgba(167,139,250,0.1)",
                border: "1px solid rgba(167,139,250,0.3)",
                color: "#a78bfa",
              }}
            >
              🔄
            </button>
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
        <EditForm local={local} setLocal={setLocal} onSave={handleSave} />
      )}
    </div>
  );
}

// ── Upload form ───────────────────────────────────────────────
function UploadForm({ onSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [params, setParams] = useState({
    label: "",
    emoji: "🚀",
    role: "ship",
    scale: 0.25,
    gunTipOffset: 0.4,
    rotationY: 0,
    bulletColor: "#00f5ff",
  });
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".glb")) { setError("Chỉ hỗ trợ file .glb"); return; }
    setFile(f);
    setError("");
    const base = f.name.replace(/\.glb$/i, "");
    setParams((p) => ({ ...p, label: p.label || base }));
  };

  const handleUpload = async () => {
    if (!file) return;
    if (!params.label.trim()) { setError("Vui lòng nhập tên hiển thị"); return; }
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file",         file);
      fd.append("label",        params.label.trim());
      fd.append("emoji",        params.emoji || "🚀");
      fd.append("role",         params.role);
      fd.append("scale",        params.scale);
      fd.append("gunTipOffset", params.gunTipOffset);
      fd.append("rotationY",    params.rotationY);
      fd.append("bulletColor",  params.bulletColor);

      const res = await fetch(`${BACKEND_URL}/api/models/upload`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload thất bại");

      // Xóa Suspense cache của useGLTF để tránh lỗi "Unexpected token '<'"
      // (cache có thể giữ lỗi 404 từ khi file chưa tồn tại)
      if (data.path) {
        try { useGLTF.clear(data.path); } catch (_) {}
      }

      onSuccess(data); // backend trả về full model object đã lưu vào JSON

      setFile(null);
      setParams({ label: "", emoji: "🚀", role: "ship", scale: 0.25, gunTipOffset: 0.4, rotationY: 0, bulletColor: "#00f5ff" });
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      style={{
        padding: "14px",
        background: "rgba(0,245,255,0.03)",
        border: "1px solid rgba(0,245,255,0.15)",
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div
        style={{
          fontSize: "0.66rem",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: "var(--color-cyan)",
          fontFamily: "var(--font-game)",
        }}
      >
        ⬆ Upload Model Mới (.glb)
      </div>

      {/* File drop zone */}
      <div
        onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed ${file ? "rgba(0,245,255,0.5)" : "rgba(0,245,255,0.2)"}`,
          borderRadius: 10,
          padding: "16px 12px",
          textAlign: "center",
          cursor: "pointer",
          background: file ? "rgba(0,245,255,0.06)" : "rgba(0,0,0,0.2)",
          transition: "all 0.2s",
        }}
      >
        <div style={{ fontSize: 20, marginBottom: 4 }}>{file ? "📦" : "📁"}</div>
        <div style={{ fontSize: "0.73rem", color: file ? "var(--color-cyan)" : "rgba(180,200,255,0.4)" }}>
          {file ? file.name : "Click để chọn file .glb"}
        </div>
        {file && (
          <div style={{ fontSize: "0.6rem", color: "rgba(180,200,255,0.35)", marginTop: 2 }}>
            {(file.size / 1024 / 1024).toFixed(1)} MB
          </div>
        )}
        <input ref={fileRef} type="file" accept=".glb" onChange={handleFile} style={{ display: "none" }} />
      </div>

      {/* Params */}
      {file && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {/* Role selector */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Role *</label>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { value: "ship", label: "🚀 Ship (User)", color: "#00f5ff" },
                { value: "boss", label: "💀 Boss", color: "#ff4466" },
              ].map(({ value, label, color }) => (
                <button
                  key={value}
                  onClick={() => setParams((p) => ({ ...p, role: value }))}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: 8,
                    border: `1px solid ${params.role === value ? color + "88" : "rgba(255,255,255,0.12)"}`,
                    background: params.role === value ? color + "18" : "rgba(0,0,0,0.2)",
                    color: params.role === value ? color : "rgba(180,200,255,0.4)",
                    cursor: "pointer",
                    fontSize: "0.72rem",
                    fontWeight: params.role === value ? 700 : 400,
                    transition: "all 0.15s",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Tên hiển thị *</label>
            <input
              style={inputStyle}
              placeholder="My Custom Ship"
              value={params.label}
              onChange={(e) => setParams((p) => ({ ...p, label: e.target.value }))}
            />
          </div>

          <div>
            <label style={labelStyle}>Emoji Icon</label>
            <input
              style={inputStyle}
              maxLength={2}
              value={params.emoji}
              onChange={(e) => setParams((p) => ({ ...p, emoji: e.target.value }))}
            />
          </div>
          <div>
            <label style={labelStyle}>Scale</label>
            <input type="number" step="0.01" min="0.001" max="20" style={inputStyle}
              value={params.scale} onChange={(e) => setParams((p) => ({ ...p, scale: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Gun Tip Offset</label>
            <input type="number" step="0.05" min="-5" max="10" style={inputStyle}
              value={params.gunTipOffset} onChange={(e) => setParams((p) => ({ ...p, gunTipOffset: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Rotation Y (°)</label>
            <input type="number" step="5" min="-360" max="360" style={inputStyle}
              value={params.rotationY} onChange={(e) => setParams((p) => ({ ...p, rotationY: e.target.value }))} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Bullet Color</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="color" value={params.bulletColor}
                onChange={(e) => setParams((p) => ({ ...p, bulletColor: e.target.value }))}
                style={{ width: 38, height: 32, border: "none", borderRadius: 5, cursor: "pointer", background: "transparent", padding: 0, flexShrink: 0 }} />
              <input style={{ ...inputStyle, flex: 1 }} value={params.bulletColor}
                onChange={(e) => setParams((p) => ({ ...p, bulletColor: e.target.value }))} />
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(255,51,102,0.1)", border: "1px solid rgba(255,51,102,0.3)", color: "#ff5577", fontSize: "0.73rem" }}>
          ⚠ {error}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        style={{
          padding: "10px",
          borderRadius: 8,
          border: "none",
          background: file ? "linear-gradient(135deg, var(--color-cyan), #0088aa)" : "rgba(255,255,255,0.06)",
          color: file ? "#000" : "rgba(255,255,255,0.2)",
          fontWeight: 700,
          fontSize: "0.76rem",
          cursor: file ? "pointer" : "not-allowed",
          letterSpacing: "0.05em",
          fontFamily: "var(--font-game)",
        }}
      >
        {uploading ? "⏳ Đang upload..." : "🚀 Upload & Add Model"}
      </button>
    </div>
  );
}

// ── Section header ────────────────────────────────────────────
function SectionHeader({ icon, label, color, count }) {
  return (
    <div
      style={{
        fontSize: "0.6rem",
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        color,
        marginBottom: 8,
        fontFamily: "var(--font-game)",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
      {count != null && (
        <span style={{ opacity: 0.5 }}>({count})</span>
      )}
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────
export default function ModelManagerPanel({ isOpen, onClose }) {
  const {
    allShipModels,
    allBossModels,
    activeBossId,
    addModel,
    updateModel,
    removeModel,
    toggleShipActive,
    setActiveBoss,
    loading,
  } = useModels();

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const ships  = allShipModels;
  const bosses = allBossModels;

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

      {/* Panel */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 390,
          display: "flex",
          flexDirection: "column",
          background: "rgba(4,10,28,0.97)",
          borderLeft: "1px solid rgba(100,120,255,0.2)",
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
            padding: "15px 18px",
            borderBottom: "1px solid rgba(100,120,255,0.15)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "1rem" }}>🚀</span>
            <span style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "#a78bfa", fontFamily: "var(--font-game)" }}>
              Model Manager
            </span>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: "0.6rem", color: "rgba(180,200,255,0.4)" }}>
            <RoleBadge role="ship" />
            <span>{ships.length}</span>
            <RoleBadge role="boss" />
            <span>{bosses.length}</span>
            <button
              onClick={onClose}
              style={{ ...btnBase, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(200,220,255,0.7)", marginLeft: 4 }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: 18 }}>

          {loading && (
            <div style={{ textAlign: "center", color: "rgba(180,200,255,0.4)", fontSize: "0.75rem", padding: "20px 0" }}>
              ⏳ Đang tải models từ server...
            </div>
          )}

          {/* ── Ships ── */}
          {ships.length > 0 && (
            <section>
              <SectionHeader icon="✦" label="Ships" color="rgba(0,245,255,0.65)" count={ships.length} />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {ships.map((m) => (
                  <ModelCard
                    key={m.id}
                    model={m}
                    onUpdate={(id, changes) => updateModel(id, changes)}
                    onDelete={(id) => removeModel(id)}
                    onToggleShip={toggleShipActive}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── Bosses ── */}
          {bosses.length > 0 && (
            <section>
              <SectionHeader icon="☠" label="Boss" color="rgba(255,80,100,0.7)" count={bosses.length} />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {bosses.map((m) => (
                  <ModelCard
                    key={m.id}
                    model={m}
                    isActiveBoss={m.id === activeBossId}
                    onUpdate={(id, changes) => updateModel(id, changes)}
                    onDelete={(id) => removeModel(id)}
                    onSetActiveBoss={setActiveBoss}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── Upload ── */}
          <section>
            <UploadForm onSuccess={addModel} />
          </section>
        </div>
      </aside>
    </>
  );
}
