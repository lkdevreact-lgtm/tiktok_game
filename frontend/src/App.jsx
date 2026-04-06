import { useEffect } from "react";
import { GameProvider, useGame } from "./store/gameStore";
import { ModelProvider } from "./store/modelStore";
import { GiftProvider } from "./store/giftStore";
import ConnectForm from "./components/ConnectForm";
import GameCanvas from "./components/GameCanvas";
import socket from "./socket/socketClient";

function AppInner() {
  const { connected, setConnected, setUsername, setGameStatus } = useGame();

  useEffect(() => {
    socket.on("tiktok_connected", ({ username }) => {
      setUsername(username);
      setConnected(true);
      setGameStatus("playing");
    });

    socket.on("tiktok_disconnected", () => {
      console.warn("TikTok disconnected");
    });

    return () => {
      socket.off("tiktok_connected");
      socket.off("tiktok_disconnected");
    };
  }, [setConnected, setUsername, setGameStatus]);

  if (connected) return <ConnectForm />;
  return <GameCanvas />;
}

export default function App() {
  return (
    <ModelProvider>
      <GiftProvider>
        <GameProvider>
          <AppInner />
        </GameProvider>
      </GiftProvider>
    </ModelProvider>
  );
}
