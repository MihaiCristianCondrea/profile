import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { transform } from 'lightningcss';

const CSS_SOURCES = [
  'assets/css/variables.css',
  'assets/css/base.css',
  'assets/css/components.css',
  'assets/css/pages.css',
  'assets/css/fonts.css'
];

async function buildSiteStyles() {
  const chunks = await Promise.all(
    CSS_SOURCES.map(async (relativePath) => {
      const filePath = resolve(relativePath);
      return readFile(filePath, 'utf8');
    })
  );

  const combined = chunks.join('\n');
  const { code } = transform({
    filename: 'site.css',
    code: Buffer.from(combined),
    minify: true
  });

  await writeFile(resolve('assets/css/site.min.css'), code);
}

buildSiteStyles().catch((error) => {
  console.error('Failed to build site CSS', error);
  process.exitCode = 1;
});
