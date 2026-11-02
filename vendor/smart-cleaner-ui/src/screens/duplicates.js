/** Mirrors DuplicatesScreen.kt (feature/duplicates). */
import { html, nothing } from "lit";
import {
  CLEANING_TIPS,
  alertDialog,
  button,
  cleaningScreen,
  dateHeader,
  fileCard,
  fileItem,
  fileListActions,
  fileSize,
  goer,
  groupedList,
  scrollArea,
  selectionBar,
  setter,
  sortSheet,
  toggleIn,
} from "../kit/components.js";
import { previewScreen } from "material-next-web-components/marketing.js";
import { APP } from "../config/identity.js";
import { icon } from "../kit/shell.js";
import { photo } from "../motion/photo.js";

const pdfThumb = html`<span class="sc-text-thumb">PDF</span>`;
const shot = html`${photo(21, { w: 40, h: 40, radius: 20 })}`;

/** DuplicateKeepStrategy entries: label, card description, sheet description (strategy_* strings). */
const STRATEGIES = [
  ["Highest resolution", "Keeps the sharpest and clearest copies of your files.", "Keep the sharpest image, then the newest file."],
  ["Newest", "Keep the most recently modified file."],
  ["Oldest", "Keep the oldest file."],
  ["Shortest path", "Keep the file with the shortest folder path."],
  ["Preferred folder", "Keep files stored in your preferred folders."],
  ["Automatic", "Let Smart Cleaner decide which file is best to keep."],
];

/** Two groups of identical files from the reference device. `t` orders modification time; Documents is the preferred folder. */
const GROUPS = [
  {
    day: "Today",
    files: [
      { id: 0, name: "Invoice_July_2026.pdf", bytes: 184300, t: 1012, path: "/Download/Invoice_July_2026.pdf", thumb: pdfThumb },
      { id: 1, name: "Invoice_July_2026 (1).pdf", bytes: 184300, t: 1014, path: "/Documents/Invoice_July_2026 (1).pdf", thumb: pdfThumb },
    ],
  },
  {
    day: "Thu, Aug 6",
    files: [
      { id: 2, name: "IMG_20260806_142210 (1).jpg", bytes: 4.2e6, t: 1428, path: "/Download/IMG_20260806_142210 (1).jpg", thumb: shot },
      { id: 3, name: "IMG_20260806_142210 (2).jpg", bytes: 4.2e6, t: 1425, path: "/Pictures/IMG_20260806_142210 (2).jpg", thumb: shot },
      { id: 4, name: "IMG_20260806_142210.jpg", bytes: 4.2e6, t: 1430, path: "/DCIM/Camera/IMG_20260806_142210.jpg", thumb: shot },
    ],
  },
].map((g) => ({ ...g, files: g.files.map((f) => ({ ...f, size: fileSize(f.bytes) })) }));
const ALL = GROUPS.flatMap((g) => g.files);

/** DuplicatesSmartSelection: the one copy per group the strategy keeps (no resolution on these files, so ties fall to newest). */
const newest = (fs) => fs.reduce((a, b) => (b.t > a.t ? b : a));
const KEEP = [
  newest,
  newest,
  (fs) => fs.reduce((a, b) => (b.t < a.t ? b : a)),
  (fs) => fs.reduce((a, b) => (b.path.length < a.path.length ? b : a)),
  (fs) => fs.find((f) => f.path.startsWith("/Documents/")) ?? newest(fs),
  newest,
];
const originalsFor = (strategy) => GROUPS.map((g) => KEEP[strategy](g.files).id);
const duplicatesFor = (strategy) => ALL.filter((f) => !originalsFor(strategy).includes(f.id)).map((f) => f.id);

/**
 * Motion part: one file of a duplicate group as its grid FileCard, with the "Original" tab the
 * keep strategy gives it (and its checkbox locked), or its preselected checkbox. `id` is 0..4.
 * `original`, `checked` and `showSize` override the strategy's result, to stage the moment before
 * the strategy is applied or a tab leaving its card.
 */
export const duplicateCard = (id, { checked, strategy = 0, original, showSize = true } = {}) => {
  const f = ALL.find((x) => x.id === id);
  const isOriginal = original ?? originalsFor(strategy).includes(id);
  return fileCard({
    ...f,
    size: showSize ? f.size : "",
    preview: f.thumb,
    original: isOriginal,
    checked: checked ?? (!isOriginal && duplicatesFor(strategy).includes(id)),
  });
};

/**
 * Motion part: one file of a duplicate group as its list row (ExpandableFileListItem), with the
 * "Original" label the keep strategy gives it or its preselected checkbox. `seed` replaces the
 * thumbnail's photo; `showSize: false` leaves the size line empty (the size leaving its row).
 */
export const duplicateRow = (id, { checked, strategy = 0, original, seed, showSize = true } = {}) => {
  const f = ALL.find((x) => x.id === id);
  const isOriginal = original ?? originalsFor(strategy).includes(id);
  const thumb = seed === undefined ? f.thumb : html`${photo(seed, { w: 40, h: 40, radius: 20 })}`;
  return fileItem({
    ...f,
    size: showSize ? f.size : "",
    thumb,
    original: isOriginal,
    checked: checked ?? (!isOriginal && duplicatesFor(strategy).includes(id)),
  });
};

const DEFAULTS = {
  strategy: 0,
  applied: false,
  checked: duplicatesFor(0),
  scroll: 0,
  grid: false,
  sort: "date",
  descending: true,
  sheet: null, // null | "strategy" | { sort, descending }
  draft: 0,
  dialog: null, // null | "selectAll" | "trash" | "delete"
  phase: "list", // list | cleaning | result
  cleaned: 0,
  cleaning: [],
};

/** feature/duplicates: DuplicatesScreen with DuplicateRecommendationCard and DuplicateStrategyBottomSheet. */
export default {
  id: "duplicates",
  title: "Duplicates",
  category: "review",
  categoryLabel: "File review",
  palette: "dynamic",
  description: "Identical files grouped by date. The keep strategy marks one Original per group and preselects the other copies.",
  defaults: DEFAULTS,
  scrollMax: 300,
  tick: (s, dt) => {
    if (s.phase !== "cleaning") return null;
    const cleaned = Math.min(s.cleaning.length, s.cleaned + dt * 2.5);
    return cleaned >= s.cleaning.length ? { cleaned, phase: "result" } : { cleaned };
  },
  controls: [
    { key: "strategy", label: "Strategy", type: "range", min: 0, max: 5, patch: (v) => ({ checked: duplicatesFor(v), applied: true }) },
    {
      label: "States",
      type: "presets",
      options: [
        ["Recommended", { ...DEFAULTS }],
        ["Strategy sheet", { sheet: "strategy", draft: 0 }],
        ["Newest applied", { strategy: 1, applied: true, checked: duplicatesFor(1) }],
        ["Grid", { grid: true }],
        ["Delete dialog", { dialog: "delete" }],
        ["Cleaning", { phase: "cleaning", cleaning: duplicatesFor(0), cleaned: 1 }],
      ],
    },
  ],
  render: (s) => {
    const set = setter(s);
    const go = goer(s);
    const originals = originalsFor(s.strategy);
    const picked = ALL.filter((f) => s.checked.includes(f.id));
    const bytes = picked.reduce((a, f) => a + f.bytes, 0);
    const groups = GROUPS.filter((g) => g.files.some((f) => s.checked.includes(f.id))).length;
    const dupes = ALL.filter((f) => !originals.includes(f.id));
    const allSelected = dupes.every((f) => s.checked.includes(f.id));
    const cleaningUi = s.phase !== "list";
    const [label, cardDesc] = STRATEGIES[s.strategy];
    const collapse = Math.min(1, s.scroll / 92);
    const clean = () => s.set?.({ dialog: null, phase: "cleaning", cleaning: [...s.checked], cleaned: 0 });
    const apply = (strategy) => s.set?.({ strategy, applied: true, checked: duplicatesFor(strategy), sheet: null });

    const reco = html`<div class="sc-dup-reco">
      <span class="sc-dup-reco__icon ${s.applied ? "sc-dup-reco__icon--applied" : ""}">${icon(s.applied ? "check" : "auto_awesome", { size: 20 })}</span>
      <div class="sc-grow">
        <div class="t-title-medium w-bold">${s.applied ? "Selection applied" : `Recommended: ${label}`}</div>
        <div class="t-body-medium c-variant" style="margin-top:4px">${s.applied ? `${label} files will be kept.` : cardDesc}</div>
        ${s.applied
          ? nothing
          : html`<div class="sc-row" style="justify-content:flex-end;margin-top:16px">
              ${button("Change", { onClick: () => s.set?.({ sheet: "strategy", draft: s.strategy }) })}
            </div>`}
      </div>
    </div>`;

    const row = (f) =>
      fileItem({
        ...f,
        original: originals.includes(f.id),
        checked: s.checked.includes(f.id),
        onCheck: set((st) => ({ checked: toggleIn(st.checked, f.id) })),
      });
    const card = (f) => fileCard({ ...f, preview: f.thumb, original: originals.includes(f.id), checked: s.checked.includes(f.id), onCheck: set((st) => ({ checked: toggleIn(st.checked, f.id) })) });
    const header = (g) => {
      const ids = g.files.filter((f) => !originals.includes(f.id)).map((f) => f.id);
      const on = ids.every((id) => s.checked.includes(id));
      return dateHeader(g.day, on, set((st) => ({ checked: on ? st.checked.filter((id) => !ids.includes(id)) : [...new Set([...st.checked, ...ids])] })));
    };
    const ordered = s.descending ? GROUPS : [...GROUPS].reverse();
    const list = s.grid
      ? html`<div class="sc-file-cards sc-viewmode">${ordered.map((g) => html`${header(g)}${g.files.map(card)}`)}</div>`
      : html`<div class="sc-file-list sc-viewmode">${ordered.map((g) => html`${header(g)}${groupedList(g.files.map(row), { cls: "sc-grouped--files" })}`)}</div>`;

    const cleaningBytes = ALL.filter((f) => s.cleaning.includes(f.id)).reduce((a, f) => a + f.bytes, 0);
    const n = (k) => `${k} ${k === 1 ? "file" : "files"}`;
    const dialogs = {
      selectAll: () =>
        alertDialog({
          icon: "warning",
          title: "Select all duplicates?",
          text: `This will select ${dupes.length} duplicate ${dupes.length === 1 ? "file" : "files"} (${fileSize(dupes.reduce((a, f) => a + f.bytes, 0))}).\n\nOriginal files will be kept.`,
          dismiss: "Cancel",
          confirm: "Select All",
          onDismiss: () => s.set?.({ dialog: null }),
          onConfirm: () => s.set?.({ dialog: null, checked: dupes.map((f) => f.id) }),
        }),
      trash: () =>
        alertDialog({
          icon: "delete",
          title: "Move to Trash",
          text: `You are about to move ${n(picked.length)} (${fileSize(bytes)}) to the trash.`,
          dismiss: "Cancel",
          confirm: "Move to trash",
          onDismiss: () => s.set?.({ dialog: null }),
          onConfirm: clean,
        }),
      delete: () =>
        alertDialog({
          icon: "delete_forever",
          title: "Delete selected duplicates?",
          text: `You are about to permanently delete ${n(picked.length)} (${fileSize(bytes)}).`,
          dismiss: "Cancel",
          confirm: "Delete forever",
          onDismiss: () => s.set?.({ dialog: null }),
          onConfirm: clean,
        }),
    };
    const strategySheet = () => ({
      presentation: "sheet",
      label: "Change selection strategy",
      handle: true,
      flush: true,
      onDismiss: () => s.set?.({ sheet: null }),
      content: html`<div style="padding-bottom:16px">
        <div class="t-title-large w-bold" style="padding:0 16px">Change selection strategy</div>
        <div style="padding-top:8px">
          ${STRATEGIES.map(
            ([name, desc, long], i) => html`<div class="sc-row" style="gap:16px;padding:12px 16px;cursor:pointer" @click=${() => s.set?.({ draft: i })}>
              <md-radio .checked=${s.draft === i}></md-radio>
              <div>
                <div class="t-body-large ${s.draft === i ? "w-bold" : ""}">${i === 0 ? `${name} (Recommended)` : name}</div>
                <div class="t-body-small c-variant">${long ?? desc}</div>
              </div>
            </div>`,
          )}
        </div>
        <div class="sc-row" style="justify-content:flex-end;gap:8px;padding:16px 16px 0">
          ${button("Cancel", { variant: "outlined", onClick: () => s.set?.({ sheet: null }) })} ${button("Apply", { onClick: () => apply(s.draft) })}
        </div>
      </div>`,
    });

    const showTools = !cleaningUi;
    // A page: Back, a large title collapsing as the list scrolls, the selection bar under the content.
    return previewScreen(APP, s, {
      kind: "page",
      title: "Duplicates",
      topBar: "large",
      collapse,
      actions: fileListActions({ grid: s.grid, tools: showTools }),
      onBack: go("dashboard"),
      onAction: (a) =>
          a === "sort"
            ? s.set?.({ sheet: { sort: s.sort, descending: s.descending } })
            : a === "refresh"
              ? !cleaningUi && s.set?.({ ...DEFAULTS })
              : s.set?.({ grid: !s.grid }),
      content: cleaningUi
        ? cleaningScreen({
            cleaned: Math.floor(s.cleaned),
            total: s.cleaning.length,
            bytes: cleaningBytes,
            finished: s.phase === "result",
            art: "il_blebble_duplicates",
            tip: CLEANING_TIPS.duplicates,
            onDone: go("dashboard"),
          })
        : scrollArea(s, html`<div style="transform:translateY(${-Math.max(0, s.scroll - 92)}px)"><div style="padding:0 16px">${reco}</div>${list}</div>`, { max: 300 }),
      bottom: showTools
        ? selectionBar({
            files: picked.length,
            groups,
            bytes,
            allSelected,
            onSelectAll: () => (allSelected ? s.set?.({ checked: [] }) : s.set?.({ dialog: "selectAll" })),
            onTrash: () => s.set?.({ dialog: "trash" }),
            onDelete: () => s.set?.({ dialog: "delete" }),
          })
        : null,
      overlay:
        s.sheet === "strategy"
          ? strategySheet()
          : s.sheet
            ? sortSheet({
                type: s.sheet.sort,
                descending: s.sheet.descending,
                onPick: (k) => s.set?.({ sheet: { ...s.sheet, sort: k } }),
                onDescending: () => s.set?.({ sheet: { ...s.sheet, descending: !s.sheet.descending } }),
                onApply: () => s.set?.({ sort: s.sheet.sort, descending: s.sheet.descending, sheet: null }),
                onDismiss: () => s.set?.({ sheet: null }),
              })
            : s.dialog
              ? dialogs[s.dialog]()
              : null,
    });
  },
};
