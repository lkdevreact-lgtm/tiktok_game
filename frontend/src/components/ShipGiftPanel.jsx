/**
 * ShipGiftPanel — hiển thị quà triệu hồi từng ship
 * Có thể kéo thả tự do bất kỳ vị trí nào trên màn hình.
 */
import { useMemo, useRef, useState, useEffect } from "react";
import { useModels } from "../hooks/useModels";
import { useGifts } from "../hooks/useGifts";
import { IMAGES } from "../utils/constant";

const LS_KEY = "shipGiftPanelPos";

function loadPos(fallback) {
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY));
    if (saved && typeof saved.x === "number") return saved;
  } catch { /* ignore */ }
  return fallback;
}

export default function ShipGiftPanel() {
  const { shipModels } = useModels();
  const { gifts: allGifts } = useGifts();

  // ── Gift lookup map ──────────────────────────────────────────
  const giftMap = useMemo(() => {
    const map = {};
    (allGifts || []).forEach((g) => { map[String(g.giftId)] = g; });
    return map;
  }, [allGifts]);

  const shipsWithGifts = useMemo(() =>
    (shipModels || [])
      .map((ship) => ({
        ship,
        gifts: (ship.gifts || []).map((id) => giftMap[String(id)]).filter(Boolean),
      }))
      .filter(({ gifts }) => gifts.length > 0),
    [shipModels, giftMap]
  );

  // ── Drag state ───────────────────────────────────────────────
  const [pos, setPos] = useState(() => loadPos({ x: window.innerWidth - 160, y: 200 }));
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

  if (!shipsWithGifts.length) return null;

  return (
    <div
      ref={panelRef}
      className="absolute z-[20] select-none animate-fade-in"
      style={{ left: pos.x, top: pos.y, width: 145 }}
    >
      {/* ── Header — drag handle ─────────────────────────────── */}
      <div
        onMouseDown={onDragStart}
        onTouchStart={onDragStart}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-t-xl cursor-grab active:cursor-grabbing"
        style={{
          background: "rgba(5,15,30,0.90)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderBottom: "none",
        }}
      >
        <span className="text-[0.62rem] font-bold text-[#00f5ff]">🚀 Ship Gifts</span>
        <span className="ml-auto text-white/25 text-[0.55rem]">⠿</span>
      </div>

      {/* ── Body ─────────────────────────────────────────────── */}
      <div
        className="flex flex-col gap-2 p-2 rounded-b-xl pointer-events-none"
        style={{
          background: "rgba(5,15,30,0.82)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(10px)",
        }}
      >
        {shipsWithGifts.map(({ ship, gifts }, idx) => (
          <div key={ship.id}>
            {/* Ship row */}
            <div className="flex items-center gap-1.5 mb-1">
              <img
                src={ship.iconUrl || IMAGES.SHIP_USER}
                alt={ship.label}
                className="w-5 h-5 rounded-md object-cover shrink-0"
                style={{ border: "1px solid rgba(255,255,255,0.15)" }}
              />
              <span className="text-[0.65rem] font-semibold text-white/85 truncate">
                {ship.label}
              </span>
            </div>

            {/* Gift list */}
            <div className="flex flex-col gap-1 pl-0.5">
              {gifts.map((g) => (
                <div key={g.giftId} className="flex items-center gap-1.5">
                  {g.image
                    ? <img src={g.image} alt={g.giftName} className="w-4 h-4 rounded object-contain shrink-0" />
                    : <span className="text-sm shrink-0">🎁</span>
                  }
                  <span className="text-[0.62rem] text-white/60 truncate">{g.giftName}</span>
                </div>
              ))}
            </div>

            {/* Divider between ships */}
            {idx < shipsWithGifts.length - 1 && (
              <div className="border-t border-white/[0.06] mt-2" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
