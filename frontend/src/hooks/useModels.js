// Hook — tách riêng để Vite Fast Refresh không warning
import { useContext } from "react";
import { ModelContext } from "../store/modelStore";

export function useModels() {
  const ctx = useContext(ModelContext);
  if (!ctx) throw new Error("useModels must be used within ModelProvider");
  return ctx;
}
