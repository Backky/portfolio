import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Float, Environment } from "@react-three/drei";

// Poly-by-Google astronaut (CC-BY), vendored in public/models
const MODEL_URL = `${import.meta.env.BASE_URL}models/astronaut.glb`;

function Astronaut() {
  const group = useRef();
  const { scene } = useGLTF(MODEL_URL);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // turn to follow the cursor (the float adds the zero-g bob)
  useFrame(() => {
    if (!group.current) return;
    const ty = mouse.current.x * 0.8;
    const tx = mouse.current.y * 0.25;
    group.current.rotation.y += (ty - group.current.rotation.y) * 0.05;
    group.current.rotation.x += (tx - group.current.rotation.x) * 0.05;
  });

  return (
    <group ref={group}>
      <primitive object={scene} scale={2.2} position={[0, -2.2, 0]} />
    </group>
  );
}

export default function HeroModel() {
  return (
    <Canvas
      className="!touch-none"
      camera={{ position: [0, 0, 6], fov: 40 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={2.2} />
      <directionalLight position={[-6, -2, -4]} intensity={0.6} color="#8b5cf6" />
      <pointLight position={[0, 3, 4]} intensity={18} color="#22d3ee" />
      <Suspense fallback={null}>
        <Float speed={1.4} rotationIntensity={0.4} floatIntensity={1.3}>
          <Astronaut />
        </Float>
        <Environment preset="city" />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);
