
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { API_URL } from "../utils/constant";


const ls = {
  get: (key, fb) => { try { return JSON.parse(localStorage.getItem(key)) ?? fb; } catch { return fb; } },
  set: (key, v) => localStorage.setItem(key, JSON.stringify(v)),
};

const ModelContext = createContext(null);

export function ModelProvider({ children }) {
  const [models,  setModels]  = useState(() => ls.get("modelsCache", []));
  const [loading, setLoading] = useState(true);

  // activeBossId vẫn localStorage (runtime preference, không cần persist json)
  const [activeBossId, setActiveBossIdState] = useState(
    () => ls.get("activeBossId", null) ?? "spaceship_boss"
  );

  // ── Load từ API khi mount ─────────────────────────────────────
  useEffect(() => {
    fetch(`${API_URL}/api/models`)
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

  // ── Helper cập nhật local state + cache ─────────────────────
  const _setAndCache = (updater) => {
    setModels((prev) => {
      const next = updater(prev);
      ls.set("modelsCache", next);
      return next;
    });
  };

  // ── Computed views ────────────────────────────────────────────
  const allShipModels   = models.filter((m) => m.role === "ship");
  const allBossModels   = models.filter((m) => m.role === "boss").map((m) => ({
    ...m,
    active: m.id === activeBossId,
  }));
  const shipModels      = allShipModels.filter((m) => m.active);          // ship đang active
  const activeBossModel = allBossModels.find((m) => m.active) ?? allBossModels[0];

  // Gift → model mapping: { [giftId]: model }
  const giftModelMap = {};
  allShipModels.filter((m) => m.active).forEach((m) => {
    (m.gifts || []).forEach((giftId) => {
      giftModelMap[String(giftId)] = m;
    });
  });

  // ── Add model ────────────────────────────────────────────────
  const addModel = useCallback((model) => {
    _setAndCache((prev) => [...prev, model]);
  }, []);

  // ── Update model → PUT API + local ──────────────────────────
  const updateModel = useCallback(async (id, changes) => {
    _setAndCache((prev) => prev.map((m) => (m.id === id ? { ...m, ...changes } : m)));

    try {
      await fetch(`${API_URL}/api/models/${id}`, {
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
      await fetch(`${API_URL}/api/models/${id}`, { method: "DELETE" });
    } catch { /* ignore */ }

    if (id === activeBossId) {
      setActiveBossIdState("spaceship_boss");
      ls.set("activeBossId", "spaceship_boss");
    }
  }, [activeBossId]);

  // ── Toggle ship active → persist vào JSON qua PUT ────────────
  const toggleShipActive = useCallback(async (id) => {
    let newActive;
    _setAndCache((prev) => prev.map((m) => {
      if (m.id === id) {
        newActive = !m.active;
        return { ...m, active: newActive };
      }
      return m;
    }));

    // Đợi newActive được set rồi gọi API
    // (dùng functional form nên newActive đã có từ map trên)
    setTimeout(async () => {
      try {
        await fetch(`${API_URL}/api/models/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active: newActive }),
        });
      } catch { /* ignore */ }
    }, 0);
  }, []);

  // ── Active boss ──────────────────────────────────────────────
  const setActiveBoss = useCallback((id) => {
    setActiveBossIdState(id);
    ls.set("activeBossId", id);
  }, []);

  // ── Refresh từ server ────────────────────────────────────────
  const refreshModels = useCallback(() => {
    fetch(`${API_URL}/api/models`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) { setModels(data); ls.set("modelsCache", data); } })
      .catch(() => {});
  }, []);

  return (
    <ModelContext.Provider
      value={{
        loading,
        models,
        allShipModels,
        allBossModels,
        shipModels,
        activeBossModel,
        activeBossId,
        giftModelMap,
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
