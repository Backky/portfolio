import { Suspense, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Environment, Center, Resize } from "@react-three/drei";
import { warpShipPath } from "./warpPath";

const MODEL_URL = `${import.meta.env.BASE_URL}models/spaceship.glb`;
const DUR = 3000;
const MARGIN = 2.6; // world units past the edge, so the ship is fully off-screen
const clamp01 = (v) => Math.min(1, Math.max(0, v));

function Ship() {
  const ref = useRef();
  const { scene } = useGLTF(MODEL_URL);
  const { viewport } = useThree();
  const start = useRef(performance.now());

  useFrame(() => {
    if (!ref.current) return;
    const p = clamp01((performance.now() - start.current) / DUR);
    const { nx, ny, near } = warpShipPath(p);

    // map path to the real viewport (+margin) so it enters from fully below
    // and exits fully above on any screen size; z brings it near in the middle
    const halfW = viewport.width / 2;
    const halfH = viewport.height / 2;
    ref.current.position.set(
      nx * (halfW + MARGIN),
      ny * (halfH + MARGIN),
      -1 + near * 2
    );

    // heading: nose points along travel (up-right into the warp)
    ref.current.rotation.y = -Math.PI / 2 + 0.9;
    // fighter-jet attitude: hard, steady bank into the climb + nose-up pitch
    ref.current.rotation.z = 0.6 + Math.sin(performance.now() / 500) * 0.05;
    ref.current.rotation.x = -0.14 + Math.sin(p * Math.PI) * 0.1; // climbing
  });

  return (
    <group ref={ref} scale={2.4}>
      <Center>
        <Resize>
          <primitive object={scene} />
        </Resize>
      </Center>
    </group>
  );
}

export default function WarpShip() {
  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 48 }}
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
