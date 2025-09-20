import { build } from 'esbuild';

const ENTRY_POINT = 'assets/js/main.js';
const OUT_FILE = 'assets/js/main.min.js';

build({
  entryPoints: [ENTRY_POINT],
  outfile: OUT_FILE,
  bundle: true,
  format: 'esm',
  platform: 'browser',
  minify: true,
  sourcemap: false,
  target: ['es2018']
}).catch((error) => {
  console.error('Failed to build JavaScript bundle', error);
  process.exitCode = 1;
});
