import { Canvas } from "@react-three/fiber";
import Experience from "./components/Experience";

const App = () => {
  return (
    <Canvas shadows camera={{position: [0,8,12], fov: 10}}>
      <color attach="background" args={["ececec"]} />
      <Experience />
    </Canvas>
  );
};

export default App;
