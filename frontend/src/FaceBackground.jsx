import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Environment, Center, Resize } from "@react-three/drei";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";

// facecap face scan (three.js examples) — 52 ARKit blend shapes for lip-sync.
// Its skin texture is KTX2/Basis-compressed and its mesh is meshopt-compressed,
// so both decoders are needed (the Basis transcoder is self-hosted).
const MODEL_URL = `${import.meta.env.BASE_URL}models/face.glb`;
let ktx2 = null;

function Face() {
  const ref = useRef();
  const gl = useThree((s) => s.gl);
  const { scene } = useGLTF(MODEL_URL, false, true, (loader) => {
    if (!ktx2) {
      ktx2 = new KTX2Loader()
        .setTranscoderPath(`${import.meta.env.BASE_URL}basis/`)
        .detectSupport(gl);
    }
    loader.setKTX2Loader(ktx2);
  });
  const morph = useRef(null); // the mesh that has the blend shapes
  const mouse = useRef({ x: 0, y: 0 });
  const talk = useRef({ until: 0, pulse: 0 });
  const jaw = useRef(0);
  const blink = useRef({ next: 2, active: false, p: 0 });

  // find the blend-shape mesh + give the pale scan a cooler, premium skin tone
  useEffect(() => {
    scene.traverse((o) => {
      if (
        o.morphTargetInfluences &&
        o.morphTargetDictionary &&
        o.morphTargetDictionary.jawOpen !== undefined
      ) {
        morph.current = o;
      }
      if (o.isMesh && o.material && o.material.map) {
        o.material.color.set("#a9a1c4"); // lavender-grey multiplier on the skin
        if ("roughness" in o.material) o.material.roughness = 0.55;
        if ("envMapIntensity" in o.material) o.material.envMapIntensity = 0.8;
        o.material.needsUpdate = true;
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
      camera={{ position: [0, 0, 6], fov: 38 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, toneMappingExposure: 1.05 }}
    >
      {/* studio 3-point lighting: soft key, cool violet rim, warm low fill */}
      <ambientLight intensity={0.22} />
      <directionalLight position={[3.5, 4, 5]} intensity={1.25} color="#fff6ee" />
      <directionalLight position={[-4.5, 2, -4]} intensity={2.2} color="#8b7bff" />
      <directionalLight position={[4, -1, -4]} intensity={1.2} color="#d946ef" />
      <pointLight position={[-3, -2, 3]} intensity={2.5} color="#ffd9b8" />
      <Suspense fallback={null}>
        <Face />
        <Environment preset="studio" environmentIntensity={0.3} />
      </Suspense>
    </Canvas>
  );
}

// (no preload: the KTX2 loader needs the renderer, set up inside Face)
