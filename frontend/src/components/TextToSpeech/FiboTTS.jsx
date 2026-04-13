import { useState, useCallback } from "react";
import { useTTS } from "../../hooks/useTTS";
import ToggleSwitch from "../ui/ToggleSwitch";

const inputCls =
  "w-full rounded-lg px-3 py-2 text-sm bg-[rgba(255,255,255,0.06)] border border-[rgba(139,92,246,0.25)] text-[#e0e8ff] outline-none focus:border-purple/60 transition-colors placeholder:text-white/20";
const labelCls =
  "block text-[0.62rem] uppercase tracking-[0.15em] text-white/40 font-semibold mb-1";

export default function FiboTTS() {
  const { config, setConfig, voices, loadingVoices, fetchVoices, speak } = useTTS();

  const configKey = JSON.stringify(config);
  const [draft, setDraft] = useState({ ...config });
  const [prevConfigKey, setPrevConfigKey] = useState(configKey);
  const [feedback, setFeedback] = useState(null);
  const [testText, setTestText] = useState("Xin chào, đây là bài test giọng nói.");
  const [testing, setTesting] = useState(false);

  if (configKey !== prevConfigKey) {
    setPrevConfigKey(configKey);
    setDraft({ ...config });
  }

  // Helper to update draft fields
  const updateDraft = useCallback((key, value) => {
    setDraft((p) => ({ ...p, [key]: value }));
  }, []);

  // ── Save handler — persist draft → store ───────────────────
  const handleSave = () => {
    setConfig(draft);
    setFeedback({ type: "success", msg: "Đã lưu thành công!" });
    setTimeout(() => setFeedback(null), 2500);
  };

  // Check if draft differs from saved config
  const hasChanges = JSON.stringify(draft) !== JSON.stringify(config);

  const handleTest = async () => {
    if (testing || !testText.trim()) return;
    setTesting(true);
    speak(testText);
    setTimeout(() => setTesting(false), 2000);
  };

  // Toggle enabled trực tiếp (không cần Save)
  const handleToggleEnabled = () => {
    const next = !config.enabled;
    setConfig({ enabled: next });
    setDraft((p) => ({ ...p, enabled: next }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        onClick={handleToggleEnabled}
        className="flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer select-none transition-all duration-300"
        style={{
          background: config.enabled
            ? "linear-gradient(135deg, rgba(139,92,246,0.18), rgba(99,102,241,0.12))"
            : "rgba(255,255,255,0.03)",
          borderColor: config.enabled ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.08)",
          boxShadow: config.enabled ? "0 0 18px rgba(139,92,246,0.15)" : "none",
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{config.enabled ? "🔊" : "🔇"}</span>
          <div>
            <div className="text-[0.8rem] font-bold text-white/90">
              Text-to-Speech
            </div>
            <div className="text-[0.62rem] text-white/40">
              {config.enabled ? "Đang hoạt động" : "Đã tắt"}
            </div>
          </div>
        </div>

        {/* Visual toggle pill */}
        <div
          className="relative w-12 h-6 rounded-full transition-all duration-300 shrink-0"
          style={{
            background: config.enabled
              ? "linear-gradient(90deg, #8b5cf6, #6366f1)"
              : "rgba(255,255,255,0.1)",
          }}
        >
          <div
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300"
            style={{ left: config.enabled ? "calc(100% - 1.375rem)" : "0.125rem" }}
          />
        </div>
      </div>

      {/* Dim the rest when disabled */}
      <div style={{ opacity: config.enabled ? 1 : 0.4, transition: "opacity 0.3s", pointerEvents: config.enabled ? "auto" : "none" }}>
      {/* API URL */}
      <div>
        <label className={labelCls}>API URL</label>
        <input
          className={inputCls}
          value={draft.apiUrl}
          onChange={(e) => updateDraft("apiUrl", e.target.value)}
          placeholder="Api url..."
        />
        <button
          onClick={() => fetchVoices(draft.apiUrl)}
          disabled={loadingVoices}
          className="mt-1.5 text-[0.65rem] px-3 py-1 rounded-md bg-purple/15 border border-purple/30 text-purple cursor-pointer hover:bg-purple/25 transition-all disabled:opacity-50"
        >
          {loadingVoices ? "Đang tải..." : "Tải danh sách voice"}
        </button>
      </div>

      {/* Voice select */}
      <div>
        <label className={labelCls}>Voice</label>
        <select
          className={inputCls}
          value={draft.voice}
          onChange={(e) => updateDraft("voice", e.target.value)}
        >
          <option value="" className="bg-[#0a1020]">-- Chọn giọng --</option>
          {voices.map((v) => (
            <option key={v} value={v} className="bg-[#0a1020]">{v}</option>
          ))}
        </select>
        {voices.length === 0 && !loadingVoices && (
          <p className="text-[0.6rem] text-white/25 mt-1 italic">
            Nhấn "Tải danh sách voice" để lấy voices từ API
          </p>
        )}
      </div>

      {/* Parameters grid */}
      <div>
        <label className={`${labelCls} mb-2`}>Settings parameter</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[0.58rem] text-white/30 mb-0.5 block">num_step</label>
            <input
              type="number"
              min={1}
              max={50}
              className={inputCls}
              value={draft.numStep}
              onChange={(e) => updateDraft("numStep", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-[0.58rem] text-white/30 mb-0.5 block">first_chunk_words</label>
            <input
              type="number"
              min={1}
              max={100}
              className={inputCls}
              value={draft.firstChunkWords}
              onChange={(e) => updateDraft("firstChunkWords", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-[0.58rem] text-white/30 mb-0.5 block">min_chunk_words</label>
            <input
              type="number"
              min={1}
              max={100}
              className={inputCls}
              value={draft.minChunkWords}
              onChange={(e) => updateDraft("minChunkWords", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-[0.58rem] text-white/30 mb-0.5 block">batch_size</label>
            <input
              type="number"
              min={1}
              max={20}
              className={inputCls}
              value={draft.batchSize}
              onChange={(e) => updateDraft("batchSize", Number(e.target.value))}
            />
          </div>
        </div>
        <div className="flex items-center gap-2.5 mt-2.5">
          <ToggleSwitch
            value={draft.noWarmup}
            onChange={(v) => updateDraft("noWarmup", v)}
          />
          <span className="text-[0.7rem] text-white/50">no_warmup</span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/[0.06]" />

      {/* Welcome toggle + template */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-base">👋</span>
            <span className="text-[0.72rem] font-semibold text-white/80">
              Chào người vào live
            </span>
          </div>
          <ToggleSwitch
            value={draft.enableWelcome}
            onChange={(v) => updateDraft("enableWelcome", v)}
          />
        </div>
        {draft.enableWelcome && (
          <textarea
            className={`${inputCls} min-h-[60px] resize-y`}
            value={draft.welcomeTemplate}
            onChange={(e) => updateDraft("welcomeTemplate", e.target.value)}
            placeholder="Chào mừng {name} ..."
          />
        )}
        {draft.enableWelcome && (
          <p className="text-[0.58rem] text-white/25 mt-1">
            Dùng <code className="text-purple/80">{"{name}"}</code> để chèn tên viewer
          </p>
        )}
      </div>

      {/* Gift thank toggle + template */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-base">🎁</span>
            <span className="text-[0.72rem] font-semibold text-white/80">
              Cảm ơn tặng quà
            </span>
          </div>
          <ToggleSwitch
            value={draft.enableGiftThank}
            onChange={(v) => updateDraft("enableGiftThank", v)}
          />
        </div>
        {draft.enableGiftThank && (
          <textarea
            className={`${inputCls} min-h-[60px] resize-y`}
            value={draft.giftTemplate}
            onChange={(e) => updateDraft("giftTemplate", e.target.value)}
            placeholder="Cảm ơn {name} ..."
          />
        )}
        {draft.enableGiftThank && (
          <p className="text-[0.58rem] text-white/25 mt-1">
            Dùng <code className="text-purple/80">{"{name}"}</code>, <code className="text-purple/80">{"{count}"}</code>, <code className="text-purple/80">{"{gift}"}</code>
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-white/[0.06]" />

      {/* Test area */}
      <div>
        <label className={labelCls}>🔊 Test TTS</label>
        <div className="flex gap-2">
          <input
            className={`${inputCls} flex-1`}
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder="Nhập text để test..."
          />
          <button
            onClick={handleTest}
            disabled={testing || !draft.voice}
            className="px-4 py-2 rounded-lg text-[0.72rem] font-semibold cursor-pointer bg-gradient-to-r from-purple/30 to-indigo-500/30 border border-purple/40 text-purple hover:from-purple/40 hover:to-indigo-500/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {testing ? "🔊 ..." : "▶ Play"}
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/[0.06]" />

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
      </div>{/* end dim wrapper */}

      {/* Save button — always accessible */}
      <button
        onClick={handleSave}
        className={`
          w-full py-3 rounded-lg text-sm font-bold uppercase tracking-wider cursor-pointer
          transition-all duration-200
          ${hasChanges
            ? "bg-gradient-to-r from-purple/25 via-indigo-500/25 to-purple/25 border border-purple/50 text-purple hover:from-purple/35 hover:via-indigo-500/35 hover:to-purple/35 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] active:scale-[0.98]"
            : "bg-white/[0.03] border border-white/10 text-white/30 cursor-default"
          }
        `}
      >
        Save Changes
      </button>
    </div>
  );
}
