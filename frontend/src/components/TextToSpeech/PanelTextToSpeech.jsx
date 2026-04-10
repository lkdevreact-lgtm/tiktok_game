import { useEffect, useRef, useState } from "react";
import FiboTTS from "./FiboTTS";

const TABS = [
  { id: "fibo", label: "Fibo TTS", icon: "🎙️" },
  // Thêm TTS provider mới ở đây sau này
  // { id: "openai", label: "OpenAI TTS", icon: "🤖" },
];

export default function PanelTextToSpeech({ isOpen, onClose }) {
  const panelRef = useRef(null);
  const [activeTab, setActiveTab] = useState("fibo");

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`
          fixed inset-0 z-[100] bg-black/55 backdrop-blur-xs
          transition-opacity duration-300 ease-in-out
          ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      />

      {/* Sliding Panel */}
      <aside
        ref={panelRef}
        className={`
          fixed top-0 right-0 bottom-0 w-[420px] max-w-[92vw] z-[101]
          flex flex-col
          bg-[rgba(4,10,28,0.98)] border-l border-[rgba(139,92,246,0.2)] backdrop-blur-xl
          transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${isOpen
            ? "translate-x-0 shadow-[-8px_0_40px_rgba(139,92,246,0.1)]"
            : "translate-x-full shadow-none"
          }
        `}
        style={{ fontFamily: "var(--font-ui), sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(139,92,246,0.15)]">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🔊</span>
            <span className="text-[0.85rem] font-bold tracking-[0.12em] uppercase text-purple">
              Text to Speech
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/5 text-lg cursor-pointer transition-all"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-3 pb-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-3 py-1.5 rounded-lg text-[0.72rem] font-semibold cursor-pointer transition-all duration-150
                ${activeTab === tab.id
                  ? "bg-purple/15 border border-purple/40 text-purple shadow-[0_0_12px_rgba(139,92,246,0.1)]"
                  : "bg-white/[0.03] border border-white/[0.06] text-white/40 hover:bg-white/[0.06] hover:text-white/60"
                }
              `}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
          {activeTab === "fibo" && <FiboTTS />}
        </div>
      </aside>
    </>
  );
}
