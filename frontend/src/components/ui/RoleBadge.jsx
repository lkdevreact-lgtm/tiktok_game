/** RoleBadge — hiển thị badge SHIP / BOSS */
export default function RoleBadge({ role }) {
  const isShip = role === "ship";
  return (
    <span
      style={{
        fontSize: "0.52rem",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        fontFamily: "var(--font-game)",
        fontWeight: 700,
        padding: "2px 7px",
        borderRadius: 4,
        color: isShip ? "#00f5ff" : "#ff4466",
        background: isShip ? "rgba(0,245,255,0.1)" : "rgba(255,0,66,0.12)",
        border: `1px solid ${isShip ? "rgba(0,245,255,0.3)" : "rgba(255,0,66,0.3)"}`,
      }}
    >
      {isShip ? "SHIP" : "BOSS"}
    </span>
  );
}
