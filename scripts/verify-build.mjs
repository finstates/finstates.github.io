import { access, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("../", import.meta.url);
const dist = new URL("dist/", root);
const requiredFiles = [
  "index.html",
  "pricing/index.html",
  "privacy/index.html",
  "register/index.html",
  "register/confirm/index.html",
  "support/index.html",
  "terms/index.html",
  "CNAME",
  "robots.txt",
  "sitemap.xml",
];
const applicationPages = requiredFiles.filter(
  (name) => name.endsWith(".html") && name !== "pricing/index.html",
);

function fail(message) {
  throw new Error(`Production build verification failed: ${message}`);
}

for (const path of requiredFiles) {
  await access(new URL(path, dist)).catch(() => fail(`missing dist/${path}`));
}

const cname = (await readFile(new URL("CNAME", dist), "utf8")).trim();
if (cname !== "finstates.app") fail(`CNAME must be finstates.app, received ${JSON.stringify(cname)}`);

const assetsDir = new URL("assets/", dist);
const assetNames = await readdir(assetsDir);
const scriptNames = assetNames.filter((name) => /^main-.*\.js$/.test(name));
const styleNames = assetNames.filter((name) => /^main-.*\.css$/.test(name));
if (scriptNames.length !== 1) fail(`expected one main JavaScript asset, found ${scriptNames.length}`);
if (styleNames.length !== 1) fail(`expected one main CSS asset, found ${styleNames.length}`);

const script = await readFile(join(assetsDir.pathname, scriptNames[0]), "utf8");
if (!script.includes("https://api.finstates.app/v1")) fail("production API base is absent from the JavaScript bundle");
if (script.includes("https://api.dev.finstates.app/v1")) fail("development API base leaked into the production JavaScript bundle");

for (const path of applicationPages) {
  const html = await readFile(new URL(path, dist), "utf8");
  if (!html.includes(`/assets/${scriptNames[0]}`)) fail(`dist/${path} does not load the production JavaScript asset`);
  if (!html.includes(`/assets/${styleNames[0]}`)) fail(`dist/${path} does not load the production CSS asset`);
}

console.log(JSON.stringify({
  message: "Production build verified",
  apiBase: "https://api.finstates.app/v1",
  domain: cname,
  pages: requiredFiles.filter((name) => name.endsWith(".html")).length,
  script: scriptNames[0],
  stylesheet: styleNames[0],
}));
