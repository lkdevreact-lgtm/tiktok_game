import { useState, useCallback, useRef, useEffect } from "react";
import { API_URL } from "../utils/constant";
import { TTSContext } from "./ttsContext";

const LS_KEY = "ttsConfig";

const DEFAULT_CONFIG = {
  apiUrl: "https://unoverlooked-soulfully-rayna.ngrok-free.dev",
  voice: "",
  numStep: 8,
  firstChunkWords: 20,
  minChunkWords: 15,
  batchSize: 3,
  noWarmup: true,
  enableWelcome: true,
  enableGiftThank: true,
  welcomeTemplate: "Chào mừng {name} đến với phiên live này, cho tớ xin 1 follow và 1 tim nhé. Cảm ơn cậu nhó.",
  giftTemplate: "Cảm ơn {name} đã tặng {count} {gift}",
};

function loadConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY));
    if (saved && typeof saved === "object") return { ...DEFAULT_CONFIG, ...saved };
  } catch { /* ignore */ }
  return { ...DEFAULT_CONFIG };
}

export function TTSProvider({ children }) {
  const [config, setConfigState] = useState(loadConfig);
  const [voices, setVoices] = useState([]);
  const [loadingVoices, setLoadingVoices] = useState(false);

  // Audio queue for sequential playback
  const queueRef = useRef([]);
  const playingRef = useRef(false);

  // ── Persist config ──────────────────────────────────────────
  const setConfig = useCallback((updater) => {
    setConfigState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // ── Fetch voices from API ───────────────────────────────────
  const fetchVoices = useCallback(async (apiUrl) => {
    const url = apiUrl || config.apiUrl;
    if (!url) return;
    setLoadingVoices(true);
    try {
      const res = await fetch(`${API_URL}/api/tts/voices?apiUrl=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setVoices(data);
        // Auto-select first voice if none selected
        if (!config.voice && data.length > 0) {
          setConfig((p) => ({ ...p, voice: data[0] }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch voices:", err);
    }
    setLoadingVoices(false);
  }, [config.apiUrl, config.voice, setConfig]);

  // Fetch voices on mount
  useEffect(() => {
    if (config.apiUrl) fetchVoices(config.apiUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Play next in queue ──────────────────────────────────────
  const playNext = useCallback(async () => {
    if (playingRef.current || queueRef.current.length === 0) return;
    playingRef.current = true;

    const { text, cfg } = queueRef.current.shift();
    cfg.apiUrl.replace(/\/$/, "");

    try {
      const res = await fetch(`${API_URL}/api/tts/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiUrl: cfg.apiUrl,
          text,
          voice: cfg.voice,
          num_step: cfg.numStep,
          first_chunk_words: cfg.firstChunkWords,
          min_chunk_words: cfg.minChunkWords,
          batch_size: cfg.batchSize,
          no_warmup: cfg.noWarmup,
        }),
      });


      if (!res.ok) {
        const errBody = await res.text();
        console.error("[TTS] API Error:", res.status, errBody);
        throw new Error(`TTS API ${res.status}: ${errBody}`);
      }

      const blob = await res.blob();
      console.log("[TTS] Blob:", { size: blob.size, type: blob.type });

      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audio.volume = 1.0;

      await new Promise((resolve) => {
        audio.onloadedmetadata = () => {
          console.log("[TTS] Audio duration:", audio.duration, "sec, volume:", audio.volume, "muted:", audio.muted);
        };
        audio.onended = () => { console.log("[TTS] Audio ended"); URL.revokeObjectURL(audioUrl); resolve(); };
        audio.onerror = (e) => { console.error("[TTS] Audio error:", e); URL.revokeObjectURL(audioUrl); resolve(); };
        audio.play().then(() => console.log("[TTS] Playing...")).catch((e) => { console.error("[TTS] Play failed:", e); resolve(); });
      });
    } catch (err) {
      console.error("TTS play error:", err);
    }

    playingRef.current = false;
    if (queueRef.current.length > 0) playNext();
  }, []);

  // ── Enqueue TTS ─────────────────────────────────────────────
  const speak = useCallback((text) => {
    const cfg = loadConfig(); // always read latest config
    if (!cfg.apiUrl || !cfg.voice || !text) return;
    queueRef.current.push({ text, cfg });
    playNext();
  }, [playNext]);

  // ── Speak for welcome ───────────────────────────────────────
  const speakWelcome = useCallback((name) => {
    const cfg = loadConfig();
    if (!cfg.enableWelcome) return;
    const text = cfg.welcomeTemplate.replace("{name}", name);
    speak(text);
  }, [speak]);

  // ── Speak for gift ──────────────────────────────────────────
  const speakGift = useCallback((name, count, gift) => {
    const cfg = loadConfig();
    if (!cfg.enableGiftThank) return;
    const text = cfg.giftTemplate
      .replace("{name}", name)
      .replace("{count}", count)
      .replace("{gift}", gift);
    speak(text);
  }, [speak]);

  return (
    <TTSContext.Provider value={{
      config,
      setConfig,
      voices,
      loadingVoices,
      fetchVoices,
      speak,
      speakWelcome,
      speakGift,
    }}>
      {children}
    </TTSContext.Provider>
  );
}
