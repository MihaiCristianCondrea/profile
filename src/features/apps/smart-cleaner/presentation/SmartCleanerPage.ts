import type { ScreenHost, ScreenState } from 'material-next-web-components/marketing.js';
import { fetchPixelModel } from '../data/PixelModelSource.ts';
import { clamp01, startScrollScenes, within } from './ScrollScenes.ts';
import type { Pixel3D } from './Pixel3D.ts';
import {
  isPartName,
  loadSmartCleanerUiKit,
  type SmartCleanerTheme,
  type SmartCleanerUiKit,
} from './SmartCleanerUiKit.ts';

/** The framed Pixel 9 Pro XL from Material Next's device frames, in CSS pixels. */
const DEVICE_WIDTH = 469;
const DEVICE_HEIGHT = 992;
/** The site's top app bar plus breathing room around a pinned phone. */
const VIEWPORT_CHROME = 150;
const LOGO_DURATION_MS = 900;
/** Storage categories, in the ring's order (motion/storage-ring.js). */
const CATEGORY_IDS = ['images', 'videos', 'apps', 'downloads', 'system'] as const;

function reduceMotionEnabled(): boolean {
  return typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function siteTheme(): SmartCleanerTheme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

/** `data-state` is authored JSON; anything else falls back to the screen's defaults. */
export function parseScreenState(source: string | undefined): ScreenState | undefined {
  if (!source) return undefined;
  try {
    const value: unknown = JSON.parse(source);
    return value && typeof value === 'object' && !Array.isArray(value) ? value as ScreenState : undefined;
  } catch {
    return undefined;
  }
}

/** Scale that fits the framed phone inside `maxHeight` and the stage width. */
export function deviceZoom(stageWidth: number, maxHeight: number): number {
  const byHeight = maxHeight / DEVICE_HEIGHT;
  const byWidth = stageWidth > 0 ? stageWidth / DEVICE_WIDTH : byHeight;
  return Math.max(0.3, Math.min(byHeight, byWidth));
}

/**
 * Height for a phone pinned in a scene. On one-column layouts the copy shares
 * the viewport with it, so the phone takes a little over half.
 */
export function viewportDeviceHeight(width: number, height: number): number {
  return width < 900 ? Math.max(320, height * 0.56) : Math.min(840, height - VIEWPORT_CHROME);
}

/**
 * Quick Clean, scrubbed: the first 70% of the scene runs the scan from 0 to
 * 100%, and from 80% the screen shows its finished state, which then animates
 * in on the screen's own clock.
 */
export function quickCleanState(progress: number): ScreenState {
  if (progress >= 0.8) return { phase: 'done' };
  return { phase: 'scanning', progress: within(progress, 0, 0.7), running: false, derive: true };
}

/** Gallery Swipe Cleaner, scrubbed: the card leans left (delete), then right (keep), then rests. */
export function swipeDrag(progress: number): number {
  return -Math.sin(clamp01(progress) * Math.PI * 2) * 0.85;
}

/** Runs `onVisible` the first time `el` is at least half on screen. */
function whenVisible(el: Element, onVisible: () => void, cleanups: Array<() => void>): void {
  if (typeof IntersectionObserver !== 'function') {
    onVisible();
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    onVisible();
  }, { threshold: 0.5 });
  observer.observe(el);
  cleanups.push(() => observer.disconnect());
}

function animateLogo(kit: SmartCleanerUiKit, el: HTMLElement, size: number, still: boolean): void {
  if (still || typeof requestAnimationFrame !== 'function') {
    kit.renderLogo(el, size, 1);
    return;
  }
  kit.renderLogo(el, size, 0);
  let start = 0;
  const frame = (now: number): void => {
    start ||= now;
    const progress = Math.min(1, (now - start) / LOGO_DURATION_MS);
    kit.renderLogo(el, size, progress);
    if (progress < 1 && el.isConnected) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/** Numeric state values: the screen's scroll offsets live among them. */
function numericSnapshot(state: ScreenState): string {
  return Object.entries(state)
    .filter(([, value]) => typeof value === 'number')
    .map(([key, value]) => `${key}:${String(value)}`)
    .join('|');
}

function scrollContainerOf(event: Event): Element | null {
  for (const node of event.composedPath()) {
    if (!(node instanceof Element)) continue;
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) return node;
  }
  return document.scrollingElement;
}

/**
 * The kit scrolls a screen from state and always cancels the wheel event, so a
 * wheel over a phone would never reach the page. When the screen did not move
 * (it is at its top or bottom, or does not scroll), hand the wheel back.
 */
function releaseWheelAtEdges(device: HTMLElement, host: () => ScreenHost | undefined, cleanups: Array<() => void>): void {
  let before = '';
  const capture = (): void => {
    const current = host();
    before = current ? numericSnapshot(current.state) : '';
  };
  const bubble = (event: WheelEvent): void => {
    const current = host();
    if (!event.defaultPrevented || !current || numericSnapshot(current.state) !== before) return;
    scrollContainerOf(event)?.scrollBy({ top: event.deltaY, left: event.deltaX });
  };
  device.addEventListener('wheel', capture, { capture: true, passive: true });
  device.addEventListener('wheel', bubble);
  cleanups.push(() => {
    device.removeEventListener('wheel', capture, { capture: true });
    device.removeEventListener('wheel', bubble);
  });
}

export function initSmartCleanerPage(): void {
  const page = document.getElementById('smartCleanerPageContainer');
  if (!page) return;

  const still = reduceMotionEnabled();
  page.classList.toggle('is-still', still);
  const cleanups: Array<() => void> = [];
  const hosts = new Map<HTMLElement, ScreenHost>();

  const applyTheme = (): void => {
    const theme = siteTheme();
    page.dataset.theme = theme;
    hosts.forEach((host) => host.setOptions({ theme }));
  };
  applyTheme();
  const themeObserver = new MutationObserver(applyTheme);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  cleanups.push(() => themeObserver.disconnect());

  const devices = Array.from(page.querySelectorAll<HTMLElement>('.cleaner-device[data-screen]'));
  const fitDevices = (): void => {
    devices.forEach((device) => {
      // The figure, not the shrink-wrapped Pixel stage, gives the room available.
      const stage = device.closest('figure') ?? device.parentElement;
      const maxHeight = device.dataset.deviceFit === 'viewport'
        ? viewportDeviceHeight(window.innerWidth, window.innerHeight) - (Number(device.dataset.deviceReserve) || 0)
        : Number(device.dataset.deviceHeight) || 720;
      device.style.setProperty('--device-zoom', String(deviceZoom(stage?.clientWidth ?? 0, maxHeight)));
    });
  };
  fitDevices();
  window.addEventListener('resize', fitDevices, { passive: true });
  cleanups.push(() => window.removeEventListener('resize', fitDevices));
  if (typeof ResizeObserver === 'function') {
    const resizeObserver = new ResizeObserver(fitDevices);
    devices.forEach((device) => {
      const stage = device.closest('figure') ?? device.parentElement;
      if (stage) resizeObserver.observe(stage);
    });
    cleanups.push(() => resizeObserver.disconnect());
  }
  devices.forEach((device) => releaseWheelAtEdges(device, () => hosts.get(device), cleanups));

  const scenes = startScrollScenes({ still });
  cleanups.push(() => scenes.stop());

  // Tear everything down once the router swaps this page out.
  const teardown = (): void => {
    cleanups.splice(0).forEach((cleanup) => cleanup());
    hosts.forEach((host) => host.destroy());
    hosts.clear();
  };
  if (page.parentElement) {
    const detachObserver = new MutationObserver(() => {
      if (page.isConnected) return;
      detachObserver.disconnect();
      teardown();
    });
    detachObserver.observe(page.parentElement, { childList: true });
  }

  // Every phone is the 3D Pixel first: it turns in, and the live screen takes
  // its place once it faces front. Skipped for reduced motion and without
  // WebGL, where the flat device is shown from the start.
  const pixelStages = Array.from(page.querySelectorAll<HTMLElement>('[data-pixel]'));
  const pixels = new Map<HTMLElement, Pixel3D>();
  const heroStage = pixelStages.find((stage) => stage.dataset.pixelArrival === undefined);
  pixelStages.forEach((stage) => {
    if (stage.dataset.pixelArrival === undefined) return;
    const side = stage.dataset.pixelArrival === 'left' ? -1 : 1;
    scenes.arrive(stage, (arrival) => {
      stage.style.setProperty('--live', within(arrival, 0.9, 1).toFixed(3));
      pixels.get(stage)?.pose(0.4 + 0.6 * arrival, (1 - arrival) * 0.22, side);
    });
  });
  if (pixelStages.length > 0 && !still) {
    void Promise.all([fetchPixelModel(), import('./Pixel3D.ts')])
      .then(async ([model, { createPixel3D }]) => {
        for (const stage of pixelStages) {
          const canvas = stage.querySelector<HTMLCanvasElement>('canvas.cleaner-pixel');
          if (!canvas || !page.isConnected) continue;
          const pixel = await createPixel3D(canvas, model);
          pixels.set(stage, pixel);
          cleanups.push(() => pixel.dispose());
        }
        if (!page.isConnected) {
          pixels.forEach((pixel) => pixel.dispose());
          return;
        }
        const fit = (): void => pixels.forEach((pixel, stage) => {
          const canvas = stage.querySelector<HTMLCanvasElement>('canvas.cleaner-pixel');
          if (canvas) pixel.resize(canvas.clientWidth, canvas.clientHeight);
        });
        page.classList.add('has-pixel');
        fit();
        if (typeof ResizeObserver === 'function') {
          const observer = new ResizeObserver(fit);
          pixelStages.forEach((stage) => observer.observe(stage));
          cleanups.push(() => observer.disconnect());
        }
        scenes.refresh();
      })
      .catch((error: unknown) => console.warn('Smart Cleaner: 3D phone unavailable, showing the flat device.', error));
  }

  void loadSmartCleanerUiKit().then((kit) => {
    if (!page.isConnected) return;
    page.classList.add('is-live');

    devices.forEach((device) => {
      hosts.set(device, kit.mountScreen(device, device.dataset.screen ?? '', {
        state: parseScreenState(device.dataset.state),
        theme: siteTheme(),
      }));
    });
    const hostOf = (selector: string): ScreenHost | undefined => {
      const device = page.querySelector<HTMLElement>(selector);
      return device ? hosts.get(device) : undefined;
    };

    page.querySelectorAll<HTMLElement>('[data-part]').forEach((piece) => {
      const name = piece.dataset.part;
      if (isPartName(name)) kit.renderPart(piece, name);
    });

    const heroLogo = page.querySelector<HTMLElement>('#cleanerHeroLogo');
    if (heroLogo) animateLogo(kit, heroLogo, 40, still);
    const closingLogo = page.querySelector<HTMLElement>('#cleanerClosingLogo');
    if (closingLogo) whenVisible(closingLogo, () => animateLogo(kit, closingLogo, 120, still), cleanups);

    // Opening: CSS reads --p to fly the pieces into the phone. Once it has
    // landed, the phone takes taps.
    const assemble = page.querySelector<HTMLElement>('[data-scene="assemble"]');
    if (assemble) scenes.add(assemble, (progress) => {
      assemble.classList.toggle('is-assembled', progress > 0.55);
      if (heroStage) pixels.get(heroStage)?.pose(within(progress, 0.1, 0.55), (1 - within(progress, 0.1, 0.55)) * 0.12);
    });

    const quick = page.querySelector<HTMLElement>('[data-scene="quick"]');
    const quickHost = hostOf('[data-screen="quick-clean"]');
    const steps = Array.from(page.querySelectorAll<HTMLElement>('.cleaner-steps [data-step]'));
    if (quick && quickHost) {
      scenes.add(quick, (progress) => {
        const next = quickCleanState(progress);
        if (next.phase !== 'done') quickHost.set(next);
        else if (quickHost.state.phase !== 'done') {
          // The finished screen eases in on its own clock; a still page shows it settled.
          const entrance = still ? 1 : 0;
          quickHost.set({ phase: 'done', running: false, heroIn: entrance, cardsIn: entrance });
        }
        const active = progress >= 0.8 ? 2 : progress >= 0.25 ? 1 : 0;
        steps.forEach((step) => step.classList.toggle('is-active', Number(step.dataset.step) === active));
      });
    }

    const swipe = page.querySelector<HTMLElement>('[data-scene="swipe"]');
    const swipeHost = hostOf('[data-screen="gallery-cleaner"]');
    if (swipe && swipeHost) {
      scenes.add(swipe, (progress) => {
        const drag = swipeDrag(progress);
        swipe.style.setProperty('--lean', drag.toFixed(3));
        const state = swipeHost.state as { phase?: string; dragging?: boolean; fling?: number };
        if (state.phase === 'review' && !state.dragging && !state.fling) swipeHost.set({ drag, settle: false });
      });
    }

    const storage = page.querySelector<HTMLElement>('[data-scene="storage"]');
    const ring = page.querySelector<HTMLElement>('#cleanerRing');
    const tiles = Array.from(page.querySelectorAll<HTMLElement>('.cleaner-tile[data-category]'));
    tiles.forEach((tile) => kit.renderCategoryTile(tile, tile.dataset.category ?? ''));
    if (storage && ring) {
      scenes.add(storage, (progress) => {
        const peeled: string[] = [];
        CATEGORY_IDS.forEach((id, index) => {
          const lift = within(progress, 0.55 + index * 0.07, 0.67 + index * 0.07);
          tiles.find((tile) => tile.dataset.category === id)?.style.setProperty('--t', lift.toFixed(3));
          if (lift > 0) peeled.push(id);
        });
        kit.renderRing(ring, Math.round(Math.min(360, ring.clientWidth || 360)), within(progress, 0.05, 0.5), peeled);
      });
    }

    const toolHost = hostOf('#cleanerToolDevice');
    const tools = Array.from(page.querySelectorAll<HTMLElement>('#cleanerTools [data-tool]'));
    tools.forEach((tool) => tool.addEventListener('click', () => {
      const id = tool.dataset.tool;
      if (!id || !toolHost) return;
      // md-list-item moves aria-* onto its inner element, so the visual state
      // rides on data-selected while aria-current keeps it announced.
      tools.forEach((item) => {
        item.toggleAttribute('data-selected', item === tool);
        if (item === tool) item.setAttribute('aria-current', 'true');
        else item.removeAttribute('aria-current');
      });
      toolHost.load(id);
    }));
  }).catch((error: unknown) => {
    console.error('Smart Cleaner: the live app preview could not load.', error);
    page.classList.add('is-offline');
  });
}
