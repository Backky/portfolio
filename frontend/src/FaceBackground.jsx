import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment } from "@react-three/drei";

const MODEL_URL = `${import.meta.env.BASE_URL}models/robotface.glb`;

function Face() {
  const ref = useRef();
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

  // slow idle + gentle cursor follow
  useFrame((state) => {
    if (!ref.current) return;
    const ty = mouse.current.x * 0.4 + Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
    const tx = mouse.current.y * 0.22;
    ref.current.rotation.y += (ty - ref.current.rotation.y) * 0.04;
    ref.current.rotation.x += (tx - ref.current.rotation.x) * 0.04;
  });

  return <primitive ref={ref} object={scene} scale={2.6} position={[0, -0.4, 0]} />;
}

export default function FaceBackground() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 40 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 5, 5]} intensity={2} />
      <directionalLight position={[-5, -2, -4]} intensity={1.1} color="#6366f1" />
      <pointLight position={[0, 2, 4]} intensity={12} color="#22d3ee" />
      <pointLight position={[3, -1, -2]} intensity={8} color="#d946ef" />
      <Suspense fallback={null}>
        <Face />
        <Environment preset="night" />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);
