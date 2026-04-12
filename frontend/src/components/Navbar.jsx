import { useState, useRef, useEffect } from "react";
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
import { RiSettings4Fill } from "react-icons/ri";
import socket from "../socket/socketClient";
import { API_URL } from "../utils/constant";

export default function Navbar() {
  const {
    shipCount,
    username,
    gameStatus,
    wins,
    losses,
    setConnected,
    setUsername,
    setGameStatus,
  } = useGame();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [modelsOpen, setModelsOpen] = useState(false);
  const [triggerOpen, setTriggerOpen] = useState(false);
  const [tts, setTts] = useState(false);
  const [soundOpen, setSoundOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

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
      label: "Model Manager",
      icon: <SiOpen3D size={18} />,
      onClick: () => {
        setModelsOpen(true);
        setMenuOpen(false);
      },
    },
    {
      id: "trigger",
      label: "Trigger Config",
      icon: <IoMdSettings size={18} />,
      onClick: () => {
        setTriggerOpen(true);
        setMenuOpen(false);
      },
    },
    {
      id: "gift",
      label: "Gift Settings",
      icon: <IoIosGift size={18} />,
      onClick: () => {
        setSettingsOpen(true);
        setMenuOpen(false);
      },
    },
    {
      id: "tts",
      label: "Text To Speech",
      icon: <BsSoundwave size={18} />,
      onClick: () => {
        setTts(true);
        setMenuOpen(false);
      },
    },
    {
      id: "sound",
      label: "Sound Settings",
      icon: <HiVolumeUp size={18} />,
      onClick: () => {
        setSoundOpen(true);
        setMenuOpen(false);
      },
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
        {/* Username */}
        <div className="flex items-center gap-2 bg-purple/20 py-1.5 px-3 rounded-full">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_10px_rgba(0,245,255,0.6)]" />
          <span className="text-sm text-white whitespace-nowrap">
            @{username || "User test live"}
          </span>
        </div>

        <div className="flex-1" />

        {/* Win/Lose center */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 text-lg font-bold">
          <span className="text-white">Win: {wins}</span>
          <span className="text-white/25">·</span>
          <span className="text-red-500">Lose: {losses}</span>
        </div>

        {/* Right section */}
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

          {/* Settings dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              title="Settings"
              className={`
                flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold
                cursor-pointer transition-all duration-200 border
                ${
                  menuOpen
                    ? "bg-purple/30 border-purple/60 text-purple-300 shadow-[0_0_14px_rgba(168,85,247,0.35)]"
                    : "bg-white/5 border-white/15 text-white/80 hover:bg-purple/15 hover:border-purple/40 hover:text-purple-200"
                }
              `}
            >
              <RiSettings4Fill
                size={17}
                className={`transition-transform duration-500 ${menuOpen ? "rotate-90" : "rotate-0"}`}
              />
              Menu Settings
            </button>

            {/* Dropdown menu */}
            {menuOpen && (
              <div
                className="
                  absolute right-0 top-full mt-2 w-52
                  bg-[#0f0f1a]/95 backdrop-blur-xl border border-white/10
                  rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.55)]
                  overflow-hidden z-[200]
                  animate-[fadeSlideDown_0.18s_ease_forwards]
                "
                style={{
                  animation: "fadeSlideDown 0.18s ease forwards",
                }}
              >
                <div className="px-3 py-2 border-b border-white/8">
                  <span className="text-[0.65rem] uppercase tracking-widest text-white/35 font-semibold">
                    List menu
                  </span>
                </div>

                {MenuNav.map((item) => (
                  <button
                    key={item.id}
                    onClick={item.onClick}
                    className="
                      w-full flex items-center gap-3 px-4 py-3 text-sm text-white/75
                      hover:bg-purple/20 hover:text-white transition-all duration-150
                      cursor-pointer group
                    "
                  >
                    <span className="text-purple-400/80 group-hover:text-purple-300 transition-colors">
                      {item.icon}
                    </span>
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Panels */}
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
      <PanelTextToSpeech isOpen={tts} onClose={() => setTts(false)} />
      <SoundSettingPanel
        isOpen={soundOpen}
        onClose={() => setSoundOpen(false)}
      />

      {/* Animation keyframes */}
      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </>
  );
}
