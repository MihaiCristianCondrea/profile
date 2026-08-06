import { readdir, readFile } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_ROOT = join(ROOT, 'src');
const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

async function collectHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectHtmlFiles(path));
    } else if (entry.isFile() && extname(entry.name).toLowerCase() === '.html') {
      files.push(path);
    }
  }

  return files;
}

function lineNumberAt(source, index) {
  let line = 1;
  for (let cursor = 0; cursor < index; cursor += 1) {
    if (source.charCodeAt(cursor) === 10) line += 1;
  }
  return line;
}

function readTag(source, start) {
  let quote = null;

  for (let cursor = start + 1; cursor < source.length; cursor += 1) {
    const character = source[cursor];
    if (quote) {
      if (character === quote) quote = null;
      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }

    if (character === '>') {
      return {
        raw: source.slice(start, cursor + 1),
        end: cursor + 1,
      };
    }
  }

  return null;
}

function readAttribute(tag, attributeName) {
  const expression = new RegExp(`\\s${attributeName}\\s*=\\s*(["'])(.*?)\\1`, 'i');
  return tag.match(expression)?.[2] ?? null;
}

function validateHtml(filePath, source) {
  const stack = [];
  const errors = [];
  const ids = new Map();
  const rootCounts = new Map([
    ['html', 0],
    ['head', 0],
    ['body', 0],
  ]);
  const isDocument = filePath === join(ROOT, 'index.html');
  let cursor = 0;

  while (cursor < source.length) {
    const tagStart = source.indexOf('<', cursor);
    if (tagStart === -1) break;

    if (source.startsWith('<!--', tagStart)) {
      const commentEnd = source.indexOf('-->', tagStart + 4);
      if (commentEnd === -1) {
        errors.push(`line ${lineNumberAt(source, tagStart)}: unclosed HTML comment`);
        break;
      }
      cursor = commentEnd + 3;
      continue;
    }

    const tag = readTag(source, tagStart);
    if (!tag) {
      errors.push(`line ${lineNumberAt(source, tagStart)}: tag is missing a closing >`);
      break;
    }
    cursor = tag.end;

    if (/^<\s*[!?]/.test(tag.raw)) continue;

    const match = tag.raw.match(/^<\s*(\/?)\s*([A-Za-z][A-Za-z0-9:-]*)\b/);
    if (!match) continue;

    const closing = match[1] === '/';
    const name = match[2].toLowerCase();
    const line = lineNumberAt(source, tagStart);
    const selfClosing = /\/\s*>$/.test(tag.raw);

    if (!closing) {
      if (rootCounts.has(name)) rootCounts.set(name, rootCounts.get(name) + 1);

      const id = readAttribute(tag.raw, 'id');
      if (id) {
        const previousLine = ids.get(id);
        if (previousLine) {
          errors.push(`line ${line}: duplicate id="${id}"; first declared on line ${previousLine}`);
        } else {
          ids.set(id, line);
        }
      }

      if (!selfClosing && !VOID_ELEMENTS.has(name)) {
        stack.push({ name, line });
      }
      continue;
    }

    if (VOID_ELEMENTS.has(name)) {
      errors.push(`line ${line}: void element </${name}> must not have a closing tag`);
      continue;
    }

    const opened = stack.at(-1);
    if (!opened) {
      errors.push(`line ${line}: unexpected closing tag </${name}>`);
      continue;
    }

    if (opened.name !== name) {
      const matchingIndex = stack.findLastIndex((entry) => entry.name === name);
      if (matchingIndex === -1) {
        errors.push(
          `line ${line}: unexpected closing tag </${name}>; `
          + `the currently open element is <${opened.name}> from line ${opened.line}`,
        );
      } else {
        const unclosed = stack.slice(matchingIndex + 1)
          .map((entry) => `<${entry.name}> from line ${entry.line}`)
          .join(', ');
        errors.push(`line ${line}: </${name}> closes across unclosed ${unclosed}`);
        stack.length = matchingIndex;
      }
      continue;
    }

    stack.pop();
  }

  for (const opened of stack.reverse()) {
    errors.push(`line ${opened.line}: unclosed <${opened.name}> element`);
  }

  for (const [name, count] of rootCounts) {
    if (isDocument && count !== 1) {
      errors.push(`document must contain exactly one <${name}> element; found ${count}`);
    }
    if (!isDocument && count !== 0) {
      errors.push(`route fragment must not contain a <${name}> document element`);
    }
  }

  if (errors.length > 0) {
    const path = relative(ROOT, filePath).replaceAll('\\', '/');
    throw new Error(`${path}\n${errors.map((error) => `  - ${error}`).join('\n')}`);
  }
}

const files = [join(ROOT, 'index.html'), ...await collectHtmlFiles(SOURCE_ROOT)];
const failures = [];

for (const filePath of files.sort()) {
  try {
    validateHtml(filePath, await readFile(filePath, 'utf8'));
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }
}

if (failures.length > 0) {
  throw new Error(`HTML structure validation failed:\n\n${failures.join('\n\n')}`);
}

console.log(`Validated balanced tags, document shells, and unique IDs for ${files.length} HTML files.`);
