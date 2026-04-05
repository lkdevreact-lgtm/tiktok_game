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
    if (!name) { setError("Please enter a TikTok username"); return; }

    setLoading(true);
    setError("");
    if (!socket.connected) {
      await new Promise((res) => { socket.once("connect", res); setTimeout(res, 3000); });
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
    <div className="connect-overlay">
      {/* Stars background */}
      <Stars />
      <div className="glass connect-card">
        <h1>⚔️ SPACESHIP VS BOSS</h1>
        <p className="subtitle">TikTok Live Gift Battle Game</p>

        <div className="input-group">
          <label>TikTok Username</label>
          <input
            id="tiktok-username"
            type="text"
            placeholder="@username"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            autoFocus
          />
        </div>

        {error && <div className="error-msg">⚠️ {error}</div>}

        <button
          id="btn-connect-live"
          className="btn-connect"
          onClick={handleConnect}
          disabled={loading}
        >
          {loading ? "Connecting..." : "🚀 Connect Live"}
        </button>

        <div style={{ textAlign: "center", fontSize: "0.72rem", color: "rgba(180,200,255,0.4)" }}>
          Viewers send gifts → Spaceships spawn → Defeat the Boss!
        </div>
      </div>
    </div>
  );
}

function Stars() {
  const stars = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    delay: Math.random() * 4,
    duration: Math.random() * 3 + 2,
  }));

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", zIndex: -1 }}>
      {stars.map((s) => (
        <div
          key={s.id}
          style={{
            position: "absolute",
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            borderRadius: "50%",
            background: "white",
            opacity: 0.6,
            animation: `twinkle ${s.duration}s ${s.delay}s ease-in-out infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}
