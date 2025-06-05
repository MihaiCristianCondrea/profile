const base = 'https://cdn.jsdelivr.net/npm/@material/web@2.3.0';
const components = [
  '/button/filled-button.js',
  '/button/outlined-button.js',
  '/button/text-button.js',
  '/icon/icon.js',
  '/iconbutton/icon-button.js',
  '/list/list.js',
  '/list/list-item.js',
  '/chips/assist-chip.js',
  '/chips/chip-set.js',
  '/progress/circular-progress.js',
  '/divider/divider.js',
  '/labs/card/elevated-card.js',
  '/labs/card/filled-card.js',
  '/labs/card/outlined-card.js'
];
Promise.all(components.map(p => import(`${base}${p}?module`)))
  .catch(err => console.error('Failed to load Material components', err));

