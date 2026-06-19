import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, Html, useProgress } from "@react-three/drei";

// served from public/models — BASE_URL handles the /portfolio/ gh-pages prefix
const MODEL_URL = `${import.meta.env.BASE_URL}models/helmet.glb`;

function Helmet() {
  const ref = useRef();
  const { scene } = useGLTF(MODEL_URL);
  const mouse = useRef({ x: 0, y: 0 });

  // track the cursor across the WHOLE window, even outside the canvas
  useEffect(() => {
    const onMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useFrame((_, delta) => {
    if (!ref.current) return;
    // always-on rotation
    ref.current.rotation.y += delta * 0.5;
    // cursor influence (tilt + gentle sway), eased
    const targetX = -mouse.current.y * 0.5;
    ref.current.rotation.x += (targetX - ref.current.rotation.x) * 0.06;
    ref.current.position.x += (mouse.current.x * 0.4 - ref.current.position.x) * 0.05;
    ref.current.position.y += (-mouse.current.y * 0.25 - ref.current.position.y) * 0.05;
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
        <Helmet />
        <Environment preset="city" />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);
