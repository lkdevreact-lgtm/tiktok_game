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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
        style={{ animation: "fadeIn 0.15s ease" }}
      />

      {/* Centered Modal */}
      <div
        ref={panelRef}
        className="
          fixed z-[201] top-1/2 left-1/2
          w-[520px] max-w-[92vw] max-h-[85vh]
          flex flex-col
          rounded-2xl border border-[rgba(139,92,246,0.25)]
          bg-[radial-gradient(circle_at_20%_20%,#1a1040,#020617)]
          shadow-[0_24px_80px_rgba(0,0,0,0.7),0_0_40px_rgba(139,92,246,0.08)]
          overflow-hidden
        "
        style={{
          transform: "translate(-50%, -50%)",
          animation: "modalIn 0.2s ease",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(139,92,246,0.15)] shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-lg font-bold tracking-[0.12em] uppercase text-purple">
              Text to Speech
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 text-lg cursor-pointer transition-all"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-3 pb-1 shrink-0">
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
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1);    }
        }
      `}</style>
    </>
  );
}
