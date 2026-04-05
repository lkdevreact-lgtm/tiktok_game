import { useState } from "react";
import { useGame } from "../store/gameStore";
import socket from "../socket/socketClient";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

export default function ConnectForm() {
  const { setConnected, setUsername, setGameStatus } = useGame();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConnect = async () => {
    const name = input.trim().replace("@", "");
    if (!name) {
      setError("Please enter a TikTok username");
      return;
    }

    setLoading(true);
    setError("");
    if (!socket.connected) {
      await new Promise((res) => {
        socket.once("connect", res);
        setTimeout(res, 3000);
      });
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/connect`, {
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

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleConnect();
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[100]"
      style={{
        background: "radial-gradient(ellipse at center, #020d1e 0%, #000 100%)",
      }}
    >
      <StarsBg />
      <div
        className="relative w-[420px] flex flex-col gap-6 overflow-hidden rounded-xl backdrop-blur-2xl"
        style={{
          padding: "40px 36px",
          background: "var(--color-panel)",
          backdropFilter: "blur(16px)",
          border: "1px solid var(--color-border)",
        }}
      >
        {/* Title */}
        <h1
          className="text-center text-[1.6rem] font-black"
          style={{
            fontFamily: "var(--font-game)",
            background:
              "linear-gradient(135deg, var(--color-cyan), var(--color-purple))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Star Wars
        </h1>

        <p
          className="text-center text-[0.85rem] -mt-4"
          style={{ color: "rgba(180,200,255,0.6)" }}
        >
          TikTok Live Gift Battle Game
        </p>

        {/* Input */}
        <div className="flex flex-col gap-2">
          <label
            className="text-[0.75rem] uppercase tracking-widest"
            style={{
              fontFamily: "var(--font-game)",
              color: "var(--color-cyan)",
            }}
          >
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
            className="rounded-lg px-4 py-3 text-base outline-none transition-all duration-200 text-[#e0e8ff]"
            style={{
              background: "rgba(0,245,255,0.05)",
              border: "1px solid var(--color-border)",
              fontFamily: "var(--font-ui)",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "var(--color-cyan)";
              e.target.style.boxShadow =
                "0 0 0 3px rgba(0,245,255,0.1), 0 0 20px rgba(0,245,255,0.15)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "var(--color-border)";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <div
            className="text-[0.8rem] text-center px-3 py-2 rounded-md"
            style={{
              color: "var(--color-danger)",
              background: "rgba(255,51,102,0.1)",
              border: "1px solid rgba(255,51,102,0.3)",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Button */}
        <button
          id="btn-connect-live"
          onClick={handleConnect}
          disabled={loading}
          className="rounded-lg py-[14px] text-black font-bold text-[0.9rem] uppercase tracking-widest cursor-pointer
                     transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed
                     hover:not-disabled:-translate-y-0.5"
          style={{
            fontFamily: "var(--font-game)",
            background: "linear-gradient(135deg, var(--color-cyan), #0088aa)",
          }}
          onMouseEnter={(e) => {
            if (!loading)
              e.currentTarget.style.boxShadow =
                "0 8px 30px rgba(0,245,255,0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {loading ? "Connecting..." : "🚀 Connect Live"}
        </button>

        <div
          className="text-center text-[0.72rem]"
          style={{ color: "rgba(180,200,255,0.4)" }}
        >
          Viewers send gifts → Spaceships spawn → Defeat the Boss!
        </div>
      </div>
    </div>
  );
}

const STARS = Array.from({ length: 80 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2 + 0.5,
  delay: Math.random() * 4,
  duration: Math.random() * 3 + 2,
}));

function StarsBg() {
  const stars = STARS;

  return (
    <div className="fixed inset-0 overflow-hidden -z-[1]">
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full opacity-60"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            background: "white",
            animation: `twinkle ${s.duration}s ${s.delay}s ease-in-out infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}
