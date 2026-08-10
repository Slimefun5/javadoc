# Slimefun5 Javadocs

Unified API documentation for the Slimefun5 core and its addons, published to
**https://slimefun5.github.io/javadoc/**.

Each project's `javadoc` task is run in CI, collected under `/<project>/`, and listed
on a single landing page. Nothing is authored by hand except the landing page and this
config.

## How it works

- `projects.json`: the list of documented repos (id, repo, branch, gradle task, output path).
- `gradle/javadoc.init.gradle`: applied to every project via `-I` so Javadoc renders
  uniformly (doclint off, `@implNote`/`@apiNote`/`@implSpec` tags registered, versioned
  title) without editing any project's build file.
- `scripts/build-landing.mjs`: generates the landing `index.html` from `projects.json`,
  marking projects whose docs failed to build as *docs pending*.
- `.github/workflows/publish.yml`: matrix-builds every project's Javadoc, assembles the
  site, and deploys it to `gh-pages`.

## Refreshing

- Automatically every Monday and on demand (**Actions > Publish Javadocs > Run workflow**).
- A release in any documented repo can refresh the hub by sending a `repository_dispatch`
  event of type `publish-docs` to this repo.

A project that fails to build does not fail the site; it is listed as *docs pending* until
its next successful build.
