import { useGifts } from "../../hooks/useGifts";
import { FIRE_RATE_OPTIONS, DAMAGE_OPTIONS } from "../ui/styles";

const inputCls = "w-full rounded-lg px-2.5 py-1.5 text-[0.72rem] bg-black/30 border border-white/10 text-[#e0e8ff] outline-none focus:border-cyan-400/50 transition-colors";
const labelCls = "block text-[0.62rem] uppercase tracking-widest text-white/40 mb-1";

function GiftCheckboxList({ selected = [], activeGifts = [], onChange, accentColor = "#00f5ff" }) {
  if (activeGifts.length === 0) {
    return (
      <div className="text-xs text-white/30 italic">
        Chưa có quà active. Bật quà trong Gift Config.
      </div>
    );
  }

  const toggle = (giftId) => {
    const numId = Number(giftId);
    const next = selected.includes(numId)
      ? selected.filter((x) => x !== numId)
      : [...selected, numId];
    onChange(next);
  };

  return (
    <div className="max-h-[140px] overflow-y-auto flex flex-col gap-1 pr-1">
      {activeGifts.map((gift) => {
        const checked = selected.includes(Number(gift.giftId));
        return (
          <label
            key={gift.giftId}
            className={`
              flex items-center gap-2 cursor-pointer px-1.5 py-1 rounded-md border transition-all duration-150
              ${checked
                ? "bg-[rgba(0,245,255,0.08)] border-[rgba(0,245,255,0.25)]"
                : "bg-white/[0.02] border-white/[0.06]"
              }
            `}
            style={checked ? { background: `${accentColor}14`, borderColor: `${accentColor}40` } : undefined}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(gift.giftId)}
              className="w-3.5 h-3.5 shrink-0"
              style={{ accentColor }}
            />
            {gift.image
              ? <img src={gift.image} alt={gift.giftName} className="w-5 h-5 rounded-sm object-contain shrink-0" />
              : <span className="text-base shrink-0">🎁</span>
            }
            <span className={`text-[0.7rem] flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap ${checked ? "text-[#e0e8ff]" : "text-white/50"}`}>
              {gift.giftName}
            </span>
            <span className="text-[0.6rem] text-[var(--color-gold)] shrink-0">
              💎{gift.diamonds}
            </span>
          </label>
        );
      })}
    </div>
  );
}

export default function EditForm({ local, setLocal, onSave, isBoss = false }) {
  const { activeGifts } = useGifts();

  return (
    <div className="p-3 bg-black/30 rounded-lg border border-[rgba(0,245,255,0.12)] flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-2.5">

        {/* Label - full width */}
        <div className="col-span-2">
          <label className={labelCls}>Display Name</label>
          <input
            className={inputCls}
            value={local.label}
            onChange={(e) => setLocal((p) => ({ ...p, label: e.target.value }))}
          />
        </div>

        <div>
          <label className={labelCls}>Scale</label>
          <input type="number" step="0.01" min="0.001" max="20"
            className={inputCls} value={local.scale}
            onChange={(e) => setLocal((p) => ({ ...p, scale: e.target.value }))} />
        </div>

        <div>
          <label className={labelCls}>Gun Tip Offset</label>
          <input type="number" step="0.05" min="-5" max="10"
            className={inputCls} value={local.gunTipOffset}
            onChange={(e) => setLocal((p) => ({ ...p, gunTipOffset: e.target.value }))} />
        </div>

        <div>
          <label className={labelCls}>Rotation Y (°)</label>
          <input type="number" step="5" min="-360" max="360"
            className={inputCls} value={local.rotationY}
            onChange={(e) => setLocal((p) => ({ ...p, rotationY: e.target.value }))} />
        </div>

        <div>
          <label className={labelCls}>Bullet Color</label>
          <div className="flex gap-1.5 items-center">
            <input type="color" value={local.bulletColor}
              onChange={(e) => setLocal((p) => ({ ...p, bulletColor: e.target.value }))}
              className="w-[34px] h-[28px] border-0 rounded cursor-pointer bg-transparent p-0 shrink-0" />
            <input className={`${inputCls} flex-1`} value={local.bulletColor}
              onChange={(e) => setLocal((p) => ({ ...p, bulletColor: e.target.value }))} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Damage</label>
          <select className={inputCls} value={local.damage}
            onChange={(e) => setLocal((p) => ({ ...p, damage: Number(e.target.value) }))}>
            {DAMAGE_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div>
          <label className={labelCls}>Fire Rate</label>
          <select className={inputCls} value={local.fireRate}
            onChange={(e) => setLocal((p) => ({ ...p, fireRate: Number(e.target.value) }))}>
            {FIRE_RATE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Ship gifts */}
      {!isBoss && (
        <div>
          <label className={`${labelCls} mb-1.5`}>
            Quà kích hoạt ship này
            {local.gifts?.length > 0 && (
              <span className="ml-1.5 text-cyan-400 normal-case tracking-normal font-normal">
                ({local.gifts.length} đã chọn)
              </span>
            )}
          </label>
          <GiftCheckboxList
            selected={local.gifts || []}
            activeGifts={activeGifts}
            onChange={(next) => setLocal((p) => ({ ...p, gifts: next }))}
          />
        </div>
      )}

      {/* Boss gifts */}
      {isBoss && (
        <>
          <div>
            <label className={`${labelCls} mb-1.5 text-green-400`}>
              💚 Quà hồi máu boss
              {local.healGifts?.length > 0 && (
                <span className="ml-1.5 text-green-400/80 font-normal normal-case tracking-normal">
                  ({local.healGifts.length} đã chọn)
                </span>
              )}
            </label>
            <GiftCheckboxList
              selected={local.healGifts || []}
              activeGifts={activeGifts}
              onChange={(next) => setLocal((p) => ({ ...p, healGifts: next }))}
              accentColor="#4ade80"
            />
          </div>

          <div>
            <label className={`${labelCls} mb-1.5 text-cyan-400`}>
              🛡️ Quà tạo khiên boss
              {local.shieldGifts?.length > 0 && (
                <span className="ml-1.5 text-cyan-400/80 font-normal normal-case tracking-normal">
                  ({local.shieldGifts.length} đã chọn)
                </span>
              )}
            </label>
            <GiftCheckboxList
              selected={local.shieldGifts || []}
              activeGifts={activeGifts}
              onChange={(next) => setLocal((p) => ({ ...p, shieldGifts: next }))}
              accentColor="#00f5ff"
            />
          </div>
        </>
      )}

      <button
        onClick={onSave}
        className="w-full py-2 rounded-lg border-0 bg-gradient-to-r from-[var(--color-cyan)] to-[#0088aa] text-black font-bold text-[0.74rem] cursor-pointer hover:brightness-110 transition-all"
      >
        Save Changes
      </button>
    </div>
  );
}
