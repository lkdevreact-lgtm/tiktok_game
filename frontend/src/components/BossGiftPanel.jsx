/**
 * BossGiftPanel — hiển thị quà boss (hồi máu, khiên, ...)
 * Có thể kéo thả tự do.
 *
 * ──────────────────────────────────────────────────────────────
 *  BOSS_GIFT_SECTIONS: config map định nghĩa các loại quà boss.
 *  Muốn thêm loại quà mới → thêm 1 entry vào mảng này.
 *  - key    : tên field trong model (vd: activeBossModel.healGifts)
 *  - label  : tên hiển thị
 *  - icon   : emoji/icon
 * ──────────────────────────────────────────────────────────────
 */
import { useMemo, useRef, useState, useEffect } from "react";
import { useModels } from "../hooks/useModels";
import { useGifts } from "../hooks/useGifts";
import { IMAGES } from "../utils/constant";

// ── Gift section config ──────────────────────────────────────────────────────
// Thêm loại quà mới tại đây, ví dụ:
// { key: "rageGifts", label: "Rage", icon: "🔥" }
const BOSS_GIFT_SECTIONS = [
  { key: "healGifts",   label: "Hồi Máu", icon: "💚" },
  { key: "shieldGifts", label: "Khiên",   icon: "🛡️" },
];
// ────────────────────────────────────────────────────────────────────────────

const LS_KEY = "bossGiftPanelPos";

function loadPos(fallback) {
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY));
    if (saved && typeof saved.x === "number") return saved;
  } catch { /* ignore */ }
  return fallback;
}

export default function BossGiftPanel() {
  const { activeBossModel } = useModels();
  const { gifts: allGifts } = useGifts();

  // ── Gift lookup map: giftId → gift object ──────────────────────────────
  const giftMap = useMemo(() => {
    const map = {};
    (allGifts || []).forEach((g) => { map[String(g.giftId)] = g; });
    return map;
  }, [allGifts]);

  // ── Map từng section ra danh sách gift objects ─────────────────────────
  const sections = useMemo(() =>
    BOSS_GIFT_SECTIONS.map(({ key, label, icon }) => ({
      key,
      label,
      icon,
      gifts: (activeBossModel?.[key] || [])
        .map((id) => giftMap[String(id)])
        .filter(Boolean),
    })).filter(({ gifts }) => gifts.length > 0),  // ẩn section rỗng
    [activeBossModel, giftMap]
  );

  // ── Drag state ─────────────────────────────────────────────────────────
  const [pos, setPos] = useState(() => loadPos({ x: 12, y: 200 }));
  const dragging = useRef(false);
  const offset   = useRef({ x: 0, y: 0 });
  const panelRef = useRef(null);

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const next = { x: clientX - offset.current.x, y: clientY - offset.current.y };
      setPos(next);
      localStorage.setItem(LS_KEY, JSON.stringify(next));
    };
    const onUp = () => { dragging.current = false; };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend",  onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend",  onUp);
    };
  }, []);

  const onDragStart = (e) => {
    dragging.current = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const rect = panelRef.current.getBoundingClientRect();
    offset.current = { x: clientX - rect.left, y: clientY - rect.top };
    e.preventDefault();
  };

  // Ẩn panel nếu boss không có bất kỳ quà nào
  if (!sections.length) return null;

  const bossIcon = activeBossModel?.iconUrl || IMAGES.SHIP_BOSS;

  return (
    <div
      ref={panelRef}
      className="absolute z-[20] select-none animate-fade-in"
      style={{ left: pos.x, top: pos.y, width: 145 }}
    >
      {/* ── Header — drag handle ──────────────────────────────────── */}
      <div
        onMouseDown={onDragStart}
        onTouchStart={onDragStart}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-t-xl cursor-grab active:cursor-grabbing"
        style={{
          background: "rgba(5,15,30,0.92)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderBottom: "none",
        }}
      >
        <img
          src={bossIcon}
          alt="boss"
          className="w-5 h-5 rounded-md object-cover shrink-0"
          style={{ border: "1px solid rgba(255,68,102,0.5)" }}
        />
        <span className="text-[0.62rem] font-bold text-[#ff4466] truncate">
          {activeBossModel?.label || "Boss"}
        </span>
        <span className="ml-auto text-white/25 text-[0.6rem]">⠿</span>
      </div>

      {/* ── Body: render từng section theo config ────────────────── */}
      <div
        className="flex flex-col gap-2 p-2 rounded-b-xl"
        style={{
          background: "rgba(5,15,30,0.84)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(10px)",
        }}
      >
        {sections.map(({ key, label, icon, gifts }, sIdx) => (
          <div key={key}>
            {/* Section label */}
            <span className="text-[0.52rem] uppercase tracking-widest text-white/35 flex items-center gap-1 mb-1">
              {icon} {label}
            </span>

            {/* Gift list */}
            <div className="flex flex-col gap-1">
              {gifts.map((g) => (
                <div key={g.giftId} className="flex items-center gap-1.5">
                  {g.image ? (
                    <img
                      src={g.image}
                      alt={g.giftName}
                      className="w-5 h-5 rounded object-contain shrink-0"
                    />
                  ) : (
                    <span className="text-base shrink-0">🎁</span>
                  )}
                  <span className="text-[0.65rem] text-white/80 truncate">
                    {g.giftName}
                  </span>
                </div>
              ))}
            </div>

            {/* Divider giữa các section */}
            {sIdx < sections.length - 1 && (
              <div className="border-t border-white/[0.06] mt-2" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
