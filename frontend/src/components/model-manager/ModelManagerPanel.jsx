import { useEffect } from "react";
import { useModels } from "../../store/modelStore";
import { useGifts } from "../../store/giftStore";
import { btnBase } from "../ui/styles";
import RoleBadge from "../ui/RoleBadge";
import SectionHeader from "../ui/SectionHeader";
import ModelCard from "./ModelCard";
import UploadForm from "./UploadForm";

export default function ModelManagerPanel({ isOpen, onClose }) {
  const {
    allShipModels,
    allBossModels,
    activeBossId,
    addModel,
    updateModel,
    removeModel,
    toggleShipActive,
    setActiveBoss,
    loading,
  } = useModels();

  const { activeGifts } = useGifts();

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const ships = allShipModels;
  const bosses = allBossModels;

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-[#0000008C] backdrop-blur-xs z-10 ${isOpen ? "opacity-100" : "opacity-0"} transition-opacity duration-300 ease-in-out`}
      />

      <aside
        className={`fixed top-0 right-0 bottom-0 w-[390px] flex flex-col bg-[#040A1CF7] border-l-[#6478FF33] backdrop-blur-xl z-[100] transform transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
 ${isOpen ? "translate-x-0 shadow-[-8px_0_40px_rgba(0,0,0,0.6)]" : "translate-x-full shadow-none"}`}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "15px 18px",
            borderBottom: "1px solid rgba(100,120,255,0.15)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "1rem" }}>🚀</span>
            <span
              style={{
                fontSize: "0.68rem",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "#a78bfa",
                fontFamily: "var(--font-game)",
              }}
            >
              Model Manager
            </span>
          </div>
          <div
            style={{
              display: "flex",
              gap: 6,
              alignItems: "center",
              fontSize: "0.6rem",
              color: "rgba(180,200,255,0.4)",
            }}
          >
            <RoleBadge role="ship" />
            <span>{ships.length}</span>
            <RoleBadge role="boss" />
            <span>{bosses.length}</span>
            <button
              onClick={onClose}
              style={{
                ...btnBase,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(200,220,255,0.7)",
                marginLeft: 4,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "14px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          {loading && (
            <div
              style={{
                textAlign: "center",
                color: "rgba(180,200,255,0.4)",
                fontSize: "0.75rem",
                padding: "20px 0",
              }}
            >
              ⏳ Đang tải models từ server...
            </div>
          )}

          {ships.length > 0 && (
            <section>
              <SectionHeader
                icon="✦"
                label="Ships"
                color="text-[#00F5FFA6]"
                count={ships.length}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {ships.map((m) => (
                  <ModelCard
                    key={m.id}
                    model={m}
                    activeGifts={activeGifts}
                    onUpdate={(id, changes) => updateModel(id, changes)}
                    onDelete={!m.builtIn ? (id) => removeModel(id) : undefined}
                    onToggleShip={toggleShipActive}
                  />
                ))}
              </div>
            </section>
          )}

          {bosses.length > 0 && (
            <section>
              <SectionHeader
                icon="☠"
                label="Boss"
                color="text-[#FF5064B3]"
                count={bosses.length}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {bosses.map((m) => (
                  <ModelCard
                    key={m.id}
                    model={m}
                    isActiveBoss={m.id === activeBossId}
                    activeGifts={[]}
                    onUpdate={(id, changes) => updateModel(id, changes)}
                    onDelete={!m.builtIn ? (id) => removeModel(id) : undefined}
                    onSetActiveBoss={setActiveBoss}
                  />
                ))}
              </div>
            </section>
          )}

          <section>
            <UploadForm onSuccess={addModel} activeGifts={activeGifts} />
          </section>
        </div>
      </aside>
    </>
  );
}
