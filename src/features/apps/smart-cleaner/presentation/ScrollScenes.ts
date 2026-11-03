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
  visible: boolean;
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

  let stopped = false;
  const measure = (): void => {
    frame = 0;
    if (stopped) return;
    const viewport = window.innerHeight;
    // Finish every layout read before a callback can change the DOM.
    // Read offscreen boxes too: a fast jump must still publish both endpoints.
    const measured = scenes.map((scene) => {
      const box = scene.el.getBoundingClientRect();
      const raw = scene.arrival
        ? arrivalProgress(box.top, viewport)
        : sceneProgress(box.top, box.height, viewport);
      return { scene, progress: Math.round(raw * 10000) / 10000 };
    });
    for (const { scene, progress } of measured) {
      if (progress === scene.last) continue;
      if (!scene.visible && progress > 0 && progress < 1) continue;
      scene.last = progress;
      scene.el.style.setProperty('--p', String(progress));
      scene.update(progress);
    }
  };

  const schedule = (): void => {
    if (!stopped && !frame) frame = requestAnimationFrame(measure);
  };

  const observer = !still && typeof IntersectionObserver === 'function'
    ? new IntersectionObserver((entries) => {
      for (const entry of entries) {
        for (const scene of scenes) {
          if (scene.el === entry.target) scene.visible = entry.isIntersecting;
        }
      }
      schedule();
    })
    : undefined;
  const resizeObserver = !still && typeof ResizeObserver === 'function'
    ? new ResizeObserver(schedule)
    : undefined;

  if (!still) {
    // Capture: the shell may scroll an inner element rather than the document.
    window.addEventListener('scroll', schedule, { capture: true, passive: true });
    window.addEventListener('resize', schedule, { passive: true });
  }

  return {
    arrive(el, update) {
      const scene = { el, update, last: -1, visible: true, arrival: true };
      scenes.push(scene);
      observer?.observe(el);
      resizeObserver?.observe(el);
      if (still) {
        el.style.setProperty('--p', '1');
        update(1);
      } else schedule();
    },
    add(el, update) {
      const scene = { el, update, last: -1, visible: true };
      scenes.push(scene);
      observer?.observe(el);
      resizeObserver?.observe(el);
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
      stopped = true;
      observer?.disconnect();
      resizeObserver?.disconnect();
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule, { capture: true });
      window.removeEventListener('resize', schedule);
      scenes.length = 0;
    },
  };
}
