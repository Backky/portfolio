import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations, Environment, Html } from "@react-three/drei";

// Realistic rigged character (three.js examples, MIT-licensed repo)
const MODEL_URL = `${import.meta.env.BASE_URL}models/soldier.glb`;

const now = () => performance.now() / 1000;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
// smooth ease for gesture in/out
const ease = (v) => v * v * (3 - 2 * v);

function Character() {
  const group = useRef();
  const { scene, animations } = useGLTF(MODEL_URL);
  const { actions } = useAnimations(animations, group);
  const mouse = useRef({ x: 0, y: 0 });

  // skeleton bones we animate by hand
  const bones = useRef({});
  // gesture state machine
  const gesture = useRef({ type: null, start: 0 });
  const broken = useRef({ side: null, start: 0 });
  const clicks = useRef([]);
  const bubbleRef = useRef(null);

  // collect bones + enable shadows
  useEffect(() => {
    scene.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        if (o.material) o.material.envMapIntensity = 0.9;
      }
      if (o.isBone) {
        const n = o.name.toLowerCase();
        if (n.endsWith("head")) bones.current.head = o;
        else if (n.endsWith("rightarm")) bones.current.rArm = o;
        else if (n.endsWith("rightforearm")) bones.current.rForeArm = o;
        else if (n.endsWith("leftleg")) bones.current.lKnee = o;
        else if (n.endsWith("rightleg")) bones.current.rKnee = o;
        else if (n.endsWith("spine")) bones.current.spine = o;
      }
    });
  }, [scene]);

  // cursor tracking across the whole window
  useEffect(() => {
    const onMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // looping lifelike idle
  useEffect(() => {
    const idle = actions?.["Idle"];
    idle?.reset().fadeIn(0.4).play();
    return () => idle?.fadeOut(0.2);
  }, [actions]);

  // classify clicks on the character
  const onPointerDown = (e) => {
    e.stopPropagation();
    const t = now();
    clicks.current = [...clicks.current.filter((c) => t - c < 0.9), t];
    const rapid = clicks.current.length >= 3;

    // local point: model-space (group handles scale/rotation)
    const local = group.current.worldToLocal(e.point.clone());
    const isLeg = local.y < 0.85;

    if (isLeg && rapid) {
      broken.current = { side: local.x >= 0 ? "l" : "r", start: t };
      clicks.current = [];
    } else if (rapid) {
      gesture.current = { type: "jump", start: t };
      clicks.current = [];
    } else if (!gesture.current.type || t - gesture.current.start > 2) {
      gesture.current = { type: "wave", start: t };
    }
  };

  // NOTE: registered after useAnimations, so this runs AFTER the mixer
  // each frame — bone offsets stack on top of the idle animation.
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const t = now();
    const B = bones.current;

    // ---- head tracks + tilts toward the cursor ----
    if (B.head) {
      B.head.rotation.y += mouse.current.x * 0.55;
      B.head.rotation.x += mouse.current.y * 0.3;
      B.head.rotation.z += -mouse.current.x * 0.22; // the sideways tilt
    }
    // subtle whole-body turn (model faces -Z, so base yaw is PI)
    const ty = Math.PI + mouse.current.x * 0.35;
    g.rotation.y += (ty - g.rotation.y) * 0.06;

    // ---- gestures ----
    let baseY = -1.7;
    const ge = gesture.current;
    if (ge.type === "wave") {
      const p = (t - ge.start) / 1.8;
      if (p >= 1) ge.type = null;
      else {
        // envelope: ramp up, hold, ramp down
        const k = ease(clamp01(p / 0.2)) * ease(clamp01((1 - p) / 0.25));
        if (B.rArm) {
          B.rArm.rotation.x -= 0.7 * k;
          B.rArm.rotation.z -= 1.5 * k;
        }
        if (B.rForeArm) {
          B.rForeArm.rotation.x -= 0.35 * k;
          B.rForeArm.rotation.z += Math.sin(t * 13) * 0.5 * k;
        }
        if (B.head) B.head.rotation.z += 0.15 * k;
      }
    } else if (ge.type === "jump") {
      const p = (t - ge.start) / 0.75;
      if (p >= 1) ge.type = null;
      else baseY += Math.sin(Math.PI * clamp01(p)) * 1.05;
    }
    g.position.y += (baseY - g.position.y) * 0.35;

    // ---- broken leg: bend the clicked knee, recover after 3.5s ----
    const br = broken.current;
    if (br.side) {
      const p = (t - br.start) / 3.5;
      if (p >= 1) br.side = null;
      else {
        const k = ease(clamp01(p / 0.12)) * ease(clamp01((1 - p) / 0.15));
        const knee = br.side === "l" ? B.lKnee : B.rKnee;
        if (knee) knee.rotation.x += 1.15 * k;
        if (B.spine) B.spine.rotation.z += (br.side === "l" ? 0.14 : -0.14) * k;
        baseY -= 0.12 * k;
      }
    }

    // speech bubble visibility (plain DOM toggle, no re-renders)
    if (bubbleRef.current) {
      bubbleRef.current.style.opacity = ge.type ? "1" : "0";
      bubbleRef.current.style.transform = ge.type
        ? "translateY(0) scale(1)"
        : "translateY(6px) scale(0.85)";
    }
  });

  return (
    <group ref={group} position={[0, -1.7, 0]} scale={1.85}>
      <primitive
        object={scene}
        onPointerDown={onPointerDown}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "")}
      />
      <Html position={[0.35, 2.05, 0]} center distanceFactor={6} zIndexRange={[30, 0]}>
        <div
          ref={bubbleRef}
          style={{ opacity: 0, transition: "opacity .25s ease, transform .25s ease" }}
          className="pointer-events-none select-none rounded-2xl rounded-bl-sm border border-white/20 bg-white/90 px-3 py-1.5 text-sm font-semibold text-black shadow-lg"
        >
          Hi! 👋
        </div>
      </Html>
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
      onPointerMissed={(e) => {
        // empty space inside the 3D area -> bubbles
        window.dispatchEvent(
          new CustomEvent("spawn-bubbles", { detail: { x: e.clientX, y: e.clientY } })
        );
      }}
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
