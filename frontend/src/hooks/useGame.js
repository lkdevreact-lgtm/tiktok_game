// Hook — tách riêng để Vite Fast Refresh không warning
import { useContext } from "react";
import { GameContext } from "../store/gameStore";

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
