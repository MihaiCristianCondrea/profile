/** Mirrors ImageOptimizerScreen.kt (feature/imageoptimizer). */
import { html, nothing } from "lit";
import { button, card, fileSize, goer } from "../kit/components.js";
import { previewScreen } from "material-next-web-components/marketing.js";
import { APP } from "../config/identity.js";
import { icon } from "../kit/shell.js";
import { photo } from "../motion/photo.js";

/** CompressionLevel defaults: LOW 25, MEDIUM 50, HIGH 75. */
const LEVELS = [
  ["Low", 25],
  ["Medium", 50],
  ["High", 75],
];
const PRESET_SIZES = [250, 500, 1000, 2000];
const FORMATS = ["WEBP", "JPEG", "PNG"];
const PHOTOS = [2, 21, 7, 10, 16, 0];

/** feature/imageoptimizer: before/after comparison, compression tabs and quality presets. */
export default {
  id: "image-optimizer",
  title: "Image Optimizer",
  category: "tools",
  categoryLabel: "Tools",
  palette: "android-vivid",
  description: "Before and after comparison with quick compression presets. Drag the divider, pick a level, step through images.",
  defaults: {
    split: 0.5,
    quality: 1,
    compression: 50,
    image: 0,
    tab: 0,
    targetSize: 500,
    manualWidth: 1920,
    manualHeight: 1080,
    savePhase: null,
    saveProgress: 0,
    destOpen: false,
    outputOpen: false,
    replaceOriginal: false,
    format: "WEBP",
    collapse: 0,
  },
  controls: [
    { key: "split", label: "Compare split", type: "range", min: 0, max: 1, step: 0.01 },
    { key: "compression", label: "Compression", type: "range", min: 0, max: 100, unit: "%" },
    { key: "tab", label: "Tab", type: "choice", options: [0, 1, 2] },
    { key: "savePhase", label: "Save Sheet", type: "choice", options: [null, "confirm", "saving", "done"] },
    {
      label: "Presets",
      type: "presets",
      options: [
        ["Quick Compress", { tab: 0, quality: 1, compression: 50, split: 0.5, savePhase: null }],
        ["File Size Tab", { tab: 1, targetSize: 500, savePhase: null }],
        ["Manual Tab", { tab: 2, manualWidth: 1920, manualHeight: 1080, compression: 75, savePhase: null }],
        ["Save Confirmation", { savePhase: "confirm" }],
        ["Saving Progress", { savePhase: "saving" }],
        ["Save Complete", { savePhase: "done" }],
      ],
    },
  ],
  /** Saving runs ~1.2 s, then the sheet shows Done. */
  tick: (s, dt) => {
    if (s.savePhase !== "saving") return null;
    const saveProgress = (s.saveProgress ?? 0) + dt / 1.2;
    return saveProgress >= 1 ? { savePhase: "done", saveProgress: 1 } : { saveProgress };
  },
  render: (s) => {
    const seed = PHOTOS[s.image % PHOTOS.length];
    const origKB = 2450 + (s.image % PHOTOS.length) * 380;
    let compKB = origKB * (1 - (s.compression / 100) * 0.72);
    let effectiveComp = Math.round(s.compression);

    if (s.tab === 1 && s.targetSize) {
      compKB = Math.min(origKB, s.targetSize);
      effectiveComp = Math.max(0, Math.min(100, Math.round((1 - compKB / origKB) * 100)));
    }

    const beforeMB = (origKB / 1024).toFixed(2);
    const afterMB = (compKB / 1024).toFixed(2);
    const savingsPct = Math.max(0, Math.round((1 - compKB / origKB) * 100));

    const drag = (e) => {
      if (!s.dragging) return;
      const r = e.currentTarget.getBoundingClientRect();
      const newSplit = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      s.set?.({ split: newSplit });
    };

    /**
     * SaveOptimizerBottomSheet: Confirm (Destination, Output, Items, info) -> Saving… -> Done
     * (Saved successfully, Location). Cards are plain filled Cards (12dp, surface-container-highest).
     */
    const count = PHOTOS.length;
    const images = `${count} ${count === 1 ? "image" : "images"}`;
    const quality = s.tab === 1 ? 100 : Math.round(s.compression);
    const kbOf = (i) => 2450 + i * 380;
    const estOf = (i) => (s.tab === 1 ? Math.min(kbOf(i), s.targetSize) : kbOf(i) * (1 - (s.compression / 100) * 0.72));
    const totalOrig = PHOTOS.reduce((a, _, i) => a + kbOf(i), 0) * 1024;
    const totalEst = PHOTOS.reduce((a, _, i) => a + estOf(i), 0) * 1024;
    const savings = (from, to) => `${fileSize(from)} → ${fileSize(to)}`;
    const sheetCard = (ic, title, sub, extra = nothing, tail = nothing) => html`<div class="sc-io-card">
      <div class="sc-row" style="gap:12px">${icon(ic, { size: 24 })}<div class="sc-grow"><div class="t-title-small">${title}</div><div class="t-body-small c-variant">${sub}</div></div>${tail}</div>
      ${extra}
    </div>`;
    const gear = (key) => html`<md-icon-button @click=${() => s.set?.({ [key]: !s[key] })}>${icon("settings")}</md-icon-button>`;
    const renderSaveModal = () => {
      if (!s.savePhase) return null;
      const phase = s.savePhase;
      const title = phase === "confirm" ? "Save optimized images" : phase === "saving" ? "Saving…" : "Done";
      const subtitle = phase === "confirm" ? `${images} • ${s.format} • Quality ${quality}` : phase === "saving" ? "Please keep the app open" : "Files saved successfully";
      const body =
        phase === "confirm"
          ? html`${sheetCard(
              "folder",
              "Destination",
              s.replaceOriginal ? "Replace original files" : "Export to Pictures",
              s.destOpen
                ? html`<div class="sc-io-field" @click=${() => s.set?.({ replaceOriginal: !s.replaceOriginal })}>
                      <span class="t-body-small c-variant">Export destination</span>
                      <div class="sc-row"><span class="sc-grow t-body-large">${s.replaceOriginal ? "Replace original files" : "Export to Pictures"}</span>${icon("arrow_drop_down")}</div>
                    </div>
                    ${s.replaceOriginal
                      ? html`<div class="sc-io-warning">${icon("warning", { size: 18 })}<span class="t-body-small">Original files will be replaced by optimized ones. This cannot be undone.</span></div>`
                      : nothing}`
                : nothing,
              gear("destOpen"),
            )}
            ${sheetCard(
              "tune",
              "Output",
              `${s.format} • Quality ${quality}`,
              s.outputOpen
                ? html`<div class="sc-io-field" @click=${() => s.set?.({ format: FORMATS[(FORMATS.indexOf(s.format) + 1) % FORMATS.length] })}>
                    <span class="t-body-small c-variant">Format</span>
                    <div class="sc-row"><span class="sc-grow t-body-large">${s.format}</span>${icon("arrow_drop_down")}</div>
                  </div>`
                : nothing,
              gear("outputOpen"),
            )}
            ${sheetCard(
              "collections",
              "Items",
              images,
              html`<div class="t-body-small c-variant" style="margin-top:8px">${savings(totalOrig, totalEst)}</div>
                <div class="sc-io-items">
                  ${PHOTOS.map(
                    (seed, i) => html`<div class="sc-io-item">
                      ${photo(seed, { w: 48, h: 48, radius: 8 })}
                      <div class="sc-grow" style="min-width:0">
                        <div class="t-body-medium">Image ${i + 1}</div>
                        <div class="t-body-small c-variant">${savings(kbOf(i) * 1024, estOf(i) * 1024)}</div>
                      </div>
                    </div>`,
                  )}
                </div>`,
            )}
            <div class="sc-io-card sc-io-card--info">
              <div class="sc-row" style="gap:12px;align-items:flex-start">${icon("info", { size: 24 })}<span class="t-body-small">Your optimized images will be saved with the selected format and quality. Use export to Pictures to keep originals untouched and easy to find.</span></div>
            </div>`
          : phase === "saving"
            ? html`<div class="sc-io-card">
                  <div class="sc-row" style="gap:12px">${icon("download", { size: 24 })}<span class="t-body-medium">Saving…</span></div>
                  <md-linear-progress style="width:100%;margin-top:12px" value=${s.saveProgress ?? 0.4}></md-linear-progress>
                </div>
                ${sheetCard("collections", "Items", images)}`
            : html`<div class="sc-io-card">
                  <div class="sc-row" style="gap:12px">
                    ${icon("task_alt", { size: 24 })}
                    <div><div class="t-body-medium">Saved successfully</div><div class="t-body-small c-variant">${savings(totalOrig, totalEst)}</div></div>
                  </div>
                  <div class="t-body-small c-variant" style="margin-top:8px">${images}</div>
                </div>
                ${sheetCard("folder_open", "Location", s.replaceOriginal ? "Original file locations" : "Pictures/Smart Cleaner/Optimized")}`;
      const close = () => s.set?.({ savePhase: null, saveProgress: 0 });
      const actions =
        phase === "confirm"
          ? html`${button("Cancel", { variant: "outlined", icon: "close", cls: "sc-grow sc-btn--block", onClick: close })}
            ${button(count === 1 ? "Save image" : `Save ${count} images`, { icon: "download", cls: "sc-grow sc-btn--block", onClick: () => s.set?.({ savePhase: "saving", saveProgress: 0 }) })}`
          : phase === "saving"
            ? button("Cancel", { variant: "outlined", icon: "close", cls: "sc-grow sc-btn--block", onClick: close })
            : html`${button("Close", { variant: "outlined", icon: "close", cls: "sc-grow sc-btn--block", onClick: close })}
              ${button("Open folder", { variant: "text", icon: "folder_open", cls: "sc-grow sc-btn--block", onClick: close })}
              ${button("Share", { variant: "outlined", icon: "share", cls: "sc-grow sc-btn--block", onClick: close })}`;
      return {
        presentation: "sheet",
        label: title,
        handle: true,
        flush: true,
        onDismiss: close,
        content: html`<div class="sc-row" style="padding:0 4px 8px 12px">
            <div class="sc-grow"><div class="t-title-medium w-semibold">${title}</div><div class="t-body-small c-variant">${subtitle}</div></div>
            <md-icon-button @click=${close}>${icon("close")}</md-icon-button>
          </div>
          <md-divider></md-divider>
          <div class="sc-io-body">${body}</div>
          <md-divider></md-divider>
          <div class="sc-row" style="gap:12px;padding:12px">${actions}</div>`,
      };
    };

    // Opened from the drawer: a page with a large title, the save sheet over it.
    return previewScreen(APP, s, {
      kind: "page",
      title: "Image optimizer",
      topBar: "large",
      collapse: s.collapse ?? 0,
      onBack: goer(s)("dashboard"),
      overlay: renderSaveModal(),
      content: html`<div style="padding:12px 16px 0">
        <div
          class="sc-compare"
          @pointerdown=${(e) => {
            e.currentTarget.setPointerCapture?.(e.pointerId);
            const r = e.currentTarget.getBoundingClientRect();
            s.set?.({ dragging: true, split: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) });
          }}
          @pointermove=${drag}
          @pointerup=${() => s.set?.({ dragging: false })}
          @pointercancel=${() => s.set?.({ dragging: false })}
        >
          ${photo(seed, { w: 398, h: 332, radius: 0 })}
          <div
            class="sc-compare__after"
            style="clip-path:inset(0 0 0 ${s.split * 100}%)"
          >
            ${photo(seed, {
              w: 398,
              h: 332,
              radius: 0,
              style: `filter:saturate(${1 + s.compression / 350}) contrast(${1 + s.compression / 800})`,
            })}
          </div>
          <span class="sc-compare__line" style="left:${s.split * 100}%"></span>
          <span class="sc-compare__knob" style="left:${s.split * 100}%">
            <span class="sc-compare__knob-inner">${icon("compare_arrows", { size: 20 })}</span>
          </span>
          <span class="sc-compare__size t-label-small">
            ${beforeMB} MB → ${afterMB} MB (-${savingsPct}%)
          </span>
        </div>

        <div class="sc-row" style="justify-content:space-between;padding:12px 8px">
          <md-icon-button
            ?disabled=${s.image === 0}
            @click=${() => s.set?.({ image: Math.max(0, s.image - 1) })}
          >
            ${icon("chevron_left")}
          </md-icon-button>
          <span class="t-body-medium">${s.image + 1} / ${PHOTOS.length}</span>
          <md-icon-button
            ?disabled=${s.image === PHOTOS.length - 1}
            @click=${() => s.set?.({ image: Math.min(PHOTOS.length - 1, s.image + 1) })}
          >
            ${icon("chevron_right")}
          </md-icon-button>
        </div>

        <md-tabs class="sc-tabs" .activeTabIndex=${s.tab}>
          <md-primary-tab ?active=${s.tab === 0} @click=${() => s.set?.({ tab: 0 })}>Quick Compress</md-primary-tab>
          <md-primary-tab ?active=${s.tab === 1} @click=${() => s.set?.({ tab: 1 })}>File Size (KB)</md-primary-tab>
          <md-primary-tab ?active=${s.tab === 2} @click=${() => s.set?.({ tab: 2 })}>Manual</md-primary-tab>
        </md-tabs>

        ${s.tab === 0
          ? html`
              <div style="padding:16px 8px 0">
                <div class="sc-row" style="gap:8px">
                  ${LEVELS.map(([l, v], i) =>
                    button(l, {
                      variant: s.quality === i ? "filled" : "outlined",
                      cls: "sc-grow sc-btn--block sc-btn--container sc-btn--toggle",
                      onClick: () => s.set?.({ quality: i, compression: v }),
                    }),
                  )}
                </div>
                <div class="t-title-medium" style="font-weight:400;margin-top:16px">
                  Compression: ${effectiveComp}%
                </div>
                <md-slider
                  class="sc-slider"
                  .value=${s.compression}
                  min="0"
                  max="100"
                  @input=${(e) =>
                    s.set?.({
                      compression: Number(e.target.value),
                      quality: LEVELS.findIndex(([, v]) => v === Number(e.target.value)),
                    })}
                ></md-slider>
              </div>
            `
          : nothing}

        ${s.tab === 1
          ? html`
              <div style="padding:16px 8px 0">
                <div class="t-title-medium" style="font-weight:400">
                  Target: ${s.targetSize ? `${s.targetSize} KB` : "Default"}
                </div>
                <div class="sc-row" style="gap:8px;margin-top:12px">
                  ${PRESET_SIZES.map((sz) =>
                    button(`${sz} KB`, {
                      variant: s.targetSize === sz ? "filled" : "outlined",
                      size: "small",
                      cls: "sc-grow",
                      onClick: () => s.set?.({ targetSize: sz }),
                    }),
                  )}
                </div>
                <div style="margin-top:16px">
                  <md-outlined-text-field
                    label="File Size"
                    type="number"
                    style="width:100%"
                    .value=${s.targetSize ? String(s.targetSize) : ""}
                    supporting-text="Enter target size in KB"
                    @input=${(e) => s.set?.({ targetSize: Number(e.target.value) || 0 })}
                  >
                    <md-icon slot="trailing-icon">tune</md-icon>
                  </md-outlined-text-field>
                </div>
              </div>
            `
          : nothing}

        ${s.tab === 2
          ? html`
              <div style="padding:16px 8px 0">
                <div class="sc-row" style="gap:12px">
                  <md-outlined-text-field
                    label="Width"
                    type="number"
                    style="flex:1"
                    .value=${String(s.manualWidth || 1920)}
                    @input=${(e) => {
                      const w = Number(e.target.value) || 1920;
                      const h = Math.round(w / (16 / 9));
                      s.set?.({ manualWidth: w, manualHeight: h });
                    }}
                  ></md-outlined-text-field>
                  <md-outlined-text-field
                    label="Height"
                    type="number"
                    style="flex:1"
                    .value=${String(s.manualHeight || 1080)}
                    @input=${(e) => {
                      const h = Number(e.target.value) || 1080;
                      const w = Math.round(h * (16 / 9));
                      s.set?.({ manualWidth: w, manualHeight: h });
                    }}
                  ></md-outlined-text-field>
                </div>
                <div class="t-title-medium" style="font-weight:400;margin-top:16px">
                  Quality: ${Math.round(s.compression)}%
                </div>
                <md-slider
                  class="sc-slider"
                  .value=${s.compression}
                  min="0"
                  max="100"
                  @input=${(e) => s.set?.({ compression: Number(e.target.value) })}
                ></md-slider>
              </div>
            `
          : nothing}
      </div>`,
      bottom: html`<div class="sc-row" style="gap:12px;padding:12px 28px 20px">
        ${button("Reset", {
          icon: "close",
          variant: "outlined",
          cls: "sc-grow sc-btn--block",
          onClick: () =>
            s.set?.({
              quality: 1,
              compression: 50,
              split: 0.5,
              targetSize: 500,
              manualWidth: 1920,
              manualHeight: 1080,
            }),
        })}
        ${button(`Save ${PHOTOS.length} images`, {
          icon: "download",
          cls: "sc-grow sc-btn--block sc-btn--container",
          fill: true,
          onClick: () => s.set?.({ savePhase: "confirm" }),
        })}
      </div>`,
    });
  },
};
