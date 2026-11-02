/** Mirrors QuickCleanScreen.kt (feature/quickclean). */
import { html, nothing } from "lit";
import { bottomAction, button, goer, groupedList, illustration, setter } from "../kit/components.js";
import { previewScreen } from "material-next-web-components/marketing.js";
import { APP } from "../config/identity.js";
import { icon } from "../kit/shell.js";

const ITEMS = {
  cache: { title: "Cache files", subtitle: "Temporary cache from apps", icon: "cached", bg: "#E3F2FD", fg: "#0D47A1", size: "252 kB" },
  folders: { title: "Empty folders", subtitle: "Folders with no items", icon: "folder", bg: "#FFF8E1", fg: "#FF6F00", size: "6 items" },
  clipboard: { title: "Clipboard", subtitle: "Clears clipboard without reading contents", icon: "content_paste", bg: "#EDE7F6", fg: "#311B92", size: "Private" },
  temp: { title: "Temporary files", subtitle: "System and app temp files", icon: "description", bg: "#E8F5E9", fg: "#1B5E20", size: "18 kB" },
  thumbnails: { title: "Thumbnails", subtitle: "Image previews and thumbnails", icon: "image", bg: "#F3E5F5", fg: "#4A148C", size: "6 kB" },
};

const RATINGS = [
  ["il_great.webp", "Great"],
  ["il_good.webp", "Good"],
  ["il_okay.webp", "Okay"],
  ["il_not_enough.webp", "Not enough"],
  ["il_bad.webp", "Bad"],
];

const REASONS = [
  ["folder", "Found the right files"],
  ["storage", "Freed enough space"],
  ["sentiment_dissatisfied", "Freed too little space"],
  ["save", "Skipped things I wanted cleaned"],
  ["shield", "Cleaned something risky"],
];

/** Back-out overshoot (a bouncy pop) for 0..1. */
const popIn = (p) => (p <= 0 ? 0 : p >= 1 ? 1 : 1 + 2.70158 * (p - 1) ** 3 + 1.70158 * (p - 1) ** 2);

/** The row's 44 dp icon circle, tinted with the category colours (QuickCleanItemUiMapper). Also a motion part. */
export const quickCleanIcon = (key, { icon: ic } = {}) => {
  const it = ITEMS[key];
  // `icon` swaps the glyph (motion: many pieces of one category, each its own), keeping the category's colours.
  return html`<span class="sc-qc-row__icon" style="background:${it.bg}">${icon(ic ?? it.icon, { size: 24, color: it.fg })}</span>`;
};

/** ScanningItemRow: 44 dp tinted icon circle, size in primary, status icon (spinner or check). */
const row = (key, status, spin = 0, pop = 1, size) => {
  const it = ITEMS[key];
  const statusIcon =
    status === "scanning"
      ? html`<md-circular-progress value="0.7" class="sc-qc-spinner" style="transform:rotate(${spin * 360}deg)"></md-circular-progress>`
      : html`<span style="display:grid;transform:scale(${popIn(pop)})">${icon("check_circle", { size: 22, fill: true, color: "#4CAF50" })}</span>`;
  return html`<div class="sc-qc-row">
    ${quickCleanIcon(key)}
    <div class="sc-grow" style="min-width:0">
      <div class="t-body-large w-semibold sc-ellipsis">${it.title}</div>
      <div class="t-body-small c-variant sc-ellipsis">${it.subtitle}</div>
    </div>
    <span class="t-label-large w-bold c-primary">${size ?? it.size}</span>
    ${status === "cleaned" ? html`<span class="t-label-small c-variant" style="margin-left:8px">Cleaned</span>` : nothing}
    <span class="sc-qc-status">${statusIcon}</span>
  </div>`;
};

/** ScanningHeaderArc: 260 dp arc from 140° sweeping 260°, 12 dp round stroke. */
const arc = (progress) => {
  const r = 124;
  const len = (260 / 360) * 2 * Math.PI * r;
  const path = (() => {
    const a0 = (140 * Math.PI) / 180;
    const a1 = (400 * Math.PI) / 180;
    const p = (a) => `${130 + r * Math.cos(a)} ${130 + r * Math.sin(a)}`;
    return `M ${p(a0)} A ${r} ${r} 0 1 1 ${p(a1)}`;
  })();
  return html`<svg class="sc-qc-arc" viewBox="0 0 260 260" width="260" height="260">
    <path d=${path} fill="none" stroke="color-mix(in srgb, var(--md-sys-color-primary-container) 30%, transparent)" stroke-width="12" stroke-linecap="round" />
    <path d=${path} fill="none" stroke="var(--md-sys-color-primary)" stroke-width="12" stroke-linecap="round" stroke-dasharray="${len}" stroke-dashoffset=${len * (1 - progress)} />
  </svg>`;
};

/**
 * Motion parts (see embed.js PARTS): one ScanningItemRow on its own, for `key` in QUICK_CLEAN_ITEMS
 * ("cache", "folders", "clipboard", "temp", "thumbnails"), and the ScanningHeaderArc.
 * `pop` (0..1) is the check mark's pop-in once the row is cleaned; `size` replaces the sample size.
 */
export const QUICK_CLEAN_ITEMS = Object.keys(ITEMS);
export const quickCleanRow = (key, { status = "scanning", spin = 0, pop = 1, size } = {}) => row(key, status, spin, pop, size);
export const quickCleanArc = (progress = 0) => arc(progress);

/** Items finish in order as the scan progresses (cache, then folders, then clipboard). */
const THRESHOLDS = { cache: 0.35, folders: 0.7, clipboard: 0.98, temp: 0.5, thumbnails: 0.85 };
const itemsFor = (s) => (s.running || s.derive ? s.items.map(([k]) => [k, s.progress >= THRESHOLDS[k] ? "cleaned" : "scanning"]) : s.items);

const scanning = (s) => html`
  <div class="sc-qc-header">
    ${arc(s.progress)}
    <div class="sc-qc-header__center">
      <div class="sc-row c-primary" style="justify-content:center">
        <span style="font:300 64px/64px var(--md-ref-typeface-brand)">${Math.round(s.progress * 100)}</span>
        <span class="t-headline-medium w-medium" style="padding-top:16px">%</span>
      </div>
      <div class="t-title-medium" style="font-weight:400;opacity:.8;max-width:170px;text-align:center">Smart cleanup in progress</div>
    </div>
    ${illustration(
      "il_blebble_cleaning",
      150,
      // Blebble sways while it sweeps (driven by t, so video frames stay deterministic).
      `position:absolute;left:50%;margin-left:-75px;bottom:-56px;transform-origin:50% 90%;transform:translateY(${Math.sin((s.t ?? 0) * 5) * 3}px) rotate(${Math.sin((s.t ?? 0) * 2.6) * 3}deg)`,
    )}
  </div>
  <div style="padding:74px 16px 0">
    ${groupedList(itemsFor(s).map(([k, st]) => row(k, st, (s.t ?? 0) * 1.4, s.derive || s.running ? (s.progress - THRESHOLDS[k]) / 0.05 : 1, s.sizes?.[k])))}
  </div>
`;

/**
 * The finished screen comes in two steps, like the app's CleanupFinishedHero and FinishedCardsList: the hero
 * (fade, scale 0.92 to 1, a 16 dp rise), then the cards (fade, a 24 dp rise). `heroIn` and `cardsIn` run 0 to 1.
 */
const enter = (u, rise, scale = 0) => (u >= 1 ? "" : `opacity:${u};transform:translateY(${(1 - u) * rise}px) scale(${1 - (1 - u) * scale})`);

const finished = (s) => html`
  <div class="sc-col" style="align-items:center;padding-top:32px;${enter(s.heroIn ?? 1, 16, 0.08)}">
    ${illustration("il_blebble_all_done", 190)}
    <div class="t-headline-large w-medium c-primary" style="margin-top:24px">All clean</div>
    <div class="t-body-large c-variant" style="margin-top:8px">${s.reclaimed}</div>
  </div>
  <div class="sc-col" style="padding:48px 36px 0;gap:0;${enter(s.cardsIn ?? 1, 24)}">
    <div class="sc-row"><span class="t-title-medium sc-grow">Storage</span><span class="t-body-medium">128 GB used</span></div>
    <md-linear-progress class="sc-qc-storage" value="0.25"></md-linear-progress>
    <div class="t-body-small c-variant">263 GB free of 512 GB</div>
    <div class="t-title-medium w-semibold" style="margin-top:40px">Was this cleanup helpful?</div>
    <div class="t-body-medium c-variant" style="margin-top:4px">Rate cleanup to help Quick Clean learn what to keep or remove next time.</div>
    <div style="margin-top:16px">${button("Rate cleanup", { icon: "thumb_up", fill: true, onClick: () => s.set?.({ showFeedback: true }) })}</div>
    <div class="sc-row sc-link-row" style="margin-top:24px;cursor:pointer" @click=${() => s.set?.({ showHowItWorks: true })}>
      <div class="sc-grow"><div class="t-title-medium w-semibold">How it works</div><div class="t-body-medium c-variant">Quick Clean clears temporary clutter while leaving your personal files alone.</div></div>
      ${icon("keyboard_arrow_right")}
    </div>
  </div>
`;

const renderOverlays = (s) => {
  if (s.showFeedback) {
    const toggle = (i) => {
      const reasons = s.feedbackReasons || [];
      s.set?.({ feedbackReasons: reasons.includes(i) ? reasons.filter((x) => x !== i) : [...reasons, i] });
    };
    return {
      presentation: "dialog",
      label: "How was this cleanup?",
      flush: true,
      onDismiss: () => s.set?.({ showFeedback: false }),
      content: html`<div style="width:390px;max-width:100%;padding:16px 20px">
          <div class="sc-row" style="justify-content:flex-end">
            <md-icon-button @click=${() => s.set?.({ showFeedback: false })}>${icon("close")}</md-icon-button>
          </div>
          <div class="sc-col" style="align-items:center;text-align:center">
            ${icon("cleaning_services", { size: 64, fill: true, color: "var(--md-sys-color-primary)" })}
            <div class="t-headline-small w-bold" style="margin-top:16px">How was this cleanup?</div>
            <div class="t-body-medium c-variant" style="margin-top:6px">Your feedback helps us improve Cleaner for you.</div>
          </div>
          <div class="sc-row" style="justify-content:space-between;margin-top:20px">
            ${RATINGS.map(([img, label], i) => html`
              <button
                class="sc-rating ${s.feedbackRating === i ? "sc-rating--on" : ""}"
                @click=${() => s.set?.({ feedbackRating: i })}
              >
                <span class="sc-rating__face">${illustration(img, 48)}</span>
                <span class="t-label-medium" style="font-weight:400">${label}</span>
              </button>
            `)}
          </div>
          <div class="sc-row" style="gap:8px;margin-top:16px">
            <md-divider class="sc-grow"></md-divider>
            ${icon("expand_more", { size: 20 })}
            <md-divider class="sc-grow"></md-divider>
          </div>
          <div class="t-body-small c-variant" style="text-align:center;margin:10px 0">Tell us more (optional)</div>
          <div class="sc-reasons">
            ${REASONS.map(([ic, label], i) => {
              const active = (s.feedbackReasons || []).includes(i);
              return html`
                <button class="sc-reason ${active ? "sc-reason--on" : ""}" @click=${() => toggle(i)}>
                  ${icon(active ? "check" : ic, { size: 20, fill: true })}
                  <span>${label}</span>
                </button>
              `;
            })}
          </div>
          <div style="margin-top:18px;display:flex;flex-direction:column;gap:8px">
            ${button("Submit", {
              fill: true,
              cls: "sc-grow sc-btn--block",
              disabled: (s.feedbackRating ?? -1) < 0,
              onClick: () => s.set?.({ showFeedback: false, feedbackRating: -1, feedbackReasons: [] }),
            })}
            ${button("Skip", {
              variant: "text",
              cls: "sc-grow sc-btn--block",
              onClick: () => s.set?.({ showFeedback: false }),
            })}
          </div>
        </div>`,
    };
  }

  if (s.showHowItWorks) {
    return {
      presentation: "sheet",
      label: "How Quick Clean Works",
      handle: true,
      flush: true,
      onDismiss: () => s.set?.({ showHowItWorks: false }),
      content: html`
          <div class="sc-sheet__header">
            <div class="t-title-medium w-bold">How Quick Clean Works</div>
            <md-icon-button @click=${() => s.set?.({ showHowItWorks: false })}>${icon("close")}</md-icon-button>
          </div>
          <div class="sc-sheet__content" style="padding-top:4px">
            <div class="t-body-medium c-variant" style="margin-bottom:12px">
              Quick Clean clears temporary clutter while leaving your personal files alone.
            </div>
            <div class="sc-col" style="gap:14px">
              <div class="sc-row" style="gap:12px;align-items:flex-start">
                <span class="sc-sm-icon">${icon("frame_inspect", { size: 22 })}</span>
                <div>
                  <div class="t-title-small w-semibold">Deep Scan</div>
                  <div class="t-body-small c-variant">Cleaner inspects temporary clutter in standard safe locations.</div>
                </div>
              </div>
              <div class="sc-row" style="gap:12px;align-items:flex-start">
                <span class="sc-sm-icon">${icon("auto_fix_high", { size: 22 })}</span>
                <div>
                  <div class="t-title-small w-semibold">Smart Filter</div>
                  <div class="t-body-small c-variant">Safety rules ensure personal documents, photos, and messages are protected.</div>
                </div>
              </div>
              <div class="sc-row" style="gap:12px;align-items:flex-start">
                <span class="sc-sm-icon">${icon("done_all", { size: 22 })}</span>
                <div>
                  <div class="t-title-small w-semibold">Precise Cleanup</div>
                  <div class="t-body-small c-variant">Only verified junk is removed, keeping your device running smoothly.</div>
                </div>
              </div>
            </div>
            <div class="sc-promise" style="margin-top:16px">
              <div class="sc-row" style="gap:10px">
                ${icon("shield", { size: 24, fill: true, color: "var(--md-sys-color-primary)" })}
                <span class="t-title-medium w-bold c-primary">Our Safety Promise</span>
              </div>
              ${["Camera Photos & Videos", "Downloads Folder", "Document storage", "Messaging Backups"].map(
                (t) => html`<div class="sc-row" style="gap:12px;margin-top:8px">${icon("check", { size: 20 })}<span class="t-body-medium">${t}</span></div>`,
              )}
            </div>
          </div>
          <div class="sc-sheet__footer" style="justify-content:flex-end">
            ${button("Got it", { fill: true, onClick: () => s.set?.({ showHowItWorks: false }) })}
          </div>`,
    };
  }

  return null;
};

/** feature/quickclean: QuickCleanScreen (scanning, then the finished hero). */
export default {
  id: "quick-clean",
  title: "Quick Clean",
  category: "quick-clean",
  categoryLabel: "Quick Clean",
  palette: "dynamic",
  description: "One-tap cleanup: animated progress arc with Blebble sweeping, then the All clean summary.",
  defaults: {
    phase: "scanning",
    progress: 0.55,
    running: false,
    t: 0,
    hold: 0,
    showFeedback: false,
    showHowItWorks: false,
    feedbackRating: -1,
    feedbackReasons: [],
    items: [
      ["cache", "cleaned"],
      ["folders", "cleaned"],
      ["clipboard", "cleaned"],
    ],
    reclaimed: "276 kB reclaimed • 44 safe items cleaned",
    // A row's total instead of its sample size, by item key: { cache: "1.24 GB" }.
    sizes: {},
    heroIn: 1,
    cardsIn: 1,
  },
  /** A run takes ~5 s like the scan engine; after a short pause the hero replaces the list, then the cards come in. */
  tick: (s, dt) => {
    if (s.phase === "done") {
      if (s.heroIn < 1) return { heroIn: Math.min(1, s.heroIn + dt / 0.4) };
      return s.cardsIn < 1 ? { cardsIn: Math.min(1, s.cardsIn + dt / 0.3) } : null;
    }
    if (!s.running) return s.progress < 1 && s.phase === "scanning" ? { t: s.t + dt } : null;
    if (s.progress < 1) return { t: s.t + dt, progress: Math.min(1, s.progress + dt / 5) };
    if (s.hold < 0.6) return { t: s.t + dt, hold: s.hold + dt };
    return { phase: "done", running: false, hold: 0, heroIn: 0, cardsIn: 0 };
  },
  controls: [
    { key: "progress", label: "Progress", type: "range", min: 0, max: 1, step: 0.01, patch: { derive: true } },
    { key: "phase", label: "Phase", type: "choice", options: ["scanning", "done"] },
    { key: "showFeedback", label: "Feedback Dialog", type: "boolean" },
    { key: "showHowItWorks", label: "How It Works", type: "boolean" },
    {
      label: "Presets",
      type: "presets",
      options: [
        ["Scanning Halfway", { phase: "scanning", progress: 0.55, running: false, showFeedback: false }],
        ["Scanning 100%", { phase: "scanning", progress: 1.0, running: false, showFeedback: false }],
        ["Finished Clean", { phase: "done", showFeedback: false }],
        ["Feedback Rating Dialog", { phase: "done", showFeedback: true }],
        ["How It Works Sheet", { phase: "done", showHowItWorks: true }],
        ["Run Quick Clean", { phase: "scanning", progress: 0, running: true, showFeedback: false }],
      ],
    },
  ],
  render: (s) => {
    const go = goer(s);
    // page<QuickCleanRoute>(topBar = CenterAligned): Back, no title.
    return previewScreen(APP, s, {
      kind: "page",
      topBar: "center",
      onBack: go("dashboard"),
      overlay: renderOverlays(s),
      content: s.phase === "done" ? finished(s) : scanning(s),
      bottom:
        s.phase === "done"
          ? bottomAction("Done", { icon: "check", onClick: go("dashboard") })
          : bottomAction("Stop", {
              icon: "stop",
              variant: "tonal",
              onClick: s.running ? setter(s)({ running: false }) : go("dashboard"),
            }),
    });
  },
};
