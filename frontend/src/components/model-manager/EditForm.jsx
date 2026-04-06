import { useGifts } from "../../hooks/useGifts";
import {
  inputStyle,
  labelStyle,
  FIRE_RATE_OPTIONS,
  DAMAGE_OPTIONS,
} from "../ui/styles";

function GiftCheckboxList({ selected = [], activeGifts = [], onChange }) {
  if (activeGifts.length === 0) {
    return (
      <div className="text-xs text-[#B4C8FF4D] italic">
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
            className={`flex items-center gap-2 cursor-pointer px-[6px] py-[4px] rounded-[6px] transition-all duration-150 ${
              checked
                ? "bg-[#00F5FF14] border border-[#00F5FF40]"
                : "bg-[#FFFFFF05] border border-[#FFFFFF0F]"
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(gift.giftId)}
              className="text-cyan-1 w-3.5 h-3.5 shrink-0"
            />
            {gift.image ? (
              <img
                src={gift.image}
                alt={gift.giftName}
                className="w-5 h-5 rounded-sm object-contain shrink-0"
              />
            ) : (
              <span className="text-base leading-0.5 shrink-0">🎁</span>
            )}
            <span
              className={`text-[0.7rem] flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap ${
                checked ? "text-[#e0e8ff]" : "text-[#B4C8FF80]"
              }`}
            >
              {gift.giftName}
            </span>
            <span className="text-[0.6rem] text-gold shrink-0">
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
    <div className="p-3 bg-[#0000004D] rounded-lg border border-[#00F5FF1F] flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-2.5">
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Display Name</label>
          <input
            style={inputStyle}
            value={local.label}
            onChange={(e) => setLocal((p) => ({ ...p, label: e.target.value }))}
          />
        </div>

        <div>
          <label style={labelStyle}>Scale</label>
          <input
            type="number"
            step="0.01"
            min="0.001"
            max="20"
            style={inputStyle}
            value={local.scale}
            onChange={(e) => setLocal((p) => ({ ...p, scale: e.target.value }))}
          />
        </div>

        <div>
          <label style={labelStyle}>Gun Tip Offset</label>
          <input
            type="number"
            step="0.05"
            min="-5"
            max="10"
            style={inputStyle}
            value={local.gunTipOffset}
            onChange={(e) =>
              setLocal((p) => ({ ...p, gunTipOffset: e.target.value }))
            }
          />
        </div>

        <div>
          <label style={labelStyle}>Rotation Y (°)</label>
          <input
            type="number"
            step="5"
            min="-360"
            max="360"
            style={inputStyle}
            value={local.rotationY}
            onChange={(e) =>
              setLocal((p) => ({ ...p, rotationY: e.target.value }))
            }
          />
        </div>

        <div>
          <label style={labelStyle}>Bullet Color</label>
          <div className="flex gap-1.5 items-center">
            <input
              type="color"
              value={local.bulletColor}
              onChange={(e) =>
                setLocal((p) => ({ ...p, bulletColor: e.target.value }))
              }
              className="w-[34px] h-[28px] border-0 rounded-[5px] cursor-pointer bg-transparent p-0 shrink-0"
            />
            <input
              style={{ ...inputStyle, flex: 1 }}
              value={local.bulletColor}
              onChange={(e) =>
                setLocal((p) => ({ ...p, bulletColor: e.target.value }))
              }
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Damage</label>
          <select
            style={{ ...inputStyle, appearance: "none" }}
            value={local.damage}
            onChange={(e) =>
              setLocal((p) => ({ ...p, damage: Number(e.target.value) }))
            }
          >
            {DAMAGE_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Fire Rate</label>
          <select
            style={{ ...inputStyle, appearance: "none" }}
            value={local.fireRate}
            onChange={(e) =>
              setLocal((p) => ({ ...p, fireRate: Number(e.target.value) }))
            }
          >
            {FIRE_RATE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!isBoss && (
        <div>
          <label style={{ ...labelStyle, marginBottom: 6 }}>
            Quà kích hoạt ship này
            {local.gifts?.length > 0 && (
              <span className="ml-1.5 text-cyan-1">
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

      <button
        onClick={onSave}
        className="w-full p-2 rounded-lg border-0 bg-[linear-gradient(135deg,var(--color-cyan),#0088aa)] text-black font-bold text-[0.74rem] cursor-pointer"
      >
        Save Changes
      </button>
    </div>
  );
}
