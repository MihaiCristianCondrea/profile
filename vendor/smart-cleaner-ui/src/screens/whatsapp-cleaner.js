/** Mirrors WhatsappCleanerSummaryScreen.kt and WhatsAppDetailsScreen.kt (feature/whatsappcleaner). */
import { html, nothing } from "lit";
import {
  MB,
  alertDialog,
  cleaningScreen,
  dateHeader,
  fileItem,
  fileSize,
  fileSizeLong,
  goer,
  groupedList,
  selectionBar,
  toggleIn,
  whatsappIcon,
  fileListActions,
  scrollArea,
} from "../kit/components.js";
import { previewScreen } from "material-next-web-components/marketing.js";
import { APP } from "../config/identity.js";
import { icon } from "../kit/shell.js";
import { photo } from "../motion/photo.js";

/**
 * WhatsApp media on the reference device, one entry per WhatsAppDirectoryUiItem (empty folders are
 * dropped, like the mapper does). `mb` in SI megabytes.
 */
const DIRECTORIES = [
  { type: "images", name: "Images", icon: "image", count: 842, mb: 1240 },
  { type: "videos", name: "Videos", icon: "video_file", count: 96, mb: 1020 },
  { type: "documents", name: "Documents", icon: "description", count: 54, mb: 186 },
  { type: "audios", name: "Audios", icon: "audio_file", count: 38, mb: 64.2 },
  { type: "statuses", name: "Statuses", icon: "web_stories", count: 41, mb: 88.4 },
  { type: "voice_notes", name: "Voice Notes", icon: "voice_selection", count: 126, mb: 142 },
  { type: "video_notes", name: "Video Notes", icon: "video_file", count: 9, mb: 12.6 },
  { type: "gifs", name: "GIFs", icon: "gif", count: 57, mb: 21.3 },
  { type: "wallpapers", name: "Wallpapers", icon: "wallpaper", count: 6, mb: 8.4 },
  { type: "stickers", name: "Stickers", icon: "ar_stickers", count: 212, mb: 17.1 },
  { type: "profile_photos", name: "Profile Photos", icon: "person_pin", count: 43, mb: 3.1 },
];
const TOTAL_FILES = DIRECTORIES.reduce((a, d) => a + d.count, 0);
const TOTAL_BYTES = DIRECTORIES.reduce((a, d) => a + d.mb, 0) * MB;
const DEVICE_BYTES = 128e9;
const BACKUPS = { bytes: 412 * MB, old: 3 };
const n = (x) => x.toLocaleString("en-US");

/** CleanerProgressIndicator: 100dp track + progress ring (8dp, round caps) around the cleaner icon. */
const progressRing = (progress, size = 100) => {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return html`<span class="sc-wa-ring" style="width:${size}px;height:${size}px">
    <svg width=${size} height=${size} viewBox="0 0 ${size} ${size}">
      <circle cx=${size / 2} cy=${size / 2} r=${r} fill="none" stroke="var(--md-sys-color-primary-container)" stroke-width=${stroke} />
      <circle cx=${size / 2} cy=${size / 2} r=${r} fill="none" stroke="var(--md-sys-color-primary)" stroke-width=${stroke} stroke-linecap="round"
        stroke-dasharray="${Math.max(0.001, c * progress)} ${c}" transform="rotate(-90 ${size / 2} ${size / 2})" />
    </svg>
    ${icon("cleaning_services", { size: size / 2, color: "var(--md-sys-color-primary)" })}
  </span>`;
};

/** feature/whatsappcleaner: WhatsappCleanerSummaryScreen. */
export const whatsappCleaner = {
  id: "whatsapp-cleaner",
  title: "WhatsApp Cleaner",
  category: "review",
  categoryLabel: "File review",
  palette: "dynamic",
  description: "How much WhatsApp media can be freed, database backups, and every media folder. Tap a folder to review it, or clean everything.",
  defaults: { dialog: false, phase: "summary", cleaned: 0, scroll: 0 },
  scrollMax: 420,
  /** Cleaning counts through every media file, then holds on All clean until Done. */
  tick: (s, dt) => {
    if (s.phase !== "cleaning") return null;
    const cleaned = Math.min(TOTAL_FILES, s.cleaned + dt * 700);
    return cleaned >= TOTAL_FILES ? { cleaned, phase: "result" } : { cleaned };
  },
  controls: [
    { key: "scroll", label: "Scroll", type: "range", min: 0, max: 420, unit: "dp" },
    {
      label: "States",
      type: "presets",
      options: [
        ["Summary", { phase: "summary", dialog: false, scroll: 0 }],
        ["Clean dialog", { phase: "summary", dialog: true }],
        ["Cleaning", { phase: "cleaning", cleaned: 610, dialog: false }],
      ],
    },
  ],
  render: (s) => {
    const go = goer(s);
    const cleaning = s.phase !== "summary";
    const info = html`<div class="sc-wa-info">
      ${progressRing(TOTAL_BYTES / DEVICE_BYTES)}
      <div>
        <div class="sc-row c-variant" style="gap:8px">${icon("sd_storage", { size: 18 })}<span class="t-body-large">Can be freed</span></div>
        <div class="t-headline-large w-semibold" style="line-height:42px">${fileSizeLong(TOTAL_BYTES)}</div>
        <div class="sc-row c-variant" style="gap:8px;margin-top:4px">${icon("folder_open", { size: 16 })}<span class="t-body-medium">${n(TOTAL_FILES)} files</span></div>
      </div>
    </div>`;
    const backups = html`<div class="sc-wa-backups" @click=${() => {}}>
      <span class="sc-wa-backups__icon">${icon("database", { size: 22 })}</span>
      <div class="sc-grow" style="min-width:0">
        <div class="t-title-medium sc-ellipsis">Database Backups</div>
        <div class="t-body-medium c-variant">Safe to clean • ${BACKUPS.old} old backups found</div>
      </div>
      <span class="t-label-large">${fileSizeLong(BACKUPS.bytes)}</span>
      <span class="sc-wa-backups__go">${icon("chevron_right", { size: 20 })}</span>
    </div>`;
    const grid = html`<div class="sc-wa-grid">
      ${DIRECTORIES.map(
        (d) => html`<div class="sc-wa-dir" @click=${go("whatsapp-details", { type: d.type })}>
          <span class="sc-wa-dir__icon">${icon(d.icon, { size: 24 })}</span>
          <div style="min-width:0"><div class="t-title-medium sc-ellipsis">${d.name}</div><div class="t-body-small">${fileSizeLong(d.mb * MB)}</div></div>
        </div>`,
      )}
    </div>`;
    return previewScreen(APP, s, {
      kind: "page",
      title: "WhatsApp Cleaner",
      topBar: "large",
      collapse: Math.min(1, s.scroll / 92),
      onBack: go("dashboard"),
      content: cleaning
        ? cleaningScreen({
            cleaned: Math.floor(s.cleaned),
            total: TOTAL_FILES,
            bytes: TOTAL_BYTES,
            finished: s.phase === "result",
            title: "Cleaning WhatsApp",
            statsIcon: whatsappIcon(20, "var(--md-sys-color-primary)"),
            onDone: go("dashboard"),
          })
        : scrollArea(
            s,
            html`<div class="sc-wa-summary" style="transform:translateY(${-Math.max(0, s.scroll - 92)}px)">
              <div class="sc-wa-group">${info}${backups}</div>
              ${grid}
            </div>`,
            { max: 420 },
          ),
      fab: cleaning
        ? null
        : html`<md-fab class="sc-fab-tonal" label=${s.scroll > 0 ? "" : "Clean WhatsApp Media"} @click=${() => s.set?.({ dialog: true })}
            ><md-icon slot="icon">delete_sweep</md-icon></md-fab
          >`,
      overlay: s.dialog
        ? alertDialog({
            icon: "delete_sweep",
            title: "Clean WhatsApp Media",
            text: "This will delete all WhatsApp media files. Continue?",
            dismiss: "Cancel",
            confirm: "Clean WhatsApp Media",
            onDismiss: () => s.set?.({ dialog: false }),
            onConfirm: () => s.set?.({ dialog: false, phase: "cleaning", cleaned: 0 }),
          })
        : null,
    });
  },
};

/* ------------------------------------------------------------------ details */

const pad = (x) => String(x).padStart(2, "0");
/** WhatsApp's own naming: IMG-20260924-WA0042.jpg. */
const waName = (i, day, kind) => {
  const ext = { images: "jpg", videos: "mp4", documents: "pdf", audios: "opus", voice_notes: "opus" }[kind] ?? "jpg";
  const prefix = { images: "IMG", videos: "VID", documents: "DOC", audios: "AUD", voice_notes: "PTT" }[kind] ?? "IMG";
  return `${prefix}-202609${pad(day)}-WA${String(12 + i * 7).padStart(4, "0")}.${ext}`;
};
const TABS = ["Received", "Sent", "Private"];
const SEEDS = [2, 10, 22, 7, 16, 5, 0, 13, 21, 8, 1, 12, 25, 3];
/** Files per tab: [id, seed, day of September, MB]; the first days form the date groups. */
const TAB_FILES = [
  [
    [0, 2, 25, 2.4], [1, 10, 25, 1.9], [2, 22, 25, 3.1],
    [3, 7, 24, 0.8], [4, 16, 24, 2.7], [5, 5, 24, 1.2],
    [6, 13, 22, 4.4], [7, 21, 22, 0.6],
  ],
  [
    [20, 8, 24, 1.6], [21, 1, 23, 2.2], [22, 12, 21, 0.9],
  ],
  [
    [30, 25, 20, 3.8], [31, 3, 18, 1.4],
  ],
];
const DAY_LABEL = { 25: "Today", 24: "Yesterday" };
const dayLabel = (d) => DAY_LABEL[d] ?? `Sep ${d}`;
const SUGGESTED = [6, 4, 2, 21, 30];
const TYPE_NAMES = Object.fromEntries(DIRECTORIES.map((d) => [d.type, d.name]));

/** feature/whatsappcleaner: WhatsAppDetailsScreen (smart suggestions, Received / Sent / Private tabs, file list). */
export const whatsappDetails = {
  id: "whatsapp-details",
  title: "WhatsApp Details",
  category: "review",
  categoryLabel: "File review",
  palette: "dynamic",
  description: "One WhatsApp folder: Smart Suggestions, Received, Sent and Private tabs with select-all, then trash or delete forever.",
  defaults: { type: "images", tab: 0, checked: [], removed: [], dialog: null, phase: "list", cleaned: 0, cleaning: [] },
  tick: (s, dt) => {
    if (s.phase !== "cleaning") return null;
    const cleaned = Math.min(s.cleaning.length, s.cleaned + dt * 3);
    return cleaned >= s.cleaning.length ? { cleaned, phase: "result" } : { cleaned };
  },
  controls: [
    { key: "tab", label: "Tab", type: "choice", options: [0, 1, 2] },
    {
      label: "States",
      type: "presets",
      options: [
        ["Received", { tab: 0, checked: [], dialog: null, phase: "list" }],
        ["Suggestions picked", { tab: 0, checked: SUGGESTED }],
        ["Delete dialog", { checked: SUGGESTED, dialog: "delete" }],
        ["Cleaning", { phase: "cleaning", cleaning: SUGGESTED, cleaned: 2 }],
      ],
    },
  ],
  render: (s) => {
    const go = goer(s);
    const kind = s.type;
    const all = TAB_FILES.flat()
      .filter(([id]) => !s.removed.includes(id))
      .map(([id, seed, day, mb], i) => ({ id, seed, day, bytes: mb * MB, size: fileSize(mb * MB), name: waName(id, day, kind) }));
    const byTab = TAB_FILES.map((list) => list.map(([id]) => all.find((f) => f.id === id)).filter(Boolean));
    const files = byTab[s.tab] ?? [];
    const picked = all.filter((f) => s.checked.includes(f.id));
    const bytes = picked.reduce((a, f) => a + f.bytes, 0);
    const days = [...new Set(files.map((f) => f.day))];
    const groups = new Set(picked.map((f) => f.day)).size;
    const suggested = all.filter((f) => SUGGESTED.includes(f.id));
    const cleaningUi = s.phase !== "list";
    const toggle = (id) => () => s.set?.({ checked: toggleIn(s.checked, id) });
    const thumb = (f, size) => (kind === "images" || kind === "videos" || kind === "statuses" ? photo(f.seed, { w: size, h: size, radius: size / 2 }) : undefined);

    const suggestions = suggested.length
      ? html`<div class="sc-wa-suggest">
          <div class="sc-row" style="gap:4px">${icon("auto_fix_high", { size: 24 })}<span class="t-title-medium">Smart Suggestions</span></div>
          <div class="sc-wa-suggest__row">
            ${suggested.map(
              (f) => html`<div class="sc-wa-tile">
                ${photo(f.seed, { w: 64, h: 64, radius: 12 })}
                <md-checkbox class="sc-wa-tile__check" .checked=${s.checked.includes(f.id)} touch-target="wrapper" @change=${toggle(f.id)}></md-checkbox>
              </div>`,
            )}
          </div>
          <div class="sc-row" style="justify-content:flex-end">
            <md-text-button @click=${() => s.set?.({ checked: suggested.map((f) => f.id), dialog: "delete" })}
              ><md-icon slot="icon">delete</md-icon>Delete All Suggested</md-text-button
            >
          </div>
        </div>`
      : nothing;

    const tabs = html`<md-tabs class="sc-tabs" .activeTabIndex=${s.tab}>
      ${TABS.map((label, i) => {
        const ids = (byTab[i] ?? []).map((f) => f.id);
        const on = ids.filter((id) => s.checked.includes(id)).length;
        return html`<md-primary-tab ?active=${s.tab === i} @click=${() => s.set?.({ tab: i })}>
          <span class="sc-row" style="gap:2px">
            <md-checkbox
              touch-target="wrapper"
              .checked=${ids.length > 0 && on === ids.length}
              .indeterminate=${on > 0 && on < ids.length}
              @click=${(e) => e.stopPropagation()}
              @change=${() => s.set?.({ checked: on === ids.length ? s.checked.filter((id) => !ids.includes(id)) : [...new Set([...s.checked, ...ids])] })}
            ></md-checkbox>
            ${label}
          </span>
        </md-primary-tab>`;
      })}
    </md-tabs>`;

    const list = files.length
      ? html`<div class="sc-file-list sc-viewmode">
          ${days.map((d) => {
            const ids = files.filter((f) => f.day === d).map((f) => f.id);
            const on = ids.every((id) => s.checked.includes(id));
            return html`${dateHeader(dayLabel(d), on, () => s.set?.({ checked: on ? s.checked.filter((id) => !ids.includes(id)) : [...new Set([...s.checked, ...ids])] }))}
            ${groupedList(
              files.filter((f) => f.day === d).map((f) => fileItem({ ...f, thumb: thumb(f, 40), fileIcon: "image", checked: s.checked.includes(f.id), onCheck: toggle(f.id) })),
              { cls: "sc-grouped--files" },
            )}`;
          })}
        </div>`
      : html`<div class="sc-empty-state">${icon("check_circle", { size: 64, color: "var(--md-sys-color-on-surface-variant)" })}<div class="t-body-large c-variant">You're all set! No files left in this category.</div></div>`;

    const clean = () => s.set?.({ dialog: null, phase: "cleaning", cleaning: [...s.checked], cleaned: 0 });
    const cleaningBytes = all.filter((f) => s.cleaning.includes(f.id)).reduce((a, f) => a + f.bytes, 0);
    const k = picked.length;
    return previewScreen(APP, s, {
      kind: "page",
      title: TYPE_NAMES[kind] ?? "Images",
      topBar: "large",
      actions: cleaningUi ? [] : fileListActions(),
      onBack: go("whatsapp-cleaner"),
      onAction: (a) => a === "refresh" && s.set?.({ checked: [], removed: [] }),
      content: cleaningUi
        ? cleaningScreen({
            cleaned: Math.floor(s.cleaned),
            total: s.cleaning.length,
            bytes: cleaningBytes,
            finished: s.phase === "result",
            title: "Cleaning WhatsApp",
            statsIcon: whatsappIcon(20, "var(--md-sys-color-primary)"),
            onDone: () => s.set?.({ phase: "list", removed: [...s.removed, ...s.cleaning], checked: [], cleaning: [] }),
          })
        : html`<div class="sc-wa-details">${suggestions}${tabs}<div class="sc-wa-details__list">${list}</div></div>`,
      bottom: cleaningUi
        ? null
        : selectionBar({
            files: k,
            groups,
            bytes,
            allSelected: all.length > 0 && k === all.length,
            onSelectAll: () => s.set?.({ checked: k === all.length ? [] : all.map((f) => f.id) }),
            onTrash: () => s.set?.({ dialog: "trash" }),
            onDelete: () => s.set?.({ dialog: "delete" }),
          }),
      overlay:
        s.dialog === "delete"
          ? alertDialog({
              icon: "delete_forever",
              title: "Delete Forever",
              text: `Delete ${k} ${k === 1 ? "item" : "items"}?`,
              dismiss: "Cancel",
              confirm: "Delete forever",
              onDismiss: () => s.set?.({ dialog: null }),
              onConfirm: clean,
            })
          : s.dialog === "trash"
            ? alertDialog({
                icon: "delete",
                title: "Move to Trash",
                text: "Are you sure you want to move these files to the trash?",
                dismiss: "Cancel",
                confirm: "Move",
                onDismiss: () => s.set?.({ dialog: null }),
                onConfirm: clean,
              })
            : null,
    });
  },
};
