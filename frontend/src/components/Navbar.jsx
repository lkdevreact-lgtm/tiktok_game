import { useState } from "react";
import { useGame } from "../hooks/useGame";
import SidebarSetting from "./SidebarSetting";
import ModelManagerPanel from "./ModelManagerPanel";

export default function Navbar() {
  const { shipCount, username, gameStatus, wins, losses } = useGame();
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

  const statusCls =
    gameStatus === "playing"
      ? "text-[var(--color-success)]"
      : gameStatus === "win"
        ? "text-[#ffd700]"
        : "text-white/45";

  return (
    <>
      <nav
        id="game-navbar"
        className="fixed top-0 left-0 right-0 flex items-center gap-4 px-5 py-4 z-50 bg-[#020814E0] border-b border-[rgba(0,245,255,0.14)] backdrop-blur-lg"
      >
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(0,245,255,0.6)]" />
          <p className="text-xs tracking-[0.18em] uppercase text-cyan-400 whitespace-nowrap">
            TikTok live
          </p>
        </div>
        <div className="w-px h-[22px] bg-[rgba(0,245,255,0.15)]" />
        <div className="flex-1" />

        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 text-lg font-bold">
          <span className="text-white">Win: {wins}</span>
          <span className="text-white/25">·</span>
          <span className="text-red-500">Lose: {losses}</span>
        </div>

        <div className="flex items-center gap-3.5 text-[0.68rem]">
          <span className="text-cyan-1 whitespace-nowrap">
            Total Ships: {shipCount}
          </span>
          <span className="text-[0.62rem] text-white/45 whitespace-nowrap">
            @{username}
          </span>
          <span className={`text-[0.62rem] whitespace-nowrap ${statusCls}`}>
            {statusLabel}
          </span>
        </div>
        <div className="w-px h-[22px] bg-[rgba(0,245,255,0.15)]" />
        <button
          id="btn-open-models"
          onClick={() => setModelsOpen(true)}
          title="Model Manager"
          className="
            flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[0.68rem]
            tracking-[0.08em] uppercase whitespace-nowrap cursor-pointer border
            bg-[rgba(167,139,250,0.1)] border-[rgba(167,139,250,0.35)] text-[#a78bfa]
            transition-all duration-150
            hover:bg-[rgba(167,139,250,0.2)] hover:shadow-[0_0_14px_rgba(167,139,250,0.25)]
          "
        >
          Setting Models
        </button>

        <button
          id="btn-open-settings"
          onClick={() => setSettingsOpen(true)}
          title="Gift Settings"
          className="
            flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[0.68rem]
            tracking-[0.08em] uppercase whitespace-nowrap cursor-pointer border
            bg-[rgba(0,245,255,0.1)] border-[rgba(0,245,255,0.3)] text-cyan-1
            transition-all duration-150
            hover:bg-[rgba(0,245,255,0.2)] hover:shadow-[0_0_14px_rgba(0,245,255,0.25)]
          "
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
