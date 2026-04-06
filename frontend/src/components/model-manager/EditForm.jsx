import {
  inputStyle,
  labelStyle,
  btnBase,
  FIRE_RATE_OPTIONS,
  DAMAGE_OPTIONS,
} from "../ui/styles";

function GiftCheckboxList({ selected = [], activeGifts = [], onChange }) {
  if (activeGifts.length === 0) {
    return (
      <div
        style={{
          fontSize: "0.65rem",
          color: "rgba(180,200,255,0.3)",
          fontStyle: "italic",
        }}
      >
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
    <div
      style={{
        maxHeight: 140,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        paddingRight: 4,
      }}
    >
      {activeGifts.map((gift) => {
        const checked = selected.includes(Number(gift.giftId));
        return (
          <label
            key={gift.giftId}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              padding: "4px 6px",
              borderRadius: 6,
              background: checked
                ? "rgba(0,245,255,0.08)"
                : "rgba(255,255,255,0.02)",
              border: `1px solid ${checked ? "rgba(0,245,255,0.25)" : "rgba(255,255,255,0.06)"}`,
              transition: "all 0.15s",
            }}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(gift.giftId)}
              style={{
                accentColor: "var(--color-cyan)",
                width: 13,
                height: 13,
                flexShrink: 0,
              }}
            />
            {gift.image ? (
              <img
                src={gift.image}
                alt={gift.giftName}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  objectFit: "contain",
                  flexShrink: 0,
                }}
              />
            ) : (
              <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>
                🎁
              </span>
            )}
            <span
              style={{
                fontSize: "0.7rem",
                color: checked ? "#e0e8ff" : "rgba(180,200,255,0.5)",
                flex: 1,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {gift.giftName}
            </span>
            <span
              style={{
                fontSize: "0.6rem",
                color: "var(--color-gold)",
                flexShrink: 0,
              }}
            >
              💎{gift.diamonds}
            </span>
          </label>
        );
      })}
    </div>
  );
}

export default function EditForm({
  local,
  setLocal,
  onSave,
  activeGifts = [],
  isBoss = false,
}) {
  return (
    <div
      style={{
        padding: "12px",
        background: "rgba(0,0,0,0.3)",
        borderRadius: 8,
        border: "1px solid rgba(0,245,255,0.12)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
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
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              type="color"
              value={local.bulletColor}
              onChange={(e) =>
                setLocal((p) => ({ ...p, bulletColor: e.target.value }))
              }
              style={{
                width: 34,
                height: 28,
                border: "none",
                borderRadius: 5,
                cursor: "pointer",
                background: "transparent",
                padding: 0,
                flexShrink: 0,
              }}
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
              <span
                style={{
                  marginLeft: 6,
                  color: "var(--color-cyan)",
                  fontFamily: "inherit",
                }}
              >
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
        style={{
          width: "100%",
          padding: "8px",
          borderRadius: 8,
          border: "none",
          background: "linear-gradient(135deg, var(--color-cyan), #0088aa)",
          color: "#000",
          fontWeight: 700,
          fontSize: "0.74rem",
          cursor: "pointer",
          fontFamily: "var(--font-game)",
        }}
      >
        💾 Save Changes
      </button>
    </div>
  );
}
