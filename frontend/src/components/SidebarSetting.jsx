import { useEffect, useRef } from "react";
import ToggleSwitch from "./ui/ToggleSwitch";
import { useGifts } from "../hooks/useGifts";
import { IMAGES } from "../utils/constant";
import { usePanelSettings } from "../hooks/usePanelSettings";

const PANEL_TOGGLES = [
  { key: "showBossGiftPanel",  label: "Bảng quà Boss",      icon: "🔴" },
  { key: "showShipGiftPanel",  label: "Bảng quà Ship User", icon: "🚀" },
  { key: "showTopDonorsPanel", label: "Top tặng quà",     icon: "🏆" },
];

export default function SidebarSetting({ isOpen, onClose }) {
  const { gifts, toggleGiftActive } = useGifts();
  const { settings, togglePanel } = usePanelSettings();
  const panelRef = useRef(null);

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
        className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal centered */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="
            pointer-events-auto relative w-full max-w-[420px] max-h-[88vh]
            bg-[rgba(4,10,28,0.98)] border border-[rgba(0,245,255,0.18)]
            backdrop-blur-xl rounded-2xl
            shadow-[0_0_60px_rgba(0,245,255,0.06),0_24px_60px_rgba(0,0,0,0.6)]
            flex flex-col overflow-hidden
          "
          style={{ animation: "giftModalIn 0.22s cubic-bezier(0.34,1.56,0.64,1) forwards" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(0,245,255,0.15)] flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_var(--color-success)] shrink-0 inline-block" />
              <span className="text-[0.7rem] uppercase tracking-[0.15em] text-cyan-1">
                Gift Config
              </span>
            </div>
            <button
              onClick={onClose}
              className="
                px-2.5 py-1 rounded-lg text-[0.8rem]
                bg-white/[0.06] border border-white/[0.12] text-white/70
                cursor-pointer transition-colors duration-150
                hover:bg-white/[0.12]
              "
            >
              ✕
            </button>
          </div>

          {/* Subtitle + count */}
          <div className="px-5 pt-2 pb-1 flex-shrink-0">
            <p className="text-[0.6rem] text-white/35 tracking-[0.05em]">
              Bật/tắt quà để hiển thị trong danh sách chọn của Model Manager
            </p>
            <p className="text-[0.63rem] text-[rgba(0,245,255,0.6)] mt-0.5">
              {gifts.filter((g) => g.active).length}/{gifts.length} quà đang active
            </p>
          </div>

          {/* Scroll area — gift list */}
          <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 flex flex-col gap-1.5">
            {gifts.length === 0 && (
              <div className="text-[0.75rem] text-center p-5 text-white/30">
                Loading gifts...
              </div>
            )}

            {gifts.map((gift) => (
              <div
                key={gift.giftId}
                className={`
                  rounded-[10px] px-3 py-2 flex items-center gap-2.5
                  border transition-[border-color,background] duration-200
                  ${gift.active
                    ? "bg-[rgba(0,245,255,0.05)] border-border opacity-100"
                    : "bg-white/[0.015] border-white/[0.06] opacity-55"
                  }
                `}
              >
                {gift.image ? (
                  <img
                    src={gift.image}
                    alt={gift.giftName}
                    className="w-9 h-9 rounded-lg object-contain bg-white/[0.05] shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xl bg-white/[0.05] shrink-0">
                    🎁
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className={`text-[0.78rem] font-semibold overflow-hidden text-ellipsis whitespace-nowrap ${gift.active ? "text-[#e0e8ff]" : "text-white/45"}`}>
                    {gift.giftName}
                  </div>
                  <div className="text-xs text-gold mt-px flex items-center gap-1">
                    <p>{gift.diamonds}</p>
                    <img src={IMAGES.COIN} alt="Coin" className="w-3 h-3 object-contain" />
                  </div>
                </div>

                <ToggleSwitch
                  value={gift.active}
                  onChange={() => toggleGiftActive(gift.giftId)}
                  title={gift.active ? "Tắt khỏi danh sách chọn" : "Bật lại trong danh sách chọn"}
                />
              </div>
            ))}
          </div>

          {/* Panel Visibility Section */}
          <div className="px-5 pt-4 pb-5 border-t border-[rgba(0,245,255,0.1)] flex-shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.6)] shrink-0 inline-block" />
              <span className="text-[0.7rem] uppercase tracking-[0.15em] text-purple-400">
                Hiển thị bảng
              </span>
            </div>
            <p className="text-[0.6rem] text-white/30 mb-3">
              Bật/tắt các bảng nổi trên màn hình game
            </p>
            <div className="flex flex-col gap-2">
              {PANEL_TOGGLES.map(({ key, label, icon }) => (
                <div
                  key={key}
                  className={`
                    rounded-[10px] px-3 py-2.5 flex items-center gap-2.5
                    border transition-[border-color,background] duration-200
                    ${settings[key]
                      ? "bg-[rgba(168,85,247,0.08)] border-[rgba(168,85,247,0.3)]"
                      : "bg-white/[0.015] border-white/[0.06] opacity-55"
                    }
                  `}
                >
                  <span className="text-lg shrink-0">{icon}</span>
                  <span className={`flex-1 text-[0.78rem] font-semibold ${settings[key] ? "text-[#e0e8ff]" : "text-white/45"}`}>
                    {label}
                  </span>
                  <ToggleSwitch
                    value={settings[key]}
                    onChange={() => togglePanel(key)}
                    title={settings[key] ? "Ẩn panel" : "Hiện panel"}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes giftModalIn {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>
    </>
  );
}
