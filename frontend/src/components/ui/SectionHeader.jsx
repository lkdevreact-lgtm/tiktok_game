export default function SectionHeader({ icon, label, color, count }) {
  return (
    <div className={`text-xs uppercase tracking-widest ${color} mb-2 flex items-center gap-[6px]`}>
      <span>{icon}</span>
      <span>{label}</span>
      {count != null && <span style={{ opacity: 0.5 }}>({count})</span>}
    </div>
  );
}
