/** Mirrors MetadataSanitizerScreen.kt and MetadataDetailsBottomSheet.kt (feature/metadatasanitizer). */
import { html, nothing } from "lit";
import { button, card, goer, groupedList } from "../kit/components.js";
import { previewScreen } from "material-next-web-components/marketing.js";
import { APP } from "../config/identity.js";
import { icon } from "../kit/shell.js";
import { photo } from "../motion/photo.js";

const SAMPLE_FILES = [
  {
    id: "1000482193",
    name: "PXL_20260918_143210942.jpg",
    seed: 25,
    type: "image",
    size: "2.4 MB",
    mime: "image/jpeg",
    resolution: "4032 × 3024",
    camera: "Google Pixel 8 Pro",
    lens: "f/1.68 50mm",
    exif: 24,
    gps: 4,
    xmp: 6,
    date: "Sep 18, 2026, 14:32:10",
  },
  {
    id: "1000482377",
    name: "IMG_20260920_111544.jpg",
    seed: 7,
    type: "image",
    size: "3.8 MB",
    mime: "image/jpeg",
    resolution: "3840 × 2160",
    camera: "Samsung Galaxy S24",
    lens: "f/1.8 24mm",
    exif: 18,
    gps: 3,
    xmp: 2,
    date: "Sep 20, 2026, 11:15:44",
  },
  {
    id: "1000482519",
    name: "DSC04822.jpg",
    seed: 10,
    type: "image",
    size: "1.9 MB",
    mime: "image/jpeg",
    resolution: "2048 × 1536",
    camera: "Sony Alpha 7 IV",
    lens: "FE 24-70mm F2.8 GM",
    exif: 12,
    gps: 0,
    xmp: 1,
    date: "Sep 22, 2026, 16:40:02",
  },
  {
    id: "1000482604",
    name: "Quarterly_report_Q3_2026.pdf",
    seed: null,
    type: "pdf",
    size: "540 KB",
    mime: "application/pdf",
    resolution: "6 pages",
    camera: "Adobe PDF Engine",
    lens: "Standard document",
    exif: 0,
    gps: 0,
    xmp: 5,
    date: "Sep 24, 2026, 09:00:15",
  },
  {
    id: "1000482731",
    name: "IMG_4821.jpg",
    seed: 22,
    type: "image",
    size: "4.1 MB",
    mime: "image/jpeg",
    resolution: "4000 × 3000",
    camera: "iPhone 15 Pro",
    lens: "f/1.78 48mm",
    exif: 31,
    gps: 5,
    xmp: 8,
    date: "Sep 25, 2026, 18:22:31",
  },
];

/** A selected file's status: Pending, then Sanitized. Also a motion part. */
export const statusChip = (sanitized = false) => html`<span class="sc-status-chip ${sanitized ? "sc-status-chip--sanitized" : "sc-status-chip--pending"} t-label-small">
  ${icon(sanitized ? "check_circle" : "schedule", { size: 14 })}
  ${sanitized ? "Sanitized" : "Pending"}
</span>`;

const fileRow = (file, s) => {
  const isSanitized = !!s.sanitized;
  return html`<div
    class="sc-meta-row"
    style="display:flex;align-items:center;gap:12px;padding:10px 14px;cursor:pointer"
    @click=${() => s.set?.({ activeDetailFile: file })}
  >
    ${file.type === "image"
      ? photo(file.seed, { w: 32, h: 32, radius: 8 })
      : html`<div
          style="width:32px;height:32px;border-radius:8px;background:var(--md-sys-color-surface-variant);display:grid;place-items:center"
        >
          ${icon("description", { size: 20, color: "var(--md-sys-color-primary)" })}
        </div>`}
    <div class="sc-col sc-grow" style="min-width:0;gap:2px">
      <span class="t-body-medium sc-ellipsis w-medium">${file.name}</span>
      <span class="t-label-small c-variant sc-ellipsis">
        ${isSanitized ? "Sanitized • Metadata stripped" : `${file.size} • ${file.exif} EXIF entries`}
      </span>
    </div>
    ${statusChip(isSanitized)}
    <md-icon-button
      @click=${(e) => {
        e.stopPropagation();
        s.set?.({ activeDetailFile: file });
      }}
      title="View metadata"
    >
      ${icon("visibility", { size: 22, color: "var(--md-sys-color-primary)" })}
    </md-icon-button>
    <md-icon-button
      @click=${(e) => {
        e.stopPropagation();
        s.set?.({ removed: [...s.removed, file.name] });
      }}
      title="Remove file"
    >
      ${icon("close", { size: 22, color: "var(--md-sys-color-error)" })}
    </md-icon-button>
  </div>`;
};

const detailRow = (ic, label, value) =>
  html`<div class="sc-row" style="padding:10px 14px;gap:14px">
    ${icon(ic, { size: 22, color: "var(--md-sys-color-on-surface-variant)" })}
    <div class="sc-grow" style="min-width:0">
      <div class="t-label-small c-variant">${label}</div>
      <div class="t-body-medium sc-ellipsis">${value}</div>
    </div>
  </div>`;
const detailCard = (ic, label, value) =>
  card(detailRow(ic, label, value), { color: "color-mix(in srgb, var(--md-sys-color-surface-variant) 50%, transparent)" });

/** The extended Sanitize FAB (tonal, filled security icon). Also a motion part. */
export const sanitizeFab = ({ label = "Sanitize", disabled = false, onClick } = {}) => html`<md-fab label=${label} class="sc-fab-tonal" ?disabled=${disabled} @click=${() => onClick?.()}>
  <md-icon slot="icon" style="font-variation-settings:'FILL' 1">security</md-icon>
</md-fab>`;

/** The detail cards of MetadataDetailsBottomSheet, by field, so each can be used as a motion part. */
const DETAILS = {
  name: (f) => ["description", "File name", f.name],
  size: (f) => ["straighten", "File size", f.size],
  uri: (f) => ["link", "Uri", `content://media/external/images/media/${f.id}`],
  mime: (f) => ["settings", "Mime type", f.mime],
  resolution: (f) => ["aspect_ratio", "Resolution", f.resolution],
  exif: (f) => ["photo_filter", "EXIF entries", `${f.exif} entries`],
  gps: (f) => ["location_on", "GPS entries", f.gps ? `${f.gps} entries (Lat: 37.7749, Lon: -122.4194)` : "None"],
  camera: (f) => ["camera_alt", "Camera", `${f.camera} • ${f.lens}`],
  date: (f) => ["calendar_today", "Date captured", f.date],
};
/** Motion part: one metadata detail card (`field` is a DETAILS key) of the sample file shown with `seed`. */
export const metadataDetail = (field, { seed = 25 } = {}) => {
  const f = SAMPLE_FILES.find((x) => x.seed === seed) ?? SAMPLE_FILES[0];
  return detailCard(...DETAILS[field](f));
};
/** Motion part: the same detail without its card (icon, label, value), to sit in a groupedList row. */
export const metadataDetailRow = (field, { seed = 25 } = {}) => {
  const f = SAMPLE_FILES.find((x) => x.seed === seed) ?? SAMPLE_FILES[0];
  return detailRow(...DETAILS[field](f));
};

/** In-place or standalone Metadata Details Bottom Sheet *//** In-place or standalone Metadata Details Bottom Sheet */
const renderDetailContent = (file, s, onClose) => html`
  <div class="sc-sheet__header">
    <div class="sc-col sc-grow" style="min-width:0">
      <div class="t-title-medium w-semibold">File metadata</div>
      <div class="t-body-small c-variant sc-ellipsis">${file.name}</div>
    </div>
    <md-icon-button @click=${onClose}>${icon("close")}</md-icon-button>
  </div>
  <md-divider></md-divider>
  <div class="sc-sheet__content" style="gap:8px;padding:12px 16px">
    ${file.type === "image"
      ? photo(file.seed ?? 25, { w: 398, h: 120, radius: 20 })
      : html`<div
          style="height:110px;border-radius:20px;background:var(--md-sys-color-surface-container-high);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px"
        >
          ${icon("description", { size: 40, color: "var(--md-sys-color-primary)" })}
          <span class="t-label-medium c-variant">PDF Document</span>
        </div>`}
    ${Object.values(DETAILS).map((d) => detailCard(...d(file)))}
  </div>
  <md-divider></md-divider>
  <div class="sc-sheet__footer">
    ${button("Close", {
      icon: "close",
      variant: "outlined",
      cls: "sc-grow sc-btn--block",
      onClick: onClose,
    })}
    ${button("Preview", {
      icon: "visibility",
      variant: "outlined",
      cls: "sc-grow sc-btn--block",
      onClick: () => {
        onClose();
        s.set?.({ previewItem: file });
      },
    })}
  </div>
`;

/** feature/metadatasanitizer: MetadataSanitizerScreen with selected files and privacy notes. */
export const metadataSanitizer = {
  id: "metadata-sanitizer",
  title: "Metadata Sanitizer",
  category: "tools",
  categoryLabel: "Tools",
  description: "Strip EXIF and location data from copies of your photos and PDFs, offline.",
  palette: "dynamic",
  defaults: {
    removed: [],
    sanitized: false,
    sheetOpen: false,
    sheetPhase: "confirm", // "confirm" | "progress" | "done"
    overwriteExisting: false,
    activeDetailFile: null,
    previewItem: null,
  },
  controls: [
    {
      type: "preset",
      label: "State",
      options: [
        { label: "Pending Files", value: { removed: [], sanitized: false, sheetOpen: false, sheetPhase: "confirm", activeDetailFile: null, previewItem: null } },
        { label: "Sanitize Sheet (Confirm)", value: { removed: [], sanitized: false, sheetOpen: true, sheetPhase: "confirm", activeDetailFile: null, previewItem: null } },
        { label: "Sanitizing Progress", value: { removed: [], sanitized: false, sheetOpen: true, sheetPhase: "progress", activeDetailFile: null, previewItem: null } },
        { label: "Sanitized Done", value: { removed: [], sanitized: true, sheetOpen: true, sheetPhase: "done", activeDetailFile: null, previewItem: null } },
        { label: "Sanitized List", value: { removed: [], sanitized: true, sheetOpen: false, sheetPhase: "confirm", activeDetailFile: null, previewItem: null } },
        { label: "File Metadata Sheet", value: { removed: [], sanitized: false, sheetOpen: false, activeDetailFile: SAMPLE_FILES[0], previewItem: null } },
        { label: "Empty State", value: { removed: SAMPLE_FILES.map((f) => f.name), sanitized: false, sheetOpen: false, activeDetailFile: null, previewItem: null } },
      ],
    },
  ],
  tick: (s, dt) => {
    if (s.sheetOpen && s.sheetPhase === "progress") {
      const p = (s.progress ?? 0) + dt / 1.0;
      if (p >= 1) {
        return { sheetPhase: "done", sanitized: true, progress: 0 };
      }
      return { progress: p };
    }
    return null;
  },
  render: (s) => {
    const activeFiles = SAMPLE_FILES.filter((f) => !s.removed.includes(f.name));
    const isSheetOpen = !!s.sheetOpen;
    const isProgress = isSheetOpen && s.sheetPhase === "progress";

    const renderSanitizeSheet = () => {
      if (!isSheetOpen) return null;
      const phase = s.sheetPhase || "confirm";

      const title =
        phase === "confirm"
          ? "Sanitize"
          : phase === "progress"
            ? "Sanitizing"
            : "Sanitizing complete";

      const subtitle =
        phase === "confirm"
          ? `Selected ${activeFiles.length} file(s)`
          : phase === "progress"
            ? "Removing EXIF and location metadata"
            : "Metadata successfully removed";

      return {
        presentation: "sheet",
        label: title,
        handle: true,
        flush: true,
        onDismiss: () => !isProgress && s.set?.({ sheetOpen: false }),
        content: html`
            <div class="sc-sheet__header">
              <div class="sc-col sc-grow" style="min-width:0">
                <div class="t-title-medium w-semibold">${title}</div>
                <div class="t-body-small c-variant">${subtitle}</div>
              </div>
              <md-icon-button
                ?disabled=${isProgress}
                @click=${() => s.set?.({ sheetOpen: false })}
              >
                ${icon("close")}
              </md-icon-button>
            </div>
            <md-divider></md-divider>

            <div class="sc-sheet__content">
              ${phase === "confirm"
                ? html`
                    ${card(
                      html`<div style="padding:14px 16px;display:flex;flex-direction:column;gap:6px">
                        <div class="sc-row" style="gap:10px">
                          ${icon("description", { size: 22, color: "var(--md-sys-color-primary)" })}
                          <span class="t-body-medium">Selected ${activeFiles.length} • Supported ${activeFiles.length} • Unsupported 0</span>
                        </div>
                        <div class="t-body-small c-variant" style="padding-left:32px">
                          Will create ${activeFiles.length} sanitized copies
                        </div>
                      </div>`,
                      { color: "color-mix(in srgb, var(--md-sys-color-surface-variant) 45%, transparent)" },
                    )}
                    ${card(
                      html`<div style="padding:14px 16px;display:flex;flex-direction:column;gap:10px">
                        <div class="sc-row" style="gap:10px">
                          ${icon("folder_open", { size: 22, color: "var(--md-sys-color-primary)" })}
                          <div class="sc-grow">
                            <div class="t-label-large w-semibold">Save location</div>
                            <div class="t-body-small c-variant">Pictures/Smart Cleaner/Sanitized</div>
                          </div>
                        </div>
                        <div class="sc-row" style="gap:10px;justify-content:space-between">
                          <div class="sc-row" style="gap:10px">
                            ${icon("info", { size: 20, color: "var(--md-sys-color-primary)" })}
                            <span class="t-body-medium">Overwrite sanitized files</span>
                          </div>
                          <md-switch
                            .selected=${!!s.overwriteExisting}
                            @change=${(e) => s.set?.({ overwriteExisting: e.target.selected })}
                          ></md-switch>
                        </div>
                        ${s.overwriteExisting
                          ? card(
                              html`<div class="sc-row" style="padding:10px 12px;gap:8px">
                                ${icon("warning", { size: 18, color: "var(--md-sys-color-error)" })}
                                <span class="t-label-small" style="color:var(--md-sys-color-on-error-container)">Warning: Existing files with the same name will be overwritten.</span>
                              </div>`,
                              { color: "var(--md-sys-color-error-container)" },
                            )
                          : nothing}
                      </div>`,
                      { color: "color-mix(in srgb, var(--md-sys-color-surface-variant) 50%, transparent)" },
                    )}
                    ${card(
                      html`<div class="sc-row" style="padding:12px 16px;gap:10px">
                        ${icon("info", { size: 20, color: "var(--md-sys-color-on-secondary-container)" })}
                        <span class="t-body-small" style="color:var(--md-sys-color-on-secondary-container)">Sanitized copies will be saved without modifying original files.</span>
                      </div>`,
                      { color: "color-mix(in srgb, var(--md-sys-color-secondary-container) 40%, transparent)" },
                    )}
                  `
                : nothing}

              ${phase === "progress"
                ? html`
                    ${card(
                      html`<div style="padding:14px 16px;display:flex;flex-direction:column;gap:12px">
                        <div class="sc-row" style="gap:10px">
                          ${icon("hourglass_top", { size: 22, color: "var(--md-sys-color-on-tertiary-container)" })}
                          <span class="t-body-medium w-medium">Processing: ${activeFiles[0]?.name || "sanitizing_stream.jpg"}</span>
                        </div>
                        <md-linear-progress value=${s.progress ?? 0.4}></md-linear-progress>
                      </div>`,
                      { color: "color-mix(in srgb, var(--md-sys-color-tertiary-container) 40%, transparent)" },
                    )}
                    ${card(
                      html`<div style="padding:14px 16px;display:flex;flex-direction:column;gap:6px">
                        <div class="t-body-medium w-semibold">Stripping EXIF & GPS tags</div>
                        <div class="t-body-small c-variant">Writing sanitized stream to Pictures/Smart Cleaner/Sanitized/...</div>
                      </div>`,
                      { color: "color-mix(in srgb, var(--md-sys-color-surface-variant) 45%, transparent)" },
                    )}
                  `
                : nothing}

              ${phase === "done"
                ? html`
                    ${card(
                      html`<div class="sc-row" style="padding:14px 16px;gap:12px">
                        ${icon("check_circle", { size: 24, color: "var(--md-sys-color-primary)" })}
                        <span class="t-body-medium w-medium">Sanitized ${activeFiles.length} of ${activeFiles.length} files (${activeFiles.length} succeeded, 0 failed)</span>
                      </div>`,
                      { color: "color-mix(in srgb, var(--md-sys-color-primary-container) 40%, transparent)" },
                    )}
                    ${card(
                      html`<div class="sc-row" style="padding:14px 16px;gap:12px">
                        ${icon("location_on", { size: 22, color: "var(--md-sys-color-primary)" })}
                        <div class="sc-grow">
                          <div class="t-title-small w-semibold">Saved location</div>
                          <div class="t-body-small c-variant">Pictures/Smart Cleaner/Sanitized</div>
                        </div>
                      </div>`,
                      { color: "color-mix(in srgb, var(--md-sys-color-surface-variant) 45%, transparent)" },
                    )}
                  `
                : nothing}
            </div>

            <md-divider></md-divider>
            <div class="sc-sheet__footer">
              ${phase === "confirm"
                ? html`
                    ${button("Cancel", {
                      variant: "outlined",
                      cls: "sc-grow sc-btn--block",
                      icon: "close",
                      onClick: () => s.set?.({ sheetOpen: false }),
                    })}
                    ${button("Sanitize", {
                      fill: true,
                      cls: "sc-grow sc-btn--block",
                      icon: "download",
                      onClick: () => s.set?.({ sheetPhase: "progress", progress: 0 }), // tick() finishes the run
                    })}
                  `
                : nothing}

              ${phase === "progress"
                ? html`
                    ${button("Cancel", {
                      variant: "outlined",
                      cls: "sc-grow sc-btn--block",
                      icon: "close",
                      onClick: () => s.set?.({ sheetOpen: false, sheetPhase: "confirm" }),
                    })}
                  `
                : nothing}

              ${phase === "done"
                ? html`
                    ${button("Open file", {
                      variant: "outlined",
                      cls: "sc-grow sc-btn--block",
                      icon: "open_in_new",
                      onClick: () => {
                        s.set?.({ sheetOpen: false, previewItem: activeFiles[0] });
                      },
                    })}
                    ${button("Share", {
                      fill: true,
                      cls: "sc-grow sc-btn--block",
                      icon: "share",
                      onClick: () => s.set?.({ sheetOpen: false }),
                    })}
                  `
                : nothing}
            </div>
      `,
      };
    };

    const renderDetailModal = () => {
      const file = s.activeDetailFile;
      if (!file) return null;
      const close = () => s.set?.({ activeDetailFile: null });
      return { presentation: "sheet", label: "File metadata", handle: true, flush: true, onDismiss: close, content: renderDetailContent(file, s, close) };
    };

    const renderPreviewDialog = () => {
      const item = s.previewItem;
      if (!item) return null;
      return {
        presentation: "sheet",
        label: item.name,
        flush: true,
        onDismiss: () => s.set?.({ previewItem: null }),
        content: html`
            <div class="sc-sheet__header">
              <div class="sc-col sc-grow" style="min-width:0">
                <div class="t-title-medium w-semibold sc-ellipsis">${item.name}</div>
                <div class="t-body-small c-variant">${item.size} • ${item.resolution}</div>
              </div>
              <md-icon-button @click=${() => s.set?.({ previewItem: null })}>
                ${icon("close")}
              </md-icon-button>
            </div>
            <md-divider></md-divider>
            <div class="sc-sheet__content" style="align-items:center;justify-content:center;padding:16px">
              ${item.type === "image"
                ? photo(item.seed, { w: 380, h: 280, radius: 16 })
                : html`<div
                    style="width:100%;height:240px;border-radius:16px;background:var(--md-sys-color-surface-container-high);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px"
                  >
                    ${icon("description", { size: 64, color: "var(--md-sys-color-primary)" })}
                    <span class="t-title-small">${item.name}</span>
                    <span class="t-body-small c-variant">${item.resolution} • ${item.size}</span>
                  </div>`}
            </div>
            <div class="sc-sheet__footer">
              ${button("Close", {
                variant: "outlined",
                cls: "sc-grow sc-btn--block",
                icon: "close",
                onClick: () => s.set?.({ previewItem: null }),
              })}
            </div>
      `,
      };
    };

    // Opened from the drawer. One sheet at a time, the latest on top: preview, then details, then sanitizing.
    return previewScreen(APP, s, {
      kind: "page",
      title: "Metadata sanitizer",
      topBar: "large",
      onBack: goer(s)("dashboard"),
      overlay: renderPreviewDialog() ?? renderDetailModal() ?? renderSanitizeSheet(),
      content: html`<div style="padding:0 16px">
        ${activeFiles.length > 0
          ? html`
              <div class="sc-row"><span class="t-title-medium w-semibold c-primary sc-grow">Selected files</span><span class="sc-count-dot">${activeFiles.length}</span></div>
              <div class="t-body-small c-variant" style="margin:4px 0 10px">Selected ${activeFiles.length} • Supported ${activeFiles.length} • Unsupported 0</div>
              ${groupedList(activeFiles.map((f) => fileRow(f, s)), { bg: "color-mix(in srgb, var(--md-sys-color-secondary-container) 40%, transparent)" })}
            `
          : html`
              <div
                class="sc-meta-empty-card"
                @click=${() => s.set?.({ removed: [], sanitized: false })}
                style="margin-top:12px"
              >
                <div class="sc-meta-empty-icon-box">
                  ${icon("image", { size: 36, color: "var(--md-sys-color-on-surface-variant)" })}
                </div>
                <div class="t-title-medium w-semibold" style="margin-top:16px">No files selected</div>
                <div class="t-body-small c-variant" style="margin-top:6px;text-align:center">
                  Tap here to select photos and PDFs to sanitize
                </div>
              </div>
            `}

        <div style="margin-top:20px">${icon("info", { size: 24, color: "var(--md-sys-color-primary)" })}</div>
        <div class="t-body-medium w-semibold" style="margin-top:10px">Privacy protection</div>
        <p class="t-body-medium" style="margin:12px 0 0;color:var(--md-sys-color-on-surface-variant)">Offline processing. Supported formats: images and PDF. Unsupported files are skipped.</p>
        <p class="t-body-medium" style="margin:12px 0 0;color:var(--md-sys-color-on-surface-variant)">
          Sanitized images are saved to Pictures/Smart Cleaner/Sanitized, and sanitized documents are saved to Documents/Smart Cleaner/Sanitized. Original files remain unchanged.
        </p>
        <p class="t-body-medium" style="margin:12px 0 0;color:var(--md-sys-color-on-surface-variant)">Metadata is removed from selected copies. Original files are preserved by default.</p>
      </div>`,
      fab: html`<div class="sc-col" style="align-items:flex-end;gap:16px">
        <md-fab size="small" class="sc-fab-tonal" @click=${() => s.set?.({ removed: [], sanitized: false })} title="Select photos / PDFs"><md-icon slot="icon">add_photo_alternate</md-icon></md-fab>
        ${sanitizeFab({
          label: activeFiles.length === 0 ? "No files" : isProgress ? "Sanitizing…" : "Sanitize",
          disabled: activeFiles.length === 0 || isProgress,
          onClick: () => activeFiles.length > 0 && s.set?.({ sheetOpen: true, sheetPhase: "confirm" }),
        })}
      </div>`,
    });
  },
};

/** MetadataDetailsBottomSheet over the sanitizer, for one sample file. */
export const fileMetadata = {
  ...metadataSanitizer,
  id: "file-metadata",
  title: "File Metadata",
  category: "tools",
  categoryLabel: "Tools",
  description: "Everything a photo carries: EXIF, GPS and XMP entries before sanitizing.",
  palette: "dynamic",
  defaults: { ...metadataSanitizer.defaults, activeDetailFile: SAMPLE_FILES.find((f) => f.seed === 25) ?? SAMPLE_FILES[0] },
  controls: [],
};
