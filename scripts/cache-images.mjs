import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const COLLECTIONS_DIR = join(ROOT, "content", "collections");
const CACHE_DIR = join(ROOT, "public", "cache");
const MANIFEST = join(CACHE_DIR, "manifest.json");

function collectUrls() {
  const urls = new Set();
  if (!existsSync(COLLECTIONS_DIR)) return urls;
  for (const file of readdirSync(COLLECTIONS_DIR).filter((f) => f.endsWith(".json"))) {
    const c = JSON.parse(readFileSync(join(COLLECTIONS_DIR, file), "utf8"));
    if (c.cover) urls.add(c.cover);
    for (const s of c.stories ?? [])
      for (const e of s.events ?? [])
        for (const img of e.images ?? []) urls.add(img.src);
  }
  return urls;
}

function extFromUrl(url, contentType) {
  const m = url.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif|svg)(?:$|\?)/);
  if (m) return m[1] === "jpeg" ? "jpg" : m[1];
  if (contentType?.includes("png")) return "png";
  if (contentType?.includes("webp")) return "webp";
  return "jpg";
}

async function main() {
  mkdirSync(CACHE_DIR, { recursive: true });
  const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : {};
  const urls = collectUrls();
  let failed = 0;

  for (const url of urls) {
    const hash = createHash("sha1").update(url).digest("hex").slice(0, 16);
    try {
      const res = await fetch(url, { headers: { "User-Agent": "MercatorAtlas/1.0 (build cache)" }, redirect: "follow" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const ext = extFromUrl(url, res.headers.get("content-type") ?? "");
      const localName = `${hash}.${ext}`;
      const buf = Buffer.from(await res.arrayBuffer());
      writeFileSync(join(CACHE_DIR, localName), buf);
      manifest[url] = `/cache/${localName}`;
      console.log(`cached  ${url} -> /cache/${localName} (${(buf.length / 1024).toFixed(0)} KB)`);
    } catch (err) {
      failed++;
      console.error(`FAILED  ${url}: ${err.message}`);
    }
  }

  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  console.log(`\n${urls.size} urls, ${failed} failed, manifest -> public/cache/manifest.json`);
  if (failed > 0) process.exit(1);
}

main();
