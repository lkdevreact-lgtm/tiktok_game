import { createContext, useContext, useState, useCallback, useRef } from "react";

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [connected,     setConnected]    = useState(false);
  const [username,      setUsername]     = useState("");
  const [bossHp,        setBossHp]       = useState(100);
  const [gameStatus,    setGameStatus]   = useState("idle"); // idle | playing | win | lose
  const [shipCount,     setShipCount]    = useState(0);
  const [notifications, setNotifications] = useState([]);
  const notifId = useRef(0);

  const addNotification = useCallback((data) => {
    const id = ++notifId.current;
    setNotifications((prev) => [...prev.slice(-4), { id, ...data }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
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
        username,  setUsername,
        bossHp,    setBossHp,
        gameStatus, setGameStatus,
        shipCount,  setShipCount,
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
