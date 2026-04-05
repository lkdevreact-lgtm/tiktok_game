import { createContext, useContext, useState, useCallback, useRef } from "react";

const GameContext = createContext(null);

export const SHIP_TYPES = {
  spaceship_1: { label: "Fighter",  color: "#00f5ff", damage: 1, fireRate: 1.0 },
  spaceship_2: { label: "Cruiser",  color: "#bf00ff", damage: 3, fireRate: 0.5 },
  spaceship_3: { label: "Destroyer",color: "#ffaa00", damage: 5, fireRate: 0.3 },
};

// Default gift → spaceship mapping
const DEFAULT_GIFT_MAPPING = {
  5655:  { spaceship: "spaceship_1", damage: 1, fireRate: 1.0, active: true },  // Rose
  7934:  { spaceship: "spaceship_1", damage: 1, fireRate: 1.0, active: true },  // Heart Me
  5487:  { spaceship: "spaceship_1", damage: 1, fireRate: 1.5, active: true },  // Finger Heart
  5658:  { spaceship: "spaceship_2", damage: 3, fireRate: 0.8, active: true },  // Perfume
  5660:  { spaceship: "spaceship_2", damage: 3, fireRate: 1.0, active: true },  // Hand Heart
  5586:  { spaceship: "spaceship_2", damage: 4, fireRate: 1.0, active: true },  // Hearts
  5585:  { spaceship: "spaceship_2", damage: 3, fireRate: 1.0, active: true },  // Confetti
  11046: { spaceship: "spaceship_3", damage: 5, fireRate: 1.5, active: true },  // Galaxy
  6820:  { spaceship: "spaceship_3", damage: 5, fireRate: 2.0, active: true },  // Whale diving
  6089:  { spaceship: "spaceship_3", damage: 5, fireRate: 3.0, active: true },  // Sports Car
};

export function GameProvider({ children }) {
  const [connected, setConnected] = useState(false);
  const [username, setUsername] = useState("");
  const [bossHp, setBossHp] = useState(100);
  const [gameStatus, setGameStatus] = useState("idle"); // idle | playing | win | lose
  const [giftMapping, setGiftMapping] = useState(DEFAULT_GIFT_MAPPING);
  const [shipCount, setShipCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const notifId = useRef(0);

  const addNotification = useCallback((data) => {
    const id = ++notifId.current;
    setNotifications((prev) => [...prev.slice(-4), { id, ...data }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  }, []);

  const updateGiftMapping = useCallback((giftId, config) => {
    setGiftMapping((prev) => ({ ...prev, [giftId]: { ...prev[giftId], ...config } }));
  }, []);

  const resetGame = useCallback(() => {
    setBossHp(100);
    setGameStatus("playing");
    setShipCount(0);
  }, []);

  return (
    <GameContext.Provider
      value={{
        connected, setConnected,
        username, setUsername,
        bossHp, setBossHp,
        gameStatus, setGameStatus,
        giftMapping, setGiftMapping, updateGiftMapping,
        shipCount, setShipCount,
        notifications, addNotification,
        resetGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}

export { DEFAULT_GIFT_MAPPING };
