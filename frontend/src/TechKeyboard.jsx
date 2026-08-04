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

function Key({ icon, def }) {
  let hex = icon.hex;
  // near-black brands -> dark keycap instead of pure black
  if (parseInt(hex, 16) < 0x151515) hex = "2b2b31";
  const ic = iconColor(hex);
  return (
    <div className="group relative flex items-center justify-center">
      <button
        type="button"
        aria-label={icon.title}
        className="keycap flex aspect-square w-full items-center justify-center rounded-xl"
        style={{
          "--cap": `#${hex}`,
          "--light": shade(hex, 1.22),
          "--dark": shade(hex, 0.55),
        }}
      >
        <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" style={{ fill: ic }}>
          <path d={icon.path} />
        </svg>
      </button>
      {/* tooltip */}
      <div className="pointer-events-none absolute -top-2 left-1/2 z-30 w-max -translate-x-1/2 -translate-y-full scale-95 opacity-0 transition-all duration-200 group-hover:-translate-y-full group-hover:scale-100 group-hover:opacity-100">
        <div className="rounded-xl border border-white/10 bg-black/90 px-3 py-2 text-center shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)] backdrop-blur">
          <p className="text-xs font-semibold text-white">{icon.title}</p>
          <p className="mt-0.5 text-[11px] text-white/60">{def}</p>
        </div>
      </div>
    </div>
  );
}

export default function TechKeyboard() {
  return (
    <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-[#17181d] to-[#0c0d11] p-5 shadow-[0_40px_120px_-50px_rgba(0,0,0,0.9)] sm:p-7">
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 sm:gap-4 lg:grid-cols-10">
        {KEYS.map(([icon, def]) => (
          <Key key={icon.title} icon={icon} def={def} />
        ))}
      </div>
      <p className="label-mono mt-4 text-center text-[10px] text-white/30">
        Hover a key
      </p>
    </div>
  );
}
