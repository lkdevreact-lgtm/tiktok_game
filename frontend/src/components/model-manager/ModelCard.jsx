import { useState, useRef, useMemo, useEffect } from "react";
import RoleBadge from "../ui/RoleBadge";
import ToggleSwitch from "../ui/ToggleSwitch";
import EditForm from "./EditForm";
import { FaEdit, FaCamera } from "react-icons/fa";
import { API_URL, IMAGES, assetUrl } from "../../utils/constant";
import { FIRE_RATE_OPTIONS } from "../ui/styles";
import { useGifts } from "../../hooks/useGifts";
import { useModels } from "../../hooks/useModels";

const actionBtn =
  "w-7 h-7 flex items-center justify-center rounded-md border cursor-pointer transition-all duration-150 text-[0]";

function ModelAvatar({ iconUrl, isBoss, modelId, onIconUploaded, active }) {
  const inputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [hovered, setHovered] = useState(false);

  const src = (iconUrl ? assetUrl(iconUrl) : null) || (isBoss ? IMAGES.SHIP_BOSS : IMAGES.SHIP_USER);

  const handleUpload = async (e) => {
    const f = e.target.files?.[0];
    if (!f || !modelId) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("iconImage", f);
      const res = await fetch(`${API_URL}/api/models/${modelId}/icon`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (res.ok && data.iconUrl) onIconUploaded?.(data.iconUrl);
    } catch {
      /* ignore */
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Click để đổi ảnh icon"
      className={`
        w-full h-full rounded-lg shrink-0 overflow-hidden cursor-pointer relative
        border transition-all duration-150
        ${
          active
            ? "border-[rgba(0,245,255,0.4)] opacity-100"
            : "border-white/10 opacity-50"
        }
      `}
    >
      <img src={src} alt="avatar" className="w-full h-full object-cover" />
      {hovered && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          {uploading ? (
            <span className="text-[9px] text-white">...</span>
          ) : (
            <FaCamera size={12} color="#fff" />
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
}

function fireRateLabel(v) {
  const found = FIRE_RATE_OPTIONS.find((o) => o.value === v);
  return found ? found.label.split(" ")[0] : `${v}`;
}

// ── TriggerModal per-model ─────────────────────────────────────────────
function TriggerModal({ model, onClose }) {
  const { triggers, saveTriggers } = useModels();

  // Find existing trigger for this model
  const existing = triggers.find((t) => t.modelId === model.id);

  const [enabled, setEnabled] = useState(!!existing);
  const [type, setType] = useState(existing?.type || "comment");
  const [content, setContent] = useState(existing?.content || "");
  const [quantity, setQuantity] = useState(existing?.quantity || 50);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Close on Escape
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Remove old trigger for this model, add new one if enabled
      const filtered = triggers.filter((t) => t.modelId !== model.id);
      const next = enabled
        ? [
            ...filtered,
            {
              id: existing?.id || `trigger_${model.id}_${Date.now()}`,
              modelId: model.id,
              shipId: model.id, // backward compat
              type,
              content: type === "comment" ? content : "",
              quantity: type === "tap" ? Number(quantity) : 0,
            },
          ]
        : filtered;
      await saveTriggers(next);
      setFeedback({ ok: true, msg: "✅ Đã lưu!" });
      setTimeout(() => { setFeedback(null); onClose(); }, 1000);
    } catch {
      setFeedback({ ok: false, msg: "❌ Lỗi lưu!" });
    }
    setSaving(false);
  };

  const isBoss = model.role === "boss";
  const accentColor = isBoss ? "#ff4466" : "#00f5ff";
  const accentDim = isBoss ? "rgba(255,68,102,0.15)" : "rgba(0,245,255,0.1)";
  const accentBorder = isBoss ? "rgba(255,68,102,0.35)" : "rgba(0,245,255,0.3)";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-sm"
      />
      {/* Modal */}
      <div className="fixed inset-0 z-[401] flex items-center justify-center p-4 pointer-events-none">
        <div
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto relative w-full max-w-[420px] rounded-2xl overflow-hidden flex flex-col"
          style={{
            background: "radial-gradient(circle at 20% 20%, #1e1b4b, #020617)",
            border: `1px solid ${accentBorder}`,
            boxShadow: `0 0 60px rgba(0,0,0,0.7), 0 0 30px ${accentDim}`,
            animation: "triggerModalIn 0.22s cubic-bezier(0.34,1.56,0.64,1) forwards",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-3.5 border-b"
            style={{ borderColor: accentBorder }}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🎯</span>
              <div>
                <p className="text-[0.8rem] font-bold text-white tracking-wide">Trigger Settings</p>
                <p className="text-[0.6rem] mt-0.5" style={{ color: accentColor }}>
                  {model.label || model.id}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/5 cursor-pointer transition-all"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-4 flex flex-col gap-4">
            {/* Toggle enable trigger */}
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: accentDim, border: `1px solid ${accentBorder}` }}>
              <div>
                <p className="text-[0.78rem] font-semibold text-white">Bật Trigger</p>
                <p className="text-[0.62rem] text-white/40 mt-0.5">
                  Khi bật, viewer tương tác sẽ spawn model này
                </p>
              </div>
              <ToggleSwitch
                value={enabled}
                onChange={() => setEnabled((v) => !v)}
              />
            </div>

            {/* Trigger config — only show when enabled */}
            {enabled && (
              <div className="flex flex-col gap-3">
                {/* Type select */}
                <div>
                  <label className="block text-[0.62rem] uppercase tracking-[0.15em] text-white/35 font-semibold mb-1.5">
                    Loại hành động
                  </label>
                  <div className="relative">
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm text-white appearance-none cursor-pointer outline-none transition-all duration-200"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: `1px solid ${accentBorder}`,
                      }}
                    >
                      <option value="comment" className="bg-[#0a1020] text-white">💬 Comment (CMT)</option>
                      <option value="tap" className="bg-[#0a1020] text-white">❤️ Tap tap (Tim)</option>
                      <option value="follow" className="bg-[#0a1020] text-white">➕ Follow</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none text-xs">▾</div>
                  </div>
                </div>

                {/* Comment content */}
                {type === "comment" && (
                  <div>
                    <label className="block text-[0.62rem] uppercase tracking-[0.15em] text-white/35 font-semibold mb-1.5">
                      💬 Nội dung Comment
                    </label>
                    <input
                      type="text"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder='VD: "111", "go", "attack"'
                      className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none transition-all duration-200 placeholder:text-white/20"
                      style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${accentBorder}` }}
                    />
                    <p className="text-[0.6rem] text-white/25 mt-1">
                      Viewer comment nội dung này → spawn <span style={{ color: accentColor }}>{model.label}</span>
                    </p>
                  </div>
                )}

                {/* Follow description */}
                {type === "follow" && (
                  <div>
                    <p className="text-[0.6rem] text-white/25 mt-1">
                      Khi viewer follow → spawn <span style={{ color: accentColor }}>{model.label}</span>
                    </p>
                  </div>
                )}

                {/* Tap quantity */}
                {type === "tap" && (
                  <div>
                    <label className="block text-[0.62rem] uppercase tracking-[0.15em] text-white/35 font-semibold mb-1.5">
                      ❤️ Số lượng Tim
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none transition-all duration-200"
                      style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${accentBorder}` }}
                    />
                    <p className="text-[0.6rem] text-white/25 mt-1">
                      Mỗi {quantity} tim tích lũy → spawn <span style={{ color: accentColor }}>{model.label}</span>
                    </p>
                  </div>
                )}

                {/* Summary preview */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${accentBorder}` }}>
                  <span className="text-[0.6rem] text-white/30">→</span>
                  <span className="text-[0.65rem]" style={{ color: accentColor }}>
                    {type === "comment"
                      ? `Comment "${content || "..."}" → spawn "${model.label || model.id}"`
                      : type === "follow"
                      ? `Follow → spawn "${model.label || model.id}"`
                      : `Mỗi ${quantity} tim → spawn "${model.label || model.id}"`
                    }
                  </span>
                </div>
              </div>
            )}

            {/* Feedback */}
            {feedback && (
              <div
                className={`px-3 py-2 rounded-lg text-[0.72rem] text-center ${
                  feedback.ok ? "bg-green-500/10 border border-green-500/30 text-green-400" : "bg-red-500/10 border border-red-500/30 text-red-400"
                }`}
              >
                {feedback.msg}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 pb-5">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: `linear-gradient(135deg, ${accentDim}, rgba(255,255,255,0.05))`,
                border: `1px solid ${accentBorder}`,
                color: accentColor,
              }}
            >
              {saving ? "Đang lưu..." : "💾 Lưu Trigger"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes triggerModalIn {
          from { opacity: 0; transform: scale(0.92) translateY(10px); }
          to   { opacity: 1; transform: scale(1)   translateY(0);    }
        }
      `}</style>
    </>
  );
}

// ── ModelCard ───────────────────────────────────────────────────────────
export default function ModelCard({
  model,
  isActiveBoss = false,
  onUpdate,
  onDelete,
  onToggleShip,
  onSetActiveBoss,
}) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [local, setLocal] = useState({
    label: model.label,
    scale: model.scale,
    gunTipOffset: model.gunTipOffset,
    rotationY: model.rotationY,
    bulletColor: model.bulletColor || "#00f5ff",
    damage: model.damage ?? 1,
    fireRate: model.fireRate ?? 1.0,
    maxShots: model.maxShots ?? 20,
    gifts: model.gifts || [],
    healGifts: model.healGifts || [],
    shieldGifts: model.shieldGifts || [],
    iconUrl: model.iconUrl || null,
    laserGifts: model.laserGifts || [],
    missileGifts: model.missileGifts || [],
    nuclearGifts: model.nuclearGifts || [],
    healAmount: model.healAmount ?? 3,
    shieldDuration: model.shieldDuration ?? 5,
    nuclearKillCount: model.nuclearKillCount ?? 0,
  });

  const isBoss = model.role === "boss";
  const isActive = isBoss ? isActiveBoss : model.active;

  // Trigger badge: check if this model has a trigger
  const { triggers } = useModels();
  const hasTrigger = triggers.some((t) => t.modelId === model.id);
  const color = model.bulletColor || "#00f5ff";

  // ── Gift lookup ─────────────────────────────────────────────
  const { gifts: allGifts } = useGifts();
  const giftMap = useMemo(() => {
    const map = {};
    (allGifts || []).forEach((g) => { map[String(g.giftId)] = g; });
    return map;
  }, [allGifts]);

  // Resolve gift ids → gift objects
  const resolveGifts = (ids = []) =>
    ids.map((id) => giftMap[String(id)]).filter(Boolean);

  const handleSave = async (pendingGlbFile) => {
    const changes = {
      label: local.label,
      scale: parseFloat(local.scale),
      gunTipOffset: parseFloat(local.gunTipOffset),
      rotationY: parseFloat(local.rotationY),
      bulletColor: local.bulletColor,
      damage: Number(local.damage),
      fireRate: Number(local.fireRate),
      maxShots: Number(local.maxShots),
      gifts: local.gifts,
      healGifts: local.healGifts,
      shieldGifts: local.shieldGifts,
      laserGifts: local.laserGifts,
      missileGifts: local.missileGifts,
      nuclearGifts: local.nuclearGifts,
      healAmount: Number(local.healAmount),
      shieldDuration: Number(local.shieldDuration),
      nuclearKillCount: Number(local.nuclearKillCount),
    };

    // If there's a pending GLB file, upload it first
    if (pendingGlbFile) {
      try {
        const fd = new FormData();
        fd.append("file", pendingGlbFile);
        const res = await fetch(`${API_URL}/api/models/${model.id}/glb`, {
          method: "POST",
          body: fd,
        });
        const data = await res.json();
        if (res.ok && data.model) {
          changes.path = data.model.path;
          changes.filename = data.model.filename;
          changes.builtIn = false;
        }
      } catch {
        /* ignore glb upload error */
      }
    }

    onUpdate?.(model.id, changes);
    setShowEditModal(false);
  };

  return (
    <div
      className={`rounded-xl border border-white  px-3 py-2.5 flex flex-col gap-2 transition-all duration-200 ${isActive ? "opacity-100" : "opacity-60"}`}
    >
      {/* Top row */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-4">
          <div className="w-20 h-20">
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
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Name row */}
            <div className="flex items-center justify-between mb-0.5 flex-wrap">
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm] font-semibold ${isActive ? "text-[#e0e8ff]" : "text-white/45"}`}
                >
                  Space ship: {model.label}
                </span>
                <RoleBadge role={model.role} />
                {/* {isBoss && isActiveBoss && (
                  <span className="text-[0.48rem] uppercase text-[#ff4466] bg-[rgba(255,0,66,0.12)] border border-[rgba(255,0,66,0.3)] rounded px-[5px] py-px">
                    ACTIVE
                  </span>
                )} */}
              </div>

              {/* Toggle ship active */}
              {!isBoss && onToggleShip && (
                <div className="flex items-center gap-3">
                  <p>Active ship:</p>
                  <ToggleSwitch
                    value={isActive}
                    onChange={() => onToggleShip(model.id)}
                    title={isActive ? "Tắt ship" : "Bật ship"}
                  />
                </div>
              )}
              {/* Toggle boss active */}
              {isBoss && onSetActiveBoss && (
                <div className="flex items-center gap-3">
                  <p>Active bosss:</p>
                  <ToggleSwitch
                    value={isActiveBoss}
                    onChange={() => !isActiveBoss && onSetActiveBoss(model.id)}
                    title={
                      isActiveBoss
                        ? "Đang là Active Boss"
                        : "Dùng làm Boss trong game"
                    }
                  />
                </div>
              )}
            </div>
            <div className="flex items-center text-xs gap-3 mt-3 flex-wrap">
              <div className="flex items-center gap-1 bg-amber-500/30 p-1 rounded-md border border-amber-500">
                <p>Scale:</p>
                <span>{model.scale}</span>
              </div>
              {!isBoss && (
                <>
                  <div className="flex items-center gap-1 p-1 bg-red-500/30 rounded-md border border-red-500">
                    <p>Dame:</p>
                    <span>{model.damage ?? 1}</span>
                  </div>
                  <div className="flex items-center gap-1 p-1 bg-green-500/30 rounded-md border border-green-500">
                    <p>Rate:</p>
                    <span>{fireRateLabel(model.fireRate) ?? 1}</span>
                  </div>
                </>
              )}
              <div className="flex items-center gap-1 p-1 bg-blue-500/30 rounded-md border border-blue-500">
                <p>Rotate:</p>
                <span>{model.rotationY}</span>
              </div>
              {!isBoss && (
                <div className="flex items-center gap-1 p-1 bg-white/30 rounded-md border border-white">
                  <p>Color bullet:</p>
                  <span className="font-semibold" style={{ color }}>{color}</span>
                </div>
              )}
              {isBoss && (
                <>
                  <div className="flex items-center gap-1 p-1 bg-green-500/30 rounded-md border border-green-500">
                    <p>💚 Heal:</p>
                    <span>{model.healAmount ?? 3}%</span>
                  </div>
                  <div className="flex items-center gap-1 p-1 bg-cyan-500/30 rounded-md border border-cyan-500">
                    <p>🛡️ Shield:</p>
                    <span>{model.shieldDuration ?? 5}s</span>
                  </div>
                  {(model.nuclearKillCount ?? 0) > 0 && (
                    <div className="flex items-center gap-1 p-1 bg-yellow-500/30 rounded-md border border-yellow-500">
                      <p>☢️ Nuke Kill:</p>
                      <span>{model.nuclearKillCount}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Ship: danh sách tên quà kích hoạt */}
            {!isBoss && (() => {
              const gifts = resolveGifts(model.gifts);
              return gifts.length ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {gifts.map((g) => (
                    <span
                      key={g.giftId}
                      className="flex items-center gap-1 text-[0.6rem] px-1.5 py-0.5 rounded-full bg-gold/10 border border-gold/30 text-gold"
                    >
                      {g.image && (
                        <img src={g.image} alt={g.giftName} className="w-3.5 h-3.5 rounded-sm object-contain shrink-0" />
                      )}
                      {g.giftName}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="mt-2 text-[0.6rem] text-white/20">Chưa gắn quà</div>
              );
            })()}

            {/* Boss: healGifts + shieldGifts + skills */}
            {isBoss && (() => {
              const hList = resolveGifts(model.healGifts);
              const sList = resolveGifts(model.shieldGifts);
              const lList = resolveGifts(model.laserGifts);
              const mList = resolveGifts(model.missileGifts);
              const nList = resolveGifts(model.nuclearGifts);

              if (!hList.length && !sList.length && !lList.length && !mList.length && !nList.length) return null;

              return (
                <div className="mt-2 flex flex-col gap-1.5">
                  {hList.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-[0.55rem] text-green-400/60 w-full uppercase tracking-tighter">💚 Heal</span>
                      {hList.map((g) => (
                        <span key={g.giftId} className="flex items-center gap-1 text-[0.6rem] px-1.5 py-0.5 rounded-full bg-green-400/10 border border-green-400/30 text-green-300">
                          {g.image && <img src={g.image} alt={g.giftName} className="w-3.5 h-3.5 rounded-sm object-contain" />}
                          {g.giftName}
                        </span>
                      ))}
                    </div>
                  )}
                  {sList.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-[0.55rem] text-cyan-400/60 w-full uppercase tracking-tighter">🛡️ Shield</span>
                      {sList.map((g) => (
                        <span key={g.giftId} className="flex items-center gap-1 text-[0.6rem] px-1.5 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-300">
                          {g.image && <img src={g.image} alt={g.giftName} className="w-3.5 h-3.5 rounded-sm object-contain" />}
                          {g.giftName}
                        </span>
                      ))}
                    </div>
                  )}
                  {lList.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-[0.55rem] text-red-500/60 w-full uppercase tracking-tighter">🔴 Laser</span>
                      {lList.map((g) => (
                        <span key={g.giftId} className="flex items-center gap-1 text-[0.6rem] px-1.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400">
                          {g.image && <img src={g.image} alt={g.giftName} className="w-3.5 h-3.5 rounded-sm object-contain" />}
                          {g.giftName}
                        </span>
                      ))}
                    </div>
                  )}
                  {mList.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-[0.55rem] text-orange-400/60 w-full uppercase tracking-tighter">🚀 Missile</span>
                      {mList.map((g) => (
                        <span key={g.giftId} className="flex items-center gap-1 text-[0.6rem] px-1.5 py-0.5 rounded-full bg-orange-400/10 border border-orange-400/30 text-orange-300">
                          {g.image && <img src={g.image} alt={g.giftName} className="w-3.5 h-3.5 rounded-sm object-contain" />}
                          {g.giftName}
                        </span>
                      ))}
                    </div>
                  )}
                  {nList.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-[0.55rem] text-yellow-400/60 w-full uppercase tracking-tighter">☢️ Nuclear</span>
                      {nList.map((g) => (
                        <span key={g.giftId} className="flex items-center gap-1 text-[0.6rem] px-1.5 py-0.5 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-300">
                          {g.image && <img src={g.image} alt={g.giftName} className="w-3.5 h-3.5 rounded-sm object-contain" />}
                          {g.giftName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
        <div className="flex items-end justify-end">
          <div className="flex items-center gap-3 shrink-0">
            {/* Trigger button */}
            <button
              onClick={() => setShowTriggerModal(true)}
              title="Cấu hình Trigger"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[0.68rem] font-semibold cursor-pointer transition-all duration-200 border"
              style={{
                background: hasTrigger ? "rgba(250,204,21,0.12)" : "rgba(255,255,255,0.04)",
                borderColor: hasTrigger ? "rgba(250,204,21,0.45)" : "rgba(255,255,255,0.12)",
                color: hasTrigger ? "#facc15" : "rgba(255,255,255,0.4)",
                boxShadow: hasTrigger ? "0 0 12px rgba(250,204,21,0.1)" : "none",
              }}
            >
              🎯
              <span>{hasTrigger ? "Trigger: ON" : "Trigger"}</span>
              {hasTrigger && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"
                />
              )}
            </button>

            {/* Edit */}
            <button
              onClick={() => setShowEditModal(true)}
              title="Sửa thông số"
              className={`${actionBtn} border-[rgba(0,245,255,0.3)] text-cyan-1 bg-[rgba(0,245,255,0.08)] hover:bg-[rgba(0,245,255,0.18)]`}
            >
              <FaEdit size={13} className="text-cyan-1" />
            </button>

            {/* Delete */}
            {onDelete && (
              <button
                onClick={() => {
                  if (window.confirm(`Xóa "${model.label}"?`))
                    onDelete(model.id);
                }}
                title="Xóa model"
                className={`${actionBtn} bg-[rgba(255,51,102,0.08)] border-[rgba(255,51,102,0.3)] hover:bg-[rgba(255,51,102,0.18)]`}
              >
                <span className="text-[#ff5577] text-sm">🗑</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {showEditModal && (
        <EditForm
          local={local}
          setLocal={setLocal}
          onSave={handleSave}
          onClose={() => setShowEditModal(false)}
          isBoss={isBoss}
          modelPath={assetUrl(model.path)}
        />
      )}

      {showTriggerModal && (
        <TriggerModal
          model={model}
          onClose={() => setShowTriggerModal(false)}
        />
      )}
    </div>
  );
}
