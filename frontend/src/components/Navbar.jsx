import { useState } from "react";
import { useGame } from "../hooks/useGame";
import SidebarSetting from "./SidebarSetting";
import ModelManagerPanel from "./ModelManagerPanel";

export default function Navbar() {
  const { shipCount, username, gameStatus } = useGame();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [modelsOpen, setModelsOpen] = useState(false);

  const statusLabel =
    gameStatus === "playing"
      ? "🟢 LIVE"
      : gameStatus === "win"
        ? "🏆 WIN"
        : gameStatus === "lose"
          ? "💀 OVER"
          : "⏸ IDLE";

  return (
    <>
      <nav
        id="game-navbar"
        className="fixed top-0 left-0 right-0 h-[52px] flex items-center gap-4 px-5 z-50 bg-[#020814E0] border-b border-b-[#00F5FF24] backdrop-blur-lg"
      >
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 shadow-[0_0_10px_#00F5FF99] bg-cyan-1 rounded-full animate-pulse" />
          <p className="text-xs tracking-[0.18em] uppercase text-cyan-1 whitespace-nowrap text-shadow-[0_0_10px_#00F5FF99]">
            TikTok live
          </p>
        </div>

        {/* Separator */}
        <div
          style={{ width: 1, height: 22, background: "rgba(0,245,255,0.15)" }}
        />



        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Stats */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: "0.68rem",
          }}
        >
          <span style={{ color: "var(--color-cyan)", whiteSpace: "nowrap" }}>
             Total Ships: {shipCount}
          </span>
          <span
            style={{
              fontSize: "0.62rem",
              color: "rgba(180,200,255,0.45)",
              whiteSpace: "nowrap",
            }}
          >
            @{username}
          </span>
          <span
            style={{
              fontSize: "0.62rem",
              color:
                gameStatus === "playing"
                  ? "var(--color-success)"
                  : gameStatus === "win"
                    ? "#ffd700"
                    : "rgba(180,200,255,0.45)",
              whiteSpace: "nowrap",
            }}
          >
            {statusLabel}
          </span>
        </div>

        {/* Separator */}
        <div
          style={{ width: 1, height: 22, background: "rgba(0,245,255,0.15)" }}
        />

        {/* Models button */}
        <button
          id="btn-open-models"
          onClick={() => setModelsOpen(true)}
          title="Model Manager"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(167,139,250,0.1)",
            border: "1px solid rgba(167,139,250,0.35)",
            borderRadius: 8,
            color: "#a78bfa",
            cursor: "pointer",
            padding: "6px 14px",
            fontSize: "0.68rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontFamily: "var(--font-game)",
            transition: "background 0.15s, box-shadow 0.15s",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(167,139,250,0.2)";
            e.currentTarget.style.boxShadow = "0 0 14px rgba(167,139,250,0.25)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(167,139,250,0.1)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          🚀 Models
        </button>

        {/* Settings button */}
        <button
          id="btn-open-settings"
          onClick={() => setSettingsOpen(true)}
          title="Gift Settings"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(0,245,255,0.1)",
            border: "1px solid rgba(0,245,255,0.3)",
            borderRadius: 8,
            color: "var(--color-cyan)",
            cursor: "pointer",
            padding: "6px 14px",
            fontSize: "0.68rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontFamily: "var(--font-game)",
            transition: "background 0.15s, box-shadow 0.15s",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0,245,255,0.2)";
            e.currentTarget.style.boxShadow = "0 0 14px rgba(0,245,255,0.25)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(0,245,255,0.1)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          ⚙ Settings
        </button>
      </nav>

      <SidebarSetting
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      <ModelManagerPanel
        isOpen={modelsOpen}
        onClose={() => setModelsOpen(false)}
      />
    </>
  );
}
