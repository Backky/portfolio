import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, Center, Resize } from "@react-three/drei";

// facecap face scan (three.js examples) — has 52 ARKit blend shapes for lip-sync
const MODEL_URL = `${import.meta.env.BASE_URL}models/face.glb`;

function Face() {
  const ref = useRef();
  const { scene } = useGLTF(MODEL_URL);
  const morph = useRef(null); // the mesh that has the blend shapes
  const mouse = useRef({ x: 0, y: 0 });
  const talk = useRef({ on: false, pulse: 0 });
  const jaw = useRef(0);
  const blink = useRef({ t: 2, v: 0 });

  // find the blend-shape mesh
  useEffect(() => {
    scene.traverse((o) => {
      if (
        o.morphTargetInfluences &&
        o.morphTargetDictionary &&
        o.morphTargetDictionary.jawOpen !== undefined
      ) {
        morph.current = o;
      }
    });
  }, [scene]);

  // input + speech listeners
  useEffect(() => {
    const onMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const start = () => (talk.current.on = true);
    const end = () => (talk.current.on = false);
    const bound = () => (talk.current.pulse = 1);
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

  const set = (name, v) => {
    const m = morph.current;
    if (!m) return;
    const i = m.morphTargetDictionary[name];
    if (i !== undefined) m.morphTargetInfluences[i] = v;
  };

  useFrame((state, delta) => {
    if (!ref.current) return;
    // gentle cursor follow
    ref.current.rotation.y += (mouse.current.x * 0.35 - ref.current.rotation.y) * 0.05;
    ref.current.rotation.x += (mouse.current.y * 0.2 - ref.current.rotation.x) * 0.05;

    if (!morph.current) return;
    const t = talk.current;
    t.pulse *= 0.8;

    // ---- lip-sync: drive jawOpen (+ funnel) while speaking ----
    let jawTarget = 0;
    if (t.on || t.pulse > 0.02) {
      const flap = Math.abs(Math.sin(state.clock.elapsedTime * 17));
      jawTarget = (t.on ? 0.12 + flap * 0.42 : 0) + t.pulse * 0.32;
    }
    jaw.current += (jawTarget - jaw.current) * 0.35;
    const j = Math.min(0.85, jaw.current);
    set("jawOpen", j);
    set("mouthFunnel", j * 0.25);
    set("mouthClose", (1 - Math.min(1, j * 2)) * 0.15);

    // ---- idle life: soft smile + periodic blink ----
    set("mouthSmile_L", 0.1);
    set("mouthSmile_R", 0.1);
    blink.current.t -= delta;
    if (blink.current.t <= 0) {
      blink.current.v = 1;
      blink.current.t = 2.5 + Math.random() * 3.5;
    }
    blink.current.v *= 0.55; // quick open
    const b = Math.min(1, blink.current.v);
    set("eyeBlink_L", b);
    set("eyeBlink_R", b);
  });

  return (
    <group ref={ref}>
      <Center>
        <group scale={3.4}>
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
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 5, 5]} intensity={1.1} />
      <directionalLight position={[-5, -1, -3]} intensity={0.5} color="#818cf8" />
      <pointLight position={[0, 2, 5]} intensity={4} color="#a5b4fc" />
      <Suspense fallback={null}>
        <Face />
        <Environment preset="city" environmentIntensity={0.35} />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);
