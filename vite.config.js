const { copyFile, mkdir } = require('node:fs/promises');
const { dirname, resolve } = require('node:path');

const rootFiles = ['robots.txt', 'sitemap.xml', 'app-ads.txt'];

function copyRootSeoFiles() {
  return {
    name: 'copy-root-seo-files',
    apply: 'build',
    async closeBundle() {
      await Promise.all(rootFiles.map(async (file) => {
        const destination = resolve(__dirname, 'dist', file);
        await mkdir(dirname(destination), { recursive: true });
        await copyFile(resolve(__dirname, file), destination);
      }));
    },
  };
}

module.exports = {
  base: './',
  publicDir: 'public',
  resolve: {
    // Smart Cleaner's marketing UI kit, vendored from its app repository.
    // See vendor/smart-cleaner-ui/README.md.
    alias: [
      { find: '@smart-cleaner-ui', replacement: resolve(__dirname, 'vendor/smart-cleaner-ui/src') },
      // The kit's full Material Symbols fonts are 9.4 MB; this site serves
      // trimmed faces instead. See SmartCleanerIconFonts.css.
      {
        find: /^material-symbols\/(outlined|rounded)\.css$/,
        replacement: resolve(__dirname, 'src/features/apps/smart-cleaner/presentation/SmartCleanerIconFonts.css'),
      },
    ],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  plugins: [copyRootSeoFiles()],
};
