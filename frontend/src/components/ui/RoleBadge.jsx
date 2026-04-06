export default function RoleBadge({ role }) {
  const isShip = role === "ship";
  return (
    <span
      className={`text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-sm border ${isShip ? "text-[#00f5ff] bg-[#00F5FF1A] border-[#00F5FF4D]" : "text-[#ff4466] bg-[#FF00421F] border-[FF00424D]"}`}
    >
      {isShip ? "SHIP" : "BOSS"}
    </span>
  );
}
