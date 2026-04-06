import { useState, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { FIRE_RATE_OPTIONS, DAMAGE_OPTIONS } from "../ui/styles";
import { API_URL } from "../../utils/constant";

const inputCls =
  "w-full rounded-lg px-2.5 py-1.5 text-[0.72rem] bg-black/30 border border-white/10 text-[#e0e8ff] outline-none focus:border-cyan-400/50 transition-colors";
const labelCls =
  "block text-[0.62rem] uppercase tracking-widest text-white/40 mb-1";

export default function UploadForm({ onSuccess, activeGifts = [] }) {
  const [file, setFile] = useState(null);
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [params, setParams] = useState({
    label: "",
    role: "ship",
    scale: 0.25,
    gunTipOffset: 0.4,
    rotationY: 0,
    bulletColor: "#00f5ff",
    damage: 1,
    fireRate: 1.0,
    gifts: [],
  });
  const fileRef = useRef();
  const iconRef = useRef();

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

  const handleIconFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setIconFile(f);
    setIconPreview(URL.createObjectURL(f));
  };

  const clearIcon = () => {
    setIconFile(null);
    if (iconPreview) URL.revokeObjectURL(iconPreview);
    setIconPreview(null);
    if (iconRef.current) iconRef.current.value = "";
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
    if (!params.label.trim()) {
      setError("Vui lòng nhập tên hiển thị");
      return;
    }

    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (iconFile) fd.append("iconImage", iconFile);
      fd.append("label", params.label.trim());
      fd.append("role", params.role);
      fd.append("scale", params.scale);
      fd.append("gunTipOffset", params.gunTipOffset);
      fd.append("rotationY", params.rotationY);
      fd.append("bulletColor", params.bulletColor);
      fd.append("damage", params.damage);
      fd.append("fireRate", params.fireRate);
      fd.append("gifts", JSON.stringify(params.gifts));

      const res = await fetch(`${API_URL}/api/models/upload`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload thất bại");

      if (data.path) {
        try {
          useGLTF.clear(data.path);
        } catch (_) {
          console.log(_);
        }
      }
      await new Promise((r) => setTimeout(r, 400));

      onSuccess(data);
      setFile(null);
      clearIcon();
      setParams({
        label: "",
        role: "ship",
        scale: 0.25,
        gunTipOffset: 0.4,
        rotationY: 0,
        bulletColor: "#00f5ff",
        damage: 1,
        fireRate: 1.0,
        gifts: [],
      });
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-3.5 bg-[rgba(0,245,255,0.03)] border border-[rgba(0,245,255,0.15)] rounded-xl flex flex-col gap-3">
      <div className="text-[0.66rem] uppercase tracking-[0.12em] text-cyan-400 font-[var(--font-game)]">
        ⬆ Upload Model Mới (.glb)
      </div>

      <div
        onClick={() => fileRef.current?.click()}
        className={`
          rounded-[10px] px-3 py-4 text-center cursor-pointer transition-all duration-200 border-2 border-dashed
          ${
            file
              ? "border-[rgba(0,245,255,0.5)] bg-[rgba(0,245,255,0.06)]"
              : "border-[rgba(0,245,255,0.2)] bg-black/20"
          }
        `}
      >
        <div className="text-xl mb-1">{file ? "📦" : "📁"}</div>
        <div
          className={`text-[0.73rem] ${file ? "text-cyan-400" : "text-white/40"}`}
        >
          {file ? file.name : "Click để chọn file .glb"}
        </div>
        {file && (
          <div className="text-[0.6rem] text-white/35 mt-0.5">
            {(file.size / 1024 / 1024).toFixed(1)} MB
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".glb"
          onChange={handleFile}
          className="hidden"
        />
      </div>

      {file && (
        <div className="flex flex-col gap-2.5">
          <div>
            <label className={labelCls}>Role *</label>
            <div className="flex gap-2">
              {[
                {
                  value: "ship",
                  label: "🚀 Ship (User)",
                  color: "#00f5ff",
                  activeCls:
                    "border-[rgba(0,245,255,0.5)] bg-[rgba(0,245,255,0.1)] text-cyan-400 font-bold",
                },
                {
                  value: "boss",
                  label: "💀 Boss",
                  color: "#ff4466",
                  activeCls:
                    "border-[rgba(255,68,102,0.5)] bg-[rgba(255,68,102,0.1)] text-[#ff4466] font-bold",
                },
              ].map(({ value, label, activeCls }) => (
                <button
                  key={value}
                  onClick={() => setParams((p) => ({ ...p, role: value }))}
                  className={`
                    flex-1 py-2 rounded-lg text-[0.72rem] border cursor-pointer transition-all duration-150
                    ${
                      params.role === value
                        ? activeCls
                        : "border-white/10 bg-black/20 text-white/40"
                    }
                  `}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>Icon ảnh (tùy chọn)</label>
            <div className="flex items-center gap-2">
              <div
                onClick={() => iconRef.current?.click()}
                className={`
                  w-[52px] h-[52px] rounded-[10px] shrink-0 border-2 border-dashed cursor-pointer overflow-hidden
                  flex items-center justify-center transition-all duration-200
                  ${
                    iconPreview
                      ? "border-[rgba(0,245,255,0.5)] bg-[rgba(0,245,255,0.06)]"
                      : "border-[rgba(0,245,255,0.2)] bg-black/20"
                  }
                `}
              >
                {iconPreview ? (
                  <img
                    src={iconPreview}
                    alt="icon"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl opacity-40">🖼️</span>
                )}
              </div>
              <div className="flex-1">
                <div className="text-[0.68rem] text-white/50 mb-1">
                  {iconPreview
                    ? iconFile?.name
                    : "Click ảnh bên trái để chọn icon"}
                </div>
                {iconPreview && (
                  <button
                    onClick={clearIcon}
                    className="text-[0.6rem] px-2 py-px rounded border border-[rgba(255,51,102,0.3)] bg-[rgba(255,51,102,0.08)] text-[#ff5577] cursor-pointer"
                  >
                    ✕ Xóa icon
                  </button>
                )}
              </div>
              <input
                ref={iconRef}
                type="file"
                accept="image/*"
                onChange={handleIconFile}
                className="hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="col-span-2">
              <label className={labelCls}>Tên hiển thị *</label>
              <input
                className={inputCls}
                placeholder="My Custom Ship"
                value={params.label}
                onChange={(e) =>
                  setParams((p) => ({ ...p, label: e.target.value }))
                }
              />
            </div>

            <div>
              <label className={labelCls}>Scale</label>
              <input
                type="number"
                step="0.01"
                min="0.001"
                max="20"
                className={inputCls}
                value={params.scale}
                onChange={(e) =>
                  setParams((p) => ({ ...p, scale: e.target.value }))
                }
              />
            </div>
            <div>
              <label className={labelCls}>Gun Tip Offset</label>
              <input
                type="number"
                step="0.05"
                min="-5"
                max="10"
                className={inputCls}
                value={params.gunTipOffset}
                onChange={(e) =>
                  setParams((p) => ({ ...p, gunTipOffset: e.target.value }))
                }
              />
            </div>
            <div>
              <label className={labelCls}>Rotation Y (°)</label>
              <input
                type="number"
                step="5"
                min="-360"
                max="360"
                className={inputCls}
                value={params.rotationY}
                onChange={(e) =>
                  setParams((p) => ({ ...p, rotationY: e.target.value }))
                }
              />
            </div>
            <div>
              <label className={labelCls}>Damage</label>
              <select
                className={inputCls}
                value={params.damage}
                onChange={(e) =>
                  setParams((p) => ({ ...p, damage: Number(e.target.value) }))
                }
              >
                {DAMAGE_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Fire Rate</label>
              <select
                className={inputCls}
                value={params.fireRate}
                onChange={(e) =>
                  setParams((p) => ({ ...p, fireRate: Number(e.target.value) }))
                }
              >
                {FIRE_RATE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className={labelCls}>Bullet Color</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={params.bulletColor}
                  onChange={(e) =>
                    setParams((p) => ({ ...p, bulletColor: e.target.value }))
                  }
                  className="w-9 h-8 border-0 rounded cursor-pointer bg-transparent p-0 shrink-0"
                />
                <input
                  className={`${inputCls} flex-1`}
                  value={params.bulletColor}
                  onChange={(e) =>
                    setParams((p) => ({ ...p, bulletColor: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>

          {params.role === "ship" && (
            <div>
              <label className={`${labelCls} mb-1.5`}>
                Quà kích hoạt ship này
                {params.gifts.length > 0 && (
                  <span className="ml-1.5 text-cyan-400 font-normal normal-case tracking-normal">
                    ({params.gifts.length} đã chọn)
                  </span>
                )}
              </label>
              {activeGifts.length === 0 ? (
                <div className="text-[0.65rem] text-white/30 italic">
                  Chưa có quà active. Bật quà trong Gift Config.
                </div>
              ) : (
                <div className="max-h-[130px] overflow-y-auto flex flex-col gap-1">
                  {activeGifts.map((gift) => {
                    const checked = params.gifts.includes(Number(gift.giftId));
                    return (
                      <label
                        key={gift.giftId}
                        className={`
                          flex items-center gap-2 cursor-pointer px-1.5 py-1 rounded-md border transition-all duration-150
                          ${
                            checked
                              ? "bg-[rgba(0,245,255,0.08)] border-[rgba(0,245,255,0.25)]"
                              : "bg-white/[0.02] border-white/[0.06]"
                          }
                        `}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleGift(gift.giftId)}
                          className="w-3 h-3 shrink-0 accent-cyan-400"
                        />
                        {gift.image ? (
                          <img
                            src={gift.image}
                            alt={gift.giftName}
                            className="w-5 h-5 rounded object-contain shrink-0"
                          />
                        ) : (
                          <span className="text-base shrink-0">🎁</span>
                        )}
                        <span
                          className={`text-[0.7rem] flex-1 overflow-hidden text-ellipsis whitespace-nowrap ${checked ? "text-[#e0e8ff]" : "text-white/50"}`}
                        >
                          {gift.giftName}
                        </span>
                        <span className="text-[0.6rem] text-[var(--color-gold)] shrink-0">
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

      {/* Error */}
      {error && (
        <div className="px-3 py-2 rounded-lg bg-[rgba(255,51,102,0.1)] border border-[rgba(255,51,102,0.3)] text-[#ff5577] text-[0.73rem]">
          ⚠ {error}
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className={`
          w-full py-2.5 rounded-lg border-0 font-bold text-[0.76rem] tracking-[0.05em]
          font-[var(--font-game)] transition-all duration-150
          ${
            file
              ? "bg-gradient-to-r from-cyan-400 to-[#0088aa] text-black cursor-pointer hover:brightness-110"
              : "bg-white/[0.06] text-white/20 cursor-not-allowed"
          }
        `}
      >
        {uploading ? "⏳ Đang upload..." : "🚀 Upload & Add Model"}
      </button>
    </div>
  );
}
