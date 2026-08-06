import { readdir, readFile } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_ROOT = join(ROOT, 'src');
const PRODUCTION_EXTENSIONS = new Set(['.html', '.ts']);
const FORBIDDEN_CARD_TAGS = ['md-outlined-card', 'md-elevated-card'];

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
}

if (violations.length > 0) {
  throw new Error(`UI policy validation failed:\n${violations.map((item) => `  - ${item}`).join('\n')}`);
}

const homeHtml = await readFile(join(ROOT, 'index.html'), 'utf8');
assertIncludes(homeHtml, '<md-filled-card class="profile-card">', 'Home profile header');
assertIncludes(homeHtml, '<md-filled-card class="achievement-card">', 'Home ranking header');
assertIncludes(homeHtml, '<md-filled-card class="contribute-card">', 'Contribution callout');

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

console.log(`Validated intentional UI policy across ${productionFiles.length} production files.`);
