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
  const talk = useRef({ until: 0, pulse: 0 });
  const jaw = useRef(0);
  const blink = useRef({ next: 2, active: false, p: 0 });

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
    // keep the mouth "talking" only briefly after each word boundary, so it
    // stops right after the last spoken word (independent of onend firing)
    const start = () => (talk.current.until = performance.now() + 1600);
    const end = () => (talk.current.until = 0);
    const bound = () => {
      talk.current.until = performance.now() + 360;
      talk.current.pulse = 1;
    };
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
    const talking = performance.now() < t.until;

    // ---- lip-sync: drive jawOpen (+ funnel) while speaking ----
    let jawTarget = 0;
    if (talking) {
      const flap = Math.abs(Math.sin(state.clock.elapsedTime * 9.5)); // slower
      jawTarget = 0.1 + flap * 0.36 + t.pulse * 0.25;
    }
    // when not talking, close fast so the mouth actually stops
    const ease = talking ? 0.3 : 0.6;
    jaw.current += (jawTarget - jaw.current) * ease;
    if (!talking && jaw.current < 0.01) jaw.current = 0;
    const j = Math.min(0.8, jaw.current);
    set("jawOpen", j);
    set("mouthFunnel", j * 0.25);
    set("mouthClose", (1 - Math.min(1, j * 2)) * 0.15);

    // ---- idle life: soft smile + soft, occasional blink ----
    set("mouthSmile_L", 0.1);
    set("mouthSmile_R", 0.1);
    const bk = blink.current;
    if (!bk.active) {
      bk.next -= delta;
      if (bk.next <= 0) {
        bk.active = true;
        bk.p = 0;
      }
    } else {
      bk.p += delta / 0.34; // ~0.34s soft close+open
      if (bk.p >= 1) {
        bk.active = false;
        bk.p = 1;
        bk.next = 4.5 + Math.random() * 3; // every ~4.5-7.5s
      }
    }
    const b = bk.active ? Math.sin(Math.min(bk.p, 1) * Math.PI) : 0;
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
