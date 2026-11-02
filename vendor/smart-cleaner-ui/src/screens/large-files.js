/** Mirrors LargeFilesScreen.kt (feature/largefiles). */
import { html, nothing } from "lit";
import {
  CLEANING_TIPS,
  MB,
  alertDialog,
  cleaningScreen,
  dateHeader,
  fileCard,
  fileItem,
  fileSize,
  goer,
  groupedList,
  selectionBar,
  setter,
  sortSheet,
  toggleIn,
  fileListActions,
  scrollArea,
} from "../kit/components.js";
import { previewScreen } from "material-next-web-components/marketing.js";
import { APP } from "../config/identity.js";
import { icon } from "../kit/shell.js";

/** The reference device's Download folder. `mb` in SI megabytes like Android's formatter. */
const FILES = [
  { id: 0, name: "VID_20260806_184512.mp4", mb: 1073.7, date: "Aug 06, 2026", day: "Thu, Aug 6", dir: "DCIM/Camera", type: "MP4 Video", fileIcon: "video_file" },
  { id: 1, name: "Offline_maps_Lisbon.zip", mb: 312.4, date: "Aug 06, 2026", day: "Thu, Aug 6", dir: "Download", type: "ZIP Archive", fileIcon: "folder_zip" },
  { id: 2, name: "Podcast_ep142_lossless.flac", mb: 248.1, date: "Aug 05, 2026", day: "Wed, Aug 5", dir: "Music", type: "FLAC Audio", fileIcon: "audio_file" },
  { id: 3, name: "Screen_Recording_20260805.mp4", mb: 186.3, date: "Aug 05, 2026", day: "Wed, Aug 5", dir: "Movies", type: "MP4 Video", fileIcon: "video_file" },
  { id: 4, name: "Phone_backup_2026-08.tar", mb: 131.6, date: "Aug 05, 2026", day: "Wed, Aug 5", dir: "Download", type: "TAR Archive", fileIcon: "archive" },
].map((f) => ({ ...f, bytes: f.mb * MB, size: fileSize(f.mb * MB), path: `/storage/emulated/0/${f.dir}/${f.name}` }));

/** Motion part: one Large Files row (ExpandableFileListItem) on its own. `id` is 0..4, biggest first. */
export const largeFileRow = (id, { checked = false, expanded = false } = {}) => {
  const f = FILES.find((x) => x.id === id);
  return fileItem({ ...f, checked, expanded, details: [["Modified", f.date], ["Type", f.type], ["Path", f.path, true]] });
};
/** Motion part: one Large Files grid card (FileCard): file icon, size tab and checkbox. `id` is 0..4. */
export const largeFileCard = (id, { checked = false } = {}) => fileCard({ ...FILES.find((x) => x.id === id), checked });
export const LARGE_FILES = FILES.map(({ id, name, size, bytes }) => ({ id, name, size, bytes }));

const DEFAULTS = {
  expanded: 0,
  checked: [],
  removed: [],
  scroll: 0,
  grid: false,
  sort: "size",
  descending: true,
  sheet: null, // null | { sort, descending } while the sort sheet is open
  dialog: null, // null | "selectAll" | "trash" | "delete"
  phase: "list", // list | cleaning | result
  cleaned: 0,
  cleaning: [],
};

/** feature/largefiles: LargeFilesScreen (CleanerTopBarWithGridToggle, ordered or by-date sections, CleanerSelectionActionBar). */
export default {
  id: "large-files",
  title: "Large Files",
  category: "review",
  categoryLabel: "File review",
  palette: "dynamic",
  description: "Biggest files first. Check, expand, switch to grid, sort (by date groups the list), then move to trash or delete forever.",
  defaults: DEFAULTS,
  scrollMax: 360,
  /** Cleanup counts files off at the engine's pace, then holds on "All clean" until Done. */
  tick: (s, dt) => {
    if (s.phase !== "cleaning") return null;
    const cleaned = Math.min(s.cleaning.length, s.cleaned + dt * 2.5);
    return cleaned >= s.cleaning.length ? { cleaned, phase: "result" } : { cleaned };
  },
  controls: [
    { key: "scroll", label: "Scroll", type: "range", min: 0, max: 360, unit: "dp" },
    {
      label: "States",
      type: "presets",
      options: [
        ["List", { ...DEFAULTS }],
        ["Two checked", { checked: [0, 1], expanded: -1 }],
        ["Grid", { grid: true, checked: [0, 1] }],
        ["By date", { sort: "date", expanded: -1 }],
        ["Sort sheet", { sheet: { sort: "size", descending: true } }],
        ["Delete dialog", { checked: [0, 1], dialog: "delete" }],
        ["Cleaning", { phase: "cleaning", cleaning: [0, 1], cleaned: 1 }],
        ["Nothing left", { removed: [0, 1, 2, 3, 4] }],
      ],
    },
  ],
  render: (s) => {
    const set = setter(s);
    const go = goer(s);
    const dir = s.descending ? -1 : 1;
    const files = FILES.filter((f) => !s.removed.includes(f.id)).sort((a, b) =>
      s.sort === "name" ? -dir * a.name.localeCompare(b.name) : s.sort === "date" ? dir * (a.id - b.id) * -1 : dir * (a.mb - b.mb),
    );
    const picked = files.filter((f) => s.checked.includes(f.id));
    const bytes = picked.reduce((a, f) => a + f.bytes, 0);
    const days = [...new Set(files.map((f) => f.day))];
    const groups = new Set(picked.map((f) => f.day)).size;
    const allSelected = files.length > 0 && picked.length === files.length;
    const cleaningUi = s.phase !== "list";
    const collapse = Math.min(1, s.scroll / 92);

    const clean = () => s.set?.({ dialog: null, phase: "cleaning", cleaning: [...s.checked], cleaned: 0 });
    const selectAll = () => (allSelected ? s.set?.({ checked: [] }) : s.set?.({ dialog: "selectAll" }));

    const item = (f) =>
      fileItem({
        ...f,
        expanded: s.expanded === f.id,
        checked: s.checked.includes(f.id),
        onCheck: set((st) => ({ checked: toggleIn(st.checked, f.id) })),
        onExpand: set((st) => ({ expanded: st.expanded === f.id ? -1 : f.id })),
        details: [
          ["Modified", f.date],
          ["Type", f.type],
          ["Path", f.path, true],
        ],
      });
    const card = (f) => fileCard({ ...f, checked: s.checked.includes(f.id), onCheck: set((st) => ({ checked: toggleIn(st.checked, f.id) })) });
    const dayHeader = (d) => {
      const ids = files.filter((f) => f.day === d).map((f) => f.id);
      const on = ids.every((id) => s.checked.includes(id));
      return dateHeader(d, on, set((st) => ({ checked: on ? st.checked.filter((id) => !ids.includes(id)) : [...new Set([...st.checked, ...ids])] })));
    };

    // Only sorting by date groups the files under date headers (shouldGroupLargeFilesByDate).
    const byDate = s.sort === "date";
    const list = s.grid
      ? html`<div class="sc-file-cards sc-viewmode">${byDate ? days.map((d) => html`${dayHeader(d)}${files.filter((f) => f.day === d).map(card)}`) : files.map(card)}</div>`
      : byDate
        ? html`<div class="sc-file-list sc-viewmode">${days.map((d) => html`${dayHeader(d)}${groupedList(files.filter((f) => f.day === d).map(item), { cls: "sc-grouped--files" })}`)}</div>`
        : html`<div class="sc-file-list sc-viewmode">${groupedList(files.map(item), { cls: "sc-grouped--files" })}</div>`;

    const empty = html`<div class="sc-empty-state">
      ${icon("folder", { size: 64, color: "var(--md-sys-color-on-surface-variant)" })}
      <div class="t-body-large c-variant">No large files found</div>
    </div>`;

    const cleaningBytes = FILES.filter((f) => s.cleaning.includes(f.id)).reduce((a, f) => a + f.bytes, 0);
    const dialogs = {
      selectAll: () =>
        alertDialog({
          icon: "warning",
          title: "Select All Files?",
          text: `This will select ${files.length} ${files.length === 1 ? "file" : "files"} (${fileSize(files.reduce((a, f) => a + f.bytes, 0))}).`,
          dismiss: "Cancel",
          confirm: "Select All",
          onDismiss: () => s.set?.({ dialog: null }),
          onConfirm: () => s.set?.({ dialog: null, checked: files.map((f) => f.id) }),
        }),
      trash: () =>
        alertDialog({
          icon: "delete",
          title: "Move to Trash",
          text: `You are about to move ${picked.length} ${picked.length === 1 ? "file" : "files"} (${fileSize(bytes)}) to the trash.`,
          dismiss: "Cancel",
          confirm: "Move to trash",
          onDismiss: () => s.set?.({ dialog: null }),
          onConfirm: clean,
        }),
      delete: () =>
        alertDialog({
          icon: "delete_forever",
          title: "Delete Forever",
          text: `You are about to permanently delete ${picked.length} ${picked.length === 1 ? "file" : "files"} (${fileSize(bytes)}).`,
          dismiss: "Cancel",
          confirm: "Delete forever",
          onDismiss: () => s.set?.({ dialog: null }),
          onConfirm: clean,
        }),
    };

    const showTools = files.length > 0 && !cleaningUi;
    return previewScreen(APP, s, {
      kind: "page",
      title: "Large Files",
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
            title: "Cleaning large files",
            status: "Removing large files…",
            tip: CLEANING_TIPS.largeFiles,
            // FinishAnimationCompleted, then the screen closes back to the dashboard.
            onDone: go("dashboard"),
          })
        : files.length
          ? scrollArea(s, html`<div style="transform:translateY(${-Math.max(0, s.scroll - 92)}px)">${list}</div>`, { max: 360 })
          : empty,
      bottom: showTools
        ? selectionBar({
            files: picked.length,
            groups,
            bytes,
            allSelected,
            onSelectAll: selectAll,
            onTrash: () => s.set?.({ dialog: "trash" }),
            onDelete: () => s.set?.({ dialog: "delete" }),
          })
        : null,
      overlay: s.sheet
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
