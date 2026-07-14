import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations, Environment, Html } from "@react-three/drei";

// Realistic rigged character (three.js examples, MIT-licensed repo)
const MODEL_URL = `${import.meta.env.BASE_URL}models/soldier.glb`;

const now = () => performance.now() / 1000;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const ease = (v) => v * v * (3 - 2 * v); // smoothstep
const easeOut = (v) => 1 - Math.pow(1 - v, 3);

// gesture durations (seconds)
const DUR = { wave: 1.9, shake: 0.9, flinch: 0.65, jump: 0.8, kneel: 3.6, fall: 4.4 };

function Character() {
  const group = useRef();
  const { scene, animations } = useGLTF(MODEL_URL);
  const { actions } = useAnimations(animations, group);
  const mouse = useRef({ x: 0, y: 0 });

  const bones = useRef({});
  const gesture = useRef({ type: null, start: 0, side: "r" });
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
        else if (n.endsWith("rightshoulder")) bones.current.rShoulder = o;
        else if (n.endsWith("leftshoulder")) bones.current.lShoulder = o;
        else if (n.endsWith("rightforearm")) bones.current.rForeArm = o;
        else if (n.endsWith("leftforearm")) bones.current.lForeArm = o;
        else if (n.endsWith("rightarm")) bones.current.rArm = o;
        else if (n.endsWith("leftarm")) bones.current.lArm = o;
        else if (n.endsWith("rightupleg")) bones.current.rThigh = o;
        else if (n.endsWith("leftupleg")) bones.current.lThigh = o;
        else if (n.endsWith("rightleg")) bones.current.rKnee = o;
        else if (n.endsWith("leftleg")) bones.current.lKnee = o;
        else if (n.endsWith("spine2")) bones.current.spine2 = o;
        else if (n.endsWith("spine1")) bones.current.spine1 = o;
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

  // classify clicks by body zone
  const onPointerDown = (e) => {
    e.stopPropagation();
    const ge = gesture.current;
    const t = now();
    // big gestures can't be interrupted
    if (ge.type === "fall" || ge.type === "kneel") return;

    clicks.current = [...clicks.current.filter((c) => t - c < 0.9), t];
    const rapid = clicks.current.length >= 3;

    const local = group.current.worldToLocal(e.point.clone());
    const side = local.x >= 0 ? "l" : "r";
    let zone;
    if (local.y < 0.85) zone = "leg";
    else if (local.y > 1.45) zone = "head";
    else if (Math.abs(local.x) < 0.22) zone = "chest";
    else zone = "arm";

    let type = null;
    if (zone === "chest" && rapid) type = "fall";
    else if (zone === "leg" && rapid) type = "kneel";
    else if (rapid) type = "jump";
    else if (zone === "head") type = "shake";
    else if (zone === "arm") type = "flinch";
    else type = "wave";

    if (rapid) clicks.current = [];
    // don't restart the same small gesture mid-play
    if (ge.type && t - ge.start < 0.35) return;
    gesture.current = { type, start: t, side };
  };

  // Runs AFTER the animation mixer each frame — offsets stack on the idle clip.
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const t = now();
    const B = bones.current;
    const ge = gesture.current;

    let p = ge.type ? (t - ge.start) / DUR[ge.type] : 1;
    if (p >= 1 && ge.type) {
      ge.type = null;
      p = 1;
    }

    // how "down" we are (fall) — used to mute cursor tracking while on the floor
    let fallK = 0;
    let baseY = -1.7;

    // ---------- gestures ----------
    if (ge.type === "wave") {
      // envelope: raise, hold+oscillate, lower
      const k = ease(clamp01(p / 0.22)) * ease(clamp01((1 - p) / 0.28));
      if (B.rArm) {
        B.rArm.rotation.x += 0.35 * k;   // slightly forward (toward viewer)
        B.rArm.rotation.z -= 1.6 * k;    // raise OUT to the side, hand up high
      }
      if (B.rShoulder) B.rShoulder.rotation.z -= 0.15 * k;
      if (B.rForeArm) {
        B.rForeArm.rotation.z -= 0.2 * k;
        B.rForeArm.rotation.z += Math.sin(t * 12) * 0.5 * k; // the wave itself
      }
      if (B.spine1) B.spine1.rotation.z -= 0.06 * k; // slight lean into it
      if (B.head) B.head.rotation.z -= 0.12 * k;
    } else if (ge.type === "shake") {
      // head shake "no"
      const k = ease(clamp01(p / 0.15)) * ease(clamp01((1 - p) / 0.2));
      if (B.head) B.head.rotation.y += Math.sin(t * 16) * 0.45 * k;
    } else if (ge.type === "flinch") {
      // clicked arm jerks: shoulder up, arm pulls in
      const k = ease(clamp01(p / 0.15)) * ease(clamp01((1 - p) / 0.35));
      const sh = ge.side === "l" ? B.lShoulder : B.rShoulder;
      const arm = ge.side === "l" ? B.lArm : B.rArm;
      const fa = ge.side === "l" ? B.lForeArm : B.rForeArm;
      const s = ge.side === "l" ? -1 : 1;
      if (sh) sh.rotation.z += s * 0.35 * k;
      if (arm) arm.rotation.z += s * 0.5 * k;
      if (fa) fa.rotation.z += s * 0.8 * k;
      if (B.spine1) B.spine1.rotation.z -= s * 0.08 * k;
    } else if (ge.type === "jump") {
      const pj = clamp01(p);
      // anticipation crouch -> flight with knee tuck -> landing dip
      if (pj < 0.18) {
        const k = ease(pj / 0.18);
        baseY -= 0.14 * k;
        if (B.lKnee) B.lKnee.rotation.x += 0.5 * k;
        if (B.rKnee) B.rKnee.rotation.x += 0.5 * k;
        if (B.spine1) B.spine1.rotation.x += 0.12 * k;
      } else if (pj < 0.82) {
        const f = (pj - 0.18) / 0.64;
        baseY += Math.sin(Math.PI * f) * 1.0;
        const tuck = Math.sin(Math.PI * f);
        if (B.lKnee) B.lKnee.rotation.x += 0.9 * tuck;
        if (B.rKnee) B.rKnee.rotation.x += 0.9 * tuck;
        if (B.lThigh) B.lThigh.rotation.x -= 0.45 * tuck;
        if (B.rThigh) B.rThigh.rotation.x -= 0.45 * tuck;
        if (B.lArm) B.lArm.rotation.z -= 0.4 * tuck;
        if (B.rArm) B.rArm.rotation.z += 0.4 * tuck;
      } else {
        const k = ease(1 - (pj - 0.82) / 0.18); // landing dip fades out
        baseY -= 0.1 * k;
        if (B.lKnee) B.lKnee.rotation.x += 0.45 * k;
        if (B.rKnee) B.rKnee.rotation.x += 0.45 * k;
        if (B.spine1) B.spine1.rotation.x += 0.08 * k;
      }
    } else if (ge.type === "kneel") {
      // real weight shift: drop onto the clicked knee, other leg supports
      const k = ease(clamp01(p / 0.14)) * ease(clamp01((1 - p) / 0.18));
      const s = ge.side;
      const dnKnee = s === "l" ? B.lKnee : B.rKnee;
      const dnThigh = s === "l" ? B.lThigh : B.rThigh;
      const upKnee = s === "l" ? B.rKnee : B.lKnee;
      const upThigh = s === "l" ? B.rThigh : B.lThigh;
      baseY -= 0.5 * k; // hips actually drop
      if (dnThigh) dnThigh.rotation.x += 0.35 * k;  // that leg folds under
      if (dnKnee) dnKnee.rotation.x += 1.95 * k;    // deep knee fold
      if (upThigh) upThigh.rotation.x -= 0.95 * k;  // support leg steps forward
      if (upKnee) upKnee.rotation.x += 1.5 * k;
      if (B.spine) B.spine.rotation.x += 0.12 * k;  // torso reacts
      if (B.spine1) B.spine1.rotation.x += 0.1 * k;
      if (B.spine1) B.spine1.rotation.z += (s === "l" ? 0.1 : -0.1) * k;
      if (B.head) B.head.rotation.x -= 0.15 * k;    // looks down at the knee
      // arms out slightly for balance
      if (B.lArm) B.lArm.rotation.z -= 0.25 * k;
      if (B.rArm) B.rArm.rotation.z += 0.25 * k;
      // subtle tremble while down
      if (p > 0.2 && p < 0.75 && B.spine2)
        B.spine2.rotation.z += Math.sin(t * 22) * 0.015;
    } else if (ge.type === "fall") {
      // knocked down: recoil -> topple with gravity -> lie -> heroic rise
      const s = 1; // fall backward
      let tilt = 0;
      if (p < 0.1) {
        // hit recoil: chest caves, step of shock
        const k = ease(p / 0.1);
        if (B.spine1) B.spine1.rotation.x -= 0.3 * k;
        if (B.head) B.head.rotation.x -= 0.25 * k;
        fallK = k * 0.3;
      } else if (p < 0.4) {
        // gravity-accelerated topple + settle bounce at the end
        const f = (p - 0.1) / 0.3;
        tilt = f * f; // accelerating
        fallK = 0.3 + 0.7 * tilt;
        // arms windmill/flail while falling
        const fl = Math.sin(f * Math.PI);
        if (B.lArm) B.lArm.rotation.z -= 0.9 * fl;
        if (B.rArm) B.rArm.rotation.z += 0.9 * fl;
        if (B.lForeArm) B.lForeArm.rotation.z += 0.5 * fl;
        if (B.rForeArm) B.rForeArm.rotation.z -= 0.5 * fl;
      } else if (p < 0.72) {
        // lying flat: sprawled, breathing
        tilt = 1 + Math.sin((p - 0.4) * 40) * 0.03 * Math.exp(-(p - 0.4) * 14);
        fallK = 1;
        const breathe = Math.sin(t * 3.2) * 0.02;
        if (B.spine1) B.spine1.rotation.x += breathe;
        if (B.lArm) B.lArm.rotation.z -= 0.55;
        if (B.rArm) B.rArm.rotation.z += 0.55;
        if (B.lKnee) B.lKnee.rotation.x += 0.35;
        if (B.rKnee) B.rKnee.rotation.x += 0.2;
      } else {
        // heroic rise: sit up, gather legs, push to stand
        const f = (p - 0.72) / 0.28;
        const rise = easeOut(f);
        tilt = 1 - rise;
        fallK = tilt;
        // sit-up crunch early in the rise
        const crunch = Math.sin(Math.PI * clamp01(f * 1.4)) * 0.45;
        if (B.spine) B.spine.rotation.x += crunch * 0.5;
        if (B.spine1) B.spine1.rotation.x += crunch * 0.5;
        if (B.head) B.head.rotation.x += crunch * 0.4;
        // legs gather under the body
        const gather = Math.sin(Math.PI * clamp01(f * 1.2));
        if (B.lKnee) B.lKnee.rotation.x += 1.1 * gather;
        if (B.rKnee) B.rKnee.rotation.x += 1.1 * gather;
        if (B.lThigh) B.lThigh.rotation.x -= 0.6 * gather;
        if (B.rThigh) B.rThigh.rotation.x -= 0.6 * gather;
      }
      g.rotation.x = -1.45 * tilt * s;
      baseY -= 0.12 * Math.min(tilt, 1);
    }

    if (ge.type !== "fall") {
      // relax any fall tilt smoothly
      g.rotation.x += (0 - g.rotation.x) * 0.15;
    }

    // ---------- cursor tracking (muted while on the floor) ----------
    const track = 1 - fallK;
    if (B.head && track > 0) {
      B.head.rotation.y += mouse.current.x * 0.55 * track;
      B.head.rotation.x += mouse.current.y * 0.3 * track;
      B.head.rotation.z += -mouse.current.x * 0.22 * track; // sideways tilt
    }
    const ty = Math.PI + mouse.current.x * 0.35 * track;
    g.rotation.y += (ty - g.rotation.y) * 0.06;

    g.position.y += (baseY - g.position.y) * 0.35;

    // speech bubble on friendly gestures only
    if (bubbleRef.current) {
      const talking = ge.type === "wave" || ge.type === "jump";
      bubbleRef.current.style.opacity = talking ? "1" : "0";
      bubbleRef.current.style.transform = talking
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
        // empty space inside the 3D area -> shockwave ripple
        window.dispatchEvent(
          new CustomEvent("click-wave", { detail: { x: e.clientX, y: e.clientY } })
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
