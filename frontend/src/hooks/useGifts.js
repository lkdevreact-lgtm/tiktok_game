// Hook — tách riêng để Vite Fast Refresh không warning
import { useContext } from "react";
import { GiftContext } from "../store/giftStore";

export function useGifts() {
  const ctx = useContext(GiftContext);
  if (!ctx) throw new Error("useGifts must be used within GiftProvider");
  return ctx;
}
