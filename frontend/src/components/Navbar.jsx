import { useState } from "react";
import { useGame } from "../hooks/useGame";
import SidebarSetting from "./SidebarSetting";
import ModelManagerPanel from "./ModelManagerPanel";
import TriggerPanel from "./TriggerPanel";
import PanelTextToSpeech from "./TextToSpeech/PanelTextToSpeech";
import SoundSettingPanel from "./SoundSettingPanel";
import { SiOpen3D } from "react-icons/si";
import { IoIosGift } from "react-icons/io";
import { IoMdSettings } from "react-icons/io";
import { BsSoundwave } from "react-icons/bs";
import { HiVolumeUp } from "react-icons/hi";
import { MdOutlineWifiOff } from "react-icons/md";
import socket from "../socket/socketClient";
import { API_URL } from "../utils/constant";

export default function Navbar() {
  const { shipCount, username, gameStatus, wins, losses, setConnected, setUsername, setGameStatus } = useGame();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [modelsOpen, setModelsOpen] = useState(false);
  const [triggerOpen, setTriggerOpen] = useState(false);
  const [tts, setTts] = useState(false);
  const [soundOpen, setSoundOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    if (disconnecting) return;
    setDisconnecting(true);
    try {
      await fetch(`${API_URL}/api/disconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socketId: socket.id }),
      });
    } catch {
      /* ignore — reset UI anyway */
    }
    setConnected(false);
    setUsername("");
    setGameStatus("idle");
    setDisconnecting(false);
  };

  const MenuNav = [
    {
      id: "models",
      label: "Model",
      icon: <SiOpen3D size={20} />,
      onClick: () => setModelsOpen(true),
    },
    {
      id: "trigger",
      label: "Trigger",
      icon: <IoMdSettings size={22} />,
      onClick: () => setTriggerOpen(true),
    },
    {
      id: "gift",
      label: "Gift",
      icon: <IoIosGift size={20} />,
      onClick: () => setSettingsOpen(true),
    },
    {
      id: "tts",
      label: "TextToSpeech",
      icon: <BsSoundwave size={20} />,
      onClick: () => setTts(true),
    },
    {
      id: "sound",
      label: "Setting Sound",
      icon: <HiVolumeUp size={20} />,
      onClick: () => setSoundOpen(true),
    },
  ];

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
      ? "text-success"
      : gameStatus === "win"
        ? "text-[#ffd700]"
        : "text-white/45";

  return (
    <>
      <nav
        id="game-navbar"
        className="fixed top-0 left-0 right-0 flex items-center gap-4 px-5 py-4 z-50 backdrop-blur-lg"
      >
        <div className="flex items-center gap-2 bg-purple/20 py-1.5 px-3 rounded-full">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_10px_rgba(0,245,255,0.6)]" />
          <span className="text-sm text-white whitespace-nowrap">
            @{username || "User test live"}
          </span>
        </div>
        <div className="flex-1" />
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 text-lg font-bold">
          <span className="text-white">Win: {wins}</span>
          <span className="text-white/25">·</span>
          <span className="text-red-500">Lose: {losses}</span>
        </div>

        <div className="flex items-center gap-3.5 text-sm">
          <span className="text-white whitespace-nowrap">
            Total Ships: {shipCount}
          </span>

          <span className={`text-[0.62rem] whitespace-nowrap ${statusCls}`}>
            {statusLabel}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Disconnect button */}
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            title="Ngắt kết nối TikTok"
            className="
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.68rem] font-semibold
              uppercase tracking-wider cursor-pointer transition-all duration-200
              bg-[rgba(255,51,102,0.12)] border border-[rgba(255,51,102,0.35)] text-red-400
              hover:bg-[rgba(255,51,102,0.25)] hover:border-red-400/60 hover:text-red-300
              disabled:opacity-40 disabled:cursor-not-allowed
            "
          >
            {disconnecting ? "..." : "Disconnect"}
          </button>

          {/* Nav icon buttons */}
          <div className="flex items-center gap-5">
            {MenuNav.map((item) => (
              <button
                key={item.id}
                onClick={item.onClick}
                title={item.label}
                className="w-10 h-10 border rounded-full flex items-center justify-center cursor-pointer hover:bg-purple/10 hover:text-purple transition-all duration-300 ease-in-out"
              >
                {item.icon}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <SidebarSetting
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      <ModelManagerPanel
        isOpen={modelsOpen}
        onClose={() => setModelsOpen(false)}
      />
      <TriggerPanel
        isOpen={triggerOpen}
        onClose={() => setTriggerOpen(false)}
      />
      <PanelTextToSpeech
        isOpen={tts}
        onClose={() => setTts(false)}
      />
      <SoundSettingPanel
        isOpen={soundOpen}
        onClose={() => setSoundOpen(false)}
      />
    </>
  );
}
