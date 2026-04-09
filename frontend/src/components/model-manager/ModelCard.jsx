import { useState, useRef, useMemo } from "react";
import RoleBadge from "../ui/RoleBadge";
import ToggleSwitch from "../ui/ToggleSwitch";
import EditForm from "./EditForm";
import { FaEdit, FaCamera } from "react-icons/fa";
import { API_URL, IMAGES } from "../../utils/constant";
import { FIRE_RATE_OPTIONS } from "../ui/styles";
import { useGifts } from "../../hooks/useGifts";

const actionBtn =
  "w-7 h-7 flex items-center justify-center rounded-md border cursor-pointer transition-all duration-150 text-[0]";

function ModelAvatar({ iconUrl, isBoss, modelId, onIconUploaded, active }) {
  const inputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [hovered, setHovered] = useState(false);

  const src = iconUrl || (isBoss ? IMAGES.SHIP_BOSS : IMAGES.SHIP_USER);

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

export default function ModelCard({
  model,
  isActiveBoss = false,
  onUpdate,
  onDelete,
  onToggleShip,
  onSetActiveBoss,
}) {
  const [showEditModal, setShowEditModal] = useState(false);
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
  });

  const isBoss = model.role === "boss";
  const isActive = isBoss ? isActiveBoss : model.active;
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
            <div className="flex items-center text-xs gap-3 mt-3">
              <div className="flex items-center gap-1 bg-amber-500/30 p-1 rounded-md border border-amber-500">
                <p>Scale:</p>
                <span>{model.scale}</span>
              </div>
              <div className="flex items-center gap-1 p-1 bg-red-500/30 rounded-md border border-red-500">
                <p>Dame:</p>
                <span>{model.damage ?? 1}</span>
              </div>
              <div className="flex items-center gap-1 p-1 bg-green-500/30 rounded-md border border-green-500">
                <p>Rate:</p>
                <span>{fireRateLabel(model.fireRate) ?? 1}</span>
              </div>
              <div className="flex items-center gap-1 p-1 bg-blue-500/30 rounded-md border border-blue-500">
                <p>Rotate:</p>
                <span>{model.rotationY}</span>
              </div>
              <div className="flex items-center gap-1 p-1 bg-white/30 rounded-md border border-white">
                <p>Color bullet:</p>
                <span className="font-semibold" style={{ color }}>{color}</span>
              </div>
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
          modelPath={model.path}
        />
      )}
    </div>
  );
}
