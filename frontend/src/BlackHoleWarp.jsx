import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

// CGI-style black hole transition rendered in a WebGL fragment shader:
// lensed starfield, tilted accretion disk (Doppler-brightened), photon ring,
// frame-dragging swirl, fall through the event horizon, tunnel, light burst.
const FRAG = `
precision highp float;
uniform vec2 res;
uniform float t;
uniform float p;

float hash(vec2 v){ return fract(sin(dot(v, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 v){
  vec2 i = floor(v), f = fract(v);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x),
             mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
}
float fbm(vec2 v){ float a=0.5, s=0.0; for(int i=0;i<5;i++){ s+=a*noise(v); v*=2.03; a*=0.5; } return s; }
vec2 rot(vec2 v, float a){ float c=cos(a), s=sin(a); return vec2(c*v.x-s*v.y, s*v.x+c*v.y); }

vec3 stars(vec2 v){
  vec3 c = vec3(0.0);
  for(int l=0;l<3;l++){
    float sc = 6.0 + float(l)*9.0;
    vec2 g = v*sc;
    vec2 id = floor(g);
    vec2 f = fract(g) - 0.5;
    float h = hash(id + float(l)*17.0);
    if(h > 0.86){
      vec2 o = vec2(hash(id+3.1), hash(id+7.7)) - 0.5;
      float d = length(f - o*0.7);
      float b = (1.0 - smoothstep(0.0, 0.08, d)) * (h-0.86)*7.0;
      c += b * mix(vec3(0.75,0.8,1.0), vec3(1.0,0.9,0.85), hash(id+1.3));
    }
  }
  return c;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5*res) / res.y;

  // camera falls toward the hole
  float e = smoothstep(0.08, 0.80, p);
  float zoom = mix(1.0, 0.045, e*e*e);
  vec2 q = rot(uv, 0.15) * zoom;
  float rs = 0.085;                      // event horizon radius
  float r = length(q);
  float ang = atan(q.y, q.x);
  vec2 dir = q / max(r, 1e-4);

  // gravitational lensing + frame-dragging swirl of the background
  float lens = 1.0 + (rs*rs*2.6) / max(r*r, 1e-5);
  vec2 lq = q * lens;
  lq = rot(lq, (0.25 + 2.8*e) * rs / (r + 0.03) + t*0.05);
  vec3 bg = stars(lq*1.4);
  float neb = fbm(lq*2.2 + vec2(t*0.03, 0.0));
  bg += vec3(0.33,0.22,0.75) * pow(neb, 3.0) * 0.55;
  bg += vec3(0.75,0.25,0.65) * pow(fbm(lq*3.1 - 4.0), 4.0) * 0.35;

  // accretion disk in a tilted plane
  float tilt = 0.26;
  vec2 dq = vec2(q.x, q.y / tilt);
  float dr = length(dq);
  float da = atan(dq.y, dq.x);
  float inner = rs*1.65, outer = rs*6.5;
  float dm = smoothstep(inner, inner*1.18, dr) * (1.0 - smoothstep(outer*0.65, outer, dr));
  float flow = da*2.0 - log(max(dr,1e-4))*7.0 + t*3.2;
  float streak = fbm(vec2(flow, dr*26.0));
  float dopp = 0.5 + 0.5*cos(da - 0.4);
  vec3 hot = mix(vec3(1.0,0.96,0.9), vec3(0.62,0.48,1.0), smoothstep(inner, outer*0.85, dr));
  hot = mix(hot, vec3(0.95,0.55,0.95), smoothstep(outer*0.4, outer, dr)*0.5);
  vec3 disk = hot * dm * (0.35 + 1.25*streak) * (0.3 + 1.55*pow(dopp, 1.6));

  // lensed image of the far side of the disk: arcs bent over the top and
  // under the bottom of the shadow (weak at the sides, like real lensing)
  float arcBand = exp(-pow((r - rs*1.28)/(rs*0.16), 2.0));
  float topBottom = pow(abs(sin(ang)), 1.4);
  float arcN = 0.45 + 0.55*fbm(vec2(ang*2.5 + t*2.2, r*40.0));
  float arcDopp = 0.45 + 0.55*pow(0.5 + 0.5*cos(ang - 0.4), 1.5);
  vec3 halo = mix(vec3(1.0,0.9,0.85), vec3(0.62,0.48,1.0), 0.35)
            * arcBand * topBottom * arcN * arcDopp * 1.3;

  // thin photon ring hugging the shadow, Doppler-brighter on one side
  float pr = exp(-pow((r - rs*1.07)/(rs*0.022), 2.0));
  float prDopp = 0.25 + 1.1*pow(0.5 + 0.5*cos(ang - 0.4), 2.0);
  vec3 ring = vec3(1.0,0.95,0.9) * pr * prDopp * 1.4;

  // composite: background + far-side light, masked by the horizon,
  // then the near half of the disk passes in front of the hole
  float horizon = smoothstep(rs*0.97, rs*1.04, r);
  vec3 col = (bg + halo + disk*step(0.0, q.y)) * horizon + ring;
  col += disk * step(q.y, 0.0);

  // inside the horizon: rushing tunnel
  float inside = smoothstep(0.74, 0.84, p) * (1.0 - smoothstep(0.92, 0.98, p));
  float tr = length(uv);
  float ta = atan(uv.y, uv.x);
  float tun = fbm(vec2(ta*5.0 + t*0.8, 1.6/max(tr,0.02) - t*9.0));
  vec3 tunnel = mix(vec3(0.35,0.25,0.95), vec3(0.9,0.5,1.0), tun) * pow(tun, 2.4) * 2.8 * smoothstep(0.02, 0.7, tr);
  col = mix(col, tunnel, inside);

  // portal into another dimension: a ray-filled violet light opening from
  // the centre (textured and falling off to deep violet, never flat white)
  float portal = smoothstep(0.84, 0.97, p);
  float pRad = 0.05 + portal * 1.6;
  float rays = pow(fbm(vec2(ta*9.0, t*1.5)), 2.2) * 1.6;
  float core = 1.0 - smoothstep(0.0, pRad*0.45 + 1e-3, tr);
  float glow = 1.0 - smoothstep(pRad*0.2, pRad + 1e-3, tr);
  vec3 light = vec3(0.32,0.22,0.85) * glow * (0.6 + rays)
             + vec3(0.95,0.9,1.0) * core * (0.8 + 0.4*rays);
  col = mix(col, light, portal * glow);
  // settle into darkness so the page fades up cleanly
  col *= 1.0 - smoothstep(0.95, 1.0, p) * 0.85;

  // fade in, vignette, filmic tonemap
  col *= smoothstep(0.0, 0.12, p);
  col *= 1.0 - 0.35*smoothstep(0.55, 1.1, length(uv));
  col = 1.0 - exp(-col * 1.35);
  col = pow(col, vec3(0.92));
  gl_FragColor = vec4(col, 1.0);
}
`;

const VERT = `attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;

export default function BlackHoleWarp({ onDone }) {
  const ref = useRef(null);

  useEffect(() => {
    const reduce =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const DUR = reduce ? 300 : 4800;
    const canvas = ref.current;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) {
      onDone && onDone();
      return;
    }

    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      onDone && onDone();
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, "res");
    const uT = gl.getUniformLocation(prog, "t");
    const uP = gl.getUniformLocation(prog, "p");

    const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    const resize = () => {
      canvas.width = Math.floor(window.innerWidth * DPR);
      canvas.height = Math.floor(window.innerHeight * DPR);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    let raf;
    let start;
    let done = false;
    const tick = (now) => {
      if (!start) start = now;
      const el = now - start;
      const p = Math.min(el / DUR, 1);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uT, el / 1000);
      gl.uniform1f(uP, p);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (p < 1) raf = requestAnimationFrame(tick);
      else if (!done) {
        done = true;
        onDone && onDone();
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      const ext = gl.getExtension("WEBGL_lose_context");
      ext && ext.loseContext();
    };
  }, [onDone]);

  return (
    <motion.div
      key="blackhole"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9, ease: "easeOut" }}
      className="fixed inset-0 z-[9998] bg-black"
      aria-hidden="true"
    >
      <canvas ref={ref} className="h-full w-full" />
    </motion.div>
  );
}
