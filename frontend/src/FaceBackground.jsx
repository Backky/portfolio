import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, Center, Resize } from "@react-three/drei";

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

  // Resize normalizes the tiny model to 1 unit; the group scales it up to a
  // known, guaranteed-visible size and Center puts it at the origin.
  return (
    <group ref={ref}>
      <Center>
        <group scale={3.6}>
          <Resize>
            <primitive object={scene} />
          </Resize>
        </group>
      </Center>
    </group>
  );
}

export default function FaceBackground() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 40 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={1.4} />
      <directionalLight position={[5, 5, 5]} intensity={3.2} />
      <directionalLight position={[-5, -2, -4]} intensity={1.8} color="#818cf8" />
      <pointLight position={[0, 2, 5]} intensity={22} color="#22d3ee" />
      <pointLight position={[3, -1, 2]} intensity={16} color="#d946ef" />
      <Suspense fallback={null}>
        <Face />
        <Environment preset="city" />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);
