/**
 * modelStore.jsx
 * Nguồn sự thật duy nhất: backend/data/models.json
 *
 * - Load tất cả models từ GET /api/models khi khởi động
 * - Thêm (upload) → POST /api/models/upload → append JSON
 * - Sửa → PUT /api/models/:id → update JSON
 * - Xóa → DELETE /api/models/:id → xóa JSON (+ file GLB nếu custom)
 * - localStorage chỉ cache để tránh flash khi reload
 *
 * UI preferences (active state, active boss) lưu localStorage vì chúng
 * là runtime state không cần persist vào source.
 */
import { createContext, useContext, useState, useCallback, useEffect } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8888";

// Cache localStorage helpers
const ls = {
  get: (key, fb) => { try { return JSON.parse(localStorage.getItem(key)) ?? fb; } catch { return fb; } },
  set: (key, v) => localStorage.setItem(key, JSON.stringify(v)),
};

const ModelContext = createContext(null);

export function ModelProvider({ children }) {
  // Tất cả models từ JSON (hiển thị cache trước khi fetch xong)
  const [models, setModels]   = useState(() => ls.get("modelsCache", []));
  const [loading, setLoading] = useState(true);

  // UI preferences — localStorage
  const [shipActive,      setShipActive]      = useState(() => ls.get("shipActive", {}));
  const [activeBossId,    setActiveBossIdState] = useState(() => ls.get("activeBossId", null) ?? "spaceship_boss");

  // ── Load từ API khi mount ─────────────────────────────────────
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/models`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setModels(data);
          ls.set("modelsCache", data);
        }
      })
      .catch(() => { /* giữ cache */ })
      .finally(() => setLoading(false));
  }, []);

  // ── Computed views ────────────────────────────────────────────
  const modelsWithActive = models.map((m) => ({
    ...m,
    active: m.role === "boss"
      ? m.id === activeBossId
      : shipActive[m.id] !== false, // ships default active
  }));

  const allShipModels   = modelsWithActive.filter((m) => m.role === "ship");
  const allBossModels   = modelsWithActive.filter((m) => m.role === "boss");
  const shipModels      = allShipModels.filter((m) => m.active);        // cho gift config dropdown
  const activeBossModel = allBossModels.find((m) => m.active) ?? allBossModels[0];

  // ── Helper cập nhật local state + cache ─────────────────────
  const _setAndCache = (updater) => {
    setModels((prev) => {
      const next = updater(prev);
      ls.set("modelsCache", next);
      return next;
    });
  };

  // ── Add model (sau khi upload thành công) ────────────────────
  const addModel = useCallback((model) => {
    _setAndCache((prev) => [...prev, model]);
  }, []);

  // ── Update model → PUT API + local ──────────────────────────
  const updateModel = useCallback(async (id, changes) => {
    // Optimistic update
    _setAndCache((prev) => prev.map((m) => (m.id === id ? { ...m, ...changes } : m)));

    try {
      await fetch(`${BACKEND_URL}/api/models/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
    } catch { /* ignore offline */ }
  }, []);

  // ── Delete model → DELETE API + local ───────────────────────
  const removeModel = useCallback(async (id) => {
    _setAndCache((prev) => prev.filter((m) => m.id !== id));

    try {
      await fetch(`${BACKEND_URL}/api/models/${id}`, { method: "DELETE" });
    } catch { /* ignore */ }

    if (id === activeBossId) {
      setActiveBossIdState("spaceship_boss");
      ls.set("activeBossId", "spaceship_boss");
    }
  }, [activeBossId]);

  // ── Ship active toggle ───────────────────────────────────────
  const toggleShipActive = useCallback((id) => {
    setShipActive((prev) => {
      const next = { ...prev, [id]: prev[id] === false ? true : false };
      ls.set("shipActive", next);
      return next;
    });
  }, []);

  // ── Active boss ──────────────────────────────────────────────
  const setActiveBoss = useCallback((id) => {
    setActiveBossIdState(id);
    ls.set("activeBossId", id);
  }, []);

  // ── Refresh từ server (dùng sau upload) ─────────────────────
  const refreshModels = useCallback(() => {
    fetch(`${BACKEND_URL}/api/models`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) { setModels(data); ls.set("modelsCache", data); } })
      .catch(() => {});
  }, []);

  return (
    <ModelContext.Provider
      value={{
        loading,
        models: modelsWithActive,
        allShipModels,
        allBossModels,
        shipModels,
        activeBossModel,
        activeBossId,
        addModel,
        updateModel,
        removeModel,
        toggleShipActive,
        setActiveBoss,
        refreshModels,
      }}
    >
      {children}
    </ModelContext.Provider>
  );
}

export function useModels() {
  const ctx = useContext(ModelContext);
  if (!ctx) throw new Error("useModels must be used within ModelProvider");
  return ctx;
}
