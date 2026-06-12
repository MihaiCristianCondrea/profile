import { mkdir, readdir, rm, copyFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = join(repoRoot, 'src', 'features');
const outputRoot = join(repoRoot, 'dist', 'content', 'features');

async function collectHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async entry => {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      return collectHtmlFiles(fullPath);
    }
    return entry.isFile() && entry.name.endsWith('.html') ? [fullPath] : [];
  }));

  return files.flat();
}

async function copyPageFragments() {
  const htmlFiles = await collectHtmlFiles(sourceRoot);

  await rm(outputRoot, { recursive: true, force: true });

  await Promise.all(htmlFiles.map(async sourcePath => {
    const outputPath = join(outputRoot, relative(sourceRoot, sourcePath));
    await mkdir(dirname(outputPath), { recursive: true });
    await copyFile(sourcePath, outputPath);
  }));

  console.log(`Copied ${htmlFiles.length} page fragment${htmlFiles.length === 1 ? '' : 's'} to dist/content/features.`);
}

copyPageFragments().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
