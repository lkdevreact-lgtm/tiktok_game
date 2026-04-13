
import { createContext, useState, useCallback, useEffect, useRef } from "react";
import { API_URL } from "../utils/constant";


const ls = {
  get: (key, fb) => { try { return JSON.parse(localStorage.getItem(key)) ?? fb; } catch { return fb; } },
  set: (key, v) => localStorage.setItem(key, JSON.stringify(v)),
};

const ModelContext = createContext(null);
export { ModelContext };

export function ModelProvider({ children }) {
  const [models,  setModels]  = useState(() => ls.get("modelsCache", []));
  const [loading, setLoading] = useState(true);
  const [connectedUsername, setConnectedUsername] = useState(null);
  const saveTimerRef = useRef(null);
  const connectedUsernameRef = useRef(null);

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

  // ── Triggers state ─────────────────────────────────────────────
  const [triggers, setTriggers] = useState(() => ls.get("triggersCache", []));

  useEffect(() => {
    fetch(`${API_URL}/api/triggers`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Backfill modelId from shipId for legacy triggers
          const migrated = data.map((t) => ({
            ...t,
            modelId: t.modelId || t.shipId || null,
          }));
          setTriggers(migrated);
          ls.set("triggersCache", migrated);
        }
      })
      .catch(() => { /* giữ cache */ });
  }, []);

  // ── Helper cập nhật local state + cache ─────────────────────
  const _setAndCache = (updater) => {
    setModels((prev) => {
      const next = updater(prev);
      ls.set("modelsCache", next);
      return next;
    });
  };

  // ── Auto-save helper (uses ref so it can be called from useCallback) ──
  const _autoSaveSettings = () => {
    const uname = connectedUsernameRef.current;
    if (!uname) return;

    const currentModels = ls.get("modelsCache", []);
    const modelStates = {};
    currentModels.forEach((m) => {
      modelStates[m.id] = { active: m.active };
    });

    const payload = {
      activeBossId: ls.get("activeBossId", null),
      triggers: ls.get("triggersCache", []),
      modelStates,
    };

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      fetch(`${API_URL}/api/user-settings/${encodeURIComponent(uname)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {});
    }, 2000);
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

  // Boss heal/shield gift maps: { [giftId]: true }
  const bossHealGiftMap = {};
  (activeBossModel?.healGifts || []).forEach((id) => {
    bossHealGiftMap[String(id)] = true;
  });
  const bossShieldGiftMap = {};
  (activeBossModel?.shieldGifts || []).forEach((id) => {
    bossShieldGiftMap[String(id)] = true;
  });

  const bossLaserGiftMap = {};
  (activeBossModel?.laserGifts || []).forEach((id) => {
    bossLaserGiftMap[String(id)] = true;
  });

  const bossMissileGiftMap = {};
  (activeBossModel?.missileGifts || []).forEach((id) => {
    bossMissileGiftMap[String(id)] = true;
  });

  const bossNuclearGiftMap = {};
  (activeBossModel?.nuclearGifts || []).forEach((id) => {
    bossNuclearGiftMap[String(id)] = true;
  });

  // ── Gift usage map: { [giftId]: "Model Label (role)" } ─────
  // Dùng để hiển thị trong GiftSelect quà nào đã được gán model nào
  const giftUsageMap = {};
  const GIFT_FIELDS = [
    { field: "gifts",        suffix: "" },
    { field: "healGifts",    suffix: " (Heal)" },
    { field: "shieldGifts",  suffix: " (Shield)" },
    { field: "laserGifts",   suffix: " (Laser)" },
    { field: "missileGifts", suffix: " (Missile)" },
    { field: "nuclearGifts", suffix: " (Nuclear)" },
  ];
  models.forEach((m) => {
    GIFT_FIELDS.forEach(({ field, suffix }) => {
      (m[field] || []).forEach((giftId) => {
        giftUsageMap[String(giftId)] = `${m.label || m.id}${suffix}`;
      });
    });
  });

  // ── Trigger maps (computed from triggers array) ────────────────
  // Ship comment trigger: { [code]: { shipId, model } }
  const commentTriggerMap = {};
  // Ship tap trigger: [{ quantity, shipId, model }]
  const tapTriggers = [];
  // Boss comment trigger: { [code]: bossSkill string }
  const commentBossTriggerMap = {};
  // Boss tap trigger: [{ quantity, bossSkill }]
  const tapBossTriggers = [];

  const allModelsById = {};
  models.forEach((m) => { allModelsById[m.id] = m; });

  triggers.forEach((t) => {
    const isBoss = t.target === "boss";

    if (isBoss) {
      // Boss skill trigger
      const skill = t.bossSkill;
      if (!skill) return;
      if (t.type === "comment" && t.content) {
        commentBossTriggerMap[t.content.trim()] = skill;
      } else if (t.type === "tap" && t.quantity > 0) {
        tapBossTriggers.push({ quantity: t.quantity, bossSkill: skill });
      }
    } else {
      // Ship trigger (legacy + new)
      const resolvedId = t.modelId || t.shipId;
      const model = allModelsById[resolvedId];
      if (!model) return;
      if (t.type === "comment" && t.content) {
        commentTriggerMap[t.content.trim()] = { shipId: resolvedId, model };
      } else if (t.type === "tap" && t.quantity > 0) {
        tapTriggers.push({ quantity: t.quantity, shipId: resolvedId, model });
      }
    }
  });

  // ── Save triggers → PUT API + local ────────────────────────────
  const saveTriggersFn = useCallback(async (newTriggers) => {
    setTriggers(newTriggers);
    ls.set("triggersCache", newTriggers);
    try {
      await fetch(`${API_URL}/api/triggers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTriggers),
      });
    } catch { /* ignore offline */ }
    // Auto-save user settings
    setTimeout(() => _autoSaveSettings(), 100);
  }, []);

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
    // Đọc giá trị active hiện tại từ models trước khi update
    setModels((prev) => {
      const target = prev.find((m) => m.id === id);
      if (!target) return prev;

      const newActive = !target.active;
      const next = prev.map((m) => (m.id === id ? { ...m, active: newActive } : m));
      ls.set("modelsCache", next);

      // Persist server bên trong setState để đảm bảo newActive đúng
      fetch(`${API_URL}/api/models/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: newActive }),
      }).catch(() => {});

      return next;
    });
    // Auto-save user settings
    setTimeout(() => _autoSaveSettings(), 100);
  }, []);

  // ── Active boss ──────────────────────────────────────────────
  const setActiveBoss = useCallback((id) => {
    setActiveBossIdState(id);
    ls.set("activeBossId", id);
    // Auto-save user settings
    setTimeout(() => _autoSaveSettings(), 100);
  }, []);

  // ── Refresh từ server ────────────────────────────────────────
  const refreshModels = useCallback(() => {
    fetch(`${API_URL}/api/models`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) { setModels(data); ls.set("modelsCache", data); } })
      .catch(() => {});
  }, []);

  // ── Load user settings (from connect response) ──────────────
  const loadUserSettings = useCallback((settings, username) => {
    setConnectedUsername(username);
    connectedUsernameRef.current = username;
    if (!settings) return;

    // Apply active boss
    if (settings.activeBossId) {
      setActiveBossIdState(settings.activeBossId);
      ls.set("activeBossId", settings.activeBossId);
    }

    // Apply triggers
    if (Array.isArray(settings.triggers) && settings.triggers.length > 0) {
      setTriggers(settings.triggers);
      ls.set("triggersCache", settings.triggers);
    }

    // Apply model active states
    if (settings.modelStates && Object.keys(settings.modelStates).length > 0) {
      setModels((prev) => {
        const next = prev.map((m) => {
          if (settings.modelStates[m.id] !== undefined) {
            return { ...m, active: settings.modelStates[m.id].active };
          }
          return m;
        });
        ls.set("modelsCache", next);
        return next;
      });
    }
  }, []);

  // ── Save user settings (public, debounced) ──────────────────
  const saveUserSettings = useCallback((username) => {
    if (username) connectedUsernameRef.current = username;
    _autoSaveSettings();
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
        giftUsageMap,
        commentTriggerMap,
        tapTriggers,
        commentBossTriggerMap,
        tapBossTriggers,
        triggers,
        saveTriggers: saveTriggersFn,
        bossHealGiftMap,
        bossShieldGiftMap,
        bossLaserGiftMap,
        bossMissileGiftMap,
        bossNuclearGiftMap,
        addModel,
        updateModel,
        removeModel,
        toggleShipActive,
        setActiveBoss,
        refreshModels,
        loadUserSettings,
        saveUserSettings,
        connectedUsername,
      }}
    >
      {children}
    </ModelContext.Provider>
  );
}
