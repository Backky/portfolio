import { useState } from "react";
import {
  siJavascript, siTypescript, siReact, siNodedotjs, siExpress, siMongodb,
  siHtml5, siCss, siTailwindcss, siFramer, siGit, siGithub, siPython,
  siVercel, siNginx, siDocker, siDigitalocean, siGooglegemini, siVite, siNpm,
} from "simple-icons";

// each: [icon, 6-word definition]
const KEYS = [
  [siJavascript, "Core language of the web"],
  [siTypescript, "Typed JavaScript for safer code"],
  [siReact, "Library for building user interfaces"],
  [siNodedotjs, "JavaScript runtime for the server"],
  [siExpress, "Minimal, fast Node.js web framework"],
  [siMongodb, "Flexible NoSQL document database"],
  [siHtml5, "Structure and markup of webpages"],
  [siCss, "Styling and layout of webpages"],
  [siTailwindcss, "Utility-first CSS styling framework"],
  [siFramer, "Smooth animations for React apps"],
  [siGit, "Version control for tracking code"],
  [siGithub, "Hosting and collaboration for repos"],
  [siPython, "Language for data and AI"],
  [siVite, "Fast modern frontend build tool"],
  [siNpm, "Package manager for JavaScript projects"],
  [siGooglegemini, "Google's large language model API"],
  [siDocker, "Containerize and run apps anywhere"],
  [siNginx, "High-performance web server and proxy"],
  [siDigitalocean, "Cloud servers for deploying apps"],
  [siVercel, "Frontend deployment and hosting platform"],
];

// luminance -> pick a readable icon colour
function iconColor(hex) {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return lum > 175 ? "#0b0b0f" : "#ffffff";
}
function shade(hex, f) {
  const r = Math.round(parseInt(hex.slice(0, 2), 16) * f);
  const g = Math.round(parseInt(hex.slice(2, 4), 16) * f);
  const b = Math.round(parseInt(hex.slice(4, 6), 16) * f);
  const c = (v) => Math.min(255, Math.max(0, v)).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

function Key({ icon, def, onHover }) {
  let hex = icon.hex;
  // near-black brands -> dark keycap instead of pure black
  if (parseInt(hex, 16) < 0x151515) hex = "2b2b31";
  const ic = iconColor(hex);
  return (
    <button
      type="button"
      aria-label={icon.title}
      onMouseEnter={() => onHover({ title: icon.title, def })}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover({ title: icon.title, def })}
      onBlur={() => onHover(null)}
      className="keycap flex aspect-square w-full items-center justify-center rounded-lg"
      style={{
        "--cap": `#${hex}`,
        "--light": shade(hex, 1.22),
        "--dark": shade(hex, 0.55),
      }}
    >
      <svg viewBox="0 0 24 24" className="h-[52%] w-[52%]" style={{ fill: ic }}>
        <path d={icon.path} />
      </svg>
    </button>
  );
}

export default function TechKeyboard() {
  const [active, setActive] = useState(null);
  return (
    <div>
      {/* quiet detail line above the keyboard */}
      <div className="mb-4 flex min-h-[1.75rem] items-center justify-center text-center">
        {active ? (
          <p className="text-sm">
            <span className="font-semibold text-white">{active.title}</span>
            <span className="text-white/45"> — {active.def}</span>
          </p>
        ) : (
          <p className="label-mono text-[10px] text-white/30">Hover a key</p>
        )}
      </div>

      {/* compact keyboard */}
      <div className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-gradient-to-b from-[#17181d] to-[#0c0d11] p-3.5 shadow-[0_40px_120px_-50px_rgba(0,0,0,0.9)] sm:p-4">
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-10 sm:gap-2.5">
          {KEYS.map(([icon, def]) => (
            <Key key={icon.title} icon={icon} def={def} onHover={setActive} />
          ))}
        </div>
      </div>
    </div>
  );
}
