import { readdir, readFile } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_ROOT = join(ROOT, 'src');
const PRODUCTION_EXTENSIONS = new Set(['.html', '.ts']);
const FORBIDDEN_CARD_TAGS = ['md-outlined-card', 'md-elevated-card'];
const FORBIDDEN_CARD_IMPORTS = [
  '@material/web/labs/card/outlined-card.js',
  '@material/web/labs/card/elevated-card.js',
];
const FORBIDDEN_DIVIDER_MARKER = 'md-divider';

async function collectProductionFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectProductionFiles(path));
    } else if (entry.isFile() && PRODUCTION_EXTENSIONS.has(extname(entry.name))) {
      files.push(path);
    }
  }

  return files;
}

function assertIncludes(source, expected, context) {
  if (!source.includes(expected)) {
    throw new Error(`${context} is missing required UI policy: ${expected}`);
  }
}

const productionFiles = [join(ROOT, 'index.html'), ...await collectProductionFiles(SOURCE_ROOT)];
const violations = [];

for (const filePath of productionFiles) {
  const source = await readFile(filePath, 'utf8');
  for (const cardTag of FORBIDDEN_CARD_TAGS) {
    if (source.includes(cardTag)) {
      violations.push(
        `${relative(ROOT, filePath).replaceAll('\\', '/')} contains forbidden production card ${cardTag}`,
      );
    }
  }
  if (source.includes(FORBIDDEN_DIVIDER_MARKER)) {
    violations.push(
      `${relative(ROOT, filePath).replaceAll('\\', '/')} contains forbidden production divider`,
    );
  }

}

const materialRegistryPath = join(SOURCE_ROOT, 'core/material/MaterialRegistry.ts');
const materialRegistry = await readFile(materialRegistryPath, 'utf8');
for (const cardImport of FORBIDDEN_CARD_IMPORTS) {
  if (materialRegistry.includes(cardImport)) {
    violations.push(
      `${relative(ROOT, materialRegistryPath).replaceAll('\\', '/')} contains unused forbidden import ${cardImport}`,
    );
  }
}

if (violations.length > 0) {
  throw new Error(`UI policy validation failed:\n${violations.map((item) => `  - ${item}`).join('\n')}`);
}

const homeHtml = await readFile(join(ROOT, 'index.html'), 'utf8');
assertIncludes(homeHtml, '<md-filled-card class="profile-card">', 'Home profile header');
assertIncludes(homeHtml, '<md-filled-card class="achievement-card">', 'Home ranking header');
assertIncludes(homeHtml, '<md-filled-card class="contribute-card">', 'Contribution callout');
assertIncludes(homeHtml, '<meta name="theme-color" content="#4285F4" />', 'Browser theme color');
assertIncludes(
  homeHtml,
  '<main class="content-wrapper" id="pageContentArea" data-drawer-inert-target>',
  'Semantic application shell',
);
assertIncludes(
  homeHtml,
  '<section id="mainContentPage" class="page-section active">',
  'Semantic home route',
);
assertIncludes(
  homeHtml,
  '<footer class="app-footer" data-drawer-inert-target>\n'
    + '      <div class="footer-shell">\n'
    + '        <span id="copyright-message"></span>\n'
    + '        <nav class="social-icons" aria-label="Social profiles">',
  'Footer social shell',
);

const uiPolicyCss = await readFile(join(SOURCE_ROOT, 'core/styles/ui-policy.css'), 'utf8');
assertIncludes(
  uiPolicyCss,
  '--app-filled-card-container-color: var(--md-sys-color-surface-container-low);',
  'Neutral filled-card policy',
);
assertIncludes(
  uiPolicyCss,
  '--md-filled-card-container-color: var(--md-sys-color-primary-container);',
  'Contribution-card tonal exception',
);

const groupedFaqCss = await readFile(join(SOURCE_ROOT, 'core/styles/grouped-faq.css'), 'utf8');
for (const expected of [
  '--md-outlined-text-field-container-shape: 28px;',
  '--md-filled-card-container-shape: 16px 16px 2px 2px;',
  '--md-filled-card-container-shape: 2px 2px 16px 16px;',
]) {
  assertIncludes(groupedFaqCss, expected, 'FAQ shape policy');
}

const themeCss = await readFile(join(SOURCE_ROOT, 'core/styles/variables.css'), 'utf8');
assertIncludes(themeCss, '--md-sys-color-primary: #4285f4;', 'Google blue light theme');
assertIncludes(themeCss, '--md-sys-color-inverse-primary: #4285f4;', 'Google blue dark theme');

const manifest = await readFile(join(ROOT, 'public/manifest.json'), 'utf8');
assertIncludes(manifest, '"theme_color": "#4285F4"', 'PWA theme color');

const resumePage = await readFile(
  join(SOURCE_ROOT, 'features/resume/presentation/ResumePage.ts'),
  'utf8',
);
assertIncludes(resumePage, "'accent-color': '#4285f4'", 'Resume accent color');

for (const forbiddenGreen of ['#3ddc84', '#3DDC84']) {
  if (`${themeCss}\n${manifest}\n${resumePage}`.includes(forbiddenGreen)) {
    throw new Error(`UI policy validation failed: legacy Android green ${forbiddenGreen} remains`);
  }
}

console.log(`Validated intentional UI policy across ${productionFiles.length} production files.`);
