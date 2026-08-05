import { readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDir = fileURLToPath(new URL('../', import.meta.url));
const publicDir = join(projectDir, 'public');
const readOnlyReferenceDir = join(projectDir, 'resources');
const ignoredDirectoryNames = new Set(['.git', 'dist', 'node_modules']);

const collectSvgFiles = (directory) => {
  const svgFiles = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      if (ignoredDirectoryNames.has(entry.name) || entryPath === readOnlyReferenceDir) {
        continue;
      }

      svgFiles.push(...collectSvgFiles(entryPath));
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith('.svg')) {
      svgFiles.push(entryPath);
    }
  }

  return svgFiles;
};

const svgFiles = collectSvgFiles(projectDir);
const misplacedSvgFiles = svgFiles.filter((filePath) => {
  const pathFromPublic = relative(publicDir, filePath);
  return pathFromPublic === '..' || pathFromPublic.startsWith(`..${sep}`);
});

if (misplacedSvgFiles.length > 0) {
  const formattedPaths = misplacedSvgFiles
    .map((filePath) => `- ${relative(projectDir, filePath).split(sep).join('/')}`)
    .join('\n');

  throw new Error(`Production SVG assets must live under public/.\n${formattedPaths}`);
}

console.log(`Verified SVG asset locations: ${svgFiles.length} production SVG file(s).`);
