import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, Center, Resize } from "@react-three/drei";

const MODEL_URL = `${import.meta.env.BASE_URL}models/robotface.glb`;

function Face() {
  const ref = useRef();
  const { scene } = useGLTF(MODEL_URL);
  const mouse = useRef({ x: 0, y: 0 });
  const talk = useRef({ on: false, pulse: 0 });

  useEffect(() => {
    const onMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const start = () => (talk.current.on = true);
    const end = () => (talk.current.on = false);
    const bound = () => (talk.current.pulse = 1); // spike on each word
    window.addEventListener("mousemove", onMove);
    window.addEventListener("robot-talk-start", start);
    window.addEventListener("robot-talk-end", end);
    window.addEventListener("robot-talk-boundary", bound);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("robot-talk-start", start);
      window.removeEventListener("robot-talk-end", end);
      window.removeEventListener("robot-talk-boundary", bound);
    };
  }, []);

  // slow idle + gentle cursor follow + talking head-motion
  useFrame((state) => {
    if (!ref.current) return;
    const ty = mouse.current.x * 0.4 + Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
    const tx = mouse.current.y * 0.22;
    ref.current.rotation.y += (ty - ref.current.rotation.y) * 0.04;
    ref.current.rotation.x += (tx - ref.current.rotation.x) * 0.04;

    // "talking": rapid subtle nod while speaking + a bob spike on each word
    const t = talk.current;
    t.pulse *= 0.82;
    if (t.on || t.pulse > 0.01) {
      const chatter = Math.sin(state.clock.elapsedTime * 26) * 0.05 * (t.on ? 1 : 0);
      ref.current.rotation.x += chatter + t.pulse * 0.09;
      ref.current.scale.setScalar(1 + t.pulse * 0.02);
    } else {
      ref.current.scale.setScalar(1);
    }
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
