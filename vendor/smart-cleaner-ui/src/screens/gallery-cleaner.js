/** Mirrors GalleryCleanerScreen.kt (feature/gallerycleaner). */
import { html, nothing } from "lit";
import { MB, alertDialog, button, cleaningScreen, fileSize, goer, illustration } from "../kit/components.js";
import { previewScreen } from "material-next-web-components/marketing.js";
import { APP } from "../config/identity.js";
import { icon } from "../kit/shell.js";
import { PHOTO_STYLES, photo, photoKind } from "../motion/photo.js";

/** Camera-roll order: seeds for photo(), with file names and details like the swipe card shows. */
export const ROLL = [10, 2, 7, 16, 25, 0, 22, 13, 8, 5, 21, 1, 12, 3, 27];
const pad = (n, w = 2) => String(n).padStart(w, "0");
/** When a seed was "taken": a stable date and time, so names and details never change between renders. */
const takenAt = (seed) => {
  const m = 3 + (seed % 7);
  const d = 1 + ((seed * 7) % 28);
  const t = [8 + ((seed * 5) % 13), (seed * 17) % 60, (seed * 29) % 60];
  return { date: `2026${pad(m)}${pad(d)}`, time: t.map((x) => pad(x)).join("") };
};
const isVideo = (seed) => seed % 4 === 0;
const isShot = (seed) => photoKind(seed) >= PHOTO_STYLES.length;
/** Camera-roll names as Android writes them: camera photos, Pixel shots, screen recordings and screenshots. */
const nameOf = (seed) => {
  const { date, time } = takenAt(seed);
  if (isShot(seed)) return `Screenshot_${date}-${time}.png`;
  if (isVideo(seed)) return `VID_${date}_${time}.mp4`;
  return seed % 3 ? `IMG_${date}_${time}.jpg` : `PXL_${date}_${time}${pad((seed * 37) % 1000, 3)}.jpg`;
};
const bytesOf = (seed) => (isVideo(seed) ? 18 + (seed % 5) * 9.4 : 0.9 + (seed % 7) * 0.61) * MB;
const dimsOf = (seed) => (isShot(seed) ? "1080 × 2400" : isVideo(seed) ? "1920 × 1080" : seed % 2 ? "3024 × 4032" : "4032 × 3024");
/** gallery_media_details: "%1$s • %2$d × %3$d" */
const detailsOf = (seed) => `${fileSize(bytesOf(seed))} • ${dimsOf(seed)}`;

/** GallerySwipeDeck constants. */
const THRESHOLD = 0.24; // of the deck width
const BACK_REST = 0.92;
const BACK_ENTER = 0.88; // a newly revealed back card grows 0.88 -> 0.92 and fades in to 0.55
const KEEP = "#3DDC84";
const DELETE = "#EA4335";

/**
 * GalleryMediaCard inside GallerySwipeDeck. `drag` is the front card's horizontal offset as a
 * fraction of the deck width (negative = delete, positive = keep); `dragY` is in dp.
 *
 * Front card: translationX = drag, translationY = dragY * 0.28, rotation = drag * 7deg.
 * Back card: scales 0.92 -> 1, drops 16dp -> 0 and its image fades 0.55 -> 1 as the front card
 * reaches the threshold, so it lands exactly on the front card's geometry.
 * `enter` (0..1) is the back card's entrance after a decision (spring to BackCardRestScale, 220ms alpha).
 * The card fills its parent; give the parent the deck's size.
 */
export const swipeCard = (seed, { drag = 0, dragY = 0, back = false, progress, enter = 1, handlers = {} } = {}) => {
  const p = progress ?? Math.min(1, Math.abs(drag) / THRESHOLD);
  const rest = BACK_ENTER + (BACK_REST - BACK_ENTER) * enter;
  const restAlpha = 0.55 * Math.min(1, enter * 1.6);
  const transform = back
    ? `translateY(${16 * (1 - p)}px) scale(${rest + p * (1 - rest)})`
    : `translate(calc(${drag} * 100%), ${dragY * 0.28}px) rotate(${Math.max(-1, Math.min(1, drag)) * 7}deg)`;
  const keep = !back && drag > 0 ? p : 0;
  const del = !back && drag < 0 ? p : 0;
  return html`<div
    class="sc-swipe-card ${back ? "sc-swipe-card--back" : ""}"
    style="transform:${transform}"
    @pointerdown=${handlers.down}
    @pointermove=${handlers.move}
    @pointerup=${handlers.up}
    @pointercancel=${handlers.up}
  >
    <div class="sc-swipe-card__image" style="opacity:${back ? restAlpha + p * (1 - restAlpha) : 1}">${photo(seed, { w: 400, h: 600, radius: 0, style: "width:100%;height:100%" })}</div>
    ${keep ? html`<div class="sc-swipe-card__tint sc-swipe-card__tint--keep" style="opacity:${keep}"></div>` : nothing}
    ${del ? html`<div class="sc-swipe-card__tint sc-swipe-card__tint--delete" style="opacity:${del}"></div>` : nothing}
    ${back
      ? nothing
      : html`<span class="sc-swipe-indicator sc-swipe-indicator--keep" style="opacity:${keep};transform:scale(${0.82 + keep * 0.18})">${icon("save", { size: 28 })}</span>
          <span class="sc-swipe-indicator sc-swipe-indicator--delete" style="opacity:${del};transform:scale(${0.82 + del * 0.18})">${icon("delete", { size: 28 })}</span>`}
    ${isVideo(seed) ? html`<span class="sc-swipe-card__play">${icon("play_circle", { size: 52 })}</span>` : nothing}
    <div class="sc-swipe-card__meta">
      <div class="t-body-large w-semibold sc-ellipsis">${nameOf(seed)}</div>
      <div class="t-body-small" style="opacity:.82">${detailsOf(seed)}</div>
    </div>
  </div>`;
};

/** GallerySwipeActions: delete (stage for deletion), undo and keep, under the deck. Also a motion part. */
export const swipeActions = ({ busy = false, canUndo = false, onDelete, onUndo, onKeep } = {}) => html`<div class="sc-swipe-actions">
  <button class="sc-swipe-action sc-swipe-action--delete" ?disabled=${busy} @click=${onDelete} title="Add to deletion review">${icon("delete", { size: 30 })}</button>
  <button class="sc-swipe-action sc-swipe-action--undo" ?disabled=${!canUndo} @click=${onUndo} title="Undo last choice">${icon("undo", { size: 24 })}</button>
  <button class="sc-swipe-action sc-swipe-action--keep" ?disabled=${busy} @click=${onKeep} title="Keep this item">${icon("save", { size: 28 })}</button>
</div>`;

/** Finishes a decision (onKeep / onStageForDeletion): the next card moves up, counters update. */
const commit = (s, dir) => {
  const seed = ROLL[s.index % ROLL.length];
  return {
    index: s.index + 1,
    reviewed: s.reviewed + 1,
    kept: s.kept + (dir > 0 ? 1 : 0),
    staged: s.staged + (dir < 0 ? 1 : 0),
    bytes: s.bytes + (dir < 0 ? bytesOf(seed) : 0),
    history: [...s.history, { dir, index: s.index, reviewed: s.reviewed, kept: s.kept, staged: s.staged, bytes: s.bytes }],
    drag: 0,
    dragY: 0,
    fling: 0,
    settle: false,
    enter: 0,
  };
};

const DEFAULTS = {
  phase: "review", // review | confirm | cleaning | result
  index: 0,
  reviewed: 11,
  total: 29,
  kept: 7,
  staged: 4,
  bytes: 9.5 * MB,
  history: [],
  drag: 0,
  dragY: 0,
  fling: 0,
  settle: false,
  cleaned: 0,
  enter: 1,
};

/** feature/gallerycleaner: GalleryCleanerScreen + GallerySwipeDeck. */
export default {
  id: "gallery-cleaner",
  title: "Gallery Swipe Cleaner",
  category: "review",
  categoryLabel: "File review",
  palette: "dynamic",
  description: "Swipe photos and videos: left to stage for deletion, right to keep. Drag the card or use the buttons, then review and delete.",
  defaults: DEFAULTS,
  /**
   * Leaving card: tween(210ms) to 1.4 deck widths, then commit. Released under the threshold: spring back.
   * After undo the card springs back in from the side it left. Deleting counts files up like the cleaning screen.
   */
  tick: (s, dt) => {
    if (s.phase === "cleaning") {
      const cleaned = Math.min(s.staged, s.cleaned + dt * 3);
      return cleaned >= s.staged ? { cleaned, phase: "result" } : { cleaned };
    }
    if (s.fling) {
      const drag = s.drag + s.fling * dt * (1.4 / 0.21);
      return Math.abs(drag) >= 1.4 ? commit(s, s.fling) : { drag };
    }
    const patch = {};
    if (s.enter < 1) patch.enter = Math.min(1, s.enter + dt / 0.35);
    if (s.settle && !s.dragging && (s.drag || s.dragY)) {
      const k = Math.max(0, 1 - dt * 12);
      patch.drag = Math.abs(s.drag * k) < 0.002 ? 0 : s.drag * k;
      patch.dragY = Math.abs(s.dragY * k) < 0.5 ? 0 : s.dragY * k;
      patch.settle = !!(patch.drag || patch.dragY);
    }
    return Object.keys(patch).length ? patch : null;
  },
  controls: [
    { key: "drag", label: "Drag", type: "range", min: -1, max: 1, step: 0.01 },
    { key: "reviewed", label: "Reviewed", type: "range", min: 0, max: 29 },
    {
      label: "States",
      type: "presets",
      options: [
        ["Reviewing", { phase: "review", drag: 0 }],
        ["Delete swipe", { phase: "review", drag: -0.3 }],
        ["Keep swipe", { phase: "review", drag: 0.3 }],
        ["Delete dialog", { phase: "confirm", drag: 0 }],
        ["Cleaning", { phase: "cleaning", cleaned: 2 }],
        ["Caught up", { phase: "review", reviewed: 29, drag: 0 }],
      ],
    },
  ],
  render: (s) => {
    const go = goer(s);
    const complete = s.reviewed >= s.total;
    const busy = !!s.fling;
    const decide = (dir) => () => busy || s.set?.({ fling: dir, settle: false });
    const canUndo = s.history.length > 0 && !busy;
    const undo = () => {
      const last = s.history.at(-1);
      if (!canUndo || !last) return;
      // The card returns from the side it left (undoStartX = ±1.15 deck widths), then springs to rest.
      s.set?.({ ...last, history: s.history.slice(0, -1), drag: last.dir > 0 ? 1.15 : -1.15, dragY: 0, settle: true, phase: "review" });
    };
    const deleted = () => s.set?.({ phase: "review", staged: 0, bytes: 0, cleaned: 0, history: [] });

    const handlers = {
      down: (e) => {
        if (busy) return;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        const w = e.currentTarget.parentElement.getBoundingClientRect().width || 390;
        s.set?.({ dragging: true, settle: false, x0: e.clientX - s.drag * w, y0: e.clientY - s.dragY / 0.28, w });
      },
      move: (e) => s.dragging && s.set?.({ drag: (e.clientX - s.x0) / s.w, dragY: (e.clientY - s.y0) * (s.w / 390) }),
      up: () => {
        if (!s.dragging) return;
        if (Math.abs(s.drag) >= THRESHOLD) s.set?.({ dragging: false, fling: Math.sign(s.drag) });
        else s.set?.({ dragging: false, settle: true });
      },
    };

    const top = ROLL[s.index % ROLL.length];
    const next = ROLL[(s.index + 1) % ROLL.length];
    const reviewLabel = `Review ${s.staged} ${s.staged === 1 ? "item" : "items"} • ${fileSize(s.bytes)}`;

    const progressCard = html`<div class="sc-gallery-progress">
      <div class="sc-row" style="justify-content:space-between">
        <span class="t-label-large w-semibold">${s.reviewed} of ${s.total} reviewed</span>
        ${s.staged ? html`<span class="t-label-medium c-error">${fileSize(s.bytes)}</span>` : nothing}
      </div>
      <div class="sc-gallery-progress__bar"><i style="width:${(s.reviewed / Math.max(1, s.total)) * 100}%"></i></div>
    </div>`;

    const reviewState = html`<div class="sc-swipe-deck">
        ${complete ? nothing : swipeCard(next, { back: true, enter: s.enter, progress: Math.min(1, Math.abs(s.drag) / THRESHOLD) })}
        ${swipeCard(top, { drag: s.drag, dragY: s.dragY, handlers })}
      </div>
      ${swipeActions({ busy, canUndo, onDelete: decide(-1), onUndo: undo, onKeep: decide(1) })}
      ${s.staged
        ? button(reviewLabel, { icon: "delete_sweep", cls: "sc-btn--block", size: "medium", onClick: () => s.set?.({ phase: "confirm" }) })
        : nothing}`;

    const completeState = html`<div class="sc-gallery-complete">
      ${illustration("il_blebble_gallery_caught_up", 220, "width:100%;object-fit:contain")}
      <div class="t-headline-medium w-bold">You're all caught up</div>
      <div class="t-body-large c-variant">Your gallery review is up to date. Come back anytime to keep clutter under control.</div>
      <span class="sc-gallery-pill t-label-large w-semibold">Kept ${s.kept} • Ready to delete ${s.staged}</span>
      ${s.staged
        ? button("Review and delete", { cls: "sc-btn--block", size: "medium", onClick: () => s.set?.({ phase: "confirm" }) })
        : button("Done", { cls: "sc-btn--block", size: "medium", onClick: go("dashboard") })}
    </div>`;

    const cleaning = s.phase === "cleaning" || s.phase === "result";
    return previewScreen(APP, s, {
      kind: "page",
      title: "Gallery Swipe Cleaner",
      actions: cleaning ? [] : [{ id: "refresh", icon: "refresh", label: "Refresh" }],
      onBack: go("dashboard"),
      onAction: () => s.set?.({ ...DEFAULTS }),
      content: cleaning
        ? cleaningScreen({
            cleaned: Math.floor(s.cleaned),
            total: s.staged,
            bytes: s.bytes,
            finished: s.phase === "result",
            art: "il_blebble_gallery_photo_pack",
            onDone: deleted,
          })
        : html`<div class="sc-gallery-content">${progressCard} ${complete ? completeState : reviewState}</div>`,
      overlay:
        s.phase === "confirm"
          ? alertDialog({
              icon: "delete_sweep",
              title: "Delete selected media?",
              text: `Android will ask you to confirm deletion of ${s.staged} ${s.staged === 1 ? "item" : "items"} (${fileSize(s.bytes)}). This cannot be undone here.`,
              dismiss: "Cancel",
              confirm: "Continue",
              onDismiss: () => s.set?.({ phase: "review" }),
              onConfirm: () => s.set?.({ phase: "cleaning", cleaned: 0 }),
            })
          : null,
    });
  },
};
