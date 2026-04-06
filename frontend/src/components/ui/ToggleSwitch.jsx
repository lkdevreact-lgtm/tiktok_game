/** ToggleSwitch — toggle button dạng pill */
export default function ToggleSwitch({ value, onChange, title }) {
  return (
    <button
      onClick={() => onChange(!value)}
      title={title}
      style={{
        width: 36,
        height: 20,
        borderRadius: 10,
        position: "relative",
        flexShrink: 0,
        cursor: "pointer",
        transition: "background 0.2s, border-color 0.2s",
        background: value ? "var(--color-cyan)" : "rgba(255,255,255,0.1)",
        border: `1px solid ${value ? "var(--color-cyan)" : "rgba(255,255,255,0.2)"}`,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: value ? "calc(100% - 18px)" : 2,
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.2s",
          boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
        }}
      />
    </button>
  );
}
