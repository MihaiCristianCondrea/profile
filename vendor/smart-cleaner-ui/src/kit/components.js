import { html, nothing, svg } from "lit";
import { icon } from "./shell.js";
import { asset } from "./assets.js";

/**
 * CleanerCardContainer: a filled Card (CleanerCardStyleConfig NORMAL) with a 28 dp corner. Only the
 * dashboard cards ask for OUTLINED, so pass `outlined: true` there and nowhere else.
 * `color` sets the container color (the app often tints it, e.g. surfaceVariant at 45%).
 */
export const card = (content, { outlined = false, color, radius = 28, cls = "", style = "" } = {}) =>
  outlined
    ? html`<md-outlined-card class="sc-card ${cls}" style="--sc-card-radius:${radius}px;${style}">${content}</md-outlined-card>`
    : html`<md-filled-card class="sc-card ${cls}" style="--sc-card-radius:${radius}px;${color ? `--md-filled-card-container-color:${color};` : ""}${style}">${content}</md-filled-card>`;

/** App Toolkit GeneralButton (ButtonMeasurements.Small by default). */
export const button = (label, { icon: ic, variant = "filled", cls = "", disabled = false, size = "small", fill = false, onClick } = {}) => {
  const inner = html`${ic ? html`<md-icon slot="icon" style=${fill ? "font-variation-settings:'FILL' 1" : ""}>${ic}</md-icon>` : nothing}${label}`;
  const c = `sc-btn sc-btn--${size} ${cls}`;
  switch (variant) {
    case "tonal":
      return html`<md-filled-tonal-button class=${c} ?disabled=${disabled} ?has-icon=${!!ic} @click=${() => onClick?.()}>${inner}</md-filled-tonal-button>`;
    case "outlined":
      return html`<md-outlined-button class=${c} ?disabled=${disabled} ?has-icon=${!!ic} @click=${() => onClick?.()}>${inner}</md-outlined-button>`;
    case "text":
      return html`<md-text-button class=${c} ?disabled=${disabled} ?has-icon=${!!ic} @click=${() => onClick?.()}>${inner}</md-text-button>`;
    default:
      return html`<md-filled-button class=${c} ?disabled=${disabled} ?has-icon=${!!ic} @click=${() => onClick?.()}>${inner}</md-filled-button>`;
  }
};

const TONES = {
  default: ["var(--md-sys-color-surface-variant)", "var(--md-sys-color-on-surface-variant)"],
  info: ["var(--md-sys-color-secondary-container)", "var(--md-sys-color-on-secondary-container)"],
  warning: ["var(--md-sys-color-error-container)", "var(--md-sys-color-on-error-container)"],
  safe: ["var(--md-sys-color-primary-container)", "var(--md-sys-color-on-primary-container)"],
};

/** Bottom-start badge with a 28 dp top-end corner (DashboardActionCard badge). */
export const cornerBadge = (text, tone = "default") => {
  const [bg, fg] = TONES[tone];
  return html`<span class="sc-corner-badge t-label-large w-semibold" style="background:${bg};color:${fg}">${text}</span>`;
};

/** Small rounded severity pill (DashboardSquareActionCard). */
export const pill = (text, tone = "default") => {
  const [bg, fg] = TONES[tone];
  return html`<span class="sc-pill t-label-small w-semibold" style="background:${bg};color:${fg}">${text}</span>`;
};

/** CollapsibleSectionHeader */
export const sectionHeader = (title, description, expanded = true, onToggle, { flush = false } = {}) => html`
  <div class="sc-section-header ${flush ? "sc-section-header--flush" : ""}">
    <div class="sc-grow">
      <div class="t-title-medium" style="font-weight:400">${title}</div>
      <div class="t-body-small c-variant">${description}</div>
    </div>
    <md-icon-button @click=${() => onToggle?.()}>${icon(expanded ? "expand_less" : "expand_more")}</md-icon-button>
  </div>
`;

/**
 * DashboardActionCard: outlined 28 dp card, 28 dp primary header icon, titleMedium + bodySmall,
 * optional content, bottom-start corner badge and bottom-end GeneralButton.
 */
export const actionCard = ({ icon: ic, iconColor, title, subtitle, pinned = false, content, badge, action, actionIcon, onAction, actionDisabled = false }) =>
  card(html`
    <div class="sc-action-card">
      <div class="sc-action-card__body">
        <div class="sc-action-card__header">
          ${typeof ic === "string" ? icon(ic, { size: 28, color: iconColor ?? "var(--md-sys-color-primary)" }) : ic}
          <div class="sc-grow">
            <div class="t-title-medium" style="font-weight:400">${title}</div>
            <div class="t-body-small">${subtitle}</div>
          </div>
          ${pinned ? icon("keep", { size: 22, fill: true }) : nothing}
        </div>
        ${content ?? nothing}
      </div>
      <div class="sc-action-card__footer">
        ${badge ? cornerBadge(badge.text, badge.tone) : html`<span></span>`}
        ${action ? button(action, { icon: actionIcon, onClick: onAction, disabled: actionDisabled }) : nothing}
      </div>
    </div>
  `, { outlined: true });

/** DashboardSquareActionCard */
export const squareCard = ({ icon: ic, title, severity, description }) =>
  card(html`
    <div class="sc-square-card">
      <span class="sc-square-card__icon">${icon(ic, { size: 28, color: "var(--md-sys-color-primary)" })}</span>
      <div class="t-title-medium" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${title}</div>
      ${severity ? pill(severity.text, severity.tone) : nothing}
      <div class="t-body-small c-variant sc-clamp-2">${description}</div>
    </div>
  `, { outlined: true });

/** Rounded square file thumbnail used by the Large Files / Duplicates dashboard cards. */
export const fileThumb = (label, { image } = {}) => html`
  <span class="sc-file-thumb" style=${image ? `background:${image}` : ""}>
    ${image ? nothing : icon("description", { size: 22 })}
    <span class="sc-file-thumb__label">${label}</span>
  </span>
`;

export const moreThumb = (text) => html`<span class="sc-file-thumb sc-file-thumb--more t-label-small">${text}</span>`;

/**
 * QuickScanSummaryCard: liquid gradient (three drifting radial blobs in "vibrant" shifted
 * secondary / secondaryContainer / primary), a primaryContainer halo, and the Quick Scan ring.
 * `t` (seconds) drives the blob angles exactly like the Compose infinite transition.
 */
/** `button: false` keeps the button's place but hides it (motion: the button has left the card to carry on alone). */
export const quickScanCard = ({ cleaned = "245.96 KB", free = 20, used = 79, progress = 0.79, message, warning = true, t = 0, onScan, button = true }) => {
  const a1 = ((t % 12) / 12) * Math.PI * 2;
  const a2 = Math.PI * 2 - ((t % 15) / 15) * Math.PI * 2;
  const a3 = ((t % 10) / 10) * Math.PI * 2;
  const pos = (cx, rx, a, cy, ry) => `${(cx + rx * Math.cos(a)) * 100}% ${(cy + ry * Math.sin(a)) * 100}%`;
  const v1 = "var(--sc-v1, hsl(from var(--md-sys-color-secondary) calc(h - 12) calc(s * 1.4) l / 0.36))";
  const v2 = "var(--sc-v2, hsl(from var(--md-sys-color-secondary-container) calc(h + 24) calc(s * 1.4) l / 0.36))";
  const v3 = "var(--sc-v3, hsl(from var(--md-sys-color-primary) calc(h - 16) calc(s * 1.2) l / 0.36))";
  const bg = [
    `radial-gradient(circle 345px at ${pos(0.3, 0.35, a1, 0.3, 0.35)}, ${v1} 0%, transparent 100%)`,
    `radial-gradient(circle 345px at ${pos(0.7, 0.3, a2, 0.6, 0.3)}, ${v2} 0%, transparent 100%)`,
    `radial-gradient(circle 345px at ${pos(0.4, 0.4, a3, 0.8, 0.2)}, ${v3} 0%, transparent 100%)`,
  ].join(",");
  const freeColor = free >= 75 ? "var(--sc-qs-tertiary-contrast, var(--md-sys-color-tertiary))" : free >= 50 ? "var(--sc-qs-primary-contrast, var(--md-sys-color-primary))" : "var(--sc-qs-error-contrast, var(--md-sys-color-error))";
  const usedColor = used >= 90 ? "var(--sc-qs-error-contrast, var(--md-sys-color-error))" : used >= 75 ? "var(--sc-qs-tertiary-contrast, var(--md-sys-color-tertiary))" : "var(--sc-qs-text-secondary, var(--md-sys-color-on-surface-variant))";
  const iconPrimaryColor = "var(--sc-qs-icon-primary, var(--md-sys-color-primary))";
  const textPrimaryColor = "var(--sc-qs-text-primary, var(--md-sys-color-on-surface))";
  const textSecondaryColor = "var(--sc-qs-text-secondary, var(--md-sys-color-on-surface-variant))";
  const statusColor = warning ? "var(--sc-qs-error-contrast, var(--md-sys-color-error))" : textSecondaryColor;
  return card(
    html`
      <div class="sc-quickscan" style="background:${bg}">
        <span class="sc-quickscan__halo"></span>
        <div class="sc-grow sc-quickscan__text">
          <div class="sc-row" style="gap:8px">
            ${icon("cleaning_services", { color: iconPrimaryColor })}
            <span class="t-title-medium w-semibold" style="color:${textPrimaryColor}">You cleaned ${cleaned} this week</span>
          </div>
          <div class="sc-row" style="gap:8px">
            ${icon(used >= 75 ? "disc_full" : "storage", { color: iconPrimaryColor })}
            <span class="t-body-medium" style="color:${textPrimaryColor}">Free: <span style="color:${freeColor};font-weight:600">${free}%</span></span>
            <span class="t-body-medium" style="color:${textPrimaryColor};margin-left:4px">Used: <span style="color:${usedColor};font-weight:600">${used}%</span></span>
          </div>
          <div class="sc-row" style="gap:8px;align-items:flex-start">
            ${icon(warning ? "disc_full" : "info", { color: statusColor })}
            <span class="t-body-small ${warning ? "w-semibold" : "italic"}" style="color:${statusColor}">${message ?? `${free}% free left. Worth clearing some space.`}</span>
          </div>
        </div>
        ${button ? quickScanButton({ progress, onScan }) : html`<span style="visibility:hidden">${quickScanButton({ progress })}</span>`}
      </div>
    `,
    { cls: "sc-card--clip", outlined: true },
  );
};

/** The Quick Scan card's button: a 112 dp ring showing the used share around the tonal "Quick Scan" circle. */
export const quickScanButton = ({ progress = 0.79, onScan } = {}) => {
  const r = 52;
  const circ = 2 * Math.PI * r;
  return html`<div class="sc-quickscan__button">
    <svg viewBox="0 0 112 112" width="112" height="112">
      <circle cx="56" cy="56" r=${r} fill="none" stroke="var(--md-sys-color-primary-container)" stroke-width="4" />
      <circle
        cx="56"
        cy="56"
        r=${r}
        fill="none"
        stroke="var(--md-sys-color-primary)"
        stroke-width="4"
        stroke-linecap="round"
        stroke-dasharray=${circ}
        stroke-dashoffset=${circ * (1 - progress)}
        transform="rotate(-90 56 56)"
      />
    </svg>
    <span class="sc-quickscan__tonal" @click=${() => onScan?.()}>${icon("rocket", { size: 20 })}<span class="t-label-large" style="font-weight:400">Quick<br />Scan</span></span>
  </div>`;
};

/** groupedCorners(): 28 dp outer corners, 4 dp between rows, 2 dp gaps (Material 3 Expressive lists). */
export const groupedList = (rows, { gap = 2, cls = "", bg } = {}) => html`
  <div class="sc-grouped ${cls}" style="gap:${gap}px;${bg ? `--sc-grouped-bg:${bg};` : ""}">
    ${rows.map((r) => html`<div class="sc-grouped__row">${r}</div>`)}
  </div>
`;

/** Full-width bottom action (Stop / Done / Review…), GeneralButton with ButtonMeasurements.Medium. */
export const bottomAction = (label, { icon: ic, variant = "filled", fill = true, onClick } = {}) =>
  html`<div class="sc-bottom-action">${button(label, { icon: ic, variant, fill, onClick, size: "large", cls: "sc-btn--block" })}</div>`;

/** A Blebble illustration from the app's own drawables (synced into public/illustrations). */
export const illustration = (name, size, style = "") =>
  html`<img class="sc-illustration" src=${asset(`illustrations/${name.includes(".") ? name : `${name}.png`}`)} style="width:${size}px;height:${size}px;${style}" alt="" />`;

/** clean/common ExpandableFileListItem. `thumb` replaces the icon circle with a preview. */
export const fileItem = ({ name, size, fileIcon = "draft", checked = false, expanded = false, original = false, thumb, details, onCheck, onExpand, onPreview }) => html`
  <div class="sc-file-item">
    <div class="sc-row" style="gap:12px">
      ${thumb ?? html`<span class="sc-file-item__icon">${icon(fileIcon, { size: 24, color: "var(--md-sys-color-on-primary-container)" })}</span>`}
      <div class="sc-grow" style="min-width:0">
        <div class="t-title-small sc-ellipsis" style="font-weight:400">${name}</div>
        <div class="sc-row" style="gap:6px">
          <span class="t-body-small c-variant">${size}</span>
          ${original ? html`<span class="sc-original t-label-small">Original</span>` : nothing}
        </div>
      </div>
      <md-checkbox .checked=${checked} ?disabled=${original} touch-target="wrapper" @change=${() => !original && onCheck?.()}></md-checkbox>
      <md-icon-button @click=${() => onExpand?.()}>${icon(expanded ? "expand_less" : "expand_more")}</md-icon-button>
    </div>
    ${expanded && details
      ? html`<div class="sc-file-item__details">
          ${details.map(
            ([k, v, chip]) => html`<div class="t-label-small c-variant" style="margin-top:8px">${k}</div>
              ${chip ? html`<span class="sc-path-chip t-body-small c-variant">${v}</span>` : html`<div class="t-body-medium">${v}</div>`}`,
          )}
          <div class="sc-row" style="justify-content:flex-end;margin-top:8px">
            <span class="sc-preview-btn t-label-large" style="font-weight:400;cursor:pointer" @click=${() => onPreview?.()}>${icon("visibility", { size: 20 })} Preview</span>
          </div>
        </div>`
      : nothing}
  </div>
`;

export const dateHeader = (label, checked = false, onCheck) => html`<div class="sc-date-header">
  <span class="t-body-large sc-grow">${label}</span><md-checkbox .checked=${checked} touch-target="wrapper" @change=${() => onCheck?.()}></md-checkbox>
</div>`;

/**
 * Android's Formatter.formatShortFileSize: SI units, one decimal under 10, none above
 * ("9.5 MB", "11 MB", "1.1 GB"). Takes bytes.
 */
export const fileSize = (bytes) => {
  const units = ["B", "kB", "MB", "GB", "TB"];
  let v = Math.max(0, bytes);
  let u = 0;
  while (v >= 900 && u < units.length - 1) {
    v /= 1000;
    u++;
  }
  const text = v < 1 ? v.toFixed(2) : v < 10 ? v.toFixed(1) : v.toFixed(0);
  return `${text.replace(/\.0+$/, "")} ${units[u]}`;
};
/** Formatter.formatFileSize (the long form): two decimals up to 100 ("2.84 GB", "64.20 MB"). */
export const fileSizeLong = (bytes) => {
  const units = ["B", "kB", "MB", "GB", "TB"];
  let v = Math.max(0, bytes);
  let u = 0;
  while (v >= 900 && u < units.length - 1) {
    v /= 1000;
    u++;
  }
  return `${v < 100 ? v.toFixed(2) : v.toFixed(0)} ${units[u]}`;
};
export const MB = 1e6;
const plural = (n, one, other) => `${n} ${n === 1 ? one : other}`;

/** clean/common SelectedFilesStatusRow: info icon, then "Selected: 1.1 GB • 2 files • 1 group" (or "No files selected"). */
export const selectionStatus = ({ files = 0, groups = 0, bytes = 0 } = {}) => html`<div class="sc-row sc-grow" style="gap:4px;min-width:0">
  ${icon("info", { size: 16, color: "var(--md-sys-color-on-surface-variant)" })}
  <span class="sc-grow sc-ellipsis t-body-large" style="color:${files ? "var(--md-sys-color-primary)" : "var(--md-sys-color-secondary)"}"
    >${files ? `Selected: ${fileSize(bytes)} • ${plural(files, "file", "files")} • ${plural(groups, "group", "groups")}` : "No files selected"}</span
  >
</div>`;

/**
 * clean/common SelectedFilesStatusRow + the action bar under it: "Selected: 1.1 GB • 2 files • 1 group"
 * (or "No files selected"), a Select All filter chip, then Move to trash / Delete forever.
 */
export const selectionBar = ({ files = 0, groups = 0, bytes = 0, allSelected = false, onSelectAll, onTrash, onDelete } = {}) => html`
  <div class="sc-selection-bar">
    <md-divider></md-divider>
    <div class="sc-row" style="padding:12px 16px 0;gap:4px">
      ${selectionStatus({ files, groups, bytes })}
      <md-filter-chip label="Select All" .selected=${allSelected} @click=${(e) => (e.preventDefault(), onSelectAll?.())}></md-filter-chip>
    </div>
    <div class="sc-row" style="padding:12px 16px 12px;gap:12px">
      ${button("Move to trash", { icon: "delete", variant: "outlined", disabled: !files, cls: "sc-grow sc-btn--block", onClick: onTrash })}
      ${button("Delete forever", { icon: "delete_forever", variant: "tonal", disabled: !files, cls: "sc-grow sc-btn--block", onClick: onDelete })}
    </div>
  </div>
`;

/** Material 3 AlertDialog over a scrim: optional centered icon, headline, supporting text, text/filled actions. Pass as `overlay`. */
/**
 * AlertDialog, as an overlay for previewScreen(): the shell draws the scrim, centres it, and dismisses it on the
 * scrim, Escape and Back.
 */
export const alertDialog = ({ icon: ic, title, text, confirm, dismiss, destructive = false, onConfirm, onDismiss }) => ({
  presentation: "dialog",
  label: title,
  // The box draws its own 312 dp surface.
  flush: true,
  onDismiss,
  content: html`<div class="sc-alert__box">
    ${ic ? html`<div class="sc-alert__icon">${icon(ic, { size: 24 })}</div>` : nothing}
    <div class="t-headline-small sc-alert__title ${ic ? "sc-alert__title--center" : ""}">${title}</div>
    ${text ? html`<div class="t-body-medium c-variant sc-alert__text">${text}</div>` : nothing}
    <div class="sc-alert__actions">
      ${dismiss ? button(dismiss, { variant: "text", onClick: onDismiss }) : nothing}
      ${confirm ? button(confirm, { variant: destructive ? "tonal" : "filled", onClick: onConfirm }) : nothing}
    </div>
  </div>`,
});

/** WhatsApp brand mark (feature/whatsappcleaner ic_brand_whatsapp); Material Symbols has no brand icons. */
export const whatsappIcon = (size = 24, color = "currentColor") =>
  svg`<svg width=${size} height=${size} viewBox="0 0 24 24" style="display:block"><path fill=${color} d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M8.53 7.33C8.37 7.33 8.1 7.39 7.87 7.64C7.65 7.89 7 8.5 7 9.71C7 10.93 7.89 12.1 8 12.27C8.14 12.44 9.76 14.94 12.25 16C12.84 16.27 13.3 16.42 13.66 16.53C14.25 16.72 14.79 16.69 15.22 16.63C15.7 16.56 16.68 16.03 16.89 15.45C17.1 14.87 17.1 14.38 17.04 14.27C16.97 14.17 16.81 14.11 16.56 14C16.31 13.86 15.09 13.26 14.87 13.18C14.64 13.1 14.5 13.06 14.31 13.3C14.15 13.55 13.67 14.11 13.53 14.27C13.38 14.44 13.24 14.46 13 14.34C12.74 14.21 11.94 13.95 11 13.11C10.26 12.45 9.77 11.64 9.62 11.39C9.5 11.15 9.61 11 9.73 10.89C9.84 10.78 10 10.6 10.1 10.45C10.23 10.31 10.27 10.2 10.35 10.04C10.43 9.87 10.39 9.73 10.33 9.61C10.27 9.5 9.77 8.26 9.56 7.77C9.36 7.29 9.16 7.35 9 7.34C8.86 7.34 8.7 7.33 8.53 7.33Z"/></svg>`;

/** Rotating "Did you know?" tips of CleaningTipsCard, per ScanCategory. */
export const CLEANING_TIPS = {
  duplicates: "Duplicate screenshots are one of the most common causes of gallery clutter.",
  largeFiles: "Large files are often old videos or screen recordings you no longer need.",
  other: "Regular cleaning helps maintain your device's long-term health.",
};

/**
 * clean/common CleaningAnimationScreen, shared by every cleaner (Gallery, Large Files, Duplicates...).
 * Header illustration, "Cleaning files…" (then "All clean"), progress bar with %, the stats card
 * ("3 of 4 files cleaned" | "9.5 MB recovered"), the tips card, and Done once finished.
 */
export const cleaningScreen = ({ cleaned = 0, total = 0, bytes = 0, finished = false, title = "Cleaning files…", status = "Cleaning files…", art = "il_blebble_cleaning", tip = CLEANING_TIPS.other, statsIcon, onDone }) => {
  const shown = finished ? total : Math.min(cleaned, total);
  const progress = total ? shown / total : finished ? 1 : 0;
  return html`<div class="sc-cleaning">
    <div class="sc-cleaning__scroll">
      ${illustration(art, 156, "height:156px;width:100%;object-fit:contain;padding-bottom:12px")}
      <div class="t-headline-medium w-bold" style="text-align:center">${finished ? "All clean" : title}</div>
      ${finished
        ? nothing
        : html`<div class="t-body-small c-variant" style="text-align:center;padding:0 16px">You can leave this screen. Cleaning carries on.</div>
            <div class="sc-row c-primary t-body-medium" style="justify-content:center;gap:4px;font-weight:500">
              ${icon("auto_fix_high", { size: 16 })} ${status}
            </div>`}
      <div class="sc-row" style="gap:12px">
        <md-linear-progress class="sc-cleaning__bar" value=${progress}></md-linear-progress>
        <span class="t-label-large w-bold c-primary" style="width:44px;text-align:right;font-feature-settings:'tnum'">${Math.round(progress * 100)}%</span>
      </div>
      <div class="sc-cleaning__stats">
        <div class="sc-cleaning__stat">
          <span class="sc-cleaning__stat-icon" style="background:color-mix(in srgb, var(--md-sys-color-primary-container) 50%, transparent)"
            >${statsIcon ?? icon("folder_managed", { size: 20, color: "var(--md-sys-color-primary)" })}</span
          >
          <span class="t-headline-medium w-bold c-primary">${shown}</span>
          <span class="t-label-small c-variant">${shown.toLocaleString("en-US")} of ${plural(total, "file", "files").replace(String(total), total.toLocaleString("en-US"))} cleaned</span>
        </div>
        <span class="sc-cleaning__divider"></span>
        <div class="sc-cleaning__stat">
          <span class="sc-cleaning__stat-icon" style="background:color-mix(in srgb, var(--sc-success) 15%, transparent)"
            >${icon("auto_fix_high", { size: 20, color: "var(--sc-success)" })}</span
          >
          <span class="t-headline-medium w-bold" style="color:var(--sc-success)">${fileSize(bytes)}</span>
          <span class="t-label-small c-variant">recovered</span>
        </div>
      </div>
      <div class="sc-cleaning__tip">
        ${icon("lightbulb", { size: 16, color: "var(--md-sys-color-secondary)" })}
        <div><div class="t-label-large w-bold" style="color:var(--md-sys-color-secondary)">Did you know?</div><div class="t-body-medium">${tip}</div></div>
      </div>
    </div>
    ${finished ? html`<div style="padding-top:12px">${button("Done", { icon: "check", cls: "sc-btn--block", size: "medium", onClick: onDone })}</div>` : nothing}
  </div>`;
};

/** clean/common SortBottomSheet: "Sort options", Name / Date / Size radios, Descending switch, Apply. Pass as `overlay`. */
export const sortSheet = ({ type = "size", descending = true, onPick, onDescending, onApply, onDismiss }) => ({
  presentation: "sheet",
  label: "Sort options",
  handle: true,
  onDismiss,
  content: html`
      <div class="t-title-large w-semibold" style="text-align:center">Sort options</div>
      <div class="sc-sort-options">
        ${["name", "date", "size"].map(
          (k) => html`<div class="sc-sort-option" @click=${() => onPick?.(k)}>
            <md-radio .checked=${type === k}></md-radio>
            <span class="t-title-medium w-semibold">${k[0].toUpperCase() + k.slice(1)}</span>
          </div>`,
        )}
      </div>
      <div class="sc-row" style="padding:16px 4px">
        <span class="t-body-large sc-grow">Descending</span>
        <md-switch .selected=${descending} @change=${() => onDescending?.()}></md-switch>
      </div>
      ${button("Apply", { cls: "sc-btn--block", size: "medium", onClick: onApply })}`,
});

/** clean/common FileCard (grid view): square card, preview in the middle, size tab top-start, checkbox top-end, name at the bottom. */
export const fileCard = ({ name, size, preview, fileIcon = "unknown_document", checked = false, original = false, onCheck }) => html`
  <div class="sc-file-card">
    <div class="sc-file-card__preview">${preview ?? icon(fileIcon, { size: 40, color: "var(--md-sys-color-on-surface-variant)" })}</div>
    <div class="sc-file-card__tabs">
      ${original ? html`<span class="sc-file-card__tab sc-file-card__tab--original">Original</span>` : nothing}
      ${size ? html`<span class="sc-file-card__tab">${size}</span>` : nothing}
    </div>
    <md-checkbox class="sc-file-card__check" .checked=${checked} ?disabled=${original} touch-target="wrapper" @change=${() => onCheck?.()}></md-checkbox>
    <div class="sc-file-card__name sc-ellipsis">${name}</div>
  </div>
`;

/** Helpers for screens: no-ops when the host (e.g. a video render) doesn't provide them. */
/**
 * A screen's content, scrolled from its state rather than natively, so a capture of any scroll position is
 * deterministic: the wheel moves `s[key]` between 0 and `max`, and the content reads it (translateY(-scroll)).
 */
export const scrollArea = (s, content, { max, key = "scroll", off = false, cls = "" } = {}) => html`<div
  class="sc-content ${cls}"
  @wheel=${(e) => {
    if (off || !s.set || max === undefined) return;
    e.preventDefault();
    s.set({ [key]: Math.min(max, Math.max(0, (s[key] ?? 0) + e.deltaY)) });
  }}
>${content}</div>`;

/** The file lists' app bar actions (StorageCleanerTopBar): list or grid view, sort and refresh; refresh alone while cleaning. */
export const fileListActions = ({ grid = false, tools = true } = {}) =>
  tools
    ? [
        { id: "view", icon: grid ? "view_list" : "grid_view", label: grid ? "List view" : "Grid view" },
        { id: "sort", icon: "sort", label: "Sort" },
        { id: "refresh", icon: "refresh", label: "Refresh" },
      ]
    : [{ id: "refresh", icon: "refresh", label: "Refresh" }];

export const setter = (s) => (patch) => () => s.set?.(typeof patch === "function" ? patch(s) : patch);
export const goer = (s) => (id, state) => () => s.go?.(id, state);
export const toggleIn = (list, v) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
export const clamp01 = (v) => Math.min(1, Math.max(0, v));
