import { readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const siteDir = process.argv[2] || join(root, "site");
const chromeDir = process.argv[3] || join(root, "chrome");
const { projects } = JSON.parse(readFileSync(join(root, "projects.json"), "utf8"));

const hasDocs = (id) => existsSync(join(siteDir, id, "index.html"));
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const order = { Core: 0, Library: 1, Addon: 2 };
const groups = [...new Set(projects.map((p) => p.group))].sort((a, b) => order[a] - order[b]);

const built = projects.filter((p) => hasDocs(p.id)).length;

const FALLBACK_HEADER = `<header class="sf-header">
  <a class="sf-brand" href="https://slimefun5.github.io/">
    <img src="https://github.com/Slimefun5.png" alt="Slimefun5" width="36" height="36">
    <span>Slimefun<strong>5</strong></span>
  </a>
  <nav class="sf-links">
    <a href="https://slimefun5.github.io/wiki/">Wiki</a>
    <a href="https://slimefun5.github.io/builds/">Builds</a>
    <a href="https://slimefun5.github.io/javadoc/">Javadocs</a>
    <a href="https://github.com/Slimefun5">GitHub</a>
  </nav>
</header>`;

const FALLBACK_FOOTER = `<footer class="sf-footer">
  Slimefun5 is a community fork of Slimefun. Licensed
  <a href="https://www.gnu.org/licenses/gpl-3.0.html">GPL-3.0</a>.
</footer>`;

// Partials come from files the workflow fetches from Slimefun5/web, not a runtime request here.
const readPartial = (name, fallback) => {
  const path = join(chromeDir, name);
  return existsSync(path) ? readFileSync(path, "utf8").trim() : fallback;
};

const header = readPartial("header.html", FALLBACK_HEADER);
const footer = readPartial("footer.html", FALLBACK_FOOTER);

const card = (p) => {
  const ready = hasDocs(p.id);
  const inner = `
      <div class="card-head">
        <span class="sf-card-title">${esc(p.name)}</span>
        ${ready ? "" : '<span class="badge">docs pending</span>'}
      </div>
      <p class="sf-card-desc">${esc(p.blurb || "")}</p>
      <div class="sf-card-go">${ready ? "View API &rarr;" : `<a href="https://github.com/${esc(p.repo)}">Source</a>`}</div>`;
  return ready
    ? `<a class="sf-card" href="./${encodeURIComponent(p.id)}/">${inner}</a>`
    : `<div class="sf-card card-pending">${inner}</div>`;
};

const section = (g) => `
    <h2 class="sf-group">${esc(g)}</h2>
    <div class="sf-grid">
      ${projects.filter((p) => p.group === g).map(card).join("\n      ")}
    </div>`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Slimefun5 Javadocs</title>
  <link rel="icon" href="https://github.com/Slimefun5.png">
  <link rel="stylesheet" href="./tokens.css">
  <link rel="stylesheet" href="./site.css">
  <link rel="stylesheet" href="./style.css">
</head>
<body>
  ${header}
  <main class="sf-main">
    <p class="sf-lede">API documentation for the Slimefun5 core and its ${projects.length - 1} addons. ${built} of ${projects.length} published.</p>
    ${groups.map(section).join("\n")}
  </main>
  ${footer}
</body>
</html>
`;

writeFileSync(join(siteDir, "index.html"), html);
copyFileSync(join(root, "assets", "style.css"), join(siteDir, "style.css"));

const copyChromeAsset = (name) => {
  const src = join(chromeDir, name);
  if (existsSync(src)) copyFileSync(src, join(siteDir, name));
};
copyChromeAsset("tokens.css");
copyChromeAsset("site.css");

console.log(`landing built: ${built}/${projects.length} projects have docs`);
