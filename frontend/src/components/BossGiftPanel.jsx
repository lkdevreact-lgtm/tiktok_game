import { useMemo, useRef, useState, useEffect } from "react";
import { useModels } from "../hooks/useModels";
import { useGifts } from "../hooks/useGifts";

const BOSS_GIFT_SECTIONS = [
  { key: "healGifts", label: "Hồi Máu", icon: "💚" },
  { key: "shieldGifts", label: "Khiên", icon: "🛡️" },
];

const LS_KEY = "bossGiftPanelPos";

function loadPos(fallback) {
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY));
    if (saved && typeof saved.x === "number") return saved;
  } catch {
    /* ignore */
  }
  return fallback;
}

export default function BossGiftPanel() {
  const { activeBossModel } = useModels();
  const { gifts: allGifts } = useGifts();

  const giftMap = useMemo(() => {
    const map = {};
    (allGifts || []).forEach((g) => {
      map[String(g.giftId)] = g;
    });
    return map;
  }, [allGifts]);

  const sections = useMemo(
    () =>
      BOSS_GIFT_SECTIONS.map(({ key, label, icon }) => ({
        key,
        label,
        icon,
        gifts: (activeBossModel?.[key] || [])
          .map((id) => giftMap[String(id)])
          .filter(Boolean),
      })).filter(({ gifts }) => gifts.length > 0),
    [activeBossModel, giftMap],
  );

  const [pos, setPos] = useState(() => loadPos({ x: 12, y: 200 }));
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const panelRef = useRef(null);

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const next = {
        x: clientX - offset.current.x,
        y: clientY - offset.current.y,
      };
      setPos(next);
      localStorage.setItem(LS_KEY, JSON.stringify(next));
    };
    const onUp = () => {
      dragging.current = false;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
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

  if (!sections.length) return null;

  return (
    <div
      ref={panelRef}
      className="absolute z-[20] select-none animate-fade-in"
      style={{ left: pos.x, top: pos.y, width: 145 }}
    >
      <div className="border border-white/20 w-64 max-w-sm bg-white/20 backdrop-blur-md rounded-md">
        <div
          onMouseDown={onDragStart}
          onTouchStart={onDragStart}
          className="flex flex-col items-center justify-center py-3 border-b border-white/10 cursor-grab active:cursor-grabbing"
        >
          <span className="text-red-500 text-xl font-semibold truncate">
            Team Boss
          </span>
          <p className="text-[10px] text-center px-3 text-white/40">Mỗi phần quà tương ứng sẽ giúp boss thêm sức mạnh</p>
        </div>
        <div className="flex flex-col gap-2 p-2 rounded-b-xl">
          {sections.map(({ key, label, icon, gifts }, sIdx) => (
            <div key={key}>
              <span className=" text-base font-semibold flex items-center gap-1 mb-1 mb-2">
                {icon} {label}
              </span>

              <div className="flex flex-col gap-3 px-2">
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
                    <span className="text-sm font-semibold truncate">
                      {g.giftName}
                    </span>
                  </div>
                ))}
              </div>

              {sIdx < sections.length - 1 && (
                <div className="border-t border-white/[0.06] mt-2" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
