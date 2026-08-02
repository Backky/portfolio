import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, Center, Bounds } from "@react-three/drei";

const MODEL_URL = `${import.meta.env.BASE_URL}models/spaceship.glb`;

function Ship() {
  const ref = useRef();
  const { scene } = useGLTF(MODEL_URL);

  // face straight down the warp axis (nose into the streaks), subtle motion
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = Math.PI; // nose forward into the jump
    ref.current.rotation.x = 0.08 + Math.sin(t * 3) * 0.02; // slight dive + engine shake
    ref.current.rotation.z = Math.sin(t * 0.8) * 0.1; // gentle bank
    ref.current.position.y = Math.sin(t * 3) * 0.03; // engine vibration
  });

  return (
    <group ref={ref}>
      <primitive object={scene} />
    </group>
  );
}

export default function WarpShip() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 4]} intensity={2.6} />
      <directionalLight position={[-4, 1, 2]} intensity={1} color="#818cf8" />
      <pointLight position={[0, -1.5, -4]} intensity={40} color="#22d3ee" />
      <pointLight position={[2, 2, 3]} intensity={12} color="#a855f7" />
      <Suspense fallback={null}>
        {/* auto-center the mesh and auto-zoom so the WHOLE ship fits the view */}
        <Bounds fit clip margin={1.25}>
          <Center>
            <Ship />
          </Center>
        </Bounds>
        <Environment preset="night" />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);
