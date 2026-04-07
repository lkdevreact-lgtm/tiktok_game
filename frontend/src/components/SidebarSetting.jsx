import { useEffect, useRef } from "react";
import ToggleSwitch from "./ui/ToggleSwitch";
import { useGifts } from "../hooks/useGifts";

export default function SidebarSetting({ isOpen, onClose }) {
  const { gifts, toggleGiftActive } = useGifts();
  const panelRef = useRef(null);

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
          fixed inset-0 z-[90] bg-black/55 backdrop-blur-xs
          transition-opacity duration-300 ease-in-out
          ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      />

      {/* Sliding Panel */}
      <aside
        ref={panelRef}
        className={`
          fixed top-0 right-0 bottom-0 w-[300px] z-[100]
          flex flex-col
          bg-[rgba(4,10,28,0.97)] border-l border-[rgba(0,245,255,0.18)] backdrop-blur-xl
          transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${isOpen
            ? "translate-x-0 shadow-[-8px_0_40px_rgba(0,0,0,0.6)]"
            : "translate-x-full shadow-none"
          }
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(0,245,255,0.15)]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-success)] shadow-[0_0_8px_var(--color-success)] shrink-0 inline-block" />
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

        {/* Subtitle */}
        <div className="px-[18px] pt-2 pb-1 text-[0.6rem] text-white/35 tracking-[0.05em]">
          Bật/tắt quà để hiển thị trong danh sách chọn của Model Manager
        </div>

        {/* Active count */}
        <div className="px-[18px] pb-2 text-[0.63rem] text-[rgba(0,245,255,0.6)]">
          ✅ {gifts.filter((g) => g.active).length}/{gifts.length} quà đang active
        </div>

        {/* Scroll area */}
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
                  ? "bg-[rgba(0,245,255,0.05)] border-[rgba(0,245,255,0.2)] opacity-100"
                  : "bg-white/[0.015] border-white/[0.06] opacity-55"
                }
              `}
            >
              {/* Gift image */}
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

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className={`text-[0.78rem] font-semibold overflow-hidden text-ellipsis whitespace-nowrap ${gift.active ? "text-[#e0e8ff]" : "text-white/45"}`}>
                  {gift.giftName}
                </div>
                <div className="text-[0.65rem] text-gold mt-px">
                  💎 {gift.diamonds}
                </div>
              </div>

              {/* Toggle */}
              <ToggleSwitch
                value={gift.active}
                onChange={() => toggleGiftActive(gift.giftId)}
                title={gift.active ? "Tắt khỏi danh sách chọn" : "Bật lại trong danh sách chọn"}
              />
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
