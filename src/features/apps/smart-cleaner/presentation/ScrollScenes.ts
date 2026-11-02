/**
 * Scroll-scrubbed scenes. A scene is a tall section whose stage sticks to the
 * viewport; its progress runs from 0 when the section's top reaches the top of
 * the viewport to 1 when its bottom reaches the bottom. Progress is published as
 * `--p` on the section for CSS, and handed to the scene's callback for the
 * live screens.
 */
export type SceneUpdate = (progress: number) => void;

interface Scene {
  el: HTMLElement;
  update: SceneUpdate;
  last: number;
  /** `arrival` scenes report how far `el` has entered the viewport instead of a pinned progress. */
  arrival?: boolean;
}

/**
 * How far an element has scrolled into view: 0 while its top is at the bottom
 * of the viewport, 1 once its top has risen past 85% of it.
 */
export function arrivalProgress(top: number, viewport: number): number {
  return viewport > 0 ? clamp01((viewport - top) / (viewport * 0.85)) : 1;
}

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Progress of `value` through the window [start, end], clamped to 0..1. */
export function within(value: number, start: number, end: number): number {
  return end === start ? Number(value >= end) : clamp01((value - start) / (end - start));
}

/** A scene's progress from its section's box and the viewport height. */
export function sceneProgress(top: number, height: number, viewport: number): number {
  const travel = height - viewport;
  return travel > 0 ? clamp01(-top / travel) : Number(top <= 0);
}

export interface ScrollScenes {
  add(el: HTMLElement, update: SceneUpdate): void;
  /** Like `add`, but progress is the element's arrival into the viewport. */
  arrive(el: HTMLElement, update: SceneUpdate): void;
  /** Recompute now, for example after content above the scenes changed size. */
  refresh(): void;
  stop(): void;
}

/**
 * With `still` (reduced motion) every scene is shown at its end state once and
 * scrolling drives nothing.
 */
export function startScrollScenes({ still }: { still: boolean }): ScrollScenes {
  const scenes: Scene[] = [];
  let frame = 0;

  const measure = (): void => {
    frame = 0;
    const viewport = window.innerHeight;
    for (const scene of scenes) {
      const box = scene.el.getBoundingClientRect();
      const progress = scene.arrival
        ? arrivalProgress(box.top, viewport)
        : sceneProgress(box.top, box.height, viewport);
      if (progress === scene.last) continue;
      scene.last = progress;
      scene.el.style.setProperty('--p', progress.toFixed(4));
      scene.update(progress);
    }
  };

  const schedule = (): void => {
    if (!frame) frame = requestAnimationFrame(measure);
  };

  if (!still) {
    // Capture: the shell may scroll an inner element rather than the document.
    window.addEventListener('scroll', schedule, { capture: true, passive: true });
    window.addEventListener('resize', schedule, { passive: true });
  }

  return {
    arrive(el, update) {
      const scene = { el, update, last: -1, arrival: true };
      scenes.push(scene);
      if (still) update(1);
      else schedule();
    },
    add(el, update) {
      const scene = { el, update, last: -1 };
      scenes.push(scene);
      if (still) {
        el.style.setProperty('--p', '1');
        update(1);
      } else {
        schedule();
      }
    },
    refresh: () => {
      if (still) return;
      scenes.forEach((scene) => {
        scene.last = -1;
      });
      schedule();
    },
    stop() {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule, { capture: true });
      window.removeEventListener('resize', schedule);
      scenes.length = 0;
    },
  };
}
