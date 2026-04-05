/**
 * modelStore.jsx
 * Quản lý toàn bộ models (built-in + custom).
 *
 * Mỗi model có:
 *  - role: "ship" | "boss"
 *  - active:
 *      ship  → có hiện trong dropdown gift config không
 *      boss  → có đang được render trong game không (chỉ 1 active tại một thời điểm)
 *
 * Persist vào localStorage.
 */
import { createContext, useContext, useState, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════
// Built-in defaults
// ═══════════════════════════════════════════════════════════════
export const BUILTIN_MODELS = [
  {
    id: "spaceship_1",
    label: "Fighter",
    emoji: "🔵",
    role: "ship",
    path: "/models/spaceship_1.glb",
    scale: 0.25,
    gunTipOffset: 0.1,
    rotationY: 45,
    bulletColor: "#00f5ff",
    builtIn: true,
  },
  {
    id: "spaceship_2",
    label: "Cruiser",
    emoji: "🟣",
    role: "ship",
    path: "/models/spaceship_2.glb",
    scale: 0.35,
    gunTipOffset: 0.4,
    rotationY: 35,
    bulletColor: "#bf00ff",
    builtIn: true,
  },
  {
    id: "spaceship_3",
    label: "Destroyer",
    emoji: "🟡",
    role: "ship",
    path: "/models/spaceship_3.glb",
    scale: 0.05,
    gunTipOffset: 0.5,
    rotationY: 40,
    bulletColor: "#ffaa00",
    builtIn: true,
  },
  {
    id: "spaceship_boss",
    label: "Boss (Default)",
    emoji: "💀",
    role: "boss",
    path: "/models/spaceship_boss.glb",
    scale: 4.5,
    gunTipOffset: 0,
    rotationY: 90,
    bulletColor: "#ff0044",
    builtIn: true,
  },
];

// ═══════════════════════════════════════════════════════════════
// localStorage helpers
// ═══════════════════════════════════════════════════════════════
const ls = {
  get: (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
};

// ═══════════════════════════════════════════════════════════════
// Context
// ═══════════════════════════════════════════════════════════════
const ModelContext = createContext(null);

export function ModelProvider({ children }) {
  // Custom models list (ship + boss)
  const [customModels, setCustomModels] = useState(() => ls.get("customModels", []));

  // Built-in parameter overrides: { [id]: { scale, gunTipOffset, ... } }
  const [builtinOverrides, setBuiltinOverrides] = useState(() => ls.get("builtinOverrides", {}));

  // Ship active state: { [id]: boolean } — default true
  const [shipActive, setShipActive] = useState(() => ls.get("shipActive", {}));

  // Active boss id
  const [activeBossId, setActiveBossIdState] = useState(
    () => ls.get("activeBossId", null) ?? "spaceship_boss"
  );

  // ── Computed ─────────────────────────────────────────────────

  // Built-in with overrides merged
  const builtinModels = BUILTIN_MODELS.map((m) =>
    builtinOverrides[m.id] ? { ...m, ...builtinOverrides[m.id] } : m
  );

  const allModels = [...builtinModels, ...customModels];

  // Enrich với active field
  const allModelsWithActive = allModels.map((m) => ({
    ...m,
    active: m.role === "boss"
      ? m.id === activeBossId
      : (shipActive[m.id] !== false), // ships default active
  }));

  // Ship models (all) + active ship models (for gift dropdown)
  const allShipModels = allModelsWithActive.filter((m) => m.role === "ship");
  const shipModels    = allShipModels.filter((m) => m.active);

  // All boss models + active boss
  const allBossModels  = allModelsWithActive.filter((m) => m.role === "boss");
  const activeBossModel = allBossModels.find((m) => m.active) ?? allBossModels[0];

  // ── Built-in: update / reset ──────────────────────────────────
  const updateBuiltinModel = useCallback((id, changes) => {
    setBuiltinOverrides((prev) => {
      const next = { ...prev, [id]: { ...(prev[id] ?? {}), ...changes } };
      ls.set("builtinOverrides", next);
      return next;
    });
  }, []);

  const resetBuiltinModel = useCallback((id) => {
    setBuiltinOverrides((prev) => {
      const next = { ...prev };
      delete next[id];
      ls.set("builtinOverrides", next);
      return next;
    });
  }, []);

  const hasOverride = useCallback(
    (id) => !!builtinOverrides[id],
    [builtinOverrides]
  );

  // ── Custom: add / update / remove ────────────────────────────
  const addCustomModel = useCallback((model) => {
    setCustomModels((prev) => {
      const next = [...prev, model];
      ls.set("customModels", next);
      return next;
    });
  }, []);

  const updateCustomModel = useCallback((id, changes) => {
    setCustomModels((prev) => {
      const next = prev.map((m) => (m.id === id ? { ...m, ...changes } : m));
      ls.set("customModels", next);
      return next;
    });
  }, []);

  const removeCustomModel = useCallback((id) => {
    setCustomModels((prev) => {
      const next = prev.filter((m) => m.id !== id);
      ls.set("customModels", next);
      return next;
    });
    // Nếu xóa boss đang active → chuyển về default
    if (id === activeBossId) {
      setActiveBossIdState("spaceship_boss");
      ls.set("activeBossId", "spaceship_boss");
    }
  }, [activeBossId]);

  // ── Active ship toggle ────────────────────────────────────────
  const toggleShipActive = useCallback((id) => {
    setShipActive((prev) => {
      const current = prev[id] !== false; // default true
      const next = { ...prev, [id]: !current };
      ls.set("shipActive", next);
      return next;
    });
  }, []);

  // ── Active boss setter ────────────────────────────────────────
  const setActiveBoss = useCallback((id) => {
    setActiveBossIdState(id);
    ls.set("activeBossId", id);
  }, []);

  // ── getModel ──────────────────────────────────────────────────
  const getModel = useCallback(
    (id) => allModelsWithActive.find((m) => m.id === id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [customModels, builtinOverrides, shipActive, activeBossId]
  );

  return (
    <ModelContext.Provider
      value={{
        // All models (enriched with active)
        allModels: allModelsWithActive,
        allShipModels,
        allBossModels,
        // For gift config dropdown (active ships only)
        shipModels,
        // Raw custom models list (for ModelManager)
        customModels,
        // For game rendering
        activeBossModel,
        activeBossId,
        // CRUD
        updateBuiltinModel,
        resetBuiltinModel,
        hasOverride,
        addCustomModel,
        updateCustomModel,
        removeCustomModel,
        toggleShipActive,
        setActiveBoss,
        getModel,
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
