import { createContext, useState, useCallback } from "react";

const PanelSettingsContext = createContext(null);
export { PanelSettingsContext };

const LS_KEY = "panelDisplaySettings";

const DEFAULTS = {
  showBossGiftPanel: true,
  showShipGiftPanel: true,
  showTopDonorsPanel: true,
};

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY));
    if (saved && typeof saved === "object") return { ...DEFAULTS, ...saved };
  } catch {
    /* ignore */
  }
  return { ...DEFAULTS };
}

export function PanelSettingsProvider({ children }) {
  const [settings, setSettings] = useState(loadSettings);

  const togglePanel = useCallback((key) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <PanelSettingsContext.Provider value={{ settings, togglePanel }}>
      {children}
    </PanelSettingsContext.Provider>
  );
}
