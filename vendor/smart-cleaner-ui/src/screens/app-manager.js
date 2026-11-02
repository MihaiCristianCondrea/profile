/** Mirrors AppManagerScreen.kt (feature/appmanager). */
import { html, nothing } from "lit";
import { previewScreen } from "material-next-web-components/marketing.js";
import { APP } from "../config/identity.js";
import { button } from "../kit/components.js";
import { asset } from "../kit/assets.js";
import { icon } from "../kit/shell.js";

/**
 * The reference device's installed apps. `art` is the app's real launcher icon (marketing/assets/app-icons,
 * from each project's .idea/icon.svg); apps without one keep a Material glyph on the white icon circle.
 * `days` is days since last use (AppItem flags an app unused after 30 days).
 */
const USER_APPS = [
  { id: 0, name: "Android Studio Tutorials", mb: 41.72, art: "android-studio-tutorials", days: 3, used: "3 days ago" },
  { id: 1, name: "App Toolkit", mb: 41.2, art: "app-toolkit", days: 1, used: "Yesterday" },
  { id: 2, name: "Cart Calculator", mb: 43.76, glyph: "shopping_cart", color: "#1E88E5", days: 60, used: "2 months ago" },
  { id: 3, name: "Cleaner", mb: 71.71, art: "smart-cleaner", days: 0, used: "Today" },
  { id: 4, name: "Net Probe", mb: 40.2, art: "net-probe", days: 31, used: "1 month ago" },
  { id: 5, name: "Weddix", mb: 41.34, glyph: "event", color: "#1E88E5", days: 120, used: "4 months ago" },
];
const SYSTEM_APPS = [
  { id: 10, name: "Android System", mb: 118, glyph: "android", color: "#3DDC84", days: 0, used: "Today" },
  { id: 11, name: "Camera", mb: 212, glyph: "photo_camera", color: "#1A73E8", days: 0, used: "Today" },
  { id: 12, name: "Files", mb: 64.3, glyph: "folder", color: "#1E88E5", days: 1, used: "Yesterday" },
  { id: 13, name: "Phone", mb: 96.1, glyph: "call", color: "#34A853", days: 0, used: "Today" },
  { id: 14, name: "Settings", mb: 88.7, glyph: "settings", color: "#5F6368", days: 0, used: "Today" },
  { id: 15, name: "Wallpaper & style", mb: 31.2, glyph: "palette", color: "#EA4335", days: 7, used: "1 week ago" },
];
const TABS = ["Installed apps", "System apps", "App install files (APKs)"];
/** SortMode labels; the APK tab has no "Least used". */
const SORTS = [
  ["NAME_ASC", "Name (A to Z)"],
  ["NAME_DESC", "Name (Z to A)"],
  ["SIZE_DESC", "Size (largest first)"],
  ["LEAST_USED", "Least used"],
];
const LARGE_MB = 157.3; // 150 MiB

const sorters = {
  NAME_ASC: (a, b) => a.name.localeCompare(b.name),
  NAME_DESC: (a, b) => b.name.localeCompare(a.name),
  SIZE_DESC: (a, b) => b.mb - a.mb,
  LEAST_USED: (a, b) => b.days - a.days,
};

/** feature/appmanager: AppManagerScreen (search, tabs with count badges, Sort by chips, ManagerItemCard rows). */
export default {
  id: "app-manager",
  title: "App Manager",
  category: "tools",
  categoryLabel: "Tools",
  description: "Search, tabs with live counts, the Sort by chip row, and each app's menu: Uninstall, Share, App info.",
  palette: "android-vivid",
  defaults: { tab: 0, search: "", sort: "NAME_ASC", sortPanel: true, menu: null, share: null, uninstalled: [] },
  controls: [
    { key: "tab", label: "Tab", type: "choice", options: [0, 1, 2] },
    { key: "sort", label: "Sort", type: "choice", options: SORTS.map(([k]) => k) },
    {
      label: "States",
      type: "presets",
      options: [
        ["Installed apps", { tab: 0, search: "", menu: null, share: null }],
        ["Searching", { tab: 0, search: "Tool" }],
        ["System apps", { tab: 1 }],
        ["No APK files", { tab: 2 }],
        ["Item menu", { tab: 0, menu: 3 }],
        ["Share sheet", { tab: 0, share: 3 }],
      ],
    },
  ],
  render: (s) => {
    const q = s.search.trim().toLowerCase();
    const visible = (list) => list.filter((a) => !s.uninstalled.includes(a.id) && (!q || a.name.toLowerCase().includes(q))).sort(sorters[s.sort]);
    const lists = [visible(USER_APPS), visible(SYSTEM_APPS), []];
    const list = lists[s.tab];

    const appIcon = (a) =>
      html`<span class="sc-app-card__icon"
        >${a.art ? html`<img src=${asset(`app-icons/${a.art}.svg`)} alt="" />` : icon(a.glyph, { size: 28, color: a.color, fill: true })}</span
      >`;

    const menu = (a) => html`<div class="sc-menu" @click=${(e) => e.stopPropagation()}>
      ${[
        ["Uninstall", "delete_forever", () => s.set?.({ menu: null, uninstalled: [...s.uninstalled, a.id] })],
        ["Share", "share", () => s.set?.({ menu: null, share: a.id })],
        ["App info", "info", () => s.set?.({ menu: null })],
      ].map(([label, ic, run]) => html`<div class="sc-menu__item t-body-large" @click=${run}>${icon(ic, { size: 22 })}${label}</div>`)}
    </div>`;

    const row = (a) => html`<div class="sc-app-card">
      ${appIcon(a)}
      <div class="sc-app-card__text">
        <div class="t-title-medium w-semibold sc-ellipsis">${a.name}</div>
        <div class="sc-row sc-ellipsis"><span class="t-body-medium">${a.mb.toFixed(2)} MB</span><span class="t-body-small">&nbsp;• ${a.used}</span></div>
      </div>
      ${a.days > 30 ? html`<span class="sc-app-badge" title="Unused app">${icon("snooze", { size: 16 })}</span>` : nothing}
      ${a.mb >= LARGE_MB ? html`<span class="sc-app-badge" title="Large app">${icon("data_usage", { size: 16 })}</span>` : nothing}
      <md-icon-button @click=${() => s.set?.({ menu: s.menu === a.id ? null : a.id })}>${icon("more_vert")}</md-icon-button>
      ${s.menu === a.id ? menu(a) : nothing}
    </div>`;

    const sorts = s.tab === 2 ? SORTS.slice(0, 3) : SORTS;
    const sortRow = html`<div class="sc-sort-row">
      <span class="t-title-small w-semibold" style="margin-right:4px">Sort by</span>
      <md-chip-set
        >${sorts.map(([k, label]) => html`<md-filter-chip label=${label} .selected=${s.sort === k} @click=${(e) => (e.preventDefault(), s.set?.({ sort: k }))}></md-filter-chip>`)}</md-chip-set
      >
    </div>`;

    const empty = html`<div class="sc-empty-state">
      ${icon(s.tab === 2 ? "android" : "apps", { size: 64, color: "var(--md-sys-color-on-surface-variant)" })}
      <div class="t-body-large c-variant">${s.tab === 2 ? "No APK files found" : "No apps installed"}</div>
      ${s.tab === 2 ? button("Retry", { variant: "outlined", icon: "refresh" }) : nothing}
    </div>`;

    const shareApp = [...USER_APPS, ...SYSTEM_APPS].find((a) => a.id === s.share);
    const shareSheet = shareApp && {
      presentation: "sheet",
      label: `Share ${shareApp.name}`,
      handle: true,
      onDismiss: () => s.set?.({ share: null }),
      content: html`<div style="border-radius:16px;overflow:hidden;display:flex;flex-direction:column;gap:2px">
              ${[
                ["shop", "Share Play Store link"],
                ["android", "Share APK file"],
              ].map(
                ([ic, label]) => html`<div class="sc-row t-body-large" style="gap:16px;padding:16px;background:var(--md-sys-color-surface-container-high);cursor:pointer" @click=${() => s.set?.({ share: null })}>
                  ${icon(ic, { size: 24 })} ${label}
                </div>`,
              )}
            </div>`,
    };

    // A tab root with the tab's search field and its sort toggle beside the shell's overflow menu.
    return previewScreen(APP, s, {
      tab: "app-manager",
      search: { placeholder: "Search apps", value: s.search, onInput: (search) => s.set?.({ search }) },
      actions: [{ id: "sort", icon: "sort", label: "Sort", selected: Boolean(s.sortPanel) }],
      onAction: (id) => id === "sort" && s.set?.({ sortPanel: !s.sortPanel }),
      content: html`<div class="sc-tabbed">
        <md-tabs class="sc-tabs" .activeTabIndex=${s.tab}>
          ${TABS.map(
            (label, i) => html`<md-primary-tab ?active=${s.tab === i} @click=${() => s.set?.({ tab: i, menu: null })}>
              <span class="sc-row" style="gap:4px;min-width:0"><span class="sc-ellipsis">${label}</span><span class="sc-count">${lists[i].length}</span></span>
            </md-primary-tab>`,
          )}
        </md-tabs>
        <div class="sc-content">${s.sortPanel && list.length ? sortRow : nothing}${list.length ? html`<div class="sc-app-list" @click=${() => s.menu !== null && s.set?.({ menu: null })}>${list.map(row)}</div>` : empty}</div>
      </div>`,
      overlay: shareSheet,
    });
  },
};
