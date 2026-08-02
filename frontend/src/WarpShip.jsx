import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, Center, Bounds } from "@react-three/drei";

const MODEL_URL = `${import.meta.env.BASE_URL}models/spaceship.glb`;

function Ship() {
  const ref = useRef();
  const { scene } = useGLTF(MODEL_URL);

  // model's nose runs along local X — turn it to point into the warp,
  // held at a slight 3/4 so we see the body + engine, not a flat rear
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    // nose points away into the warp (rear 3/4), tilted so we see the top
    ref.current.rotation.y = -Math.PI / 2 + 0.22 + Math.sin(t * 0.7) * 0.05;
    ref.current.rotation.x = 0.34 + Math.sin(t * 3) * 0.02; // look down on the top
    ref.current.rotation.z = Math.sin(t * 1.1) * 0.16; // banking — sells the flight
    ref.current.position.y = Math.sin(t * 3) * 0.02; // engine vibration
    ref.current.position.x = Math.sin(t * 0.8) * 0.08; // subtle drift
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
