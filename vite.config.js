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
  base: '/profile/',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  plugins: [copyRootSeoFiles()],
};
