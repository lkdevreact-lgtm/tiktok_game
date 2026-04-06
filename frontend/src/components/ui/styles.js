/**
 * styles.js — Shared inline styles cho Model Manager components
 */

export const inputStyle = {
  width: "100%",
  borderRadius: 6,
  fontSize: "0.75rem",
  padding: "6px 10px",
  outline: "none",
  color: "#e0e8ff",
  background: "rgba(0,0,0,0.35)",
  border: "1px solid rgba(0,245,255,0.2)",
  boxSizing: "border-box",
};

export const labelStyle = {
  display: "block",
  fontSize: "0.59rem",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: 4,
  color: "rgba(180,200,255,0.5)",
  fontFamily: "var(--font-game)",
};

export const btnBase = {
  borderRadius: 6,
  cursor: "pointer",
  padding: "5px 9px",
  fontSize: "0.68rem",
  lineHeight: 1,
  transition: "background 0.15s",
  flexShrink: 0,
};

export const FIRE_RATE_OPTIONS = [
  { value: 0.3, label: "Slow (0.3)" },
  { value: 0.5, label: "Normal (0.5)" },
  { value: 1.0, label: "Fast (1.0)" },
  { value: 1.5, label: "Rapid (1.5)" },
  { value: 2.0, label: "Turbo (2.0)" },
];

export const DAMAGE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
