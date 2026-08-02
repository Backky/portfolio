import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimation, useInView, useScroll, useSpring, useTransform } from "framer-motion";
import {
  ArrowRight,
  Download,
  ExternalLink,
  Github,
  Globe,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";
import { warpShipPath } from "./warpPath";
const FaceBackground = lazy(() => import("./FaceBackground"));
const WarpShip = lazy(() => import("./WarpShip"));
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";

/**
 * Personal Portfolio (single-file page)
 * - React + Tailwind + Framer Motion
 * - Replace placeholders (links, email, projects) as needed
 */

// ---------- helpers ----------
function useParallax(max = 18) {
  const ref = useRef(null);
  const [xy, setXy] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const x = (px - 0.5) * 2;
      const y = (py - 0.5) * 2;
      setXy({ x: x * max, y: y * max });
    };
    const onLeave = () => setXy({ x: 0, y: 0 });

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [max]);

  return { ref, xy };
}

function clamp(n, a, b) {
  return Math.min(b, Math.max(a, n));
}

function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Top scroll-progress bar
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });
  return (
    <motion.div
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[90] h-[3px] origin-left bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-cyan-400"
    />
  );
}

// Scroll-reveal wrapper: fades + slides children in when they enter view
function Reveal({ children, delay = 0, y = 28, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Card that lifts + glows on hover and reveals on scroll
function HoverCard({ children, delay = 0, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`group/hc rounded-xl transition-shadow duration-300 hover:shadow-[0_30px_80px_-40px_rgba(168,85,247,0.5)] ${className}`}
    >
      {children}
    </motion.div>
  );
}

function TechMarquee() {
  const items = [
    "React", "Node.js", "MongoDB", "Express", "TypeScript", "Tailwind CSS",
    "Framer Motion", "REST APIs", "JWT Auth", "Cron Jobs", "Mongoose", "Vite",
    "eSewa", "Riot API", "Offerwalls",
  ];
  const row = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-white/10 bg-white/[0.02] py-5">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-black to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-black to-transparent" />
      <div className="flex w-max animate-marquee items-center gap-10 whitespace-nowrap">
        {row.map((t, i) => (
          <span
            key={i}
            className="label-mono inline-flex items-center gap-3 text-sm text-white/45"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400/60" />
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

// Live GitHub contributions heatmap (no token; free public API)
function GitHubContributions({ username = "Backky" }) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let alive = true;
    fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((j) => {
        if (!alive) return;
        setData(j);
        setStatus("ok");
      })
      .catch(() => alive && setStatus("error"));
    return () => {
      alive = false;
    };
  }, [username]);

  // cell colour by contribution level (matches site accent palette)
  const levelClass = [
    "bg-white/[0.05]",
    "bg-indigo-500/30",
    "bg-indigo-500/60",
    "bg-fuchsia-500/70",
    "bg-fuchsia-400",
  ];

  // group flat day list into weekday-aligned week columns
  const weeks = useMemo(() => {
    if (!data?.contributions?.length) return [];
    const days = data.contributions;
    const out = [];
    let week = new Array(new Date(days[0].date).getDay()).fill(null);
    for (const d of days) {
      week.push(d);
      if (week.length === 7) {
        out.push(week);
        week = [];
      }
    }
    if (week.length) out.push([...week, ...Array(7 - week.length).fill(null)]);
    return out;
  }, [data]);

  const total = data?.total?.lastYear ?? 0;

  return (
    <section className="py-8">
      <SectionTitle
        eyebrow="Activity"
        title="Live from GitHub"
        desc="My real contribution graph over the last year — it updates automatically as I push code."
      />

      <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-white/80">
            {status === "ok" ? (
              <>
                <span className="font-semibold text-white">{total}</span> contributions
                in the last year
              </>
            ) : status === "error" ? (
              "Couldn't load contributions right now."
            ) : (
              "Loading contributions…"
            )}
          </p>
          <a
            href={`https://github.com/${username}`}
            target="_blank"
            rel="noreferrer"
            className="label-mono inline-flex items-center gap-2 text-[10px] text-white/55 transition-colors hover:text-fuchsia-300"
          >
            <Github className="h-3.5 w-3.5" />
            @{username}
          </a>
        </div>

        {status === "ok" && (
          <>
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-[3px]">
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-[3px]">
                    {week.map((day, di) => (
                      <motion.span
                        key={di}
                        initial={{ opacity: 0, scale: 0.5 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.25, delay: Math.min(wi * 0.006, 1) }}
                        title={day ? `${day.date}: ${day.count} contributions` : ""}
                        className={`h-[11px] w-[11px] rounded-[3px] ${
                          day ? levelClass[day.level] : "bg-transparent"
                        }`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-end gap-2 text-[10px] text-white/50">
              <span>Less</span>
              {levelClass.map((c, i) => (
                <span key={i} className={`h-[11px] w-[11px] rounded-[3px] ${c}`} />
              ))}
              <span>More</span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

// Shockwave ripple wherever the user clicks empty space
function RippleLayer() {
  const [ripples, setRipples] = useState([]);

  useEffect(() => {
    let id = 0;
    const spawn = (x, y) => {
      const burst = { id: id++, x, y };
      setRipples((r) => [...r, burst]);
      setTimeout(() => setRipples((r) => r.filter((b) => b !== burst)), 1200);
    };

    const onClick = (e) => {
      // only genuine empty space — skip interactive elements & the 3D canvas
      if (
        e.target.closest(
          "a,button,input,textarea,select,summary,canvas,[role='button'],[role='dialog']"
        )
      )
        return;
      spawn(e.clientX, e.clientY);
    };
    const onHeroWave = (e) => spawn(e.detail.x, e.detail.y);

    window.addEventListener("click", onClick);
    window.addEventListener("click-wave", onHeroWave);
    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("click-wave", onHeroWave);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[70]" aria-hidden="true">
      {ripples.map((b) => (
        <span key={b.id} className="absolute" style={{ left: b.x, top: b.y }}>
          {/* soft flash core */}
          <span
            className="absolute rounded-full"
            style={{
              width: 90,
              height: 90,
              transform: "translate(-50%, -50%)",
              animation: "ripple-flash 0.55s ease-out forwards",
              background:
                "radial-gradient(circle, rgba(199,210,254,0.5) 0%, rgba(199,210,254,0.12) 45%, transparent 70%)",
            }}
          />
          {/* expanding rings */}
          {[0, 0.12, 0.26].map((delay, i) => (
            <span
              key={i}
              className="absolute rounded-full"
              style={{
                width: 150,
                height: 150,
                transform: "translate(-50%, -50%)",
                border: `${2 - i * 0.5}px solid rgba(196,181,253,${0.65 - i * 0.15})`,
                boxShadow: "0 0 14px rgba(165,180,252,0.25)",
                animation: `ripple-wave ${0.75 + i * 0.15}s cubic-bezier(0.16,1,0.3,1) ${delay}s forwards`,
                opacity: 0,
              }}
            />
          ))}
        </span>
      ))}
    </div>
  );
}

// Persistent deep-space background: twinkling stars + occasional shooting stars
function SpaceBackground() {
  const ref = useRef(null);
  useEffect(() => {
    const reduce =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let W, H, raf;
    const resize = () => {
      W = canvas.width = window.innerWidth * DPR;
      H = canvas.height = window.innerHeight * DPR;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
    };
    resize();
    window.addEventListener("resize", resize);

    // depth: 0 = far (slow parallax, faint), 1 = near (fast parallax, bright)
    const stars = Array.from({ length: 220 }, () => {
      const depth = Math.random();
      return {
        x: Math.random(),
        y: Math.random(),
        r: (0.3 + depth * 1.3) * DPR,
        tw: Math.random() * Math.PI * 2,
        sp: 0.6 + Math.random() * 1.8,
        depth,
        drift: (0.1 + depth * 0.5) * DPR, // constant slow downward drift
      };
    });

    let scrollY = 0;
    const onScroll = () => {
      scrollY = window.scrollY * DPR;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    let shooters = [];
    let lastSpawn = 0;
    let nextSpawn = 600;
    const start = performance.now();

    const tick = (now) => {
      const t = now - start;
      ctx.clearRect(0, 0, W, H);

      // twinkling + drifting + scroll-parallax stars
      for (const s of stars) {
        const a = 0.4 + 0.6 * Math.sin(t * 0.0012 * s.sp + s.tw);
        // base position + constant drift + scroll parallax, wrapped vertically
        let yy = s.y * H + t * 0.001 * s.drift * 60 + scrollY * (0.15 + s.depth * 0.5);
        yy = ((yy % H) + H) % H;
        const r = 0.4 + s.depth * 0.6; // bluer/brighter when nearer
        ctx.beginPath();
        ctx.fillStyle = `rgba(${Math.round(200 + r * 55)},${Math.round(215 + r * 40)},255,${0.15 + a * 0.55})`;
        ctx.arc(s.x * W, yy, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduce) {
        // spawn shooting stars (frequent)
        if (now - lastSpawn > nextSpawn) {
          lastSpawn = now;
          nextSpawn = 900 + Math.random() * 2400;
          const fromLeft = Math.random() < 0.5;
          shooters.push({
            x: fromLeft ? -60 : W + 60,
            y: Math.random() * H * 0.55,
            vx: (fromLeft ? 1 : -1) * (9 + Math.random() * 7) * DPR,
            vy: (3 + Math.random() * 3.5) * DPR,
            life: 0,
            max: 850 + Math.random() * 600,
          });
        }
        // draw + update shooting stars
        shooters = shooters.filter((s) => s.life < s.max);
        for (const s of shooters) {
          s.life += 16;
          s.x += s.vx;
          s.y += s.vy;
          const ang = Math.atan2(s.vy, s.vx);
          const len = Math.hypot(s.vx, s.vy) * 7;
          const tx = s.x - Math.cos(ang) * len;
          const ty = s.y - Math.sin(ang) * len;
          const fade = 1 - s.life / s.max;
          const grad = ctx.createLinearGradient(s.x, s.y, tx, ty);
          grad.addColorStop(0, `rgba(255,255,255,${0.85 * fade})`);
          grad.addColorStop(0.4, `rgba(190,210,255,${0.35 * fade})`);
          grad.addColorStop(1, "rgba(255,255,255,0)");
          ctx.strokeStyle = grad;
          ctx.lineWidth = 2 * DPR;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(tx, ty);
          ctx.stroke();
          ctx.beginPath();
          ctx.fillStyle = `rgba(255,255,255,${fade})`;
          ctx.arc(s.x, s.y, 1.7 * DPR, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}

function FancyDivider() {
  return (
    <div className="relative my-10">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-white/70 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
        <span className="inline-flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5" />
          <span></span>
        </span>
      </div>
    </div>
  );
}

function GlowBlob({ className = "" }) {
  return (
    <div
      className={`pointer-events-none absolute rounded-full blur-3xl opacity-35 ${className}`}
      aria-hidden="true"
    />
  );
}

function GrainOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay"
      style={{
        backgroundImage:
          "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"120\" height=\"120\"><filter id=\"n\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"3\" stitchTiles=\"stitch\"/></filter><rect width=\"120\" height=\"120\" filter=\"url(%23n)\" opacity=\"0.35\"/></svg>')",
      }}
    />
  );
}

function AnimatedCounter({ value, suffix = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { margin: "-10% 0px" });
  const controls = useAnimation();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    controls.start({ t: 1, transition: { duration: 1.1, ease: "easeOut" } });
  }, [inView, controls]);

  useEffect(() => {
    let raf;
    const from = 0;
    const to = value;
    const start = performance.now();
    const dur = 1100;

    const tick = (now) => {
      const p = clamp((now - start) / dur, 0, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    if (inView) raf = requestAnimationFrame(tick);
    return () => raf && cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {display}
      {suffix}
    </span>
  );
}

function SectionTitle({ eyebrow, title, desc }) {
  return (
    <div className="mb-8">
      <div className="label-mono inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] text-fuchsia-200/80">
        <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400" />
        <span>{eyebrow}</span>
      </div>
      <motion.h2
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="animate-gradient-pan mt-4 bg-gradient-to-r from-white via-fuchsia-200 to-indigo-300 bg-[length:200%_auto] bg-clip-text text-3xl font-semibold tracking-tight text-transparent md:text-4xl"
      >
        {title}
      </motion.h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">
        {desc}
      </p>
    </div>
  );
}

function TechPill({ children }) {
  // "Learning: X" renders as a dashed, muted pill so it never reads as
  // claimed expertise
  const text = typeof children === "string" ? children : "";
  const learning = text.startsWith("Learning:");

  if (learning) {
    return (
      <span className="inline-flex cursor-default items-center gap-1.5 rounded-full border border-dashed border-cyan-400/40 bg-cyan-500/5 px-3 py-1 text-xs text-cyan-200/80 transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-300/60 hover:text-cyan-100">
        <span className="label-mono text-[8px] opacity-70">LEARNING</span>
        {text.replace("Learning:", "").trim()}
      </span>
    );
  }

  return (
    <span className="inline-flex cursor-default items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 hover:border-indigo-400/40 hover:bg-indigo-500/10 hover:text-white hover:shadow-[0_6px_18px_-8px_rgba(99,102,241,0.7)]">
      {children}
    </span>
  );
}

function ProjectCard({ p, index }) {
  const { ref, xy } = useParallax(12);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      viewport={{ once: true, margin: "-12%" }}
      transition={{ duration: 0.55, delay: index * 0.06 }}
      className="group relative [transform-style:preserve-3d]"
      style={{
        transform: `perspective(1000px) rotateX(${-xy.y * 0.5}deg) rotateY(${xy.x * 0.5}deg)`,
      }}
    >
      <Card className="relative overflow-hidden border-white/10 bg-white/5 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)] backdrop-blur transition-shadow duration-300 group-hover:shadow-[0_40px_120px_-40px_rgba(168,85,247,0.45)]">
        <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-indigo-500/20 blur-2xl" />
          <div className="absolute -right-24 -bottom-24 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-2xl" />
        </div>

        <CardHeader className="relative">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-white">{p.title}</CardTitle>
              <p className="mt-2 text-sm text-white/70">{p.subtitle}</p>
            </div>
            <Badge className="border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-200" variant="outline">
              {p.tag}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="relative">
          <div className="flex flex-wrap gap-2">
            {p.stack.map((s) => (
              <TechPill key={s}>{s}</TechPill>
            ))}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-white/75">{p.desc}</p>

          {p.metrics?.length ? (
            <div className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10">
              {p.metrics.map((m) => (
                <div key={m.k} className="bg-black/40 p-3 text-center transition-colors duration-300 hover:bg-fuchsia-500/10">
                  <p className="text-sm font-semibold text-white">{m.v}</p>
                  <p className="label-mono mt-1 text-[9px] text-white/45">{m.k}</p>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {p.links?.live && (
              <Button
                className="border border-white/10 bg-gradient-to-r from-indigo-500/80 to-fuchsia-500/80 text-white shadow-[0_8px_30px_-10px_rgba(168,85,247,0.6)] transition-transform duration-200 hover:scale-[1.03] hover:from-indigo-500 hover:to-fuchsia-500 active:scale-95"
                onClick={() => window.open(p.links.live, "_blank")}
              >
                <Globe className="mr-2 h-4 w-4" />
                Live
                <ExternalLink className="ml-2 h-4 w-4 opacity-80" />
              </Button>
            )}
          </div>

          <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />

          <div className="mt-4 flex items-center justify-between text-xs text-white/60">
            <span className="label-mono inline-flex items-center gap-2 text-[10px]">
              <span className="relative flex h-2 w-2">
                {p.status === "Live" && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${
                    p.status === "Live" ? "bg-emerald-400" : "bg-white/60"
                  }`}
                />
              </span>
              {p.status}
            </span>
            <span className="label-mono text-[10px]">{p.when}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function TimelineItem({ item, i }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-12%" }}
      transition={{ duration: 0.45, delay: i * 0.05 }}
      className="relative pl-10"
    >
      <div className="absolute left-[10px] top-2 h-3 w-3 rounded-full border border-white/25 bg-white/20" />
      <div className="absolute left-[15px] top-5 h-[calc(100%+14px)] w-px bg-white/15" />
      <motion.div
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.35}
        dragTransition={{ bounceStiffness: 320, bounceDamping: 22 }}
        whileDrag={{ scale: 1.04, rotate: -1.5, zIndex: 30 }}
        whileHover={{ y: -3 }}
        className="cursor-grab rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur transition-shadow duration-300 hover:border-fuchsia-400/30 hover:shadow-[0_24px_60px_-30px_rgba(168,85,247,0.55)] active:cursor-grabbing"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-white">{item.title}</p>
            <p className="mt-1 text-xs text-white/70">{item.org}</p>
          </div>
          <Badge variant="outline" className="border-white/15 bg-transparent text-white/80">
            {item.time}
          </Badge>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-white/75">{item.desc}</p>
        {item.highlights?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {item.highlights.map((h) => (
              <TechPill key={h}>{h}</TechPill>
            ))}
          </div>
        ) : null}
      </motion.div>
    </motion.div>
  );
}

// IDE-style code editor rendering the skills as syntax-highlighted code
function CodeSkills({ skills }) {
  const C = {
    kw: "text-fuchsia-400",
    var: "text-cyan-300",
    key: "text-indigo-300",
    str: "text-emerald-300",
    learn: "text-amber-300",
    pun: "text-white/40",
    com: "text-white/30",
  };
  const keyFor = {
    Frontend: "frontend",
    Backend: "backend",
    "Data / AI": "ai",
    Product: "product",
  };

  const lines = [];
  lines.push([{ t: "// my toolkit — always growing", c: "com" }]);
  lines.push([
    { t: "const", c: "kw" },
    { t: " ", c: "pun" },
    { t: "shrabya", c: "var" },
    { t: " = ", c: "pun" },
    { t: "{", c: "pun" },
  ]);
  skills.forEach((s) => {
    const key = keyFor[s.title] || s.title.toLowerCase().replace(/[^a-z]/g, "");
    const parts = [
      { t: "  " + key, c: "key" },
      { t: ": [", c: "pun" },
    ];
    s.items.forEach((it, idx) => {
      const learning = it.startsWith("Learning:");
      const clean = it.replace("Learning:", "").trim();
      parts.push({ t: `"${clean}"`, c: learning ? "learn" : "str" });
      if (idx < s.items.length - 1) parts.push({ t: ", ", c: "pun" });
    });
    parts.push({ t: "],", c: "pun" });
    lines.push(parts);
  });
  lines.push([{ t: "};", c: "pun" }]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b0d16] shadow-[0_40px_120px_-60px_rgba(0,0,0,0.9)]"
    >
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <span className="font-mono-ui ml-3 rounded-md bg-white/5 px-2.5 py-0.5 text-[11px] text-white/60">
          skills.js
        </span>
        <span className="label-mono ml-auto text-[9px] text-white/30">JavaScript</span>
      </div>

      {/* code body */}
      <div className="font-mono-ui overflow-x-auto px-4 py-4 text-[13px] leading-7 sm:text-sm">
        {lines.map((parts, i) => (
          <div key={i} className="flex whitespace-pre">
            <span className="mr-5 w-5 shrink-0 select-none text-right text-white/20">
              {i + 1}
            </span>
            <code>
              {parts.map((p, j) => (
                <span key={j} className={C[p.c]}>
                  {p.t}
                </span>
              ))}
            </code>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// A word that slides up into place through a clipped mask (staggered reveal)
function MaskWord({ children, delay = 0 }) {
  return (
    <span className="inline-block overflow-hidden pb-[0.12em] align-bottom">
      <motion.span
        className="inline-block"
        initial={{ y: "115%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.span>
    </span>
  );
}

// Hyperspace warp between the ENTER gate and the main page: first-person
// light-speed jump toward a galaxy, with a synthesized engine/whoosh sound.
function WarpTransition({ onDone }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const reduce =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const DUR = reduce ? 250 : 3000;

    // ---------- sound (Web Audio, no asset) ----------
    let cleanupAudio = () => {};
    let audioGain = null; // updated per-frame by the ship's distance
    if (!reduce) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        const ac = new AC();
        ac.resume && ac.resume();
        const t0 = ac.currentTime;
        const master = ac.createGain();
        master.gain.value = 0.0001; // driven manually in the tick loop
        master.connect(ac.destination);
        audioGain = master;

        // rising engine (sawtooth sweeping up)
        const osc = ac.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(45, t0);
        osc.frequency.exponentialRampToValueAtTime(340, t0 + 2.3);
        const oscGain = ac.createGain();
        oscGain.gain.value = 0.12;
        osc.connect(oscGain).connect(master);

        // whoosh (band-passed white noise sweeping up)
        const size = 2 * ac.sampleRate;
        const buf = ac.createBuffer(1, size, ac.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
        const noise = ac.createBufferSource();
        noise.buffer = buf;
        noise.loop = true;
        const bp = ac.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.setValueAtTime(280, t0);
        bp.frequency.exponentialRampToValueAtTime(4200, t0 + 2.0);
        bp.Q.value = 0.7;
        const noiseGain = ac.createGain();
        noiseGain.gain.value = 0.2;
        noise.connect(bp).connect(noiseGain).connect(master);

        osc.start(t0);
        noise.start(t0);
        osc.stop(t0 + 3.1);
        noise.stop(t0 + 3.1);
        cleanupAudio = () => {
          try {
            osc.stop();
            noise.stop();
            ac.close();
          } catch {}
        };
      } catch {}
    }

    // ---------- visuals ----------
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let W, H, cx, cy, raf, start, maxR;
    const resize = () => {
      W = canvas.width = window.innerWidth * DPR;
      H = canvas.height = window.innerHeight * DPR;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      cx = W / 2;
      cy = H / 2;
      maxR = Math.hypot(W, H) * 0.62;
    };
    resize();
    window.addEventListener("resize", resize);

    const N = 440;
    const mk = (spread = 1) => ({
      ang: Math.random() * Math.PI * 2,
      r: Math.random() * maxR * spread,
    });
    const stars = Array.from({ length: N }, () => mk());

    const tick = (now) => {
      if (!start) start = now;
      const t = now - start;
      const p = Math.min(t / DUR, 1);

      // follow the ship: the warp centre tracks its screen position, and the
      // engine sound rises/falls with how near the ship is
      const path = warpShipPath(p);
      cx = W / 2 + path.nx * W * 0.32;
      cy = H / 2 - path.ny * H * 0.32;
      if (audioGain) {
        const fadeIn = Math.min(1, p / 0.1);
        const fadeOut = Math.min(1, (1 - p) / 0.12);
        audioGain.gain.value = fadeIn * fadeOut * (0.08 + path.near * 0.6);
      }

      // accelerate hard, then ease at arrival
      const speed = (2 + p * p * 65) * DPR * 6;

      // deep-space motion-blur trails (dark, so streaks never wash to white)
      ctx.fillStyle = "rgba(3,4,14,0.28)";
      ctx.fillRect(0, 0, W, H);

      // refined violet destination glow (subtle, grows as we approach)
      const gR = W * (0.06 + p * 0.45);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, gR);
      g.addColorStop(0, `rgba(150,120,255,${0.05 + p * 0.1})`);
      g.addColorStop(0.4, `rgba(90,70,190,${0.03 + p * 0.06})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, gR, 0, Math.PI * 2);
      ctx.fill();

      // perfectly radial hyperspace streaks accelerating outward from centre
      const spd = (0.008 + p * p * 0.05); // fraction of radius per frame
      for (const s of stars) {
        const pr = s.r;
        s.r += pr * spd + (1.5 + p * 6) * DPR;
        if (s.r > maxR) {
          Object.assign(s, mk(0.06)); // respawn near the centre
          continue;
        }
        const near = s.r / maxR; // 0 centre, 1 edge
        const cos = Math.cos(s.ang);
        const sin = Math.sin(s.ang);
        const x1 = cx + cos * pr;
        const y1 = cy + sin * pr;
        const x2 = cx + cos * s.r;
        const y2 = cy + sin * s.r;
        const rr = Math.round(120 + near * 100);
        const gg = Math.round(150 + near * 90);
        ctx.strokeStyle = `rgba(${rr},${gg},255,${0.15 + near * 0.55})`;
        ctx.lineWidth = Math.max(0.5, near * 2.2) * DPR;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // calm dark vignette in the centre so the ship reads cleanly
      const vig = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.55);
      vig.addColorStop(0, "rgba(3,4,14,0.5)");
      vig.addColorStop(0.32, "rgba(3,4,14,0.15)");
      vig.addColorStop(0.62, "rgba(3,4,14,0)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      // soft light-speed bloom near the jump (radial, not a hard white flash)
      if (p > 0.72 && p < 0.9) {
        const f = 1 - Math.abs((p - 0.81) / 0.09);
        if (f > 0) {
          const fl = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.7);
          fl.addColorStop(0, `rgba(225,235,255,${0.7 * f})`);
          fl.addColorStop(0.5, `rgba(150,170,255,${0.25 * f})`);
          fl.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = fl;
          ctx.fillRect(0, 0, W, H);
        }
      }

      // ease in from black at the start so the warp doesn't pop on
      if (p < 0.18) {
        ctx.fillStyle = `rgba(0,0,0,${1 - p / 0.18})`;
        ctx.fillRect(0, 0, W, H);
      }

      // fade to solid black over the final stretch for a clean landing
      if (p > 0.82) {
        ctx.fillStyle = `rgba(0,0,0,${Math.min(1, (p - 0.82) / 0.16)})`;
        ctx.fillRect(0, 0, W, H);
      }

      if (t < DUR) raf = requestAnimationFrame(tick);
      else onDone && onDone();
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      cleanupAudio();
    };
  }, [onDone]);

  return (
    <motion.div
      key="warp"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[9998] bg-black"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="h-full w-full" />
      {/* 3D spaceship flying through the warp, over the star streaks */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ animation: "warp-ship-out 3000ms linear forwards" }}
      >
        <Suspense fallback={null}>
          <WarpShip />
        </Suspense>
      </div>
    </motion.div>
  );
}

// Full-screen "ENTER" curtain; fades out and unmounts to reveal the hero
function IntroGate({ onEnter }) {
  return (
    <motion.div
      key="intro-gate"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.65, ease: [0.65, 0, 0.35, 1] }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black px-6"
    >
      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.6 }}
        className="label-mono mb-7 text-[10px] text-white/40"
      >
        Shrabya Paudel · Portfolio
      </motion.p>

      <h1
        className="text-center text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-7xl md:text-8xl"
        style={{ WebkitTextStroke: "1.5px rgba(255,255,255,0.9)", color: "transparent" }}
      >
        <MaskWord delay={0.2}>WELCOME</MaskWord>
      </h1>

      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.6 }}
        className="mt-5 text-center text-sm text-white/50 sm:text-base"
      >
        Crafting high-performance digital experiences
      </motion.p>

      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        onClick={onEnter}
        className="group mt-10 inline-flex items-center gap-2 rounded-full border border-white/20 bg-gradient-to-r from-indigo-500/80 to-fuchsia-500/80 px-8 py-3 text-sm font-semibold text-white shadow-[0_12px_40px_-12px_rgba(168,85,247,0.7)] transition-all duration-300 hover:scale-105 hover:from-indigo-500 hover:to-fuchsia-500"
      >
        ENTER
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </motion.button>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="animate-drift absolute left-[15%] top-[20%] h-64 w-64 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="animate-float-y-slow absolute bottom-[18%] right-[18%] h-72 w-72 rounded-full bg-fuchsia-600/20 blur-3xl" />
      </motion.div>
    </motion.div>
  );
}

// ---------- main page ----------
export default function PortfolioShrabya() {
  // Replace with your real info
  const profile = useMemo(
    () => ({
      name: "Shrabya Paudel",
      role: "Full Stack Developer",
      location: "Nepal",
      phone: "+977 9748263475",
      email: "shrabya.paudel112@gmail.com",
      tagline:
        "I design and build full‑stack web platforms — tracking real‑time game stats, orchestrating missions, and turning player performance into rewards.",
      socials: {
        github: "https://github.com/Backky",
        linkedin: "https://www.linkedin.com/in/shrabya-paudel-703055394/?trk=public-profile-join-page",
        website: "https://",
      },
      resumeUrl: "https://docs.google.com/document/d/17g1znbg0qaE17DpC2wvXfoAlZoMSvW3d/export?format=pdf", // downloads the resume as PDF
    }),
    []
  );

  const nav = useMemo(
    () => [
      { id: "about", label: "About" },
      { id: "skills", label: "Skills" },
      { id: "projects", label: "Projects" },
      { id: "journey", label: "Journey" },
    ],
    []
  );

  const projects = useMemo(
    () => [
      {
        title: "Rewardly – Tracker‑Reward Web Application",
        subtitle:
          "A full‑stack MERN platform that tracks player stats (Valorant, Apex, CS2), assigns missions, and rewards users with BankCoins.",
        tag: "Flagship",
        stack: ["MongoDB", "Express", "React", "Node.js", "JWT", "Cron", "APIs"],
        desc:
          "Includes account linking + verification (PUUID), mission seeding, progress tracking, reward claiming, offerwalls, eSewa cash‑outs, admin mission management, and a futuristic dashboard UI.",
        links: {
          live: "https://rewardly.click",
          code: "https://github.com/Backky",
        },
        metrics: [
          { k: "Games tracked", v: "3" },
          { k: "Auth", v: "JWT · PUUID" },
          { k: "Payouts", v: "eSewa" },
        ],
        status: "Live",
        when: "2025",
      },
      {
        title: "Citation Verifier — AI Hallucination Checker",
        subtitle:
          "Checks whether AI-generated citations are real or hallucinated, and whether the source actually says what's claimed.",
        tag: "AI",
        stack: ["Node.js", "Express", "Gemini AI", "CrossRef API", "Semantic Scholar", "Vercel"],
        desc:
          "Paste AI-generated text and the app auto-detects citations (URLs, DOIs, academic references), verifies each source actually exists via CrossRef and Semantic Scholar, then uses AI to check if the source really supports the claim. Results stream in real time with Verified, Fabricated, Unverifiable, or Misrepresented badges.",
        links: {
          live: "https://citation-verifier-alpha.vercel.app",
          code: "https://github.com/Backky/citationverify_AI",
        },
        metrics: [
          { k: "AI model", v: "Gemini" },
          { k: "Sources", v: "CrossRef · S2" },
          { k: "Results", v: "Streamed" },
        ],
        status: "Live",
        when: "2026",
      },
          ],
    []
  );

  const timeline = useMemo(
    () => [
      {
        title: "BSc (Hons) Computer Science & Artificial Intelligence",
        org: "University of Wolverhampton (Partner Program)",
        time: "Awaiting Graduation",
        desc:
          "Focused on software engineering, AI fundamentals, and building real-world applications with modern web stacks.",
        highlights: ["Software Engineering", "AI", "Databases", "Cloud"],
      },
      {
        title: "Web App Developer / Computer Officer",
        org: "Corell Company",
        time: "Experience",
        desc:
          "Handled web development, IT operations, and digital workflows—supporting teams with practical, efficient solutions.",
        highlights: ["Web Dev", "IT Support", "Documentation"],
      },
    ],
    []
  );

  const skills = useMemo(
    () => [
      {
        title: "Frontend",
        items: [
          "React",
          "Tailwind CSS",
          "Framer Motion",
          "Responsive UI",
          "Accessibility basics",
        ],
      },
      {
        title: "Backend",
        items: [
          "Node.js",
          "Express",
          "REST APIs",
          "JWT Auth",
          "Cron jobs",
          "MongoDB + Mongoose",
        ],
      },
      {
        title: "Data / AI",
        items: [
          "LLM APIs (Gemini)",
          "AI-powered features",
          "Streaming responses",
          "Python",
          "ML fundamentals",
          // honest: still in progress, marked as such in the UI
          "Learning: RAG",
        ],
      },
      {
        title: "Product",
        items: ["SEO basics", "Google Analytics", "UI polish", "Documentation"],
      },
    ],
    []
  );

  // UI state — intro sequence: "gate" -> "warp" -> "done"
  const [phase, setPhase] = useState("gate");
  const [scrolled, setScrolled] = useState(false);

  // lock scrolling until the intro sequence finishes
  useEffect(() => {
    document.body.style.overflow = phase === "done" ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [phase]);
  const [active, setActive] = useState("about");
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", contact: "", message: "" });
  const [toast, setToast] = useState(null);

  // highlight active section on scroll
  useEffect(() => {
    const ids = nav.map((n) => n.id);
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 30);
      let best = ids[0];
      let bestDist = Number.POSITIVE_INFINITY;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const dist = Math.abs(rect.top - 120);
        if (dist < bestDist) {
          best = id;
          bestDist = dist;
        }
      }
      setActive(best);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [nav]);

  // simple toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const { ref: heroRef, xy: heroXY } = useParallax(22);

  return (
    <div className="min-h-screen overflow-x-clip bg-black text-white">
      <AnimatePresence>
        {phase === "gate" && <IntroGate onEnter={() => setPhase("warp")} />}
        {phase === "warp" && <WarpTransition onDone={() => setPhase("done")} />}
      </AnimatePresence>
      <ScrollProgress />
      <RippleLayer />
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <SpaceBackground />
        <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_12%_10%,rgba(255,255,255,0.10),transparent_55%),radial-gradient(1000px_circle_at_88%_18%,rgba(255,255,255,0.08),transparent_52%),radial-gradient(1000px_circle_at_45%_92%,rgba(255,255,255,0.06),transparent_52%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),transparent_35%,rgba(255,255,255,0.04))]" />
        <GlowBlob className="animate-drift left-[-120px] top-[-120px] h-[360px] w-[360px] bg-indigo-500" />
        <GlowBlob className="animate-float-y-slow right-[-180px] top-[120px] h-[420px] w-[420px] bg-fuchsia-500" />
        <GlowBlob className="animate-drift left-[20%] bottom-[-220px] h-[520px] w-[520px] bg-cyan-500" />
        {/* 3D perspective grid floor */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[55vh] [perspective:600px]"
        >
          <div className="grid-floor absolute inset-0 origin-bottom [transform:rotateX(72deg)]" />
        </div>
        <GrainOverlay />
        {/* ambient 3D robot face — rendered above the overlays so nothing dims it */}
        <div className="pointer-events-none absolute inset-0 opacity-90">
          <Suspense fallback={null}>
            <FaceBackground />
          </Suspense>
        </div>
      </div>

      {/* Fixed left social rail (sample-style) */}
      <div className="fixed bottom-0 left-8 z-40 hidden flex-col items-center gap-5 lg:flex">
        {[
          { icon: Github, label: "GitHub", href: profile.socials.github },
          { icon: Linkedin, label: "LinkedIn", href: profile.socials.linkedin },
          {
            icon: Mail,
            label: "Email",
            href: `https://mail.google.com/mail/?view=cm&fs=1&to=${profile.email}`,
          },
        ].map((c) => (
          <a
            key={c.label}
            href={c.href}
            target="_blank"
            rel="noreferrer"
            aria-label={c.label}
            className="text-white/45 transition-all duration-300 hover:-translate-y-1 hover:text-fuchsia-300"
          >
            <c.icon className="h-5 w-5" />
          </a>
        ))}
        <div className="h-24 w-px bg-gradient-to-b from-white/40 to-transparent" />
      </div>

      {/* Top Nav */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/55 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-3 sm:px-6 lg:px-10">
          <button
            className="group flex items-center gap-3"
            onClick={() => scrollToId("top")}
            aria-label="Go to top"
          >
            <span className="relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <motion.span
                className="absolute inset-0"
                animate={{
                  backgroundPositionX: ["0%", "100%"],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, rgba(255,255,255,0.05), rgba(255,255,255,0.18), rgba(255,255,255,0.05))",
                  backgroundSize: "200% 100%",
                }}
              />
              <span className="relative text-sm font-semibold">S</span>
            </span>
            <div className="text-left">
              <p className="text-sm font-semibold leading-none">{profile.name}</p>
              <p className="mt-1 text-xs text-white/60">{profile.role}</p>
            </div>
          </button>

          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((n) => (
              <button
                key={n.id}
                onClick={() => scrollToId(n.id)}
                className={`rounded-full px-3 py-2 text-sm transition-colors ${
                  active === n.id
                    ? "bg-gradient-to-r from-indigo-500/30 to-fuchsia-500/30 text-white ring-1 ring-inset ring-white/10"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                {n.label}
              </button>
            ))}
            <Button
              className="ml-2 border border-white/10 bg-gradient-to-r from-indigo-500/80 to-fuchsia-500/80 text-white shadow-[0_8px_30px_-10px_rgba(168,85,247,0.6)] transition-transform duration-200 hover:scale-[1.03] hover:from-indigo-500 hover:to-fuchsia-500 active:scale-95"
              onClick={() => setContactOpen(true)}
            >
              Let’s talk <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            <Button
              variant="outline"
              className="border-white/15 bg-transparent text-white hover:bg-white/10"
              onClick={() => setMenuOpen((s) => !s)}
            >
              Menu
            </Button>
          </div>
        </div>

        {menuOpen ? (
          <div className="border-t border-white/10 bg-black/70 backdrop-blur md:hidden">
            <div className="mx-auto max-w-[1400px] px-4 py-3 sm:px-6 lg:px-10">
              <div className="grid gap-2">
                {nav.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      scrollToId(n.id);
                      setMenuOpen(false);
                    }}
                    className={`rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm ${
                      active === n.id ? "bg-white/10" : "" 
                    }`}
                  >
                    {n.label}
                  </button>
                ))}
                <Button
                  className="border border-white/10 bg-gradient-to-r from-indigo-500/80 to-fuchsia-500/80 text-white shadow-[0_8px_30px_-10px_rgba(168,85,247,0.6)] transition-transform duration-200 hover:scale-[1.03] hover:from-indigo-500 hover:to-fuchsia-500 active:scale-95"
                  onClick={() => {
                    scrollToId("contact");
                    setMenuOpen(false);
                  }}
                >
                  Let’s talk <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      {/* Hero */}
      <main id="top" className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
        {/* Contact Modal */}
        {contactOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center px-4"
            role="dialog"
            aria-modal="true"
            aria-label="Contact modal"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setContactOpen(false);
            }}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-[0_40px_140px_-70px_rgba(0,0,0,0.95)] backdrop-blur"
            >
              <div className="absolute inset-0 opacity-70">
                <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -right-24 -bottom-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              </div>

              <div className="relative p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">Contact me</p>
                    <p className="mt-1 text-sm text-white/70">
                      Send a message securely
                    </p>
                  </div>
                  <button
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
                    onClick={() => setContactOpen(false)}
                    aria-label="Close"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-5 space-y-3">
                  <Input
                    value={contactForm.name}
                    onChange={(e) =>
                      setContactForm((s) => ({ ...s, name: e.target.value }))
                    }
                    placeholder="Your name"
                    className="border-white/10 bg-black/30 text-white placeholder:text-white/40"
                  />

                  <Input
                    value={contactForm.contact}
                    onChange={(e) =>
                      setContactForm((s) => ({ ...s, contact: e.target.value }))
                    }
                    placeholder="How should I reach you? (phone/discord/linkedin)"
                    className="border-white/10 bg-black/30 text-white placeholder:text-white/40"
                  />

                  <Textarea
                    value={contactForm.message}
                    onChange={(e) =>
                      setContactForm((s) => ({ ...s, message: e.target.value }))
                    }
                    placeholder="Your message…"
                    className="min-h-[140px] border-white/10 bg-black/30 text-white placeholder:text-white/40"
                  />

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-white/55">
                      Tip: include Discord tag or phone so I can reply.
                    </p>
                    <Button
                      className="border border-white/10 bg-gradient-to-r from-indigo-500/80 to-fuchsia-500/80 text-white shadow-[0_8px_30px_-10px_rgba(168,85,247,0.6)] transition-transform duration-200 hover:scale-[1.03] hover:from-indigo-500 hover:to-fuchsia-500 active:scale-95"
                      disabled={contactLoading}
                      onClick={async () => {
                        const name = contactForm.name.trim();
                        const message = contactForm.message.trim();
                        const contact = contactForm.contact.trim();

                        if (!name || !message) {
                          setToast("Please add your name and message.");
                          return;
                        }

                        setContactLoading(true);
                        try {
                          const FORMSPREE_URL = "https://formspree.io/f/mzznyknv";
                          const res = await fetch(FORMSPREE_URL, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ name, contact, message }),
                          });
                          if (!res.ok) throw new Error("Request failed");
                          setToast("Message sent ✅");
                          setContactForm({ name: "", contact: "", message: "" });
                          setContactOpen(false);
                        } catch {
                          setToast("Could not send. Check backend + VITE_API_URL.");
                        } finally {
                          setContactLoading(false);
                        }
                      }}
                    >
                      {contactLoading ? "Sending…" : "Send"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>

                  
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}

        <section className="relative pt-12 md:pt-16" ref={heroRef}>
          <div className="max-w-3xl">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="label-mono inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] text-emerald-200/80"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                <span>Available for internships &amp; projects</span>
              </motion.div>

              <h1 className="mt-6 text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl md:text-7xl">
                <MaskWord delay={0.1}>Crafting</MaskWord>{" "}
                <MaskWord delay={0.18}>
                  <span className="animate-gradient-pan bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-cyan-400 bg-[length:200%_auto] bg-clip-text text-transparent">
                    elegant
                  </span>
                  ,
                </MaskWord>
                <br />
                <MaskWord delay={0.26}>high‑performance</MaskWord>
                <br />
                <MaskWord delay={0.34}>
                  <span className="text-white/90">web products.</span>
                </MaskWord>
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.2, ease: "easeOut" }}
                className="mt-5 max-w-xl text-sm leading-relaxed text-white/70 md:text-base"
              >
                {profile.tagline}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.28, ease: "easeOut" }}
                className="mt-7 flex flex-wrap items-center gap-3"
              >
                <Button
                  className="border border-white/10 bg-gradient-to-r from-indigo-500/80 to-fuchsia-500/80 text-white shadow-[0_8px_30px_-10px_rgba(168,85,247,0.6)] transition-transform duration-200 hover:scale-[1.03] hover:from-indigo-500 hover:to-fuchsia-500 active:scale-95"
                  onClick={() => scrollToId("projects")}
                >
                  View projects <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  className="border-white/15 bg-transparent text-white hover:bg-white/10"
                  onClick={() => {
                    if (profile.resumeUrl === "#") {
                      setToast("Add your resume PDF link in profile.resumeUrl");
                      return;
                    }
                    window.open(profile.resumeUrl, "_blank");
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Resume
                </Button>

                <div className="ml-0 flex items-center gap-2 md:ml-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="border-white/15 bg-transparent text-white hover:bg-white/10"
                    onClick={() => window.open(profile.socials.github, "_blank")}
                    aria-label="GitHub"
                  >
                    <Github className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="border-white/15 bg-transparent text-white hover:bg-white/10"
                    onClick={() => window.open(profile.socials.linkedin, "_blank")}
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="border-white/15 bg-transparent text-white hover:bg-white/10"
                    onClick={() => window.open(profile.socials.website, "_blank")}
                    aria-label="Website"
                  >
                    <Globe className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.34, ease: "easeOut" }}
                className="mt-8 flex flex-wrap gap-2"
              >
                <TechPill>Gamified systems</TechPill>
                <TechPill>API integrations</TechPill>
                <TechPill>Admin dashboards</TechPill>
                <TechPill>Modern UI/animations</TechPill>
              </motion.div>
            </div>
          </div>
        </section>

        <div className="-mx-4 mt-12 sm:-mx-6 lg:-mx-10">
          <TechMarquee />
        </div>

        {/* About */}
        <section id="about" className="py-8">
          <SectionTitle
            eyebrow="About"
            title="Full-Stack Web Developer focused on modern and scalable design"
            desc="I build modern, scalable web applications with a focus on performance, clean architecture, and polished user experience. I work across frontend, backend, and databases, and enjoy enhancing interfaces with smooth animations and intuitive design."
          />

          <div className="grid gap-4 md:grid-cols-3">
            <HoverCard delay={0}>
              <Card className="h-full border-white/10 bg-white/5 backdrop-blur transition-colors duration-300 group-hover/hc:border-fuchsia-400/30">
                <CardHeader>
                  <CardTitle className="text-white">What I do</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-white/75">
                  Full‑stack MERN apps, dashboards, API integrations, auth systems, and admin panels.
                </CardContent>
              </Card>
            </HoverCard>
            <HoverCard delay={0.08}>
              <Card className="h-full border-white/10 bg-white/5 backdrop-blur transition-colors duration-300 group-hover/hc:border-fuchsia-400/30">
                <CardHeader>
                  <CardTitle className="text-white">What I like</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-white/75">
                  Full Stack MERN Dev, modern UI, clean logic, and shipping features step‑by‑step.
                </CardContent>
              </Card>
            </HoverCard>
            <HoverCard delay={0.16}>
              <Card className="h-full border-white/10 bg-white/5 backdrop-blur transition-colors duration-300 group-hover/hc:border-fuchsia-400/30">
                <CardHeader>
                  <CardTitle className="text-white">What I’m improving</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-white/75">
                  Advanced testing, scalability patterns, and deeper analytics instrumentation.
                </CardContent>
              </Card>
            </HoverCard>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Card className="border-white/10 bg-white/5 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-white/75">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-white/70" />
                  <span>{profile.location}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-white/70" />
                  <span>{profile.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-white/70" />
                  <span>{profile.email}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Quick stats</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-white/60">Years</p>
                  <p className="mt-1 text-lg font-semibold">
                    <AnimatedCounter value={2} suffix="+" />
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-white/60">APIs</p>
                  <p className="mt-1 text-lg font-semibold">
                    <AnimatedCounter value={5} suffix="+" />
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-white/60">Dashboards</p>
                  <p className="mt-1 text-lg font-semibold">
                    <AnimatedCounter value={6} suffix="+" />
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <FancyDivider />

        {/* Skills */}
        <section id="skills" className="py-8">
          <SectionTitle
            eyebrow="Skills"
            title="Strong fundamentals. Stylish delivery."
            desc="I focus on building reliable features with a clean architecture—and then add polished UI motion that makes everything feel premium."
          />

          <CodeSkills skills={skills} />

          <div className="mt-6 rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">My current focus</p>
                <p className="mt-1 text-sm text-white/70">
                  Making rewardly.click more scalable: mission pools, validation, cash-out system and better admin workflows.
                </p>
              </div>
              <Button
                className="border border-white/10 bg-gradient-to-r from-indigo-500/80 to-fuchsia-500/80 text-white shadow-[0_8px_30px_-10px_rgba(168,85,247,0.6)] transition-transform duration-200 hover:scale-[1.03] hover:from-indigo-500 hover:to-fuchsia-500 active:scale-95"
                onClick={() => scrollToId("projects")}
              >
                See it in action <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        <FancyDivider />

        {/* Projects */}
        <section id="projects" className="py-8">
          <SectionTitle
            eyebrow="Projects"
            title="Work that’s meant to be used."
            desc="The work that best shows how I build: real functionality, clean logic, and a polished interface — shipped and running in production."
          />

          <div className="grid gap-5 md:grid-cols-2">
            {projects.map((p, i) => (
              <ProjectCard key={p.title} p={p} index={i} />
            ))}
          </div>

          <div className="mt-6 rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold">Want to see more?</p>
                <p className="mt-1 text-sm text-white/70">
                  Happy to walk you through how rewardly.click was built — the architecture, the API integrations, or the payment flow. Just reach out.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  className="border border-white/10 bg-gradient-to-r from-indigo-500/80 to-fuchsia-500/80 text-white shadow-[0_8px_30px_-10px_rgba(168,85,247,0.6)] transition-transform duration-200 hover:scale-[1.03] hover:from-indigo-500 hover:to-fuchsia-500 active:scale-95"
                  onClick={() => setContactOpen(true)}
                >
                  Contact <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        <FancyDivider />

        {/* Journey */}
        <section id="journey" className="py-8">
          <SectionTitle
            eyebrow="Journey"
            title="Learning fast. Shipping faster."
            desc="A short timeline of where I’ve studied and worked, and what I’m building next."
          />

          <div className="relative grid gap-4">
            {timeline.map((t, i) => (
              <TimelineItem key={t.title} item={t} i={i} />
            ))}
            <div className="pl-10">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-sm font-medium">Next milestone</p>
                <p className="mt-2 text-sm text-white/75">
                  Scale rewardly.click: grow the offerwall network, harden fraud checks, add richer analytics, and ship a mobile‑first experience.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <TechPill>Security</TechPill>
                  <TechPill>Performance</TechPill>
                  <TechPill>UX polish</TechPill>
                  <TechPill>Deployment</TechPill>
                </div>
              </div>
            </div>
          </div>
        </section>

        <FancyDivider />

        {/* Live GitHub activity */}
        <GitHubContributions username="Backky" />

      </main>

      {/* Scroll-to-explore indicator (bottom-right) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: !scrolled ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        className="pointer-events-none fixed bottom-6 right-6 z-40 hidden items-center gap-3 sm:flex"
      >
        <span className="label-mono text-[10px] text-white/55">Scroll to explore</span>
        <span className="relative flex h-9 w-5 items-start justify-center rounded-full border border-white/25">
          <motion.span
            className="mt-1.5 h-1.5 w-1 rounded-full bg-white/80"
            animate={{ y: [0, 10, 0], opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </span>
      </motion.div>

      {/* Toast */}
      {toast ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2"
        >
          <div className="rounded-full border border-white/15 bg-black/70 px-4 py-2 text-sm text-white/85 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)] backdrop-blur">
            {toast}
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}
