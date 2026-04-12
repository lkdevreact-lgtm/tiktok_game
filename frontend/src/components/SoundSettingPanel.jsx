import { useState, useEffect } from "react";
import { getVolumes, setVolumes } from "../game/audio";

const SOUNDS = [
  { key: "attack", label: "Tiếng bắn", icon: "💥", file: "sound_attack.mp3", group: "ship" },
  { key: "spawn", label: "Ship xuất hiện", icon: "🚀", file: "start_sound.mp3", group: "ship" },
  { key: "hidden", label: "Ship biến mất", icon: "👻", file: "sound_hidden.mp3", group: "ship" },
  { key: "heal", label: "Hồi máu Boss", icon: "💚", file: "heal_sound.mp3", group: "boss" },
  { key: "bossLaser", label: "Boss — Laser", icon: "⚡", file: "lazer_boss.MP3", group: "boss" },
  { key: "bossUltimate", label: "Boss — Ultimate", icon: "💥", file: "ultimate_boss.MP3", group: "boss" },
];

export default function SoundSettingPanel({ isOpen, onClose }) {
  const [vols, setVols] = useState(() => getVolumes());
  const [previewAudio, setPreviewAudio] = useState(null);

  useEffect(() => {
    if (isOpen) setVols(getVolumes());
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const handleChange = (key, value) => {
    const next = { ...vols, [key]: value };
    setVols(next);
    setVolumes(next);
  };

  const handlePreview = (file, key) => {
    if (previewAudio) {
      previewAudio.pause();
      previewAudio.currentTime = 0;
    }
    const audio = new Audio(`/sound/${file}`);
    audio.volume = vols[key];
    audio.play().catch(() => { });
    setPreviewAudio(audio);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
        style={{ animation: "sssFadeIn 0.15s ease" }}
      />

      {/* Centered Modal */}
      <div
        className="
          fixed z-[201] top-1/2 left-1/2
          w-[400px] max-w-[90vw]
          flex flex-col
          rounded-2xl border border-[rgba(0,245,255,0.2)]
          bg-[radial-gradient(circle_at_20%_20%,#0f172a,#020617)]
          shadow-[0_24px_80px_rgba(0,0,0,0.7),0_0_30px_rgba(0,245,255,0.06)]
          overflow-hidden
        "
        style={{
          transform: "translate(-50%, -50%)",
          animation: "sssModalIn 0.2s ease",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(0,245,255,0.12)] shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-lg font-bold tracking-[0.12em] uppercase text-cyan-1">
              Setting Sound
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 text-lg cursor-pointer transition-all"
          >
            ✕
          </button>
        </div>

        {/* Sound sliders */}
        <div className="flex flex-col gap-4 p-5">
          {/* Group: Ship */}
          <div className="text-[0.65rem] font-bold uppercase tracking-widest text-white/30 mb-1">
            Ship ( User )
          </div>
          {SOUNDS.filter(s => s.group === "ship").map(({ key, label, file }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[0.75rem] font-semibold text-white/80">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[0.65rem] text-white/40 w-8 text-right">
                    {Math.round(vols[key] * 100)}%
                  </span>
                  <button
                    onClick={() => handlePreview(file, key)}
                    className="text-[0.6rem] px-2 py-0.5 rounded bg-cyan-1/10 border border-cyan-1/25 text-cyan-1/70 hover:text-cyan-1 hover:bg-cyan-1/20 cursor-pointer transition-all"
                    title="Nghe thử"
                  >
                    ▶
                  </button>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={vols[key]}
                onChange={(e) => handleChange(key, parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #00f5ff ${vols[key] * 100}%, rgba(255,255,255,0.08) ${vols[key] * 100}%)`,
                }}
              />
            </div>
          ))}

          {/* Separator */}
          <div className="border-t border-white/10 my-1" />

          {/* Group: Boss */}
          <div className="text-[0.65rem] font-bold uppercase tracking-widest text-white/30 mb-1">
            Boss 
          </div>
          {SOUNDS.filter(s => s.group === "boss").map(({ key, label, file }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[0.75rem] font-semibold text-white/80">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[0.65rem] text-white/40 w-8 text-right">
                    {Math.round(vols[key] * 100)}%
                  </span>
                  <button
                    onClick={() => handlePreview(file, key)}
                    className="text-[0.6rem] px-2 py-0.5 rounded bg-orange-400/10 border border-orange-400/25 text-orange-400/70 hover:text-orange-400 hover:bg-orange-400/20 cursor-pointer transition-all"
                    title="Nghe thử"
                  >
                    ▶
                  </button>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={vols[key]}
                onChange={(e) => handleChange(key, parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #fb923c ${vols[key] * 100}%, rgba(255,255,255,0.08) ${vols[key] * 100}%)`,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes sssFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes sssModalIn {
          from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1);    }
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #00f5ff;
          box-shadow: 0 0 8px rgba(0,245,255,0.4);
          cursor: pointer;
        }
        input[type="range"]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #00f5ff;
          box-shadow: 0 0 8px rgba(0,245,255,0.4);
          border: none;
          cursor: pointer;
        }
      `}</style>
    </>
  );
}
