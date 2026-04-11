import { useContext } from "react";
import { PanelSettingsContext } from "../store/panelSettingsStore";

export function usePanelSettings() {
  return useContext(PanelSettingsContext);
}
