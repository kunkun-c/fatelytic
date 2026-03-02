import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, "public");

function readEnvValueFromFile(filePath, key) {
  if (!fs.existsSync(filePath)) return undefined;
  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    const k = trimmed.slice(0, idx).trim();
    if (k !== key) continue;
    let v = trimmed.slice(idx + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    return v;
  }
  return undefined;
}

const baseUrl =
  process.env.VITE_PUBLIC_SITE_URL ||
  readEnvValueFromFile(path.join(ROOT, ".env.local"), "VITE_PUBLIC_SITE_URL") ||
  readEnvValueFromFile(path.join(ROOT, ".env"), "VITE_PUBLIC_SITE_URL");
if (!baseUrl) {
  console.error("Missing env VITE_PUBLIC_SITE_URL. Example: https://example.com");
  process.exit(1);
}

const origin = baseUrl.replace(/\/+$/, "");

const routes = [
  "/",
  "/overview",
  "/calculator",
  "/numerology",
  "/result",
  "/chat",
  "/dashboard",
  "/login",
  "/auth/callback",
  "/history",
  "/profile",
  "/disclaimer",
  "/terms",
  "/privacy",
  "/eastern-astrology",
  "/western-astrology",
  "/tarot",
  "/iching",
  "/career-ai",
];

const now = new Date().toISOString();

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  routes
    .map((route) => {
      const loc = `${origin}${route}`;
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${now}</lastmod>\n  </url>`;
    })
    .join("\n") +
  `\n</urlset>\n`;

fs.mkdirSync(PUBLIC_DIR, { recursive: true });
const outPath = path.join(PUBLIC_DIR, "sitemap.xml");
fs.writeFileSync(outPath, xml, "utf8");
