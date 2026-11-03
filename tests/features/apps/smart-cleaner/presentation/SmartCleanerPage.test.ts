import {
  createPixelsAtomically,
  deviceZoom,
  initSmartCleanerPage,
  parseScreenState,
  quickCleanState,
  swipeDrag,
  viewportDeviceHeight,
} from '../../../../../src/features/apps/smart-cleaner/presentation/SmartCleanerPage';
import { loadSmartCleanerUiKit } from '../../../../../src/features/apps/smart-cleaner/presentation/SmartCleanerUiKit';

jest.mock('../../../../../src/features/apps/smart-cleaner/presentation/SmartCleanerUiKit', () => ({
  loadSmartCleanerUiKit: jest.fn(),
  isPartName: (value: string | undefined) => value === 'statusChip',
}));

interface FakeHost {
  id: string;
  state: Record<string, unknown>;
  options: Record<string, unknown>;
  set: jest.Mock;
  load: jest.Mock;
  setOptions: jest.Mock;
  destroy: jest.Mock;
}

const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe('SmartCleanerPage', () => {
  let hosts: FakeHost[];
  let kit: Record<string, jest.Mock>;

  beforeEach(() => {
    hosts = [];
    kit = {
      mountScreen: jest.fn((_el: HTMLElement, id: string, options: Record<string, unknown>) => {
        const host: FakeHost = {
          id,
          state: { ...(options.state as object) },
          options,
          set: jest.fn(),
          load: jest.fn(),
          setOptions: jest.fn(),
          destroy: jest.fn(),
        };
        hosts.push(host);
        return host;
      }),
      renderLogo: jest.fn(),
      renderPart: jest.fn(),
      renderRing: jest.fn(),
      renderCategoryTile: jest.fn(),
    };
    (loadSmartCleanerUiKit as jest.Mock).mockResolvedValue(kit);
    document.documentElement.classList.remove('dark');
    document.body.innerHTML = `
      <main id="area">
        <div id="smartCleanerPageContainer">
          <section data-scene="assemble">
            <div data-part="statusChip"></div>
            <div class="cleaner-device" data-screen="dashboard" data-device-fit="viewport"></div>
          </section>
          <section data-scene="quick">
            <ol class="cleaner-steps"><li data-step="0"></li><li data-step="1"></li><li data-step="2"></li></ol>
            <div class="cleaner-device" data-screen="quick-clean" data-state='{"phase":"scanning","progress":0}'></div>
          </section>
          <div id="cleanerTools">
            <button data-tool="duplicates" data-selected aria-current="true"></button>
            <button data-tool="large-files" id="largeFilesTool"></button>
          </div>
          <div class="cleaner-device" id="cleanerToolDevice" data-screen="duplicates"></div>
        </div>
      </main>`;
  });

  test('hosts every marked screen live, in the site theme, and renders the floating parts', async () => {
    document.documentElement.classList.add('dark');
    initSmartCleanerPage();
    await flush();

    expect(hosts.map((host) => host.id)).toEqual(['dashboard', 'quick-clean', 'duplicates']);
    expect(hosts[1].state).toEqual({ phase: 'scanning', progress: 0 });
    expect(hosts.every((host) => host.options.theme === 'dark')).toBe(true);
    expect(kit.renderPart).toHaveBeenCalledWith(expect.any(HTMLElement), 'statusChip');
  });

  test('choosing a tool loads its screen and moves the selection', async () => {
    initSmartCleanerPage();
    await flush();
    document.getElementById('largeFilesTool')?.click();

    const previous = document.querySelector('[data-tool="duplicates"]');
    expect(hosts[2].load).toHaveBeenCalledWith('large-files');
    expect(document.getElementById('largeFilesTool')?.getAttribute('aria-current')).toBe('true');
    expect(document.getElementById('largeFilesTool')?.hasAttribute('data-selected')).toBe(true);
    expect(previous?.hasAttribute('data-selected')).toBe(false);
    expect(previous?.hasAttribute('aria-current')).toBe(false);
  });

  test('reduced motion shows every scene at its end state', async () => {
    const matchMedia = window.matchMedia;
    window.matchMedia = jest.fn().mockReturnValue({ matches: true }) as typeof window.matchMedia;
    initSmartCleanerPage();
    await flush();
    window.matchMedia = matchMedia;

    const page = document.getElementById('smartCleanerPageContainer');
    expect(page?.classList.contains('is-still')).toBe(true);
    expect(hosts[1].set).toHaveBeenCalledWith(expect.objectContaining({ phase: 'done', heroIn: 1, cardsIn: 1 }));
    expect(document.querySelector('[data-step="2"]')?.classList.contains('is-active')).toBe(true);
  });

  test('releases the live screens when the router swaps the page out', async () => {
    initSmartCleanerPage();
    await flush();
    document.getElementById('area')?.replaceChildren();
    await flush();

    expect(hosts.every((host) => host.destroy.mock.calls.length === 1)).toBe(true);
  });

  test('marks the page offline when the kit cannot load', async () => {
    (loadSmartCleanerUiKit as jest.Mock).mockRejectedValue(new Error('offline'));
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    initSmartCleanerPage();
    await flush();

    expect(document.getElementById('smartCleanerPageContainer')?.classList.contains('is-offline')).toBe(true);
    error.mockRestore();
  });
});

describe('scene choreography', () => {
  test('Quick Clean scans over the first 70% and finishes from 80%', () => {
    expect(quickCleanState(0)).toMatchObject({ phase: 'scanning', progress: 0 });
    expect(quickCleanState(0.35)).toMatchObject({ phase: 'scanning', progress: 0.5 });
    expect(quickCleanState(0.75)).toMatchObject({ phase: 'scanning', progress: 1 });
    expect(quickCleanState(0.8)).toEqual({ phase: 'done' });
  });

  test('the swipe leans left first, then right, and rests at both ends', () => {
    expect(swipeDrag(0)).toBeCloseTo(0);
    expect(swipeDrag(0.25)).toBeCloseTo(-0.85);
    expect(swipeDrag(0.75)).toBeCloseTo(0.85);
    expect(swipeDrag(1)).toBeCloseTo(0);
  });
});

describe('screen helpers', () => {
  test('parseScreenState accepts only JSON objects', () => {
    expect(parseScreenState('{"free":8}')).toEqual({ free: 8 });
    expect(parseScreenState('[1]')).toBeUndefined();
    expect(parseScreenState('not json')).toBeUndefined();
    expect(parseScreenState(undefined)).toBeUndefined();
  });

  test('deviceZoom fits the phone in both the height cap and the stage width', () => {
    expect(deviceZoom(1000, 496)).toBeCloseTo(0.5);
    expect(deviceZoom(234.5, 992)).toBeCloseTo(0.5);
    expect(deviceZoom(0, 496)).toBeCloseTo(0.5);
  });

  test('pinned phones share a narrow viewport with their copy', () => {
    expect(viewportDeviceHeight(1440, 900)).toBe(750);
    expect(viewportDeviceHeight(390, 800)).toBeCloseTo(448);
  });
});

describe('createPixelsAtomically', () => {
  const stage = (): HTMLElement => {
    const el = document.createElement('div');
    el.append(document.createElement('canvas'));
    el.firstElementChild?.classList.add('cleaner-pixel');
    return el;
  };
  const pixel = (): { pose: jest.Mock; resize: jest.Mock; attachScreen: jest.Mock; dispose: jest.Mock } => ({
    pose: jest.fn(),
    resize: jest.fn(),
    attachScreen: jest.fn(),
    dispose: jest.fn(),
  });

  test('creates a Pixel for every stage', async () => {
    const stages = [stage(), stage()];
    const created = await createPixelsAtomically(stages, () => Promise.resolve(pixel()));

    expect([...created.keys()]).toEqual(stages);
  });

  test('disposes the Pixels already built when a later one fails', async () => {
    const first = pixel();
    const second = pixel();
    const results = [Promise.resolve(first), Promise.resolve(second), Promise.reject(new Error('WebGL lost'))];

    await expect(createPixelsAtomically([stage(), stage(), stage()], () => results.shift() as Promise<typeof first>))
      .rejects.toThrow('WebGL lost');
    expect(first.dispose).toHaveBeenCalledTimes(1);
    expect(second.dispose).toHaveBeenCalledTimes(1);
  });

  test('fails, and builds nothing further, when a stage has no canvas', async () => {
    const create = jest.fn(() => Promise.resolve(pixel()));

    await expect(createPixelsAtomically([document.createElement('div')], create)).rejects.toThrow('no canvas');
    expect(create).not.toHaveBeenCalled();
  });
});
