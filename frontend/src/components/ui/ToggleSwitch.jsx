export default function ToggleSwitch({ value, onChange, title }) {
  return (
    <button
      onClick={() => onChange(!value)}
      title={title}
      className={`w-9 h-5 rounded-xl relative shrink-0 cursor-pointer transition-colors duration-200 ease-in-out border ${value ? "bg-cyan-1 border-cyan-1" : "bg-[#FFFFFF1A] border-[#FFFFFF1A]"}`}
    >
      <span
        className={`absolute top-0.5 w-[14px] h-[14px] rounded-full bg-white transition-all duration-200 shadow-[0_1px_4px_rgba(0,0,0,0.4)] ${
          value ? "left-[calc(100%-15px)]" : "left-0.5"
        }`}
      />
    </button>
  );
}
