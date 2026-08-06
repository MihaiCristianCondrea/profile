import { readdir, readFile } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_ROOT = join(ROOT, 'src');
const PUBLIC_ROOT = join(ROOT, 'public');
const SCRIPT_ROOT = join(ROOT, 'scripts');
const FORMAT_EXTENSIONS = new Set(['.css', '.html', '.js', '.json', '.mjs', '.ts']);
const USAGE_EXTENSIONS = new Set(['.html', '.json', '.ts']);

async function collectFiles(directory, extensions) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(path, extensions));
    } else if (entry.isFile() && extensions.has(extname(entry.name).toLowerCase())) {
      files.push(path);
    }
  }

  return files;
}

function displayPath(filePath) {
  return relative(ROOT, filePath).replaceAll('\\', '/');
}

function findMatchingBrace(source, openingIndex) {
  let depth = 0;
  let quote = null;

  for (let cursor = openingIndex; cursor < source.length; cursor += 1) {
    const character = source[cursor];
    if (quote) {
      if (character === quote && source[cursor - 1] !== '\\') quote = null;
      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }

    if (character === '{') depth += 1;
    if (character === '}') {
      depth -= 1;
      if (depth === 0) return cursor;
    }
  }

  return -1;
}

function collectCssRules(source, filePath, context = []) {
  const rules = [];
  let cursor = 0;

  while (cursor < source.length) {
    while (/\s/.test(source[cursor] ?? '')) cursor += 1;
    if (cursor >= source.length) break;

    const semicolonIndex = source.indexOf(';', cursor);
    const braceIndex = source.indexOf('{', cursor);
    if (braceIndex === -1) break;

    if (semicolonIndex !== -1 && semicolonIndex < braceIndex) {
      cursor = semicolonIndex + 1;
      continue;
    }

    const prelude = source.slice(cursor, braceIndex).trim();
    const closingIndex = findMatchingBrace(source, braceIndex);
    if (closingIndex === -1) break;

    const body = source.slice(braceIndex + 1, closingIndex);
    const normalizedPrelude = prelude.replace(/\s+/g, ' ').trim();

    if (/^@(media|supports|layer|container|document)\b/i.test(normalizedPrelude)) {
      rules.push(...collectCssRules(body, filePath, [...context, normalizedPrelude]));
    } else if (!normalizedPrelude.startsWith('@')) {
      rules.push({
        context: context.join(' > '),
        filePath,
        selector: normalizedPrelude,
        body,
      });
    }

    cursor = closingIndex + 1;
  }

  return rules;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const formatFiles = [
  join(ROOT, 'index.html'),
  join(ROOT, 'package.json'),
  ...await collectFiles(SOURCE_ROOT, FORMAT_EXTENSIONS),
  ...await collectFiles(SCRIPT_ROOT, FORMAT_EXTENSIONS),
];
const formattingViolations = [];

for (const filePath of formatFiles.sort()) {
  const source = await readFile(filePath, 'utf8');
  const path = displayPath(filePath);

  if (source.includes('\r')) formattingViolations.push(`${path}: use LF line endings`);
  if (/\n{3,}/.test(source)) formattingViolations.push(`${path}: remove consecutive blank lines`);

  source.split('\n').forEach((line, index) => {
    if (/\s+$/.test(line)) formattingViolations.push(`${path}:${index + 1}: trailing whitespace`);
    if (line.includes('\t')) formattingViolations.push(`${path}:${index + 1}: tab indentation`);
  });
}

const usageFiles = [
  join(ROOT, 'index.html'),
  ...await collectFiles(SOURCE_ROOT, USAGE_EXTENSIONS),
  ...await collectFiles(PUBLIC_ROOT, USAGE_EXTENSIONS),
];
const usageSource = (await Promise.all(usageFiles.map((filePath) => readFile(filePath, 'utf8')))).join('\n');
const cssFiles = await collectFiles(SOURCE_ROOT, new Set(['.css']));
const cssRules = [];

for (const filePath of cssFiles) {
  const css = (await readFile(filePath, 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '');
  cssRules.push(...collectCssRules(css, filePath));
}

const selectorViolations = [];
const selectorTokens = new Map();
const tokenPattern = /([.#])([_a-zA-Z]+[\w-]*)/g;

for (const rule of cssRules) {
  let match;
  while ((match = tokenPattern.exec(rule.selector)) !== null) {
    const token = `${match[1]}${match[2]}`;
    if (!selectorTokens.has(token)) selectorTokens.set(token, new Set());
    selectorTokens.get(token).add(displayPath(rule.filePath));
  }
}

for (const [token, files] of [...selectorTokens.entries()].sort(([left], [right]) => left.localeCompare(right))) {
  const name = token.slice(1);
  const usagePattern = new RegExp(`(^|[^A-Za-z0-9_-])${escapeRegExp(name)}([^A-Za-z0-9_-]|$)`);
  if (!usagePattern.test(usageSource)) {
    selectorViolations.push(`${token} is unused (${[...files].sort().join(', ')})`);
  }
}

const duplicateDeclarations = [];
const declarationsByRule = new Map();

for (const rule of cssRules) {
  const key = `${rule.context}|${rule.selector}`;
  const properties = [...rule.body.matchAll(/(?:^|[;{])\s*(--[\w-]+|[a-zA-Z][\w-]*)\s*:/g)]
    .map((match) => match[1]);

  for (const property of properties) {
    const declarationKey = `${key}|${property}`;
    const existing = declarationsByRule.get(declarationKey);
    if (existing && existing.filePath !== rule.filePath) {
      duplicateDeclarations.push(
        `${rule.selector} repeats ${property} in ${displayPath(existing.filePath)} and ${displayPath(rule.filePath)}`,
      );
    } else if (!existing) {
      declarationsByRule.set(declarationKey, rule);
    }
  }
}

const violations = [
  ...formattingViolations,
  ...selectorViolations,
  ...new Set(duplicateDeclarations),
];

if (violations.length > 0) {
  throw new Error(`Source quality validation failed:\n${violations.map((item) => `  - ${item}`).join('\n')}`);
}

console.log(
  `Validated formatting and CSS usage across ${formatFiles.length} source files and ${cssFiles.length} stylesheets.`,
);
