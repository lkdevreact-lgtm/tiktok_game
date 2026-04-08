import { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";
import ModelCard from "./ModelCard";
import UploadForm from "./UploadForm";
import { useModels } from "../../hooks/useModels";
import { useGifts } from "../../hooks/useGifts";

const TABS = [
  { id: "ships", label: "Ship user", color: "#00f5ff" },
  { id: "boss", label: "Boss", color: "#ff4466" },
  { id: "add", label: "Upload Model", color: "#a78bfa" },
];

function ModalContent({
  ships,
  bosses,
  activeBossId,
  addModel,
  updateModel,
  removeModel,
  toggleShipActive,
  setActiveBoss,
  loading,
  activeGifts,
  onClose,
}) {
  const [tab, setTab] = useState("ships");

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="
        flex flex-col
        w-[min(860px,100%)] h-[calc(100vh-40px)] max-h-[820px]
        bg-[radial-gradient(circle_at_20%_20%,#1e1b4b,#020617)] to-[#1e1b4b] rounded-3xl overflow-hidden
        shadow-[0_32px_80px_rgba(0,0,0,0.7)] border border-white/60
      "
    >
      <div className="flex flex-col gap-3 py-2 p-3">
        <div className="flex justify-end">
          <button
            onClick={onClose}
            title="Đóng (Esc)"
            className="
            w-8 h-8 flex items-center justify-center rounded-lg border-0
            bg-white/10 text-white/60 cursor-pointer
            transition-all duration-150
            hover:bg-[rgba(255,51,102,0.4)] hover:text-white
          "
          >
            <IoClose size={18} />
          </button>
        </div>
        <div className="shrink-0 text-center ">
          <h3 className="text-[2rem] font-bold text-white m-0">
            Model Manager
          </h3>
          <p className="text-[0.82rem] text-white/50 mt-1.5">
            Chỉnh sửa và thêm vào model yêu thích của bạn
          </p>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-1.5 px-5 pt-4">
        {TABS.map((t) => {
          const count =
            t.id === "ships"
              ? ships.length
              : t.id === "boss"
                ? bosses.length
                : null;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`
                flex items-center gap-1.5 px-4 py-2 rounded-lg text-[0.78rem] font-medium
                transition-all duration-150 cursor-pointer border-0
                ${active
                  ? "bg-white/15 text-white font-bold"
                  : "bg-transparent text-white/45 hover:text-white/70"
                }
              `}
            >
              {t.label}
              {count != null && (
                <span
                  className={` w-4 h-4 text-xs flex items-center justify-center rounded-full font-bold
                  ${active ? "bg-white/20 text-white" : "bg-white/10 text-white/40"}`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}

        <div className="flex-1" />
      </div>

      <div className="shrink-0 h-px bg-white/10 mx-5 mt-3" />

      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 pb-6">
        {loading && (
          <div className="text-center text-white/40 text-[0.75rem] py-10">
            ⏳ Đang tải models từ server...
          </div>
        )}

        {tab === "ships" && !loading && (
          <div className="flex flex-col gap-6">
            {ships.length === 0 && (
              <div className="text-center text-white/30 text-[0.75rem] py-10">
                Chưa có ship nào. Upload model mới ở tab Upload Model.
              </div>
            )}
            {ships.map((m) => (
              <ModelCard
                key={`${m.id}-${m.updatedAt ?? ""}`}
                model={m}
                onUpdate={(id, changes) => updateModel(id, changes)}
                onDelete={(id) => removeModel(id)}
                onToggleShip={toggleShipActive}
              />
            ))}
          </div>
        )}

        {tab === "boss" && !loading && (
          <div className="flex flex-col gap-2">
            {bosses.length === 0 && (
              <div className="text-center text-white/30 text-[0.75rem] py-10">
                Chưa có boss nào. Upload model mới ở tab Upload Model.
              </div>
            )}
            {bosses.map((m) => (
              <ModelCard
                key={`${m.id}-${m.updatedAt ?? ""}`}
                model={m}
                isActiveBoss={m.id === activeBossId}
                onUpdate={(id, changes) => updateModel(id, changes)}
                onDelete={(id) => removeModel(id)}
                onSetActiveBoss={setActiveBoss}
              />
            ))}
          </div>
        )}

        {tab === "add" && (
          <UploadForm
            onSuccess={(model) => {
              addModel(model);
              setTab(model.role === "boss" ? "boss" : "ships");
            }}
            activeGifts={activeGifts}
          />
        )}
      </div>
    </div>
  );
}

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
    const fn = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[200] flex items-center justify-center p-5 backdrop-blur-md"
    >
      <ModalContent
        key={String(isOpen)}
        ships={allShipModels}
        bosses={allBossModels}
        activeBossId={activeBossId}
        addModel={addModel}
        updateModel={updateModel}
        removeModel={removeModel}
        toggleShipActive={toggleShipActive}
        setActiveBoss={setActiveBoss}
        loading={loading}
        activeGifts={activeGifts}
        onClose={onClose}
      />
    </div>
  );
}
