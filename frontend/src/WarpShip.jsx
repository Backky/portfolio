import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment } from "@react-three/drei";

const MODEL_URL = `${import.meta.env.BASE_URL}models/spaceship.glb`;

function Ship() {
  const ref = useRef();
  const { scene } = useGLTF(MODEL_URL);

  // scripted flight: banking, bobbing, thrusting forward through the jump
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = Math.PI + Math.sin(t * 0.6) * 0.18; // face toward the jump
    ref.current.rotation.z = Math.sin(t * 1.3) * 0.28; // bank left/right
    ref.current.rotation.x = -0.12 + Math.sin(t * 1.7) * 0.06; // nose bob
    ref.current.position.y = -0.35 + Math.sin(t * 2.1) * 0.12;
    ref.current.position.x = Math.sin(t * 0.5) * 0.25;
    ref.current.position.z = Math.min(t * 0.6, 1.8); // drift toward camera
  });

  return <primitive ref={ref} object={scene} scale={1.4} position={[0, -0.35, 0]} />;
}

export default function WarpShip() {
  return (
    <Canvas
      camera={{ position: [0, 0.3, 7], fov: 48 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 4]} intensity={2.6} />
      <directionalLight position={[-4, 1, 2]} intensity={1} color="#818cf8" />
      <pointLight position={[0, -1.5, -4]} intensity={40} color="#22d3ee" />
      <pointLight position={[2, 2, 3]} intensity={12} color="#a855f7" />
      <Suspense fallback={null}>
        <Ship />
        <Environment preset="night" />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);
