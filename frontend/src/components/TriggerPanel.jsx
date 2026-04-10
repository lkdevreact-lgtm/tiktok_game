import { useState, useEffect } from "react";
import { useModels } from "../hooks/useModels";

/**
 * TriggerPanel — Sidebar panel cho phép cấu hình triggers:
 *  - Select kiểu trigger: Comment / Tap tap (tim)
 *  - Comment: nhập nội dung comment (code)
 *  - Tap tap: nhập số lượng tim
 *  - Chọn ship user tương ứng
 *  - Save change → lưu triggers.json qua API
 */
export default function TriggerPanel({ isOpen, onClose }) {
  const { allShipModels, triggers, saveTriggers } = useModels();
  const activeShips = allShipModels.filter((m) => m.active);

  // Local editing state — synced from store triggers khi panel mở
  const [localTriggers, setLocalTriggers] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [saving, setSaving] = useState(false);

  // Sync store → local khi mở
  useEffect(() => {
    if (isOpen) {
      setLocalTriggers(triggers.map((t) => ({ ...t })));
      setFeedback(null);
    }
  }, [isOpen, triggers]);

  // ── Thêm trigger mới ──────────────────────────────────────────
  const addTrigger = () => {
    setLocalTriggers((prev) => [
      ...prev,
      {
        id: `trigger_${Date.now()}`,
        type: "comment",
        content: "",
        quantity: 50,
        shipId: activeShips[0]?.id || "",
      },
    ]);
  };

  // ── Xóa trigger ───────────────────────────────────────────────
  const removeTrigger = (id) => {
    setLocalTriggers((prev) => prev.filter((t) => t.id !== id));
  };

  // ── Update field ──────────────────────────────────────────────
  const updateTrigger = (id, key, value) => {
    setLocalTriggers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [key]: value } : t))
    );
  };

  // ── Save ───────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      await saveTriggers(localTriggers);
      setFeedback({ type: "success", msg: "✅ Đã lưu thành công!" });
    } catch {
      setFeedback({ type: "error", msg: "❌ Lỗi khi lưu!" });
    }
    setSaving(false);
    setTimeout(() => setFeedback(null), 2500);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="
          fixed top-0 right-0 z-[101] h-full w-[420px] max-w-[92vw]
          bg-[rgba(5,12,30,0.98)] border-l border-[rgba(250,204,21,0.2)]
          backdrop-blur-xl shadow-[-8px_0_40px_rgba(250,204,21,0.08)]
          flex flex-col overflow-hidden
        "
        style={{
          fontFamily: "var(--font-ui), sans-serif",
          animation: "slideInRight 0.3s ease",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(250,204,21,0.15)]">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🎯</span>
            <span className="text-[0.85rem] font-bold tracking-[0.12em] uppercase text-yellow-400">
              Trigger Settings
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/5 text-lg cursor-pointer transition-all"
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Trigger list */}
          <div className="flex flex-col gap-4">
            {localTriggers.length === 0 && (
              <p className="text-[0.75rem] text-white/25 italic text-center py-6">
                Chưa có trigger nào. Nhấn "+ Thêm Trigger" để bắt đầu.
              </p>
            )}

            {localTriggers.map((trigger, idx) => (
              <TriggerCard
                key={trigger.id}
                trigger={trigger}
                index={idx}
                activeShips={activeShips}
                onUpdate={updateTrigger}
                onRemove={removeTrigger}
              />
            ))}
          </div>

          {/* Add button */}
          <button
            onClick={addTrigger}
            className="
              mt-4 w-full py-2.5 rounded-lg text-[0.75rem] font-semibold uppercase tracking-wider
              cursor-pointer border border-dashed border-yellow-400/25 text-yellow-400/60
              hover:border-yellow-400/50 hover:text-yellow-400 hover:bg-yellow-400/5
              transition-all duration-200
            "
          >
            + Thêm Trigger
          </button>
        </div>

        {/* Footer: Save + Feedback */}
        <div className="px-5 py-4 border-t border-[rgba(250,204,21,0.15)] flex flex-col gap-2.5">
          {/* Feedback */}
          {feedback && (
            <div
              className={`px-3 py-2 rounded-lg text-[0.75rem] animate-fade-in
                ${feedback.type === "success"
                  ? "bg-green-500/10 border border-green-500/30 text-green-400"
                  : "bg-red-500/10 border border-red-500/30 text-red-400"
                }
              `}
            >
              {feedback.msg}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="
              w-full py-3 rounded-lg text-sm font-bold uppercase tracking-wider cursor-pointer
              bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-yellow-500/20
              border border-yellow-400/40 text-yellow-300
              hover:from-yellow-500/30 hover:via-orange-500/30 hover:to-yellow-500/30
              hover:shadow-[0_0_20px_rgba(250,204,21,0.15)]
              active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
            "
          >
            {saving ? "Đang lưu..." : "💾 Save Changes"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}

// ── Sub-component: TriggerCard ─────────────────────────────────
function TriggerCard({ trigger, index, activeShips, onUpdate, onRemove }) {
  const isComment = trigger.type === "comment";
  const isTap = trigger.type === "tap";

  // Tìm model được chọn để hiển thị icon
  const selectedShip = activeShips.find((m) => m.id === trigger.shipId);

  return (
    <div className="
      rounded-xl border border-[rgba(250,204,21,0.12)] bg-[rgba(255,255,255,0.02)]
      overflow-hidden
    ">
      {/* Card header */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[rgba(250,204,21,0.04)]">
        <span className="text-[0.65rem] font-bold uppercase tracking-widest text-yellow-400/50">
          Trigger #{index + 1}
        </span>
        <button
          onClick={() => onRemove(trigger.id)}
          className="text-[0.65rem] text-red-400/50 hover:text-red-400 cursor-pointer transition-colors"
          title="Xóa trigger"
        >
          🗑 Xóa
        </button>
      </div>

      <div className="px-3.5 py-3 flex flex-col gap-3">
        {/* 1. Select loại trigger */}
        <div>
          <label className="text-[0.62rem] uppercase tracking-[0.15em] text-white/35 font-semibold mb-1 block">
            Loại hành động
          </label>
          <div className="relative">
            <select
              value={trigger.type}
              onChange={(e) => onUpdate(trigger.id, "type", e.target.value)}
              className="
                w-full px-3 py-2 rounded-lg text-sm text-white appearance-none cursor-pointer
                bg-[rgba(255,255,255,0.06)] border border-[rgba(250,204,21,0.2)]
                outline-none focus:border-yellow-400/50 transition-all duration-200
              "
            >
              <option value="comment" className="bg-[#0a1020] text-white">
                💬 Comment (CMT)
              </option>
              <option value="tap" className="bg-[#0a1020] text-white">
                ❤️ Tap tap (Tim)
              </option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none text-xs">
              ▾
            </div>
          </div>
        </div>

        {/* 2. Content / Quantity input */}
        {isComment && (
          <div>
            <label className="text-[0.62rem] uppercase tracking-[0.15em] text-white/35 font-semibold mb-1 block">
              💬 Nội dung Comment
            </label>
            <input
              type="text"
              value={trigger.content || ""}
              onChange={(e) => onUpdate(trigger.id, "content", e.target.value)}
              placeholder='VD: "111", "go", "attack"'
              className="
                w-full px-3 py-2 rounded-lg text-sm text-white
                bg-[rgba(255,255,255,0.06)] border border-[rgba(250,204,21,0.2)]
                outline-none focus:border-yellow-400/50 focus:shadow-[0_0_8px_rgba(250,204,21,0.1)]
                transition-all duration-200 placeholder:text-white/20
              "
            />
            <p className="text-[0.6rem] text-white/20 mt-1">
              Khi viewer comment nội dung này sẽ spawn chiến cơ
            </p>
          </div>
        )}

        {isTap && (
          <div>
            <label className="text-[0.62rem] uppercase tracking-[0.15em] text-white/35 font-semibold mb-1 block">
              ❤️ Số lượng Tim
            </label>
            <input
              type="number"
              min={1}
              value={trigger.quantity || 50}
              onChange={(e) => onUpdate(trigger.id, "quantity", parseInt(e.target.value) || 1)}
              className="
                w-full px-3 py-2 rounded-lg text-sm text-white
                bg-[rgba(255,255,255,0.06)] border border-[rgba(250,204,21,0.2)]
                outline-none focus:border-yellow-400/50 focus:shadow-[0_0_8px_rgba(250,204,21,0.1)]
                transition-all duration-200
              "
            />
            <p className="text-[0.6rem] text-white/20 mt-1">
              Cứ mỗi {trigger.quantity || 50} tim tích lũy sẽ spawn 1 chiến cơ
            </p>
          </div>
        )}

        {/* 3. Chọn Ship User */}
        <div>
          <label className="text-[0.62rem] uppercase tracking-[0.15em] text-white/35 font-semibold mb-1.5 block">
            🚀 Chọn Ship User
          </label>
          <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-1">
            {activeShips.length === 0 && (
              <p className="text-[0.7rem] text-white/20 italic">Không có ship nào active</p>
            )}
            {activeShips.map((m) => {
              const isSelected = trigger.shipId === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => onUpdate(trigger.id, "shipId", m.id)}
                  className={`
                    flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer
                    transition-all duration-150 border text-left
                    ${isSelected
                      ? "bg-yellow-400/12 border-yellow-400/40 shadow-[0_0_10px_rgba(250,204,21,0.08)]"
                      : "bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.05)]"
                    }
                  `}
                >
                  {/* Radio dot */}
                  <div className={`
                    w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                    ${isSelected
                      ? "border-yellow-400"
                      : "border-white/20"
                    }
                  `}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />}
                  </div>

                  {/* Icon */}
                  {m.iconUrl ? (
                    <img src={m.iconUrl} alt="" className="w-6 h-6 rounded object-cover" />
                  ) : (
                    <span className="text-base">{m.emoji || "🚀"}</span>
                  )}

                  {/* Label + stats */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-[0.72rem] truncate ${isSelected ? "text-yellow-300 font-semibold" : "text-white/70"}`}>
                      {m.label || m.id}
                    </p>
                    <p className="text-[0.58rem] text-white/25">
                      DMG {m.damage ?? 1} · Rate {m.fireRate ?? 1} · Shots {m.maxShots ?? 20}
                    </p>
                  </div>

                  {isSelected && (
                    <span className="text-[0.6rem] text-yellow-400 font-bold">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        {selectedShip && (
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[rgba(250,204,21,0.04)] border border-[rgba(250,204,21,0.1)]">
            <span className="text-[0.6rem] text-white/30">→</span>
            <span className="text-[0.65rem] text-yellow-400/70">
              {isComment
                ? `Comment "${trigger.content || "..."}" → spawn "${selectedShip.label || selectedShip.id}"`
                : `Mỗi ${trigger.quantity || 50} tim → spawn "${selectedShip.label || selectedShip.id}"`
              }
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
