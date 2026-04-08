import { createContext, useState, useCallback, useRef } from "react";

const GameContext = createContext(null);
export { GameContext };

export function GameProvider({ children }) {
  const [connected,     setConnected]    = useState(false);
  const [username,      setUsername]     = useState("");
  const [bossHp,        setBossHp]       = useState(100);
  const [bossShield,    setBossShield]   = useState(false);
  const [gameStatus,    setGameStatus]   = useState("idle");
  const [shipCount,     setShipCount]    = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [wins,          setWins]          = useState(0);
  const [losses,        setLosses]        = useState(0);
  const notifId = useRef(0);
  const gameStatusRef = useRef("idle");

  // Keep a ref in-sync so resetGame can read the latest status synchronously
  const handleSetGameStatus = useCallback((status) => {
    gameStatusRef.current = status;
    setGameStatus(status);
  }, []);

  const addNotification = useCallback((data) => {
    const id = ++notifId.current;
    setNotifications((prev) => [...prev.slice(-4), { id, ...data }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  }, []);

  const resetGame = useCallback(() => {
    // Tally result before reset
    if (gameStatusRef.current === "win")  setWins((w) => w + 1);
    if (gameStatusRef.current === "lose") setLosses((l) => l + 1);
    setBossHp(100);
    gameStatusRef.current = "playing";
    setGameStatus("playing");
    setShipCount(0);
  }, []);

  return (
    <GameContext.Provider
      value={{
        connected, setConnected,
        username,  setUsername,
        bossHp,    setBossHp,
        bossShield, setBossShield,
        gameStatus, setGameStatus: handleSetGameStatus,
        shipCount,  setShipCount,
        notifications, addNotification,
        resetGame,
        wins, losses,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
