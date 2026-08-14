import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifestUrl =
  process.env.MANIFEST_URL ||
  "https://raw.githubusercontent.com/Slimefun5/manifest/main/addons.json";

function loadLocalRepos() {
  const { projects } = JSON.parse(readFileSync(join(root, "projects.json"), "utf8"));
  return new Set(projects.map((p) => p.repo));
}

async function fetchManifestRepos() {
  const res = await fetch(manifestUrl);
  if (!res.ok) throw new Error(`manifest fetch returned HTTP ${res.status}`);
  const manifest = await res.json();
  if (!manifest.core?.repo || !Array.isArray(manifest.libraries) || !Array.isArray(manifest.addons)) {
    throw new Error("manifest response is missing expected core/libraries/addons shape");
  }
  return new Set([
    manifest.core.repo,
    ...manifest.libraries.map((l) => l.repo),
    ...manifest.addons.map((a) => a.repo),
  ]);
}

function diff(a, b) {
  return [...a].filter((x) => !b.has(x));
}

async function main() {
  const localRepos = loadLocalRepos();

  let manifestRepos;
  try {
    manifestRepos = await fetchManifestRepos();
  } catch (err) {
    console.warn(`WARNING: could not fetch or parse the manifest, skipping drift check: ${err.message}`);
    process.exit(0);
  }

  const missingFromProjects = diff(manifestRepos, localRepos);
  const unknownToManifest = diff(localRepos, manifestRepos);

  if (missingFromProjects.length === 0 && unknownToManifest.length === 0) {
    console.log(`OK: projects.json and the manifest agree on ${localRepos.size} repos.`);
    process.exit(0);
  }

  console.error("DRIFT DETECTED between projects.json and the shared manifest:");
  if (missingFromProjects.length > 0) {
    console.error("\nIn the manifest but missing from projects.json:");
    for (const repo of missingFromProjects) console.error(`  - ${repo}`);
  }
  if (unknownToManifest.length > 0) {
    console.error("\nIn projects.json but no longer known to the manifest:");
    for (const repo of unknownToManifest) console.error(`  - ${repo}`);
  }
  process.exit(1);
}

main();
