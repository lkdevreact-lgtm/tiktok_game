import { useState, useEffect } from "react";
import { useGame } from "../hooks/useGame";
import { API_URL, IMAGES } from "../utils/constant";

export default function LeaderboardPanel({ isOpen, onClose }) {
  const { username } = useGame();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !username) return;
    setLoading(true);
    fetch(`${API_URL}/api/leaderboard/${encodeURIComponent(username)}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setLeaderboard(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen, username]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const RANK_STYLES = [
    { bg: "from-yellow-500/20 via-amber-500/15 to-yellow-600/10", border: "border-yellow-400/40", medal: "🥇", text: "text-yellow-300" },
    { bg: "from-slate-300/15 via-gray-400/10 to-slate-300/5",     border: "border-gray-300/30",   medal: "🥈", text: "text-gray-300" },
    { bg: "from-orange-700/15 via-amber-800/10 to-orange-700/5",  border: "border-orange-500/30",  medal: "🥉", text: "text-orange-300" },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: "lbFadeIn 0.15s ease" }}
      />

      {/* Panel */}
      <div
        className="
          fixed top-0 right-0 z-[101] h-full w-[420px] max-w-[92vw]
          bg-[rgba(5,12,30,0.98)] border-l border-[rgba(168,85,247,0.25)]
          backdrop-blur-xl shadow-[-8px_0_40px_rgba(168,85,247,0.08)]
          flex flex-col overflow-hidden
        "
        style={{
          fontFamily: "var(--font-ui), sans-serif",
          animation: "lbSlideIn 0.3s ease",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(168,85,247,0.2)]">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🏆</span>
            <span className="text-[0.85rem] font-bold tracking-[0.12em] uppercase text-purple-400">
              Top Donors
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/5 text-lg cursor-pointer transition-all"
          >
            ✕
          </button>
        </div>

        {/* Subtitle */}
        <div className="px-5 pt-3 pb-1 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.6)] shrink-0" />
          <span className="text-[0.65rem] text-white/40">
            Bảng xếp hạng donate cho <span className="text-purple-400 font-semibold">@{username}</span>
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
          {loading && (
            <div className="text-center text-white/30 text-sm py-10">
              <div className="inline-block w-5 h-5 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin mb-2" />
              <p>Loading leaderboard...</p>
            </div>
          )}

          {!loading && leaderboard.length === 0 && (
            <div className="text-center text-white/25 text-sm py-10">
              <p className="text-3xl mb-3">💎</p>
              <p>Chưa có ai donate!</p>
              <p className="text-[0.7rem] mt-1 text-white/15">Gifts sẽ được ghi nhận tự động khi live</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {leaderboard.map((item, idx) => {
              const rankStyle = RANK_STYLES[idx] || null;
              const isTop3 = idx < 3;

              return (
                <div
                  key={item.viewer_unique_id}
                  className={`
                    rounded-xl px-3.5 py-3 flex items-center gap-3
                    border transition-all duration-200
                    ${isTop3
                      ? `bg-gradient-to-r ${rankStyle.bg} ${rankStyle.border} shadow-sm`
                      : "bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.06)]"
                    }
                  `}
                >
                  {/* Rank */}
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold
                    ${isTop3
                      ? `${rankStyle.text}`
                      : "text-white/30 bg-white/[0.03]"
                    }
                  `}>
                    {isTop3 ? rankStyle.medal : `#${idx + 1}`}
                  </div>

                  {/* Avatar */}
                  {item.viewer_avatar ? (
                    <img
                      src={item.viewer_avatar}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-purple-500/20 border border-purple-400/20 flex items-center justify-center text-base shrink-0">
                      👤
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-[0.8rem] font-semibold truncate ${isTop3 ? rankStyle.text : "text-white/80"}`}>
                      {item.viewer_nickname || item.viewer_unique_id}
                    </p>
                    <p className="text-[0.65rem] text-white/30">
                      @{item.viewer_unique_id}
                      {item.donation_count && (
                        <span className="ml-1.5">· {item.donation_count} lần</span>
                      )}
                    </p>
                  </div>

                  {/* Diamonds */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[0.85rem] font-bold ${isTop3 ? rankStyle.text : "text-purple-300"}`}>
                      {formatNumber(item.total_diamonds)}
                    </span>
                    <img src={IMAGES.COIN} alt="💎" className="w-4 h-4 object-contain" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[rgba(168,85,247,0.15)] text-center">
          <p className="text-[0.6rem] text-white/20">
            Tổng {leaderboard.length} người đã donate · Cập nhật real-time
          </p>
        </div>
      </div>

      <style>{`
        @keyframes lbFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes lbSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}

function formatNumber(n) {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}
