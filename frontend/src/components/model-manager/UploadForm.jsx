/**
 * UploadForm.jsx
 * Form upload model GLB mới kèm thông số + chọn quà kích hoạt
 */
import { useState, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { inputStyle, labelStyle, FIRE_RATE_OPTIONS, DAMAGE_OPTIONS } from "../ui/styles";
import { API_URL } from "../../utils/constant";


export default function UploadForm({ onSuccess, activeGifts = [] }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [params, setParams] = useState({
    label:        "",
    emoji:        "🚀",
    role:         "ship",
    scale:        0.25,
    gunTipOffset: 0.4,
    rotationY:    0,
    bulletColor:  "#00f5ff",
    damage:       1,
    fireRate:     1.0,
    gifts:        [],
  });
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".glb")) {
      setError("Chỉ hỗ trợ file .glb");
      return;
    }
    setFile(f);
    setError("");
    const base = f.name.replace(/\.glb$/i, "");
    setParams((p) => ({ ...p, label: p.label || base }));
  };

  const toggleGift = (giftId) => {
    const numId = Number(giftId);
    setParams((p) => ({
      ...p,
      gifts: p.gifts.includes(numId)
        ? p.gifts.filter((x) => x !== numId)
        : [...p.gifts, numId],
    }));
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
      fd.append("damage",       params.damage);
      fd.append("fireRate",     params.fireRate);
      fd.append("gifts",        JSON.stringify(params.gifts));

      const res  = await fetch(`${API_URL}/api/models/upload`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload thất bại");

      if (data.path) { try { useGLTF.clear(data.path); } catch (_) {console.log(_);
      } }

      onSuccess(data);

      setFile(null);
      setParams({ label: "", emoji: "🚀", role: "ship", scale: 0.25, gunTipOffset: 0.4, rotationY: 0, bulletColor: "#00f5ff", damage: 1, fireRate: 1.0, gifts: [] });
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: "14px", background: "rgba(0,245,255,0.03)", border: "1px solid rgba(0,245,255,0.15)", borderRadius: 12, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: "0.66rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--color-cyan)", fontFamily: "var(--font-game)" }}>
        ⬆ Upload Model Mới (.glb)
      </div>

      {/* File drop zone */}
      <div
        onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed ${file ? "rgba(0,245,255,0.5)" : "rgba(0,245,255,0.2)"}`,
          borderRadius: 10, padding: "16px 12px", textAlign: "center", cursor: "pointer",
          background: file ? "rgba(0,245,255,0.06)" : "rgba(0,0,0,0.2)", transition: "all 0.2s",
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

      {/* Params (chỉ hiện khi đã chọn file) */}
      {file && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Role selector */}
          <div>
            <label style={labelStyle}>Role *</label>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { value: "ship", label: "🚀 Ship (User)", color: "#00f5ff" },
                { value: "boss", label: "💀 Boss",        color: "#ff4466" },
              ].map(({ value, label, color }) => (
                <button
                  key={value}
                  onClick={() => setParams((p) => ({ ...p, role: value }))}
                  style={{
                    flex: 1, padding: "8px", borderRadius: 8,
                    border: `1px solid ${params.role === value ? color + "88" : "rgba(255,255,255,0.12)"}`,
                    background: params.role === value ? color + "18" : "rgba(0,0,0,0.2)",
                    color: params.role === value ? color : "rgba(180,200,255,0.4)",
                    cursor: "pointer", fontSize: "0.72rem",
                    fontWeight: params.role === value ? 700 : 400,
                    transition: "all 0.15s",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Tên hiển thị *</label>
              <input style={inputStyle} placeholder="My Custom Ship" value={params.label}
                onChange={(e) => setParams((p) => ({ ...p, label: e.target.value }))} />
            </div>

            <div>
              <label style={labelStyle}>Emoji Icon</label>
              <input style={inputStyle} maxLength={2} value={params.emoji}
                onChange={(e) => setParams((p) => ({ ...p, emoji: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Scale</label>
              <input type="number" step="0.01" min="0.001" max="20" style={inputStyle} value={params.scale}
                onChange={(e) => setParams((p) => ({ ...p, scale: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Gun Tip Offset</label>
              <input type="number" step="0.05" min="-5" max="10" style={inputStyle} value={params.gunTipOffset}
                onChange={(e) => setParams((p) => ({ ...p, gunTipOffset: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Rotation Y (°)</label>
              <input type="number" step="5" min="-360" max="360" style={inputStyle} value={params.rotationY}
                onChange={(e) => setParams((p) => ({ ...p, rotationY: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Damage</label>
              <select style={{ ...inputStyle, appearance: "none" }} value={params.damage}
                onChange={(e) => setParams((p) => ({ ...p, damage: Number(e.target.value) }))}>
                {DAMAGE_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Fire Rate</label>
              <select style={{ ...inputStyle, appearance: "none" }} value={params.fireRate}
                onChange={(e) => setParams((p) => ({ ...p, fireRate: Number(e.target.value) }))}>
                {FIRE_RATE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
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

          {/* Gift select (ship only) */}
          {params.role === "ship" && (
            <div>
              <label style={{ ...labelStyle, marginBottom: 6 }}>
                Quà kích hoạt ship này
                {params.gifts.length > 0 && (
                  <span style={{ marginLeft: 6, color: "var(--color-cyan)", fontFamily: "inherit" }}>
                    ({params.gifts.length} đã chọn)
                  </span>
                )}
              </label>
              {activeGifts.length === 0 ? (
                <div style={{ fontSize: "0.65rem", color: "rgba(180,200,255,0.3)", fontStyle: "italic" }}>
                  Chưa có quà active. Bật quà trong Gift Config.
                </div>
              ) : (
                <div style={{ maxHeight: 130, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                  {activeGifts.map((gift) => {
                    const checked = params.gifts.includes(Number(gift.giftId));
                    return (
                      <label key={gift.giftId} style={{
                        display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
                        padding: "4px 6px", borderRadius: 6,
                        background: checked ? "rgba(0,245,255,0.08)" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${checked ? "rgba(0,245,255,0.25)" : "rgba(255,255,255,0.06)"}`,
                        transition: "all 0.15s",
                      }}>
                        <input type="checkbox" checked={checked}
                          onChange={() => toggleGift(gift.giftId)}
                          style={{ accentColor: "var(--color-cyan)", width: 13, height: 13, flexShrink: 0 }} />
                        {gift.image
                          ? <img src={gift.image} alt={gift.giftName} style={{ width: 20, height: 20, borderRadius: 4, objectFit: "contain", flexShrink: 0 }} />
                          : <span style={{ fontSize: 16, flexShrink: 0 }}>🎁</span>
                        }
                        <span style={{ fontSize: "0.7rem", color: checked ? "#e0e8ff" : "rgba(180,200,255,0.5)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {gift.giftName}
                        </span>
                        <span style={{ fontSize: "0.6rem", color: "var(--color-gold)", flexShrink: 0 }}>
                          💎{gift.diamonds}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}
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
          padding: "10px", borderRadius: 8, border: "none",
          background: file ? "linear-gradient(135deg, var(--color-cyan), #0088aa)" : "rgba(255,255,255,0.06)",
          color: file ? "#000" : "rgba(255,255,255,0.2)",
          fontWeight: 700, fontSize: "0.76rem",
          cursor: file ? "pointer" : "not-allowed",
          letterSpacing: "0.05em", fontFamily: "var(--font-game)",
        }}
      >
        {uploading ? "⏳ Đang upload..." : "🚀 Upload & Add Model"}
      </button>
    </div>
  );
}
