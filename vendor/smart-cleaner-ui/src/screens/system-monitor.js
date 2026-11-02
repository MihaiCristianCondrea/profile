/** Mirrors SystemMonitorScreen.kt and SystemMonitorTabContent.kt (feature/systemmonitor). */
import { html } from "lit";
import { previewScreen } from "material-next-web-components/marketing.js";
import { APP } from "../config/identity.js";
import { button, card, goer, scrollArea, sectionHeader, setter } from "../kit/components.js";
import { icon } from "../kit/shell.js";

const head = (title, subtitle) => html`<div class="sc-sm-head">
  <div class="t-title-medium w-semibold">${title}</div>
  <div class="t-body-small c-variant">${subtitle}</div>
</div>`;

/** Horizontal pager: current card, peeking next card, and page dots. */
/**
 * App Toolkit CustomCarousel as MonitorSectionCards uses it: a HorizontalPager with 24dp side
 * padding (SectionCarouselSidePadding), so the neighbours peek on both sides, no wrap-around, and
 * a dots indicator. Pages slide (tick eases `<key>Pos` to the page) and follow the finger.
 */
const PAGE = 382 + 8; // page width (430 - 2 x 24) + page spacing
const PAGERS = ["batteryPage", "devicePage", "netPage", "storagePage"];
const pager = (s, key, cards) => {
  const page = Math.min(cards.length - 1, s[key] ?? 0);
  const drag = s.swipe?.key === key ? s.swipe.dx : 0;
  const pos = (s[`${key}Pos`] ?? page) - drag / PAGE;
  const go = (i, from = pos) => s.set?.({ [key]: Math.max(0, Math.min(cards.length - 1, i)), [`${key}Pos`]: from, swipe: null });
  const handlers = {
    down: (e) => (e.currentTarget.setPointerCapture?.(e.pointerId), s.set?.({ swipe: { key, x0: e.clientX, dx: 0 } })),
    move: (e) => s.swipe?.key === key && s.set?.({ swipe: { ...s.swipe, dx: e.clientX - s.swipe.x0 } }),
    up: () => s.swipe?.key === key && go(drag < -48 ? page + 1 : drag > 48 ? page - 1 : page),
  };
  return html`
    <div class="sc-sm-pager" @pointerdown=${handlers.down} @pointermove=${handlers.move} @pointerup=${handlers.up} @pointercancel=${handlers.up}>
      <div class="sc-sm-track" style="transform:translateX(${-pos * PAGE}px)">${cards.map((c) => html`<div class="sc-sm-card">${c}</div>`)}</div>
    </div>
    <div class="sc-dots">${cards.map((_, i) => html`<i class=${i === page ? "on" : ""} @click=${() => go(i)}></i>`)}</div>
  `;
};

const cardTitle = (ic, title) => html`<div class="sc-row" style="gap:12px">
  <span class="sc-sm-icon">${icon(ic, { size: 22, fill: true })}</span>
  <span style="font:500 22px/28px var(--md-ref-typeface-brand)">${title}</span>
</div>`;

const stat = (ic, value, label) => html`<div>
  <div class="sc-row" style="gap:6px">${icon(ic, { size: 18, color: "var(--md-sys-color-primary)" })}<span class="t-title-medium" style="font-weight:400">${value}</span></div>
  <div class="t-body-medium c-variant">${label}</div>
</div>`;

// 1. Power Cards
const battery = (level) => html`
  ${cardTitle("battery_full", "Battery Information")}
  <div class="sc-row" style="margin-top:14px;align-items:flex-end">
    <div class="sc-grow">
      <div><span style="font:300 46px/50px var(--md-ref-typeface-brand)">${level}</span><span class="t-headline-small">%</span></div>
      <div class="t-body-medium c-variant" style="margin-top:4px">Battery level</div>
    </div>
    <div class="sc-thermo"><span class="sc-thermo__bar"><i style="height:${Math.max(10, Math.min(100, level))}%"></i></span>
      <span class="sc-thermo__marks t-label-small c-variant"><b>60°</b><b>40°</b><b>20°</b><b>0°</b></span>
    </div>
  </div>
  <md-linear-progress class="sc-sm-progress" value=${level / 100}></md-linear-progress>
  <div class="sc-row" style="gap:0">
    <div class="sc-grow">${stat("device_thermostat", "25°C", "Temperature")}</div>
    <div class="sc-grow">${stat("bolt", "Discharging", "Status")}</div>
  </div>
`;

const batteryCondition = () => html`
  ${cardTitle("battery_full", "Battery condition")}
  <div class="sc-col" style="gap:14px;margin-top:18px">
    ${[
      ["favorite", "Health", "Good"],
      ["bolt", "Voltage", "4.21 V"],
      ["science", "Chemistry", "Li-ion"],
      ["battery_charging_full", "Capacity", "4700 mAh"],
    ].map(([ic, l, v]) => html`
      <div class="sc-row" style="gap:10px">
        ${icon(ic, { size: 20, color: "var(--md-sys-color-primary)" })}
        <span class="t-body-medium c-variant sc-grow">${l}</span>
        <span class="t-title-medium">${v}</span>
      </div>
    `)}
  </div>
`;

// 2. Device Cards
const system = () => html`
  ${cardTitle("monitor_heart", "System")}
  <div style="font:400 42px/48px var(--md-ref-typeface-brand);margin-top:12px">Normal</div>
  <div class="t-body-medium c-variant">Thermal state</div>
  <md-linear-progress class="sc-sm-progress" value="0.12"></md-linear-progress>
  <div class="sc-row">
    <div class="sc-grow">${stat("schedule", "30m", "Uptime")}</div>
    <div class="sc-grow">${stat("android", "17", "Android")}</div>
    <div class="sc-grow">${stat("security", "2026-07-01", "Security patch")}</div>
  </div>
`;

const hardware = () => html`
  ${cardTitle("developer_board", "Hardware Information")}
  <div class="sc-row" style="margin-top:12px;align-items:flex-end">
    <div class="sc-grow">
      <div><span style="font:400 42px/48px var(--md-ref-typeface-brand)">8</span><span class="t-headline-small"> Cores</span></div>
      <div class="t-body-medium c-variant" style="margin-top:2px">CPU Architecture</div>
    </div>
  </div>
  <div class="sc-col" style="gap:12px;margin-top:16px">
    <div class="sc-row" style="gap:10px">
      ${icon("memory", { size: 20, color: "var(--md-sys-color-primary)" })}
      <span class="t-body-medium c-variant sc-grow">Chipset</span>
      <span class="t-title-small">Snapdragon 8 Gen 3</span>
    </div>
    <div class="sc-row" style="gap:10px">
      ${icon("speed", { size: 20, color: "var(--md-sys-color-primary)" })}
      <span class="t-body-medium c-variant sc-grow">Clock speed</span>
      <span class="t-title-small">3.20 GHz</span>
    </div>
    <div class="sc-row" style="gap:10px">
      ${icon("terminal", { size: 20, color: "var(--md-sys-color-primary)" })}
      <span class="t-body-medium c-variant sc-grow">ABI</span>
      <span class="t-title-small">arm64-v8a</span>
    </div>
  </div>
`;

// 3. Network Cards (Net Probe integration)
const netConnection = () => html`
  ${cardTitle("network_check", "Wi-Fi (5 GHz)")}
  <div class="sc-row" style="margin-top:12px;align-items:flex-end">
    <div class="sc-grow">
      <div><span style="font:400 42px/48px var(--md-ref-typeface-brand)">-52</span><span class="t-headline-small"> dBm</span></div>
      <div class="t-body-medium c-variant">Signal strength</div>
    </div>
  </div>
  <div class="sc-col" style="gap:12px;margin-top:16px">
    <div class="sc-row" style="gap:10px">
      ${icon("speed", { size: 20, color: "var(--md-sys-color-primary)" })}
      <span class="t-body-medium c-variant sc-grow">Link speed</span>
      <span class="t-title-small">866 Mbps</span>
    </div>
    <div class="sc-row" style="gap:10px">
      ${icon("public", { size: 20, color: "var(--md-sys-color-primary)" })}
      <span class="t-body-medium c-variant sc-grow">Internet</span>
      <span class="t-title-small" style="color:var(--md-sys-color-primary)">Connected</span>
    </div>
    <div class="sc-row" style="gap:10px">
      ${icon("lan", { size: 20, color: "var(--md-sys-color-primary)" })}
      <span class="t-body-medium c-variant sc-grow">IP Address</span>
      <span class="t-title-small">192.168.1.142</span>
    </div>
  </div>
`;

const netSpeedTest = () => html`
  ${cardTitle("network_check", "Last Speed Test")}
  <div class="sc-row" style="margin-top:12px;align-items:flex-end">
    <div class="sc-grow">
      <div><span style="font:400 42px/48px var(--md-ref-typeface-brand)">142</span><span class="t-headline-small"> Mbps</span></div>
      <div class="t-body-medium c-variant">Download speed</div>
    </div>
  </div>
  <div class="sc-col" style="gap:12px;margin-top:16px">
    <div class="sc-row" style="gap:10px">
      ${icon("upload", { size: 20, color: "var(--md-sys-color-primary)" })}
      <span class="t-body-medium c-variant sc-grow">Upload</span>
      <span class="t-title-small">85 Mbps</span>
    </div>
    <div class="sc-row" style="gap:10px">
      ${icon("timer", { size: 20, color: "var(--md-sys-color-primary)" })}
      <span class="t-body-medium c-variant sc-grow">Latency</span>
      <span class="t-title-small">12 ms</span>
    </div>
    <div class="sc-row" style="gap:10px">
      ${icon("schedule", { size: 20, color: "var(--md-sys-color-primary)" })}
      <span class="t-body-medium c-variant sc-grow">Tested</span>
      <span class="t-title-small">10m ago</span>
    </div>
  </div>
`;

const netCompanionInstall = (onInstall) => card(
  html`<div style="padding:16px;display:flex;flex-direction:column;gap:12px">
    <div class="sc-row" style="gap:12px">
      <span class="sc-sm-icon">${icon("network_check", { size: 22, fill: true })}</span>
      <span style="font:500 22px/28px var(--md-ref-typeface-brand)">Net Probe</span>
    </div>
    <div class="t-title-medium w-semibold">Add network diagnostics</div>
    <div class="t-body-medium c-variant">Inspect your Wi-Fi link, signal strength, and internet speed with our companion app.</div>
    ${button("Get Net Probe", { icon: "shop", fill: true, onClick: onInstall, cls: "sc-grow sc-btn--block" })}
  </div>`,
  { cls: "sc-card" },
);

// 4. Storage & Memory Cards
export const storageGauge = (used = 0.8, size = 140) => {
  const r = size / 2 - 10;
  const c = size / 2;
  const len = 0.75 * 2 * Math.PI * r;
  const p = (deg) => `${c + r * Math.cos((deg * Math.PI) / 180)} ${c + r * Math.sin((deg * Math.PI) / 180)}`;
  const d = `M ${p(135)} A ${r} ${r} 0 1 1 ${p(45)}`;
  return html`<div class="sc-gauge" style="width:${size}px;height:${size}px">
    <svg viewBox="0 0 ${size} ${size}" width=${size} height=${size}>
      <path d=${d} fill="none" stroke="color-mix(in srgb, var(--md-sys-color-primary-container) 25%, transparent)" stroke-width="14" stroke-linecap="round" />
      <path d=${d} fill="none" stroke="var(--md-sys-color-primary-container)" stroke-width="14" stroke-linecap="round" stroke-dasharray=${len} stroke-dashoffset=${len * (1 - used)} />
    </svg>
    <div class="sc-gauge__label">
      <div><span style="font:400 42px/46px var(--md-ref-typeface-brand)">${Math.round(used * 100)}</span><span class="t-headline-small">%</span></div>
      <div class="t-body-medium c-variant">Used</div>
    </div>
  </div>`;
};

const storage = (used) => html`
  ${cardTitle("storage", "Storage Information")}
  <div class="sc-row" style="margin-top:16px;gap:16px">
    ${storageGauge(used)}
    <div class="sc-grow sc-col" style="gap:14px">
      ${[
        ["progress_activity", "Used", `${(14.9 * used).toFixed(2)} GB`],
        ["check_circle", "Free", `${(14.9 * (1 - used)).toFixed(2)} GB`],
        ["smartphone", "Total", "14.90 GB"],
      ].map(([ic, l, v]) => html`
        <div class="sc-row" style="gap:10px">
          ${icon(ic, { size: 18, color: "var(--md-sys-color-primary)" })}
          <span class="t-body-medium c-variant sc-grow">${l}</span>
          <span class="t-title-medium w-bold">${v}</span>
        </div>
      `)}
    </div>
  </div>
`;

const ram = (used) => html`
  ${cardTitle("memory", "RAM Information")}
  <div class="sc-row" style="margin-top:16px;gap:16px">
    ${storageGauge(used)}
    <div class="sc-grow sc-col" style="gap:14px">
      ${[
        ["data_usage", "Used", `${(12.0 * used).toFixed(2)} GB`],
        ["check_circle", "Free", `${(12.0 * (1 - used)).toFixed(2)} GB`],
        ["smartphone", "Total", "12.00 GB"],
      ].map(([ic, l, v]) => html`
        <div class="sc-row" style="gap:10px">
          ${icon(ic, { size: 18, color: "var(--md-sys-color-primary)" })}
          <span class="t-body-medium c-variant sc-grow">${l}</span>
          <span class="t-title-medium w-bold">${v}</span>
        </div>
      `)}
    </div>
  </div>
`;

const breakdown = () => html`<div class="sc-breakdown">
  ${[
    ["apps", "Installed apps", "2.36 GB"],
    ["android", "System", "3.90 GB"],
    ["folder", "Other Files", "460.97 MB"],
  ].map(
    ([ic, t, v]) => html`<div class="sc-breakdown__cell">
      <span class="sc-sm-icon" style="width:48px;height:48px">${icon(ic, { size: 24, fill: true })}</span>
      <div><div class="t-title-small">${t}</div><div class="t-body-small c-variant">${v}</div></div>
    </div>`,
  )}
</div>`;

const content = (s) => html`<div style="transform:translateY(${-s.scroll}px)">
  ${head("Power", "Charge, temperature and the state of the cell")}
  ${pager(s, "batteryPage", [battery(s.battery), batteryCondition()])}

  ${head("Device", "How hard the system is working, and what it runs")}
  ${pager(s, "devicePage", [system(), hardware()])}

  ${head("Network", "Wi-Fi link, signal strength and connectivity")}
  ${s.netState === "companion_install"
    ? html`<div style="padding:0 16px 16px">${netCompanionInstall(() => s.set?.({ netState: "connected" }))}</div>`
    : pager(s, "netPage", [netConnection(), netSpeedTest()])}

  ${head("Storage and memory", "How much space and memory the device is using")}
  ${pager(s, "storagePage", [storage(s.used), ram(s.ramUsed ?? 0.64)])}

  <div style="padding:8px 16px 0">
    ${sectionHeader(
      "What is using your storage",
      "Space taken by apps, media and other files on this device",
      !s.breakdownCollapsed,
      setter(s)((st) => ({ breakdownCollapsed: !st.breakdownCollapsed })),
      { flush: true },
    )}
  </div>
  ${s.breakdownCollapsed ? "" : breakdown()}
</div>`;

/** feature/systemmonitor: SystemMonitorScreen (battery, system, network, storage pagers and breakdown grid). */
export const systemMonitor = {
  id: "system-monitor",
  title: "System Monitor",
  category: "device",
  categoryLabel: "Device",
  description: "Battery, thermal state, hardware, network, and storage/RAM as swipeable cards.",
  palette: "android-vivid",
  defaults: {
    scroll: 0,
    battery: 100,
    used: 0.8,
    ramUsed: 0.64,
    batteryPage: 0,
    devicePage: 0,
    netPage: 0,
    storagePage: 0,
    netState: "connected",
    breakdownCollapsed: false,
  },
  /** Pager settle: each carousel eases to its page (a spring in the app). */
  tick: (s, dt) => {
    const patch = {};
    for (const k of PAGERS) {
      const pos = s[`${k}Pos`];
      if (pos === undefined || Math.abs(pos - (s[k] ?? 0)) < 0.002) continue;
      const next = pos + ((s[k] ?? 0) - pos) * Math.min(1, dt * 12);
      patch[`${k}Pos`] = Math.abs(next - (s[k] ?? 0)) < 0.002 ? (s[k] ?? 0) : next;
    }
    return Object.keys(patch).length ? patch : null;
  },
  scrollMax: 953, // content height minus the viewport, plus the five 16dp spacers that end the column
  controls: [
    { key: "battery", label: "Battery level", type: "range", min: 1, max: 100, unit: "%" },
    { key: "used", label: "Storage used", type: "range", min: 0.05, max: 0.99, step: 0.01 },
    { key: "scroll", label: "Scroll", type: "range", min: 0, max: 953, unit: "dp" },
    { key: "batteryPage", label: "Battery Card", type: "choice", options: [0, 1] },
    { key: "devicePage", label: "Device Card", type: "choice", options: [0, 1] },
    { key: "netPage", label: "Network Card", type: "choice", options: [0, 1] },
    { key: "storagePage", label: "Storage Card", type: "choice", options: [0, 1] },
    { key: "netState", label: "Network Mode", type: "choice", options: ["connected", "companion_install"] },
    {
      label: "Presets",
      type: "presets",
      options: [
        ["Power View", { scroll: 0, batteryPage: 0 }],
        ["Battery Condition", { scroll: 0, batteryPage: 1 }],
        ["Device & Hardware", { scroll: 339, devicePage: 1 }],
        ["Network Diagnostics", { scroll: 690, netState: "connected", netPage: 0 }],
        ["Network Speed Test", { scroll: 690, netState: "connected", netPage: 1 }],
        ["Storage Analyzer", { scroll: 953, storagePage: 0, breakdownCollapsed: false }],
        ["RAM Memory Card", { scroll: 953, storagePage: 1 }],
      ],
    },
  ],
  render: (s) =>
    previewScreen(APP, s, {
      tab: "system-monitor",
      topBar: "center",
      content: scrollArea(s, content(s), { max: 953 }),
    }),
};

/** Same screen scrolled to Storage and memory (the Storage Analyzer story). */
export const storageMonitor = {
  ...systemMonitor,
  id: "storage-monitor",
  title: "Storage Monitor",
  category: "device",
  categoryLabel: "Device",
  description: "Storage ring with used, free and total, RAM details, and what is using your storage.",
  defaults: { ...systemMonitor.defaults, scroll: 953 }, // Storage and memory at the top
};

export default systemMonitor;
