import type { ScreenHost, ScreenState } from 'material-next-web-components/marketing.js';

/**
 * Where `npm run sync:smart-cleaner-ui` places the kit's fonts, illustrations,
 * logos and device frames. Relative, like the rest of the build (`base: './'`):
 * routes are hash fragments, so the document URL is always the site root.
 */
const ASSET_BASE = './smart-cleaner-ui/';

/** App Toolkit's blue palette: the app's default theme. */
export const SMART_CLEANER_PALETTE = 'blue';

/** The real UI pieces the opening scene floats and assembles, by `data-part` name. */
export const PART_NAMES = [
  'quickScanCard',
  'swipeCard',
  'quickCleanRow',
  'categoryTile',
  'duplicateRow',
  'metadataDetail',
  'largeFileRow',
  'statusChip',
] as const;
export type PartName = typeof PART_NAMES[number];

export function isPartName(value: string | undefined): value is PartName {
  return PART_NAMES.includes(value as PartName);
}

export type SmartCleanerTheme = 'light' | 'dark';

export interface LiveScreenOptions {
  state?: ScreenState;
  theme: SmartCleanerTheme;
  /** Draw the Pixel device around the screen. */
  frame?: boolean;
}

export interface SmartCleanerUiKit {
  /** Hosts one of the app's real screens, live and interactive, inside `el`. */
  mountScreen(el: HTMLElement, id: string, options: LiveScreenOptions): ScreenHost;
  /** Renders the broom logo, animatable through the same parts as the app's splash. */
  renderLogo(el: HTMLElement, size: number, progress: number): void;
  /** Renders one piece of a real screen, outside any phone. */
  renderPart(el: HTMLElement, name: PartName): void;
  /** The storage ring: `progress` reveals segments, `peeled` lifts categories off. */
  renderRing(el: HTMLElement, size: number, progress: number, peeled: readonly string[]): void;
  /** One storage category tile, as the ring's segments become. */
  renderCategoryTile(el: HTMLElement, id: string): void;
}

let pending: Promise<SmartCleanerUiKit> | null = null;

/**
 * Loads the kit on demand, so the rest of the site never downloads it.
 *
 * The kit's `embed.js` is deliberately not used: its `setup()` marks the whole
 * document `data-motion="frame"`, which freezes every CSS animation for video
 * rendering. A web page wants live motion, so this loads the theme and screens
 * directly and hosts them with Material Next's `ScreenHost`.
 */
export function loadSmartCleanerUiKit(): Promise<SmartCleanerUiKit> {
  pending ??= (async () => {
    const [{ setAssetBase }, { loadFonts }, { SCREENS }, { logo }, { PARTS: k }, marketing, { html, render }] = await Promise.all([
      import('@smart-cleaner-ui/kit/assets.js'),
      import('@smart-cleaner-ui/theme/index.js'),
      import('@smart-cleaner-ui/screens/index.js'),
      import('@smart-cleaner-ui/motion/logo.js'),
      import('@smart-cleaner-ui/embed.js'),
      import('material-next-web-components/marketing.js'),
      import('lit'),
    ]);

    setAssetBase(ASSET_BASE);
    marketing.configureMarketingAssets({ base: `${ASSET_BASE}material-next/` });
    await loadFonts();

    const registry = marketing.createScreenRegistry(SCREENS);

    // Each piece in a state the app really shows; `.sc-part` gives it a screen's text context.
    const parts: Record<PartName, () => unknown> = {
      quickScanCard: () => k.quickScanCard({ free: 20, used: 80, progress: 0.8, message: '20% free left. Worth clearing some space.' }),
      swipeCard: () => html`<div class="cleaner-part-deck">${k.swipeCard(10)}</div>`,
      quickCleanRow: () => k.groupedList([
        k.quickCleanRow('cache', { status: 'cleaned' }),
        k.quickCleanRow('folders', { status: 'cleaned' }),
      ]),
      categoryTile: () => k.categoryTile('images'),
      duplicateRow: () => k.groupedList([k.duplicateRow(2, { checked: true })]),
      metadataDetail: () => k.metadataDetail('gps'),
      largeFileRow: () => k.groupedList([k.largeFileRow(0, { checked: true })]),
      statusChip: () => k.statusChip(true),
    };

    return {
      mountScreen: (el, id, { state, theme, frame = true }) => new marketing.ScreenHost(el, {
        registry,
        id,
        state,
        theme,
        frame,
        palette: SMART_CLEANER_PALETTE,
      }),
      renderLogo: (el, size, progress) => render(html`${logo(size, splashParts(progress), { broom: splashBroom(progress) })}`, el),
      renderPart: (el, name) => render(html`<div class="sc-part">${parts[name]()}</div>`, el),
      renderRing: (el, size, progress, peeled) => render(
        html`<div class="sc-part">${k.storageRing({ size, stroke: Math.round(size / 11), progress, peeled: [...peeled] })}</div>`,
        el,
      ),
      renderCategoryTile: (el, id) => render(html`<div class="sc-part">${k.categoryTile(id)}</div>`, el),
    };
  })();
  pending.catch(() => {
    pending = null;
  });
  return pending;
}

/** Overshoot easing, like the splash's `overshoot` interpolator. */
function overshoot(t: number): number {
  const c = 1.70158;
  const x = Math.min(1, Math.max(0, t)) - 1;
  return 1 + (c + 1) * x * x * x + c * x * x;
}

/** anim_splash: the broom turns in from -90° and scale 0 over the first 60%. */
function splashBroom(progress: number): { s: number; r: number } {
  const t = overshoot(progress / 0.6);
  return { s: t, r: -90 * (1 - Math.min(1, progress / 0.6)) };
}

/** Then each sparkle pops on its own. */
function splashParts(progress: number): Record<string, { s: number }> {
  return {
    sparkleYellow: { s: overshoot((progress - 0.55) / 0.25) },
    sparkleBlue: { s: overshoot((progress - 0.7) / 0.25) },
  };
}
