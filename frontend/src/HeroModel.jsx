import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations, Environment, Html, useProgress } from "@react-three/drei";

// served from public/models — BASE_URL handles the /portfolio/ gh-pages prefix
const MODEL_URL = `${import.meta.env.BASE_URL}models/robot.glb`;

function Robot() {
  const group = useRef();
  const { scene, animations } = useGLTF(MODEL_URL);
  const { actions } = useAnimations(animations, group);
  const mouse = useRef({ x: 0, y: 0 });

  // track the cursor across the whole window
  useEffect(() => {
    const onMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // wave once on load, then settle into a looping idle
  useEffect(() => {
    if (!actions) return;
    const idle = actions["Idle"];
    const wave = actions["Wave"];
    if (wave && idle) {
      wave.reset().setLoop(2200, 1).play(); // LoopOnce
      wave.clampWhenFinished = true;
      const t = setTimeout(() => {
        wave.fadeOut(0.4);
        idle.reset().fadeIn(0.4).play();
      }, 2400);
      return () => clearTimeout(t);
    }
    idle?.reset().fadeIn(0.4).play();
  }, [actions]);

  // turn the body to follow the cursor (horizontal), subtle look up/down
  useFrame(() => {
    if (!group.current) return;
    const ty = mouse.current.x * 0.7;
    const tx = mouse.current.y * 0.15;
    group.current.rotation.y += (ty - group.current.rotation.y) * 0.06;
    group.current.rotation.x += (tx - group.current.rotation.x) * 0.06;
  });

  return <primitive ref={group} object={scene} scale={0.85} position={[0, -1.7, 0]} />;
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
      camera={{ position: [0, 0, 14], fov: 36 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={2.2} />
      <directionalLight position={[-6, -2, -4]} intensity={0.7} color="#8b5cf6" />
      <pointLight position={[0, 3, 4]} intensity={20} color="#22d3ee" />
      <Suspense fallback={<Loader />}>
        <Robot />
        <Environment preset="city" />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);
