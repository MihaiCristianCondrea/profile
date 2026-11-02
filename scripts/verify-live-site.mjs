// Verifies that the deployed GitHub Pages site serves the Vite build, not raw source.
//
// Why: if the repository's Pages source is "Deploy from a branch", GitHub runs its
// legacy "pages build and deployment" job on every push in parallel with
// .github/workflows/pages.yml. That job publishes the repository root, whose
// index.html loads /src/main.ts. Browsers cannot run that file, so the page renders
// as unstyled HTML with no Material components. The legacy job often finishes
// last and silently overwrites the good deployment.
const url = process.argv[2] ?? process.env.PAGES_URL;
if (!url) throw new Error('Usage: node scripts/verify-live-site.mjs <pages-url>');

const attempts = 10;
const delayMs = 15000;
let lastProblem = '';

for (let attempt = 1; attempt <= attempts; attempt += 1) {
  const response = await fetch(`${url}?verify=${Date.now()}`, { cache: 'no-store' });
  const html = await response.text();
  if (!response.ok) {
    lastProblem = `HTTP ${response.status}`;
  } else if (html.includes('src/main.ts')) {
    lastProblem = 'live index.html references src/main.ts (raw source is published). '
      + 'Set Settings > Pages > Build and deployment > Source to "GitHub Actions".';
  } else if (!/\.\/assets\/index-[^"]+\.css/.test(html) || !/\.\/assets\/index-[^"]+\.js/.test(html)) {
    lastProblem = 'live index.html does not reference the built ./assets CSS and JS bundles.';
  } else {
    console.log(`Live site serves the production build: ${url}`);
    process.exit(0);
  }
  console.log(`Attempt ${attempt}/${attempts}: ${lastProblem}`);
  if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, delayMs));
}

throw new Error(`Live site check failed: ${lastProblem}`);
