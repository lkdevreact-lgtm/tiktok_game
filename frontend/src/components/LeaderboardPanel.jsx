import { useState, useEffect, useRef } from "react";
import { useGame } from "../hooks/useGame";
import { API_URL, IMAGES } from "../utils/constant";

const LS_KEY = "topDonorsPanelPos";

function loadPos(fallback) {
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY));
    if (saved && typeof saved.x === "number") return saved;
  } catch {
    /* ignore */
  }
  return fallback;
}

function formatNumber(n) {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

const RANK_STYLES = [
  { medal: "🥇", text: "text-yellow-300" },
  { medal: "🥈", text: "text-gray-300" },
  { medal: "🥉", text: "text-orange-300" },
];

export default function LeaderboardPanel({ visible }) {
  const { username } = useGame();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch on mount + refresh every 30s
  useEffect(() => {
    if (!username) return;
    const fetchData = () => {
      setLoading(true);
      fetch(`${API_URL}/api/leaderboard/${encodeURIComponent(username)}`)
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setLeaderboard(data); })
        .catch(() => {})
        .finally(() => setLoading(false));
    };
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [username]);

  // ── Drag ──────────────────────────────────────────────────────
  const [pos, setPos] = useState(() =>
    loadPos({ x: Math.max(0, window.innerWidth - 280), y: 80 })
  );
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
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

  if (!visible) return null;

  return (
    <div
      ref={panelRef}
      className="absolute z-[20] select-none animate-fade-in"
      style={{ left: pos.x, top: pos.y, width: 250 }}
    >
      <div className="border border-white/20 bg-white/20 backdrop-blur-md rounded-md">
        {/* Header – draggable */}
        <div
          onMouseDown={onDragStart}
          onTouchStart={onDragStart}
          className="flex flex-col items-center justify-center py-3 border-b border-white/10 cursor-grab active:cursor-grabbing"
        >
          <span className="text-yellow-300 text-[1rem] font-semibold">
            Top donate
          </span>
        </div>

        {/* Donor list */}
        <div className="flex flex-col p-2 max-h-[320px] overflow-y-auto">
          {loading && leaderboard.length === 0 && (
            <div className="text-center text-white/30 text-xs py-4">
              <div className="inline-block w-4 h-4 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin mb-1" />
              <p>Loading...</p>
            </div>
          )}

          {!loading && leaderboard.length === 0 && (
            <div className="text-center text-white/25 text-xs py-4">
              <p className="text-2xl mb-1">💎</p>
              <p>Chưa có bảng xếp hạng</p>
            </div>
          )}

          {leaderboard.slice(0, 10).map((item, idx) => {
            const isTop3 = idx < 3;
            const rankStyle = RANK_STYLES[idx] || null;
            return (
              <div
                key={item.viewer_unique_id}
                className="flex items-center gap-2 px-1.5 py-1.5 rounded-lg"
              >
                {/* Rank */}
                <div
                  className={`text-sm font-bold w-6 text-center shrink-0 ${
                    isTop3 ? rankStyle.text : "text-white/30"
                  }`}
                >
                  {isTop3 ? rankStyle.medal : `#${idx + 1}`}
                </div>

                {/* Avatar */}
                {item.viewer_avatar ? (
                  <img
                    src={item.viewer_avatar}
                    alt=""
                    className="w-6 h-6 rounded-full object-cover border border-white/10 shrink-0"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs shrink-0">
                    👤
                  </div>
                )}

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-[0.72rem] font-semibold truncate ${
                      isTop3 ? rankStyle.text : "text-white/80"
                    }`}
                  >
                    {item.viewer_nickname || item.viewer_unique_id}
                  </p>
                  {/* {item.donation_count && (
                    <p className="text-[0.6rem] text-white/30">
                      {item.donation_count} lần
                    </p>
                  )} */}
                </div>

                {/* Diamond count */}
                <div className="flex items-center gap-1 shrink-0">
                  <span
                    className={`text-[0.72rem] font-bold ${
                      isTop3 ? rankStyle.text : "text-purple-300"
                    }`}
                  >
                    {formatNumber(item.total_diamonds)}
                  </span>
                  <img
                    src={IMAGES.COIN}
                    alt="💎"
                    className="w-3.5 h-3.5 object-contain"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {leaderboard.length > 0 && (
          <div className="px-3 py-1.5 border-t border-white/10 text-center">
            <p className="text-[0.55rem] text-white/20">
              {leaderboard.length} người đã donate
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
