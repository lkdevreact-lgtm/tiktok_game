import { useMemo, useRef, useState, useEffect } from "react";
import { useModels } from "../hooks/useModels";
import { useGifts } from "../hooks/useGifts";
import { IMAGES, assetUrl } from "../utils/constant";

const LS_KEY = "shipGiftPanelPos";

function loadPos(fallback) {
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY));
    if (saved && typeof saved.x === "number") return saved;
  } catch {
    /* ignore */
  }
  return fallback;
}

export default function ShipGiftPanel({ visible = true, isMobile = false }) {
  const { shipModels, triggers, allShipModels } = useModels();
  const { gifts: allGifts } = useGifts();

  // ── Gift lookup map ──────────────────────────────────────────
  const giftMap = useMemo(() => {
    const map = {};
    (allGifts || []).forEach((g) => {
      map[String(g.giftId)] = g;
    });
    return map;
  }, [allGifts]);

  // ── Ship lookup map ──────────────────────────────────────────
  const shipMap = useMemo(() => {
    const map = {};
    (allShipModels || []).forEach((s) => {
      map[s.id] = s;
    });
    return map;
  }, [allShipModels]);

  // ── Build flat rows: each gift-ship combo + each trigger = 1 row ──
  const rows = useMemo(() => {
    const result = [];

    // 1) Gift rows: ship with gifts
    (shipModels || []).forEach((ship) => {
      const gifts = (ship.gifts || [])
        .map((id) => giftMap[String(id)])
        .filter(Boolean);
      if (gifts.length > 0) {
        result.push({ type: "gift", ship, gifts, key: `gift_${ship.id}` });
      }
    });

    // 2) Trigger rows: each trigger is its own row
    (triggers || []).forEach((t) => {
      if (!t.shipId) return;
      const ship = shipMap[t.shipId];
      if (!ship) return;
      result.push({
        type: "trigger",
        ship,
        trigger: t,
        key: `trigger_${t.id}`,
      });
    });

    return result;
  }, [shipModels, giftMap, triggers, shipMap]);

  // ── Drag state ───────────────────────────────────────────────
  const [pos, setPos] = useState(() =>
    loadPos({ x: window.innerWidth - 160, y: 200 }),
  );
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

  if (!visible || !rows.length) return null;

  if (isMobile) {
    return (
      <div className="fixed right-0 top-1/4 z-20 select-none animate-fade-in">
        <div className="max-w-xs">
          <div className="flex flex-col items-center justify-center py-2">
            <span className="text-cyan-400 text-sm font-bold">Team Ship</span>
          </div>
          <div className="flex flex-col gap-1.5 p-1.5">
            {rows.map((row, idx) => (
              <div key={row.key}>
                <div className="flex items-center gap-1.5">
                  {/* Gift / trigger icon */}
                  <div className="flex flex-col gap-1">
                    {row.type === "gift" ? (
                      row.gifts.map((g) => (
                        <div key={g.giftId} className="flex items-center gap-1">
                          {g.image ? (
                            <img
                              src={g.image}
                              alt={g.giftName}
                              className="w-5 h-5 rounded object-contain shrink-0"
                            />
                          ) : (
                            <span className="text-sm shrink-0">🎁</span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-1 text-xs">
                        {row.trigger.type === "comment" ? (
                          <span className="text-yellow-300 font-medium">
                            "{row.trigger.content}"
                          </span>
                        ) : row.trigger.type === "follow" ? (
                          <span className="text-yellow-300 font-medium">
                            👤
                          </span>
                        ) : (
                          <span className="text-yellow-300 font-medium">
                            {row.trigger.quantity} ❤️
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-white/50 text-xs">=</span>
                  {/* Ship icon */}
                  <img
                    src={
                      row.ship.iconUrl
                        ? assetUrl(row.ship.iconUrl)
                        : IMAGES.SHIP_USER
                    }
                    alt={row.ship.label}
                    className="w-6 h-6 rounded-md object-cover shrink-0"
                    style={{ border: "1px solid rgba(255,255,255,0.15)" }}
                  />
                </div>
                {idx < rows.length - 1 && (
                  <div className="border-t border-white/[0.06] mt-1" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Desktop: draggable, blur ───────────────────────────────────
  return (
    <div
      ref={panelRef}
      className="absolute z-[20] select-none animate-fade-in"
      style={{ left: pos.x, top: pos.y, width: 145 }}
    >
      <div className="border border-white/20 w-64 max-w-md bg-white/20 backdrop-blur-md rounded-md">
        <div
          onMouseDown={onDragStart}
          onTouchStart={onDragStart}
          className="flex flex-col items-center justify-center py-3 cursor-grab active:cursor-grabbing border-b border-white/10"
        >
          <span className="text-cyan-1 text-lh font-semibold">
            Team Ship (User)
          </span>
          <p className="text-[10px] text-center px-3 text-white/40">
            Mỗi phần quà tương ứng sẽ giúp ship thêm sức mạnh
          </p>
        </div>

        <div className="flex flex-col gap-3 pointer-events-none p-2">
          {rows.map((row, idx) => (
            <div key={row.key}>
              <div className="flex items-center gap-3">
                {/* Left side: gift icons or trigger icon */}
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-1 pl-0.5">
                    {row.type === "gift" ? (
                      row.gifts.map((g) => (
                        <div
                          key={g.giftId}
                          className="flex items-center gap-1.5"
                        >
                          {g.image ? (
                            <img
                              src={g.image}
                              alt={g.giftName}
                              className="w-6 h-6 rounded object-contain shrink-0"
                            />
                          ) : (
                            <span className="text-sm shrink-0">🎁</span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-1 text-sm px-1 py-0.5 rounded">
                        {row.trigger.type === "comment" ? (
                          <>
                            <span>Comment:</span>
                            <span className="text-yellow-300 font-medium truncate max-w-[60px]">
                              "{row.trigger.content}"
                            </span>
                          </>
                        ) : row.trigger.type === "follow" ? (
                          <>
                            <span className="text-yellow-300 font-medium">
                              Follow
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-yellow-300 font-medium">
                              {row.trigger.quantity}
                            </span>
                            <span>❤️</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <p>=</p>
                </div>

                {/* Right side: x1 → ship icon + name */}
                <div className="flex items-center gap-1">
                  <p>x1</p>
                  <div className="flex items-center gap-2">
                    <img
                      src={
                        row.ship.iconUrl
                          ? assetUrl(row.ship.iconUrl)
                          : IMAGES.SHIP_USER
                      }
                      alt={row.ship.label}
                      className="w-7 h-7 rounded-md object-cover shrink-0"
                      style={{ border: "1px solid rgba(255,255,255,0.15)" }}
                    />
                  </div>
                </div>
              </div>

              {idx < rows.length - 1 && (
                <div className="border-t border-white/[0.06] mt-2" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
