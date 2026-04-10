import { useContext } from "react";
import { TTSContext } from "../store/ttsContext";

export function useTTS() {
  const ctx = useContext(TTSContext);
  if (!ctx) throw new Error("useTTS must be used within TTSProvider");
  return ctx;
}
