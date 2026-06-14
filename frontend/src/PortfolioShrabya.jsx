import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, useAnimation, useInView, useScroll, useSpring, useTransform } from "framer-motion";
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
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
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
      </div>
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

  const nav = [
    { id: "about", label: "About" },
    { id: "skills", label: "Skills" },
    { id: "projects", label: "Projects" },
    { id: "journey", label: "Journey" },
      ];

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
        items: ["Python", "Data analytics basics", "ML fundamentals"],
      },
      {
        title: "Product",
        items: ["SEO basics", "Google Analytics", "UI polish", "Documentation"],
      },
    ],
    []
  );

  // UI state
  const [scrolled, setScrolled] = useState(false);
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
      <ScrollProgress />
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
      </div>

      {/* Fixed side rails (fill the gutters on wide screens) */}
      <div className="pointer-events-none fixed inset-y-0 left-5 z-40 hidden flex-col items-center justify-end gap-5 pb-6 xl:flex">
        <a
          href={profile.socials.github}
          target="_blank"
          rel="noreferrer"
          className="pointer-events-auto text-white/50 transition-colors hover:-translate-y-0.5 hover:text-fuchsia-300"
          aria-label="GitHub"
        >
          <Github className="h-5 w-5" />
        </a>
        <a
          href={profile.socials.linkedin}
          target="_blank"
          rel="noreferrer"
          className="pointer-events-auto text-white/50 transition-colors hover:-translate-y-0.5 hover:text-fuchsia-300"
          aria-label="LinkedIn"
        >
          <Linkedin className="h-5 w-5" />
        </a>
        <a
          href={`mailto:${profile.email}`}
          className="pointer-events-auto text-white/50 transition-colors hover:-translate-y-0.5 hover:text-fuchsia-300"
          aria-label="Email"
        >
          <Mail className="h-5 w-5" />
        </a>
        <div className="h-24 w-px bg-gradient-to-b from-white/30 to-transparent" />
      </div>

      <div className="pointer-events-none fixed inset-y-0 right-5 z-40 hidden flex-col items-center justify-end gap-6 pb-6 xl:flex">
        <a
          href={`mailto:${profile.email}`}
          className="pointer-events-auto [writing-mode:vertical-rl] text-xs tracking-widest text-white/50 transition-colors hover:text-fuchsia-300"
        >
          {profile.email}
        </a>
        <div className="h-24 w-px bg-gradient-to-b from-white/30 to-transparent" />
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
          <div className="grid items-center gap-10 md:grid-cols-2 md:gap-12">
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

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.1, ease: "easeOut" }}
                className="mt-6 text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl md:text-7xl"
              >
                Crafting{" "}
                <span className="animate-gradient-pan bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-cyan-400 bg-[length:200%_auto] bg-clip-text text-transparent">
                  elegant
                </span>
                ,
                <br />
                high‑performance
                <br />
                <span className="text-white/90">web products.</span>
              </motion.h1>

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

            {/* Hero visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative [transform-style:preserve-3d]"
              style={{
                transform: `perspective(1100px) rotateX(${-heroXY.y * 0.35}deg) rotateY(${heroXY.x * 0.35}deg)`,
              }}
            >
              {/* spinning conic glow ring */}
              <div
                aria-hidden="true"
                className="animate-spin-slow pointer-events-none absolute -inset-8 -z-10 rounded-full opacity-40 blur-2xl"
                style={{
                  background:
                    "conic-gradient(from 0deg, rgba(99,102,241,0.5), rgba(217,70,239,0.5), rgba(34,211,238,0.5), rgba(99,102,241,0.5))",
                }}
              />
              <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_40px_120px_-60px_rgba(0,0,0,0.9)] backdrop-blur">
                <div className="absolute inset-0">
                  <motion.div
                    className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"
                    animate={{ x: [0, 30, 0], y: [0, 18, 0] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.div
                    className="absolute -right-28 -bottom-28 h-80 w-80 rounded-full bg-white/10 blur-3xl"
                    animate={{ x: [0, -26, 0], y: [0, -16, 0] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>

                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/70">
                      <Trophy className="h-3.5 w-3.5" />
                      <span>Highlights</span>
                    </div>
                    <div className="text-xs text-white/55">Live metrics</div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs text-white/60">Projects built</p>
                      <p className="mt-2 text-2xl font-semibold">
                        <AnimatedCounter value={12} suffix="+" />
                      </p>
                      <p className="mt-2 text-xs text-white/60">Web apps, dashboards, prototypes</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs text-white/60">Stacks used</p>
                      <p className="mt-2 text-2xl font-semibold">
                        <AnimatedCounter value={8} suffix="+" />
                      </p>
                      <p className="mt-2 text-xs text-white/60">MERN, APIs, auth, UI motion</p>
                    </div>
                  </div>

                  <a
                    href="https://rewardly.click"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 block rounded-2xl border border-white/10 bg-black/30 p-4 transition-colors hover:border-fuchsia-400/40 hover:bg-black/40"
                  >
                    <p className="text-xs text-white/60">Signature project</p>
                    <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium">
                      <span className="bg-gradient-to-r from-indigo-300 to-fuchsia-300 bg-clip-text text-transparent">
                        rewardly.click
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 text-white/60" />
                    </p>
                    <p className="mt-1 text-xs text-white/70">
                      Missions • Verification • Rewards • Admin tools
                    </p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className="h-full w-2/3 bg-white/50"
                        initial={{ width: "20%" }}
                        animate={{ width: ["22%", "76%", "66%"] }}
                        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-white/55">
                      <span>Progress</span>
                      <span>Shipping features</span>
                    </div>
                  </a>

                  <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs text-white/60">Focus</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <TechPill>Clean UX</TechPill>
                        <TechPill>Fast APIs</TechPill>
                        <TechPill>Secure auth</TechPill>
                        <TechPill>Neon polish</TechPill>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-center text-xs text-white/55">
               
              </p>
            </motion.div>
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

          <div className="grid gap-4 md:grid-cols-2">
            {skills.map((s, i) => (
              <HoverCard key={s.title} delay={i * 0.08}>
                <Card className="h-full border-white/10 bg-white/5 backdrop-blur transition-colors duration-300 group-hover/hc:border-indigo-400/30">
                  <CardHeader>
                    <CardTitle className="text-white">{s.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {s.items.map((it) => (
                        <TechPill key={it}>{it}</TechPill>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </HoverCard>
            ))}
          </div>

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
            desc="Here are the projects that best show my style: real functionality, clean logic, and fancy UI polish. Replace links with your real GitHub/Live URLs."
          />

          <div className="mx-auto grid max-w-2xl gap-5">
            {projects.map((p, i) => (
              <ProjectCard key={p.title} p={p} index={i} />
            ))}
          </div>

          <div className="mt-6 rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold">Want to see more?</p>
                <p className="mt-1 text-sm text-white/70">
                  I can add case studies, screenshots, and a full “rewardly.click” walkthrough section — plus more projects if you want.
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
            desc="A short timeline of where I’ve studied and worked. Add awards, certifications, and internships here later."
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
