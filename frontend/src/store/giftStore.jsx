import { createContext, useState, useCallback, useEffect } from "react";
import { API_URL } from "../utils/constant";


const GiftContext = createContext(null);
export { GiftContext };

export function GiftProvider({ children }) {
  const [gifts,   setGifts]   = useState([]);
  const [loading, setLoading] = useState(true);

  // Load toàn bộ gifts từ server
  const fetchGifts = useCallback(() => {
    return fetch(`${API_URL}/api/gifts`)
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        // Chỉ dùng gifts có diamonds (quà thật)
        const valid = data
          .filter((g) => g.diamonds)
          .sort((a, b) => (a.diamonds || 0) - (b.diamonds || 0))
          .map((g) => ({ ...g, active: g.active !== false })); // default active = true
        setGifts(valid);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchGifts(); }, [fetchGifts]);

  // activeGifts = gifts có active === true
  const activeGifts = gifts.filter((g) => g.active);

  // Toggle active — optimistic update + persist server
  const toggleGiftActive = useCallback(async (giftId) => {
    let newActive;

    setGifts((prev) =>
      prev.map((g) => {
        if (g.giftId === giftId) {
          newActive = !g.active;
          return { ...g, active: newActive };
        }
        return g;
      })
    );

    try {
      await fetch(`${API_URL}/api/gifts/${giftId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: newActive }),
      });
    } catch { /* ignore offline */ }
  }, []);

  return (
    <GiftContext.Provider value={{ gifts, activeGifts, loading, toggleGiftActive, fetchGifts }}>
      {children}
    </GiftContext.Provider>
  );
}
