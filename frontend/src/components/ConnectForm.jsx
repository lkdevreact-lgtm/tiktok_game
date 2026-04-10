import { useState } from "react";
import { useGame } from "../hooks/useGame";
import socket from "../socket/socketClient";
import { API_URL } from "../utils/constant";

export default function ConnectForm() {
  const { setConnected, setUsername, setGameStatus } = useGame();
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleConnect = async () => {
    const name = input.trim().replace("@", "");
    if (!name) { setError("Please enter a TikTok username"); return; }

    setLoading(true);
    setError("");
    if (!socket.connected) {
      await new Promise((res) => {
        socket.once("connect", res);
        setTimeout(res, 3000);
      });
    }

    try {
      const res  = await fetch(`${API_URL}/api/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name, socketId: socket.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Connection failed");

      setUsername(name);
      setConnected(true);
      setGameStatus("playing");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleConnect(); };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] bg-[radial-gradient(ellipse_at_center,#020d1e_0%,#000_100%)]">
      <StarsBg />

      {/* Card */}
      <div className="
        relative w-[420px] flex flex-col gap-6 overflow-hidden rounded-xl
        px-9 py-10
        bg-panel backdrop-blur-2xl
        border border-border
        shadow-[0_24px_80px_rgba(0,0,0,0.7)]
      ">
        <h1 className="text-center text-4xl font-bold text-shadow-2xs text-shadow-cyan-300">
          Star Wars
        </h1>

        <p className="text-center text-[0.85rem] -mt-4 text-white/60">
          TikTok Live Gift Battle Game
        </p>

        {/* Username input */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-cyan-400 uppercase tracking-widest">
            TikTok Username
          </label>
          <input
            id="tiktok-username"
            type="text"
            placeholder="@username"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            autoFocus
            className="
              rounded-lg px-4 py-3 text-base outline-none text-white
              bg-[rgba(0,245,255,0.05)] border border-border
              font-[var(--font-ui)]
              transition-all duration-200
              focus:border-cyan-400 focus:shadow-[0_0_0_3px_rgba(0,245,255,0.1),0_0_20px_rgba(0,245,255,0.15)]
              disabled:opacity-50
            "
          />
        </div>

        {/* Error */}
        {error && (
          <div className="
            text-[0.8rem] text-center px-3 py-2 rounded-md
            text-danger
            bg-[rgba(255,51,102,0.1)]
            border border-[rgba(255,51,102,0.3)]
          ">
            {error}
          </div>
        )}

        <button
          id="btn-connect-live"
          onClick={handleConnect}
          disabled={loading}
          className="
            rounded-lg py-3.5 text-black font-bold text-[0.9rem] uppercase tracking-widest
            bg-gradient-to-r from-cyan-400 to-[#0088aa]
            cursor-pointer transition-all duration-150
            hover:shadow-[0_8px_30px_rgba(0,245,255,0.4)] hover:-translate-y-0.5
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none
          "
        >
          {loading ? "Connecting..." : "Connect Live"}
        </button>

        <div className="text-center text-[0.72rem] text-white/40">
          Send gifts, summon your fleet, and take down the Boss!
        </div>
      </div>
    </div>
  );
}

const STARS = Array.from({ length: 80 }, (_, i) => ({
  id: i,
  x:        Math.random() * 100,
  y:        Math.random() * 100,
  size:     Math.random() * 2 + 0.5,
  delay:    Math.random() * 4,
  duration: Math.random() * 3 + 2,
}));

const METEORS = Array.from({ length: 70 }, (_, i) => ({
  id:        i,
  startX:    -20 + Math.random() * 140,
  startY:    -20 + Math.random() * 70,
  length:    Math.random() * 60 + 15,
  delay:    -(Math.random() * 12),
  duration:  Math.random() * 2 + 1.2,
  opacity:   Math.random() * 0.3 + 0.15,
  thickness: Math.random() * 0.6 + 0.6,
}));

function StarsBg() {
  return (
    <div className="fixed inset-0 overflow-hidden -z-[1]">
      {STARS.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full bg-white opacity-60"
          style={{
            left:      `${s.x}%`,
            top:       `${s.y}%`,
            width:     `${s.size}px`,
            height:    `${s.size}px`,
            animation: `twinkle ${s.duration}s ${s.delay}s ease-in-out infinite alternate`,
          }}
        />
      ))}

      {METEORS.map((m) => (
        <div
          key={m.id}
          className="absolute rounded-[100px]"
          style={{
            left:            `${m.startX}%`,
            top:             `${m.startY}%`,
            width:           `${m.length}px`,
            height:          `${m.thickness}px`,
            background:      "linear-gradient(270deg, transparent 0%, rgba(160,210,255,0.3) 35%, rgba(220,240,255,0.9) 100%)",
            opacity:         m.opacity,
            transform:       "rotate(27deg)",
            transformOrigin: "right center",
            animation:       `meteor ${m.duration}s ${m.delay}s linear infinite`,
            filter:          "drop-shadow(0 0 2px rgba(180,220,255,0.5))",
          }}
        />
      ))}
    </div>
  );
}
