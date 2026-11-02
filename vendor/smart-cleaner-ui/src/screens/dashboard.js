/** Mirrors DashboardScreen.kt (feature/dashboard). */
import { html, nothing } from "lit";
import { scrollArea, actionCard, fileThumb, goer, moreThumb, quickScanCard, sectionHeader, setter, squareCard, toggleIn, whatsappIcon } from "../kit/components.js";
import { previewScreen } from "material-next-web-components/marketing.js";
import { APP } from "../config/identity.js";
import { icon } from "../kit/shell.js";
import { streakSheet } from "./streak-sheet.js";
import { photo } from "../motion/photo.js";

/** DashboardQuickScanMessageProvider: severity bands and their messages (two per band, eight tips). */
const MESSAGES = {
  critical: ["Only %d%% free. Clean up now before apps start failing.", "Storage is nearly full, only %d%% left. Time for a clean."],
  low: ["Running low: %d%% free. A clean would help.", "%d%% free left. Worth clearing some space."],
  tight: ["%d%% free. A sweep now keeps it comfortable.", "%d%% free. Still fine, but a scan would not hurt."],
  healthy: [
    "Looking good! Want to scan again for extra space?",
    "All clear, but there's always room for more.",
    "Feeling fresh? Let's double-check.",
    "You might squeeze out a bit more space.",
    "Still room to optimize. Want to scan again?",
    "Great job! Ready for a second sweep?",
    "Cleaner thinks there's still more to do!",
    "Every bit counts. Let's scan again.",
  ],
};
/** FastOutSlowInEasing (cubic-bezier 0.4, 0, 0.2, 1), the default tween easing in Compose. */
const fastOutSlowIn = (x) => {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const m = (lo + hi) / 2;
    const bx = 3 * (1 - m) ** 2 * m * 0.4 + 3 * (1 - m) * m ** 2 * 0.2 + m ** 3;
    if (bx < x) lo = m;
    else hi = m;
  }
  const m = (lo + hi) / 2;
  return 3 * (1 - m) * m ** 2 + m ** 3;
};

export const severityFor = (free) => (free <= 10 ? "critical" : free <= 20 ? "low" : free <= 35 ? "tight" : "healthy");
const message = (free, variant) => {
  const list = MESSAGES[severityFor(free)];
  return list[variant % list.length].replace("%d%%", `${free}%`);
};

/** feature/dashboard: DashboardScreen → DashboardItemList (12 dp grid gap and padding). */
export default {
  id: "dashboard",
  title: "Dashboard",
  category: "home",
  categoryLabel: "Home",
  palette: "android-vivid",
  description: "Home screen: weekly Quick Scan summary, pinned shortcuts and recommended cleanups.",
  // foldersCleaned / clipboardCleared / largeFilesCleaned / duplicatesCleaned: nothing left for that card, so the
  // Dashboard hides it (DashboardInputs: showEmptyFoldersCard, showClipboardCard, showLargeFilesCard and
  // hasDuplicateGroups need something to act on).
  defaults: { scroll: 0, t: 0, intro: 1, free: 20, cleaned: "245.96 KB", message: 1, collapsed: [], foldersCleaned: false, clipboardCleared: false, largeFilesCleaned: false, duplicatesCleaned: false },
  scrollMax: 1250,
  /**
   * The Quick Scan card's liquid gradient never stops moving (three infinite transitions), and on
   * arrival Free and Used count up from 0 over 1000 ms (animateIntAsState in QuickScanSummaryCard).
   */
  tick: (s, dt) => ({ t: s.t + dt, ...(s.intro < 1 ? { intro: Math.min(1, s.intro + dt) } : {}) }),
  controls: [
    { key: "free", label: "Free storage", type: "range", min: 1, max: 99, unit: "%" },
    {
      label: "Storage presets",
      type: "presets",
      options: [
        ["Critical", { free: 8 }],
        ["Low", { free: 20 }],
        ["Tight", { free: 30 }],
        ["Healthy", { free: 62 }],
        ["Replay intro", { intro: 0 }],
      ],
    },
    { key: "message", label: "Message variant", type: "range", min: 0, max: 7 },
    { key: "cleaned", label: "Cleaned this week", type: "choice", options: ["245.96 KB", "1.24 GB", "3.8 GB", "0 B"] },
    { key: "scroll", label: "Scroll", type: "range", min: 0, max: 1250, unit: "dp" },
  ],
  render: (s) => {
    const set = setter(s);
    const go = goer(s);
    const used = s.used ?? Math.max(0, 100 - s.free); // free and used come from the same StatFs reading
    const severity = severityFor(s.free);
    const open = (id) => !s.collapsed.includes(id);
    const toggle = (id) => set((st) => ({ collapsed: toggleIn(st.collapsed, id) }));
    // A tab root: the shell names the app ("Cleaner"), draws the menu, overflow, navigation and drawer.
    return previewScreen(APP, s, {
      tab: "dashboard",
      topBar: "center",
      overlay: s.showStreak ? streakSheet(s) : null,
      content: scrollArea(s, html`<div class="sc-pad" style="transform:translateY(${-s.scroll}px)">
        ${quickScanCard({
          cleaned: s.cleaned,
          free: Math.round(s.free * fastOutSlowIn(s.intro ?? 1)),
          used: Math.round(used * fastOutSlowIn(s.intro ?? 1)),
          progress: (used / 100) * fastOutSlowIn(s.intro ?? 1),
          t: s.t,
          warning: severity === "critical" || severity === "low",
          message: message(s.free, s.message),
          onScan: go("quick-clean", { phase: "scanning", progress: 0, running: true }),
        })}
        ${!s.foldersCleaned || !s.clipboardCleared
          ? sectionHeader("Pinned", "Your shortcuts, in the order you pinned them", open("pinned"), toggle("pinned"))
          : nothing}
        ${open("pinned")
          ? html`${s.foldersCleaned
              ? nothing
              : actionCard({
                  icon: "folder",
                  title: "Empty Folders",
                  subtitle: "Remove unused folders instantly.",
                  pinned: true,
                  content: html`<div class="t-body-medium" style="padding-top:20px">1 empty folder found</div>`,
                  badge: { text: "Quick clean", tone: "safe" },
                  action: "Delete Empty Folders",
                  actionIcon: "delete_sweep",
                  onAction: set({ foldersCleaned: true }),
                })}
            ${s.clipboardCleared
              ? nothing
              : actionCard({
                  icon: "content_paste",
                  title: "Clipboard Content",
                  subtitle: "Your clipboard may still hold private info.",
                  pinned: true,
                  content: html`<div class="t-body-medium" style="padding-top:20px">Current clipboard: This is my ****</div>`,
                  badge: { text: "Privacy risk", tone: "warning" },
                  action: "Clear Clipboard",
                  actionIcon: "content_paste_off",
                  onAction: set({ clipboardCleared: true }),
                })}`
          : nothing}
        ${sectionHeader("Recommended", "Based on your usage and cleanup opportunities", open("recommended"), toggle("recommended"))}
        ${open("recommended")
          ? html`${s.largeFilesCleaned
              ? nothing
              : actionCard({
                  icon: "data_usage",
                  title: "Large Files",
                  subtitle: "Review and remove your biggest files.",
                  pinned: true,
                  content: html`<div class="sc-row" style="gap:8px">
                    ${["VID_20260806_184512.mp4", "Offline_maps_Lisbon.zip", "Podcast_ep142_lossless.flac", "Screen_Recording_20260805.mp4"].map((n) => fileThumb(n))} ${moreThumb("+1 more")}
                  </div>`,
                  badge: { text: "High space impact", tone: "info" },
                  action: "View Large Files",
                  actionIcon: "data_usage",
                  onAction: go("large-files"),
                })}
            ${s.duplicatesCleaned
              ? nothing
              : actionCard({
                  icon: "content_copy",
                  title: "Duplicate Files",
                  subtitle: "Find and remove duplicate files.",
                  pinned: true,
                  content: html`<div class="sc-row" style="gap:8px">${["IMG_20260806_142210.jpg", "Invoice_July_2026.pdf"].map((n) => fileThumb(n))} ${moreThumb("+3 more")}</div>`,
                  badge: { text: "Needs review", tone: "warning" },
                  action: "View Duplicates",
                  actionIcon: "data_usage",
                  onAction: go("duplicates"),
                })}
            ${actionCard({
              icon: "photo_library",
              title: "Gallery Swipe Cleaner",
              subtitle: "29 items",
              pinned: true,
              content: html`<div class="sc-row" style="gap:8px">
                ${[10, 2, 7, 16].map((seed) => photo(seed, { w: 56, h: 56, radius: 14 }))} ${moreThumb("+25 items")}
              </div>`,
              action: "Start reviewing",
              actionIcon: "data_usage",
              onAction: go("gallery-cleaner"),
            })}
            ${actionCard({
              icon: html`<span style="color:var(--md-sys-color-primary)">${whatsappIcon(28)}</span>`,
              title: "WhatsApp Cleaner",
              subtitle: "1,524 media files",
              pinned: true,
              content: html`<div class="sc-row" style="gap:8px;padding-top:8px;overflow:hidden">
                  ${[2, 22, 10, 7].map((seed) => photo(seed, { w: 64, h: 64, radius: 14 }))} ${moreThumb("1,520 items")}
                </div>
                ${[
                  ["videocam", "Videos", "96 media files"],
                  ["music_note", "Audios", "38 media files"],
                  ["description", "Documents", "54 media files"],
                ].map(
                  ([ic, label, count]) => html`<div class="sc-row" style="padding-top:8px">
                    ${icon(ic, { color: "var(--md-sys-color-primary)" })}<span class="t-title-small sc-grow" style="padding-left:12px">${label}</span
                    ><span class="t-body-small c-variant">${count}</span>
                  </div>`,
                )}`,
              action: "Open WhatsApp Cleaner",
              actionIcon: "folder_open",
              onAction: go("whatsapp-cleaner"),
            })}`
          : nothing}
        ${sectionHeader("System Health", "Core cleanup checks for your device state", open("health"), toggle("health"))}
        ${open("health")
          ? html`<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              ${squareCard({
                icon: "storage",
                title: "System Storage Manager",
                severity: { text: "Low risk", tone: "safe" },
                description: "Manage space using the built-in tools.",
              })}
              ${squareCard({
                icon: "storage",
                title: "App cache cleaner",
                severity: { text: "Medium risk", tone: "info" },
                description: "Temporary app cache and thumbnails are ready for cleanup.",
              })}
            </div>`
          : nothing}
      </div>`, { max: 1250 }),
    });
  },
};
