// Copies Smart Cleaner's marketing UI kit and its runtime assets from a checkout
// of the app repository into this site. Usage:
//
//   npm run sync:smart-cleaner-ui -- ../smart-cleaner-for-android
//
// The kit (marketing/ui/src) is owned by the app repository: never edit the
// vendored copy here, change it there and sync again.
import { execFileSync } from 'node:child_process';
import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(process.argv[2] ?? '../smart-cleaner-for-android');
const kitSource = join(source, 'marketing/ui/src');
if (!existsSync(kitSource)) {
  throw new Error(`No marketing UI kit at ${kitSource}. Pass the path of a Smart Cleaner checkout.`);
}

const vendor = join(ROOT, 'vendor/smart-cleaner-ui/src');
const assets = join(ROOT, 'public/smart-cleaner-ui');
rmSync(vendor, { recursive: true, force: true });
rmSync(assets, { recursive: true, force: true });

// The kit minus the hub pages: this site hosts screens itself (SmartCleanerUiKit.ts).
for (const entry of ['config', 'kit', 'motion', 'screens', 'theme', 'embed.js']) {
  cpSync(join(kitSource, entry), join(vendor, entry), { recursive: true });
}

for (const folder of ['fonts', 'illustrations', 'logos', 'app-icons']) mkdirSync(join(assets, folder), { recursive: true });
copyFileSync(join(source, 'wear/src/main/res/font/google_sans_flex_variable.ttf'), join(assets, 'fonts/GoogleSansFlex.ttf'));
for (const [from, to] of [['marketing/assets/logos', 'logos'], ['marketing/assets/app-icons', 'app-icons']]) {
  for (const name of readdirSync(join(source, from)).filter((file) => file.endsWith('.svg'))) {
    copyFileSync(join(source, from, name), join(assets, to, name));
  }
}

// Only the Android illustrations the screens reference, from their resource folders.
const kitText = readdirSync(vendor, { recursive: true })
  .filter((file) => String(file).endsWith('.js'))
  .map((file) => readFileSync(join(vendor, String(file)), 'utf8'))
  .join('\n');
const used = new Set(kitText.match(/il_[a-z0-9_]+/g) ?? []);
let illustrations = 0;
for (const base of ['clean', 'feature']) {
  const modules = join(source, base);
  if (!existsSync(modules)) continue;
  for (const module of readdirSync(modules)) {
    for (const density of ['drawable-xhdpi', 'drawable']) {
      const folder = join(modules, module, 'src/main/res', density);
      if (!existsSync(folder)) continue;
      for (const name of readdirSync(folder)) {
        const match = /^(il_[a-z0-9_]+)\.(png|webp)$/.exec(name);
        const target = join(assets, 'illustrations', name);
        if (!match || !used.has(match[1]) || existsSync(target)) continue;
        copyFileSync(join(folder, name), target);
        illustrations += 1;
      }
    }
  }
}

// Device frames and the Play badge come from the installed Material Next.
execFileSync(process.execPath, [
  join(ROOT, 'node_modules/material-next-web-components/bin/mnw-marketing-assets.mjs'),
  join(assets, 'material-next'),
], { stdio: 'inherit' });

const commit = execFileSync('git', ['-C', source, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
writeFileSync(join(ROOT, 'vendor/smart-cleaner-ui/SOURCE'), `${commit}\n`);
console.log(`Synced Smart Cleaner UI kit at ${commit} (${illustrations} illustrations).`);
