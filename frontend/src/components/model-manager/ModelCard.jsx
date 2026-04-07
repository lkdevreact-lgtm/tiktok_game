import { useState, useRef } from "react";
import RoleBadge from "../ui/RoleBadge";
import ToggleSwitch from "../ui/ToggleSwitch";
import EditForm from "./EditForm";
import { FaEdit, FaCamera, FaCube } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { API_URL, IMAGES } from "../../utils/constant";
import { FIRE_RATE_OPTIONS } from "../ui/styles";

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

function ReplaceGLBButton({ modelId, onReplaced }) {
  const inputRef = useRef();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const f = e.target.files?.[0];
    if (!f || !modelId) return;
    if (!f.name.toLowerCase().endsWith(".glb")) {
      alert("Chỉ hỗ trợ file .glb");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch(`${API_URL}/api/models/${modelId}/glb`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (res.ok && data.model) onReplaced?.(data.model);
    } catch {
      /* ignore */
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        title="Thay file 3D (.glb)"
        className={`
          ${actionBtn}
          border-[rgba(167,139,250,0.3)] text-[#a78bfa]
          ${uploading ? "bg-[rgba(167,139,250,0.18)]" : "bg-[rgba(167,139,250,0.08)] hover:bg-[rgba(167,139,250,0.18)]"}
        `}
      >
        {uploading ? (
          <span className="text-[10px] text-[#a78bfa]">⏳</span>
        ) : (
          <FaCube size={13} color="#a78bfa" />
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".glb"
        onChange={handleUpload}
        className="hidden"
      />
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
      healGifts: local.healGifts,
      shieldGifts: local.shieldGifts,
    });
    setExpanded(false);
  };

  return (
    <div
      className={`rounded-sm border border-pink-500 bg-pink-500/20 px-3 py-2.5 flex flex-col gap-2 transition-all duration-200 ${isActive ? "opacity-100" : "opacity-60"}`}
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
            <div className="flex items-center text-sm gap-3 mt-3">
              <div className="flex items-center">
                <p>Scale:</p>
                <span>{model.scale}</span>
              </div>
              <div className="flex items-center">
                <p>Dame:</p>
                <span>{model.damage ?? 1}</span>
              </div>
              <div className="flex items-center">
                <p>Rate:</p>
                <span>{fireRateLabel(model.fireRate) ?? 1}</span>
              </div>
              <div className="flex items-center">
                <p>Rotate:</p>
                <span>{model.rotationY}</span>
              </div>
              <div className="flex items-center">
                <p>Color:</p>
                <span style={{ color }}>{color}</span>
              </div>
            </div>

            {!isBoss && (
              <div
                className={`mt-2 text-sm ${model.gifts?.length ? "text-[var(--color-gold)]" : "text-white/20"}`}
              >
                {model.gifts?.length
                  ? `${model.gifts.length} quà gắn`
                  : "Chưa gắn quà"}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-end justify-end">
          <div className="flex items-center gap-3 shrink-0">
            {/* Edit */}
            <button
              onClick={() => setExpanded((v) => !v)}
              title="Sửa thông số"
              className={`${actionBtn} border-[rgba(0,245,255,0.3)] text-[var(--color-cyan)] ${expanded ? "bg-[rgba(0,245,255,0.18)]" : "bg-[rgba(0,245,255,0.08)] hover:bg-[rgba(0,245,255,0.18)]"}`}
            >
              {expanded ? (
                <IoClose size={17} color="var(--color-cyan)" />
              ) : (
                <FaEdit size={13} color="var(--color-cyan)" />
              )}
            </button>

            {/* Replace GLB */}
            <ReplaceGLBButton
              modelId={model.id}
              onReplaced={(updated) =>
                onUpdate?.(model.id, {
                  path: updated.path,
                  filename: updated.filename,
                  builtIn: false,
                })
              }
            />

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
