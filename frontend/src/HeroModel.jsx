import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations, Environment } from "@react-three/drei";

// Realistic rigged character (three.js examples, MIT-licensed repo)
const MODEL_URL = `${import.meta.env.BASE_URL}models/soldier.glb`;

function Character() {
  const group = useRef();
  const { scene, animations } = useGLTF(MODEL_URL);
  const { actions } = useAnimations(animations, group);
  const mouse = useRef({ x: 0, y: 0 });

  // enable shadows + slightly boost material response
  useEffect(() => {
    scene.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        if (o.material) o.material.envMapIntensity = 0.9;
      }
    });
  }, [scene]);

  // track cursor across the whole window
  useEffect(() => {
    const onMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // play the lifelike idle animation on loop
  useEffect(() => {
    const idle = actions?.["Idle"];
    idle?.reset().fadeIn(0.4).play();
    return () => idle?.fadeOut(0.2);
  }, [actions]);

  // body turns to face the cursor (model faces -Z, so base yaw is PI)
  useFrame(() => {
    if (!group.current) return;
    const ty = Math.PI + mouse.current.x * 0.7;
    const tx = mouse.current.y * 0.12;
    group.current.rotation.y += (ty - group.current.rotation.y) * 0.06;
    group.current.rotation.x += (tx - group.current.rotation.x) * 0.06;
  });

  return (
    <group ref={group} position={[0, -1.7, 0]} scale={1.85}>
      <primitive object={scene} />
    </group>
  );
}

export default function HeroModel() {
  return (
    <Canvas
      className="!touch-none"
      camera={{ position: [0, 0.4, 5.2], fov: 40 }}
      dpr={[1, 2]}
      shadows
      gl={{ antialias: true, alpha: true }}
    >
      {/* futuristic tri-tone lighting: key white, indigo rim, cyan fill */}
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 4]} intensity={2.4} castShadow />
      <directionalLight position={[-6, 2, -4]} intensity={1.4} color="#6366f1" />
      <pointLight position={[0, 2.5, 3.5]} intensity={14} color="#22d3ee" />
      <pointLight position={[2.5, -1, -2]} intensity={8} color="#d946ef" />
      <Suspense fallback={null}>
        <Character />
        <Environment preset="night" />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);
