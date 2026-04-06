/**
 * ModelManagerPanel.jsx — Main panel
 * Quản lý models: Ships & Bosses
 * - Active/inactive ship → persist vào models.json qua API
 * - Edit thông số (scale, rotationY, bulletColor, damage, fireRate, gifts[])
 * - Upload GLB mới
 * - Xóa custom models
 */
import { useState, useEffect } from "react";
import { useModels } from "../../store/modelStore";
import { btnBase } from "../ui/styles";
import RoleBadge from "../ui/RoleBadge";
import SectionHeader from "../ui/SectionHeader";
import ModelCard from "./ModelCard";
import UploadForm from "./UploadForm";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8888";

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

  // activeGifts: danh sách quà đang active (để pass vào EditForm & UploadForm)
  const [activeGifts, setActiveGifts] = useState([]);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/gifts`)
      .then((r) => r.json())
      .then((data) => {
        const active = data.filter((g) => g.diamonds && g.active !== false);
        active.sort((a, b) => (a.diamonds || 0) - (b.diamonds || 0));
        setActiveGifts(active);
      })
      .catch(() => {});
  }, []);

  // Re-fetch khi panel mở (để đồng bộ khi user đổi active ở Gift Config)
  useEffect(() => {
    if (!isOpen) return;
    fetch(`${BACKEND_URL}/api/gifts`)
      .then((r) => r.json())
      .then((data) => {
        const active = data.filter((g) => g.diamonds && g.active !== false);
        active.sort((a, b) => (a.diamonds || 0) - (b.diamonds || 0));
        setActiveGifts(active);
      })
      .catch(() => {});
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const ships  = allShipModels;
  const bosses = allBossModels;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-[#0000008C] backdrop-blur-xs z-10 ${isOpen ? "opacity-100" : "opacity-0"} transition-opacity duration-300 ease-in-out`}
      />

      {/* Panel */}
      <aside
        className={`fixed top-0 right-0 bottom-0 w-[390px] flex flex-col bg-[#040A1CF7] border-l-[#6478FF33] backdrop-blur-xl z-[100] transform transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
 ${isOpen ? "translate-x-0 shadow-[-8px_0_40px_rgba(0,0,0,0.6)]" : "translate-x-full shadow-none"}`}
      >
        {/* Header */}
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
            <span style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "#a78bfa", fontFamily: "var(--font-game)" }}>
              Model Manager
            </span>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: "0.6rem", color: "rgba(180,200,255,0.4)" }}>
            <RoleBadge role="ship" />
            <span>{ships.length}</span>
            <RoleBadge role="boss" />
            <span>{bosses.length}</span>
            <button
              onClick={onClose}
              style={{ ...btnBase, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(200,220,255,0.7)", marginLeft: 4 }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: 18 }}>
          {loading && (
            <div style={{ textAlign: "center", color: "rgba(180,200,255,0.4)", fontSize: "0.75rem", padding: "20px 0" }}>
              ⏳ Đang tải models từ server...
            </div>
          )}

          {/* ── Ships ── */}
          {ships.length > 0 && (
            <section>
              <SectionHeader icon="✦" label="Ships" color="rgba(0,245,255,0.65)" count={ships.length} />
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

          {/* ── Bosses ── */}
          {bosses.length > 0 && (
            <section>
              <SectionHeader icon="☠" label="Boss" color="rgba(255,80,100,0.7)" count={bosses.length} />
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

          {/* ── Upload ── */}
          <section>
            <UploadForm onSuccess={addModel} activeGifts={activeGifts} />
          </section>
        </div>
      </aside>
    </>
  );
}
