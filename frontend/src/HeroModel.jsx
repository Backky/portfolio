import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Float, Environment, Html, useProgress } from "@react-three/drei";

// served from public/models — BASE_URL handles the /portfolio/ gh-pages prefix
const MODEL_URL = `${import.meta.env.BASE_URL}models/helmet.glb`;

function Helmet() {
  const ref = useRef();
  const { scene } = useGLTF(MODEL_URL);

  // ease the model toward the pointer for an interactive, parallax feel
  useFrame((state) => {
    if (!ref.current) return;
    const px = state.pointer.x;
    const py = state.pointer.y;
    ref.current.rotation.y += (px * 0.6 - ref.current.rotation.y) * 0.06;
    ref.current.rotation.x += (-py * 0.35 - ref.current.rotation.x) * 0.06;
  });

  return <primitive ref={ref} object={scene} scale={2.3} />;
}

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <span className="label-mono whitespace-nowrap text-[10px] text-white/60">
        {Math.round(progress)}%
      </span>
    </Html>
  );
}

export default function HeroModel() {
  return (
    <Canvas
      className="!touch-none"
      camera={{ position: [0, 0, 6], fov: 42 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 5, 5]} intensity={2.4} />
      <directionalLight position={[-6, -2, -4]} intensity={0.7} color="#8b5cf6" />
      <pointLight position={[0, 3, 4]} intensity={20} color="#22d3ee" />
      <Suspense fallback={<Loader />}>
        <Float speed={1.6} rotationIntensity={0.5} floatIntensity={1.3}>
          <Helmet />
        </Float>
        <Environment preset="city" />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);
