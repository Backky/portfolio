import { useState } from "react";
import {
  siJavascript, siTypescript, siReact, siNodedotjs, siExpress, siMongodb,
  siHtml5, siCss, siTailwindcss, siFramer, siGit, siGithub, siPython,
  siVercel, siNginx, siDocker, siDigitalocean, siGooglegemini, siVite, siNpm,
} from "simple-icons";

// icon keys: { icon, def }  |  text keys: { label, title, hex, def }
const KEYS = [
  { icon: siJavascript, def: "Core language of the web" },
  { icon: siTypescript, def: "Typed JavaScript for safer code" },
  { icon: siReact, def: "Library for building user interfaces" },
  { icon: siNodedotjs, def: "JavaScript runtime for the server" },
  { icon: siExpress, def: "Minimal, fast Node.js web framework" },
  { icon: siMongodb, def: "Flexible NoSQL document database" },
  { icon: siHtml5, def: "Structure and markup of webpages" },
  { icon: siCss, def: "Styling and layout of webpages" },
  { icon: siTailwindcss, def: "Utility-first CSS styling framework" },
  { icon: siFramer, def: "Smooth animations for React apps" },
  { icon: siGit, def: "Version control for tracking code" },
  { icon: siGithub, def: "Hosting and collaboration for repos" },
  { icon: siPython, def: "Language for data and AI" },
  { icon: siVite, def: "Fast modern frontend build tool" },
  { icon: siNpm, def: "Package manager for JavaScript projects" },
  { icon: siGooglegemini, def: "Google's large language model API" },
  { icon: siDocker, def: "Containerize and run apps anywhere" },
  { icon: siNginx, def: "High-performance web server and proxy" },
  { icon: siDigitalocean, def: "Cloud servers for deploying apps" },
  { icon: siVercel, def: "Frontend deployment and hosting platform" },
  { label: "AI", title: "AI", hex: "8b5cf6", def: "Building AI-powered web apps" },
  { label: "ML", title: "Machine Learning", hex: "f97316", def: "Machine learning fundamentals" },
  { label: "API", title: "REST APIs", hex: "10b981", def: "Designing and consuming APIs" },
  { label: "JWT", title: "JWT Auth", hex: "3b82f6", def: "Secure token-based authentication" },
];

function iconColor(hex) {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 175 ? "#0b0b0f" : "#ffffff";
}
function shade(hex, f) {
  const r = Math.round(parseInt(hex.slice(0, 2), 16) * f);
  const g = Math.round(parseInt(hex.slice(2, 4), 16) * f);
  const b = Math.round(parseInt(hex.slice(4, 6), 16) * f);
  const c = (v) => Math.min(255, Math.max(0, v)).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

function Key({ item, onHover }) {
  const icon = item.icon;
  const title = icon ? icon.title : item.title;
  let hex = icon ? icon.hex : item.hex;
  if (parseInt(hex, 16) < 0x151515) hex = "2b2b31";
  const ic = iconColor(hex);
  return (
    <button
      type="button"
      aria-label={title}
      onMouseEnter={() => onHover({ title, def: item.def })}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover({ title, def: item.def })}
      onBlur={() => onHover(null)}
      className="key-hit block w-full pb-[13px]"
    >
      <div
        className="keycap flex aspect-square w-full items-center justify-center rounded-xl"
        style={{
          "--cap": `#${hex}`,
          "--light": shade(hex, 1.22),
          "--dark": shade(hex, 0.55),
        }}
      >
        {icon ? (
          <svg viewBox="0 0 24 24" className="h-[52%] w-[52%]" style={{ fill: ic }}>
            <path d={icon.path} />
          </svg>
        ) : (
          <span className="text-lg font-extrabold sm:text-xl" style={{ color: ic }}>
            {item.label}
          </span>
        )}
      </div>
    </button>
  );
}

export default function TechKeyboard() {
  const [active, setActive] = useState(null);
  return (
    <div>
      {/* quiet detail line above the keyboard */}
      <div className="mb-4 flex min-h-[2.25rem] items-center justify-center text-center">
        {active ? (
          <p className="text-base sm:text-lg">
            <span className="font-bold text-white">{active.title}</span>
            <span className="font-medium text-white/60"> — {active.def}</span>
          </p>
        ) : (
          <p className="label-mono text-[11px] text-white/35">Hover a key</p>
        )}
      </div>

      {/* tilted keyboard tray (rotateX gives the 3D angle; small rotateZ only,
          so columns don't occlude each other and every key stays hoverable) */}
      <div
        className="mx-auto flex max-w-2xl justify-center py-6 sm:py-10"
        style={{ perspective: "1600px", perspectiveOrigin: "50% 38%" }}
      >
        <div
          className="rounded-[22px] border border-white/10 bg-gradient-to-b from-[#17181d] to-[#0b0c10] p-4 sm:p-5"
          style={{
            transform: "rotateX(34deg) rotateZ(-7deg)",
            boxShadow:
              "0 24px 0 -2px #0a0b0e, 0 30px 0 -2px #060608, 0 55px 70px rgba(0,0,0,0.7)",
          }}
        >
          <div className="grid grid-cols-6 gap-3 sm:gap-4">
            {KEYS.map((item) => (
              <Key key={item.title || (item.icon && item.icon.title)} item={item} onHover={setActive} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
