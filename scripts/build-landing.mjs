import { readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const siteDir = process.argv[2] || join(root, "site");
const { projects } = JSON.parse(readFileSync(join(root, "projects.json"), "utf8"));

const hasDocs = (id) => existsSync(join(siteDir, id, "index.html"));
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const order = { Core: 0, Library: 1, Addon: 2 };
const groups = [...new Set(projects.map((p) => p.group))].sort((a, b) => order[a] - order[b]);

const built = projects.filter((p) => hasDocs(p.id)).length;

const card = (p) => {
  const ready = hasDocs(p.id);
  const inner = `
      <div class="card-head">
        <span class="card-name">${esc(p.name)}</span>
        ${ready ? "" : '<span class="badge">docs pending</span>'}
      </div>
      <p class="card-blurb">${esc(p.blurb || "")}</p>
      <div class="card-foot">${ready ? "View API &rarr;" : `<a href="https://github.com/${esc(p.repo)}">Source</a>`}</div>`;
  return ready
    ? `<a class="card" href="./${encodeURIComponent(p.id)}/">${inner}</a>`
    : `<div class="card card-pending">${inner}</div>`;
};

const section = (g) => `
    <h2 class="group">${esc(g)}</h2>
    <div class="grid">
      ${projects.filter((p) => p.group === g).map(card).join("\n      ")}
    </div>`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Slimefun5 Javadocs</title>
  <link rel="icon" href="https://github.com/Slimefun5.png">
  <link rel="stylesheet" href="./style.css">
</head>
<body>
  <header class="header">
    <a class="brand" href="https://github.com/Slimefun5">
      <img src="https://github.com/Slimefun5.png" alt="Slimefun5" width="36" height="36">
      <span>Slimefun5 <strong>Javadocs</strong></span>
    </a>
    <nav class="links">
      <a href="https://slimefun5.github.io/Wiki/">Wiki</a>
      <a href="https://slimefun5.github.io/builds/">Builds</a>
      <a href="https://github.com/Slimefun5">GitHub</a>
    </nav>
  </header>
  <main>
    <p class="lede">API documentation for the Slimefun5 core and its ${projects.length - 1} addons. ${built} of ${projects.length} published.</p>
    ${groups.map(section).join("\n")}
  </main>
  <footer>Generated from each project's <code>javadoc</code> task. <a href="https://github.com/Slimefun5/javadoc">How this is built</a>.</footer>
</body>
</html>
`;

writeFileSync(join(siteDir, "index.html"), html);
copyFileSync(join(root, "assets", "style.css"), join(siteDir, "style.css"));
console.log(`landing built: ${built}/${projects.length} projects have docs`);
