import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, useAnimation, useInView } from "framer-motion";
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
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
        <Star className="h-3.5 w-3.5" />
        <span>{eyebrow}</span>
      </div>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">
        {desc}
      </p>
    </div>
  );
}

function TechPill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
      {children}
    </span>
  );
}

function ProjectCard({ p, index }) {
  const { ref, xy } = useParallax(10);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12%" }}
      transition={{ duration: 0.55, delay: index * 0.05 }}
      className="group relative"
      style={{
        transform: `translate3d(${xy.x * 0.15}px, ${xy.y * 0.15}px, 0)`
      }}
    >
      <Card className="relative overflow-hidden border-white/10 bg-white/5 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)] backdrop-blur">
        <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -right-24 -bottom-24 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        </div>

        <CardHeader className="relative">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-white">{p.title}</CardTitle>
              <p className="mt-2 text-sm text-white/70">{p.subtitle}</p>
            </div>
            <Badge className="border-white/10 bg-white/5 text-white/80" variant="outline">
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

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {p.links?.live && (
              <Button
                className="border border-white/10 bg-white/10 text-white hover:bg-white/15"
                onClick={() => window.open(p.links.live, "_blank")}
              >
                <Globe className="mr-2 h-4 w-4" />
                Live
                <ExternalLink className="ml-2 h-4 w-4 opacity-80" />
              </Button>
            )}
            {p.links?.code && (
              <Button
                variant="outline"
                className="border-white/15 bg-transparent text-white hover:bg-white/10"
                onClick={() => window.open(p.links.code, "_blank")}
              >
                <Github className="mr-2 h-4 w-4" />
                Code
              </Button>
            )}
          </div>

          <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />

          <div className="mt-4 flex items-center justify-between text-xs text-white/60">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-white/60" />
              {p.status}
            </span>
            <span>{p.when}</span>
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
        "I've built futuristic, web apps—tracking real-time game stats, generating missions, and turning performance into rewards.",
      socials: {
        github: "https://github.com/Backky",
        linkedin: "https://www.linkedin.com/in/shrabya-paudel-703055394/?trk=public-profile-join-page",
        website: "https://",
      },
      resumeUrl: "https://drive.google.com/drive/u/0/folders/1s_ZOqWpWw7stI71JP_8fgpe5A7dt7X_K", // put a PDF link or route
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
        title: "Rewardly.gg – Tracker‑Reward Web Application",
        subtitle:
          "A full‑stack MERN platform that tracks player stats (Valorant, Apex, CS2), assigns missions, and rewards users with BankCoins.",
        tag: "Flagship",
        stack: ["MongoDB", "Express", "React", "Node.js", "JWT", "Cron", "APIs"],
        desc:
          "Includes account linking + verification (PUUID), mission seeding, progress tracking, reward claiming, admin mission management, and a futuristic dashboard UI.",
        links: {
          live: "#",
          code: "#",
        },
        status: "Active development",
        when: "2025",
      },
      {
        title: "Personal Portfolio Website",
        subtitle: "Responsive, animated portfolio to showcase projects and achievements.",
        tag: "UI/UX",
        stack: ["React", "Tailwind", "Framer Motion"],
        desc:
          "Designed with smooth scroll, micro‑interactions, and performance-friendly animations.",
        links: { live: "#", code: "#" },
        status: "Polishing",
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
        time: "Ongoing",
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
    <div className="min-h-screen bg-black text-white">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_12%_10%,rgba(255,255,255,0.10),transparent_55%),radial-gradient(1000px_circle_at_88%_18%,rgba(255,255,255,0.08),transparent_52%),radial-gradient(1000px_circle_at_45%_92%,rgba(255,255,255,0.06),transparent_52%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),transparent_35%,rgba(255,255,255,0.04))]" />
        <GlowBlob className="left-[-120px] top-[-120px] h-[360px] w-[360px] bg-white" />
        <GlowBlob className="right-[-180px] top-[120px] h-[420px] w-[420px] bg-white" />
        <GlowBlob className="left-[20%] bottom-[-220px] h-[520px] w-[520px] bg-white" />
        <GrainOverlay />
      </div>

      {/* Top Nav */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/55 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
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
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                {n.label}
              </button>
            ))}
            <Button
              className="ml-2 border border-white/10 bg-white/10 text-white hover:bg-white/15"
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
            <div className="mx-auto max-w-6xl px-4 py-3">
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
                  className="border border-white/10 bg-white/10 text-white hover:bg-white/15"
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
      <main id="top" className="mx-auto max-w-6xl px-4">
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
                      className="border border-white/10 bg-white/10 text-white hover:bg-white/15"
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
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Available for internships & projects</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.1, ease: "easeOut" }}
                className="mt-5 text-4xl font-semibold tracking-tight md:text-6xl"
              >
                Building <span className="text-white/80">fancy</span>,
                <br />
                futuristic web experiences.
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
                  className="border border-white/10 bg-white/10 text-white hover:bg-white/15"
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
              className="relative"
              style={{
                transform: `translate3d(${heroXY.x * 0.12}px, ${heroXY.y * 0.12}px, 0)`,
              }}
            >
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

                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs text-white/60">Signature project</p>
                    <p className="mt-2 text-sm font-medium">Rewardly.gg</p>
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
                  </div>

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

        <FancyDivider />

        {/* About */}
        <section id="about" className="py-8">
          <SectionTitle
            eyebrow="About"
            title="Full-Stack Web Developer focused on modern and scalable design"
            desc="I build modern, scalable web applications with a focus on performance, clean architecture, and polished user experience. I work across frontend, backend, and databases, and enjoy enhancing interfaces with smooth animations and intuitive design."
          />

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-white/10 bg-white/5 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">What I do</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-white/75">
                Full‑stack MERN apps, dashboards, API integrations, auth systems, and admin panels.
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/5 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">What I like</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-white/75">
                Full Stack MERN Dev, futuristic UI, clean logic, and shipping features step‑by‑step.
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/5 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">What I’m improving</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-white/75">
                Advanced testing, scalability patterns, and deeper analytics instrumentation.
              </CardContent>
            </Card>
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
            {skills.map((s) => (
              <Card key={s.title} className="border-white/10 bg-white/5 backdrop-blur">
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
            ))}
          </div>

          <div className="mt-6 rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">My current focus</p>
                <p className="mt-1 text-sm text-white/70">
                  Making Rewardly.gg more scalable: mission pools, validation, cash-out system and better admin workflows.
                </p>
              </div>
              <Button
                className="border border-white/10 bg-white/10 text-white hover:bg-white/15"
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

          <div className="grid gap-4 md:grid-cols-3">
            {projects.map((p, i) => (
              <ProjectCard key={p.title} p={p} index={i} />
            ))}
          </div>

          <div className="mt-6 rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold">Want to see more?</p>
                <p className="mt-1 text-sm text-white/70">
                  I can add case studies, screenshots, and a full “Rewardly.gg” walkthrough section — plus more projects if you want.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  className="border-white/15 bg-transparent text-white hover:bg-white/10"
                  onClick={() => window.open(profile.socials.github, "_blank")}
                >
                  <Github className="mr-2 h-4 w-4" />
                  GitHub
                </Button>
                <Button
                  className="border border-white/10 bg-white/10 text-white hover:bg-white/15"
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
                  Publish Rewardly.gg MVP, add full Steam linking + owned games list, and expand mission system.
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

        
      </main>

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
