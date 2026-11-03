import { arrivalProgress, sceneProgress, startScrollScenes, within } from '../../../../../src/features/apps/smart-cleaner/presentation/ScrollScenes';

describe('ScrollScenes', () => {
  test('progress runs from the section top reaching the viewport top to its bottom reaching the bottom', () => {
    expect(sceneProgress(100, 3000, 1000)).toBe(0);
    expect(sceneProgress(-1000, 3000, 1000)).toBe(0.5);
    expect(sceneProgress(-2500, 3000, 1000)).toBe(1);
    expect(sceneProgress(-10, 800, 1000)).toBe(1);
  });

  test('within maps a value through a window and clamps it', () => {
    expect(within(0.5, 0.4, 0.6)).toBeCloseTo(0.5);
    expect(within(0.1, 0.4, 0.6)).toBe(0);
    expect(within(0.9, 0.4, 0.6)).toBe(1);
  });

  test('a still scene is published at its end state once', () => {
    const scenes = startScrollScenes({ still: true });
    const el = document.createElement('section');
    const update = jest.fn();
    scenes.add(el, update);

    expect(update).toHaveBeenCalledWith(1);
    expect(el.style.getPropertyValue('--p')).toBe('1');
    scenes.stop();
  });
});

describe('arrivalProgress', () => {
  test('runs from the element entering at the bottom to 85% up the viewport', () => {
    expect(arrivalProgress(1000, 1000)).toBe(0);
    expect(arrivalProgress(575, 1000)).toBeCloseTo(0.5);
    expect(arrivalProgress(150, 1000)).toBe(1);
    expect(arrivalProgress(-200, 1000)).toBe(1);
  });
});

describe('scroll frame scheduling', () => {
  let frames: FrameRequestCallback[];
  beforeEach(() => {
    frames = [];
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());
  const tick = (): void => { frames.splice(0).forEach((callback) => callback(0)); };

  test('batches every box read before any scene callback writes', () => {
    const order: string[] = [];
    const scenes = startScrollScenes({ still: false });
    for (const id of ['first', 'second']) {
      const el = document.createElement('section');
      el.getBoundingClientRect = () => {
        order.push(`read ${id}`);
        return { top: -500, height: 2000 } as DOMRect;
      };
      scenes.add(el, () => order.push(`write ${id}`));
    }
    expect(frames).toHaveLength(1);
    tick();
    expect(order).toEqual(['read first', 'read second', 'write first', 'write second']);
    scenes.stop();
  });

  test('fast jumps publish endpoints in both directions and settled frames do not update', () => {
    const scenes = startScrollScenes({ still: false });
    const el = document.createElement('section');
    let top = 500;
    el.getBoundingClientRect = () => ({ top, height: 3000 } as DOMRect);
    const update = jest.fn();
    scenes.add(el, update);
    tick();
    top = -5000;
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('scroll'));
    expect(frames).toHaveLength(1);
    tick();
    window.dispatchEvent(new Event('scroll'));
    tick();
    top = 500;
    window.dispatchEvent(new Event('scroll'));
    tick();
    expect(update.mock.calls.map(([value]) => value)).toEqual([0, 1, 0]);
    scenes.stop();
    window.dispatchEvent(new Event('scroll'));
    expect(frames).toHaveLength(0);
  });

  test('ignores subprecision movement but refresh republishes state after a resize', () => {
    const scenes = startScrollScenes({ still: false });
    const el = document.createElement('section');
    let top = -400;
    el.getBoundingClientRect = () => ({ top, height: window.innerHeight + 1000 } as DOMRect);
    const update = jest.fn();
    scenes.add(el, update);
    tick();
    top -= 0.001;
    window.dispatchEvent(new Event('scroll'));
    tick();
    expect(update).toHaveBeenCalledTimes(1);
    scenes.refresh();
    tick();
    expect(update).toHaveBeenCalledTimes(2);
    scenes.stop();
  });
});
