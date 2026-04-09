import { useState, useRef, useEffect, useMemo, Suspense } from "react";
import { useGifts } from "../../hooks/useGifts";
import { FIRE_RATE_OPTIONS, DAMAGE_OPTIONS } from "../ui/styles";
import { FaCube } from "react-icons/fa";
import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment } from "@react-three/drei";

const inputCls =
  "w-full rounded-lg px-2.5 py-1.5 text-[0.72rem] bg-black/30 border border-white/10 text-[#e0e8ff] outline-none focus:border-cyan-400/50 transition-colors";
const labelCls =
  "block text-[0.62rem] uppercase tracking-widest text-white/40 mb-1";

/* ─── Custom multi-select dropdown for gifts ─────────────────── */
function GiftSelect({
  selected = [],
  activeGifts = [],
  onChange,
  accentColor = "#00f5ff",
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (giftId) => {
    const numId = Number(giftId);
    const next = selected.includes(numId)
      ? selected.filter((x) => x !== numId)
      : [...selected, numId];
    onChange(next);
  };

  const selectedGifts = activeGifts.filter((g) =>
    selected.includes(Number(g.giftId)),
  );

  if (activeGifts.length === 0) {
    return (
      <div className="text-xs text-white/30 italic">
        Chưa có quà active. Bật quà trong Gift Config.
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      {/* Select trigger */}
      <div
        onClick={() => setOpen((v) => !v)}
        className={`
          w-full min-h-[36px] rounded-lg px-2.5 py-1.5 text-[0.72rem] bg-black/30
          border cursor-pointer transition-all duration-150 flex items-center gap-1.5 flex-wrap
          ${open ? "border-cyan-400/50 ring-1 ring-cyan-400/20" : "border-white/10 hover:border-white/20"}
        `}
      >
        {selectedGifts.length === 0 ? (
          <span className="text-white/30 text-[0.7rem]">Chọn quà...</span>
        ) : (
          selectedGifts.map((g) => (
            <span
              key={g.giftId}
              className="flex items-center gap-1 text-[0.62rem] px-1.5 py-0.5 rounded-full border shrink-0"
              style={{
                background: `${accentColor}14`,
                borderColor: `${accentColor}40`,
                color: accentColor,
              }}
            >
              {g.image && (
                <img
                  src={g.image}
                  alt={g.giftName}
                  className="w-3.5 h-3.5 rounded-sm object-contain"
                />
              )}
              {g.giftName}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(g.giftId);
                }}
                className="ml-0.5 text-[0.6rem] opacity-60 hover:opacity-100 cursor-pointer bg-transparent border-0 p-0"
                style={{ color: accentColor }}
              >
                ✕
              </button>
            </span>
          ))
        )}
        {/* Arrow indicator */}
        <span
          className={`ml-auto text-white/30 text-[0.6rem] shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        >
          ▼
        </span>
      </div>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1 rounded-lg border border-white/10 bg-[#0d1117] shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden animate-fade-in">
          <div className="max-h-[180px] overflow-y-auto p-1.5 flex flex-col gap-0.5">
            {activeGifts.map((gift) => {
              const checked = selected.includes(Number(gift.giftId));
              return (
                <div
                  key={gift.giftId}
                  onClick={() => toggle(gift.giftId)}
                  className={`
                    flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded-md transition-all duration-100
                    ${
                      checked
                        ? "bg-[rgba(0,245,255,0.08)]"
                        : "hover:bg-white/[0.04]"
                    }
                  `}
                  style={
                    checked ? { background: `${accentColor}14` } : undefined
                  }
                >
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all duration-150`}
                    style={{
                      borderColor: checked
                        ? accentColor
                        : "rgba(255,255,255,0.15)",
                      background: checked ? accentColor : "transparent",
                    }}
                  >
                    {checked && (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path
                          d="M2.5 6L5 8.5L9.5 3.5"
                          stroke="#000"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  {gift.image ? (
                    <img
                      src={gift.image}
                      alt={gift.giftName}
                      className="w-5 h-5 rounded-sm object-contain shrink-0"
                    />
                  ) : (
                    <span className="text-base shrink-0">🎁</span>
                  )}
                  <span
                    className={`text-[0.7rem] flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap ${checked ? "text-[#e0e8ff]" : "text-white/50"}`}
                  >
                    {gift.giftName}
                  </span>
                  <span className="text-[0.6rem] text-gold shrink-0">
                    💎{gift.diamonds}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── 3D Model Preview ──────────────────────────────────── */
function PreviewModel({ url, scale = 1 }) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => scene.clone(true), [scene]);
  return <primitive object={cloned} scale={scale} />;
}

function ModelPreview3D({ url, scale }) {
  if (!url) return null;
  return (
    <div className="w-full h-[180px] rounded-lg overflow-hidden border border-white/10 bg-black/40">
      <Canvas camera={{ position: [0, 1.5, 3.5], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 4, 5]} intensity={1} />
        <Suspense fallback={null}>
          <PreviewModel url={url} scale={scale} />
          <Environment preset="city" />
        </Suspense>
        <OrbitControls
          autoRotate
          autoRotateSpeed={3}
          enableZoom={true}
          enablePan={false}
        />
      </Canvas>
    </div>
  );
}

/* ─── Edit Modal (popup overlay) ──────────────────────────────── */
export default function EditForm({
  local,
  setLocal,
  onSave,
  onClose,
  isBoss = false,
  modelPath,
}) {
  const { activeGifts } = useGifts();
  const glbInputRef = useRef();
  const [pendingGlbFile, setPendingGlbFile] = useState(null);

  // Create object URL for pending file preview
  const pendingGlbUrl = useMemo(() => {
    if (!pendingGlbFile) return null;
    return URL.createObjectURL(pendingGlbFile);
  }, [pendingGlbFile]);

  // Clean up object URL on unmount or when file changes
  useEffect(() => {
    return () => {
      if (pendingGlbUrl) URL.revokeObjectURL(pendingGlbUrl);
    };
  }, [pendingGlbUrl]);

  // The URL to preview: pending file takes priority, otherwise current model
  const previewUrl = pendingGlbUrl || modelPath || null;

  const handlePickGlb = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".glb")) {
      alert("Chỉ hỗ trợ file .glb");
      if (glbInputRef.current) glbInputRef.current.value = "";
      return;
    }
    setPendingGlbFile(f);
  };

  const handleSaveClick = () => {
    onSave(pendingGlbFile || null);
  };

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    /* Backdrop */
    <div
      onClick={onClose}
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 backdrop-blur-sm bg-black/50 overflow-hidden"
      style={{ animation: "fadeIn 0.15s ease" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          w-[min(520px,100%)] max-h-[85vh] overflow-y-auto
          rounded-2xl border border-[rgba(0,245,255,0.2)]
          bg-[radial-gradient(circle_at_20%_20%,#1e1b4b,#020617)]
          shadow-[0_24px_60px_rgba(0,0,0,0.7)] flex flex-col gap-3
        "
        style={{ animation: "slideUp 0.2s ease" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-1 p-3">
          <h4 className="text-lg font-bold text-white m-0 flex items-center gap-2">
            Chỉnh sửa Model
          </h4>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg border-0 bg-white/10 text-white/60 cursor-pointer hover:bg-[rgba(255,51,102,0.4)] hover:text-white transition-all"
          >
            ✕
          </button>
        </div>

        <div className="overflow-auto flex flex-col gap-4 px-5">
          <div className="grid grid-cols-2 gap-2.5">
            {/* Label - full width */}
            <div className="col-span-2">
              <label className={labelCls}>Display Name</label>
              <input
                className={inputCls}
                value={local.label}
                onChange={(e) =>
                  setLocal((p) => ({ ...p, label: e.target.value }))
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
                value={local.scale}
                onChange={(e) =>
                  setLocal((p) => ({ ...p, scale: e.target.value }))
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
                value={local.gunTipOffset}
                onChange={(e) =>
                  setLocal((p) => ({ ...p, gunTipOffset: e.target.value }))
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
                value={local.rotationY}
                onChange={(e) =>
                  setLocal((p) => ({ ...p, rotationY: e.target.value }))
                }
              />
            </div>

            <div>
              <label className={labelCls}>Bullet Color</label>
              <div className="flex gap-1.5 items-center">
                <input
                  type="color"
                  value={local.bulletColor}
                  onChange={(e) =>
                    setLocal((p) => ({ ...p, bulletColor: e.target.value }))
                  }
                  className="w-[34px] h-[28px] border-0 rounded cursor-pointer bg-transparent p-0 shrink-0"
                />
                <input
                  className={`${inputCls} flex-1`}
                  value={local.bulletColor}
                  onChange={(e) =>
                    setLocal((p) => ({ ...p, bulletColor: e.target.value }))
                  }
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Damage</label>
              <select
                className={inputCls}
                value={local.damage}
                onChange={(e) =>
                  setLocal((p) => ({ ...p, damage: Number(e.target.value) }))
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
                value={local.fireRate}
                onChange={(e) =>
                  setLocal((p) => ({ ...p, fireRate: Number(e.target.value) }))
                }
              >
                {FIRE_RATE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {!isBoss && (
              <div>
                <label className={labelCls}>Max Shots 🔫</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="999"
                  className={inputCls}
                  value={local.maxShots ?? 20}
                  onChange={(e) =>
                    setLocal((p) => ({
                      ...p,
                      maxShots: Number(e.target.value),
                    }))
                  }
                />
                <div className="text-[0.58rem] text-white/30 mt-0.5">
                  Số lần bắn trước khi tàu tan biến
                </div>
              </div>
            )}
          </div>

          {/* Ship gifts */}
          {!isBoss && (
            <div>
              <label className={`${labelCls} mb-1.5`}>
                Quà kích hoạt ship này
                {local.gifts?.length > 0 && (
                  <span className="ml-1.5 text-cyan-400 normal-case tracking-normal font-normal">
                    ({local.gifts.length} đã chọn)
                  </span>
                )}
              </label>
              <GiftSelect
                selected={local.gifts || []}
                activeGifts={activeGifts}
                onChange={(next) => setLocal((p) => ({ ...p, gifts: next }))}
              />
            </div>
          )}

          {/* Boss gifts */}
          {isBoss && (
            <>
              <div>
                <label className={`${labelCls} mb-1.5 text-green-400`}>
                  💚 Quà hồi máu boss
                  {local.healGifts?.length > 0 && (
                    <span className="ml-1.5 text-green-400/80 font-normal normal-case tracking-normal">
                      ({local.healGifts.length} đã chọn)
                    </span>
                  )}
                </label>
                <GiftSelect
                  selected={local.healGifts || []}
                  activeGifts={activeGifts}
                  onChange={(next) =>
                    setLocal((p) => ({ ...p, healGifts: next }))
                  }
                  accentColor="#4ade80"
                />
              </div>

              <div>
                <label className={`${labelCls} mb-1.5 text-cyan-400`}>
                  🛡️ Quà tạo khiên boss
                  {local.shieldGifts?.length > 0 && (
                    <span className="ml-1.5 text-cyan-400/80 font-normal normal-case tracking-normal">
                      ({local.shieldGifts.length} đã chọn)
                    </span>
                  )}
                </label>
                <GiftSelect
                  selected={local.shieldGifts || []}
                  activeGifts={activeGifts}
                  onChange={(next) =>
                    setLocal((p) => ({ ...p, shieldGifts: next }))
                  }
                  accentColor="#00f5ff"
                />
              </div>

              <div>
                <label className={`${labelCls} mb-1.5 text-red-400`}>
                  🔴 Quà kích hoạt Laser
                  {local.laserGifts?.length > 0 && (
                    <span className="ml-1.5 text-red-400/80 font-normal normal-case tracking-normal">
                      ({local.laserGifts.length} đã chọn)
                    </span>
                  )}
                </label>
                <GiftSelect
                  selected={local.laserGifts || []}
                  activeGifts={activeGifts}
                  onChange={(next) =>
                    setLocal((p) => ({ ...p, laserGifts: next }))
                  }
                  accentColor="#f87171"
                />
              </div>

              <div>
                <label className={`${labelCls} mb-1.5 text-orange-400`}>
                  🚀 Quà kích hoạt Missile
                  {local.missileGifts?.length > 0 && (
                    <span className="ml-1.5 text-orange-400/80 font-normal normal-case tracking-normal">
                      ({local.missileGifts.length} đã chọn)
                    </span>
                  )}
                </label>
                <GiftSelect
                  selected={local.missileGifts || []}
                  activeGifts={activeGifts}
                  onChange={(next) =>
                    setLocal((p) => ({ ...p, missileGifts: next }))
                  }
                  accentColor="#fb923c"
                />
              </div>

              <div>
                <label className={`${labelCls} mb-1.5 text-yellow-400`}>
                  ☢️ Quà kích hoạt Nuclear
                  {local.nuclearGifts?.length > 0 && (
                    <span className="ml-1.5 text-yellow-400/80 font-normal normal-case tracking-normal">
                      ({local.nuclearGifts.length} đã chọn)
                    </span>
                  )}
                </label>
                <GiftSelect
                  selected={local.nuclearGifts || []}
                  activeGifts={activeGifts}
                  onChange={(next) =>
                    setLocal((p) => ({ ...p, nuclearGifts: next }))
                  }
                  accentColor="#facc15"
                />
              </div>
            </>
          )}

          {/* Replace GLB file */}
          <div className="mt-1">
            <label className={`${labelCls} mb-1.5`}>File 3D (.glb)</label>
            <div
              onClick={() => glbInputRef.current?.click()}
              className="rounded-lg px-3 py-10 text-center cursor-pointer transition-all duration-200 border-2 border-dashed border-[rgba(167,139,250,0.3)] bg-[rgba(167,139,250,0.05)] hover:bg-[rgba(167,139,250,0.1)]"
            >
              <div className="flex items-center justify-center gap-2">
                <FaCube size={14} color="#a78bfa" />
                <span className="text-[0.72rem] text-[#a78bfa]">
                  {pendingGlbFile ? pendingGlbFile.name : "Upload file .glb"}
                </span>
                {pendingGlbFile && (
                  <span className="text-[0.6rem] text-white/30">
                    ({(pendingGlbFile.size / 1024 / 1024).toFixed(1)} MB)
                  </span>
                )}
              </div>
            </div>
            <input
              ref={glbInputRef}
              type="file"
              accept=".glb"
              onChange={handlePickGlb}
              className="hidden"
            />
          </div>

          {/* 3D Model Preview */}
          {previewUrl && (
            <div className="mt-1">
              <label className={`${labelCls} mb-1.5`}>Preview 3D</label>
              <ModelPreview3D
                url={previewUrl}
                scale={parseFloat(local.scale) || 1}
              />
            </div>
          )}

          <button
            onClick={handleSaveClick}
            className="w-full py-2.5 mb-5 rounded-lg border-0 bg-gradient-to-r from-cyan-1 to-[#0088aa] text-black font-bold text-[0.76rem] cursor-pointer hover:brightness-110 transition-all mt-1"
          >
            Save Changes
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
      `}</style>
    </div>
  );
}
