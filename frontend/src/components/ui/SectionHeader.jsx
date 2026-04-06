/** SectionHeader — tiêu đề section trong panel */
export default function SectionHeader({ icon, label, color, count }) {
  return (
    <div
      style={{
        fontSize: "0.6rem",
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        color,
        marginBottom: 8,
        fontFamily: "var(--font-game)",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
      {count != null && <span style={{ opacity: 0.5 }}>({count})</span>}
    </div>
  );
}
