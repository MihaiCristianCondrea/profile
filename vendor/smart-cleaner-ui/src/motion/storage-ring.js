import { html, svg } from "lit";

/**
 * Storage categories whose colours are the logo's colours, so a category ring can
 * collapse into the broom (the idea behind the first promo's finale).
 */
export const CATEGORIES = [
  { id: "images", label: "Images", size: "2.41 GB", share: 0.162, color: "#1666D3", icon: "image" },
  { id: "videos", label: "Videos", size: "1.92 GB", share: 0.129, color: "#DD3039", icon: "videocam" },
  { id: "apps", label: "Installed apps", size: "2.36 GB", share: 0.158, color: "#F4B400", icon: "apps" },
  { id: "downloads", label: "Downloads", size: "2.64 GB", share: 0.177, color: "#3D9447", icon: "download" },
  { id: "system", label: "System", size: "2.58 GB", share: 0.173, color: "#8E9791", icon: "android" },
];

/**
 * Segmented storage ring. `progress` (0..1 of the used share) reveals segments in order;
 * `peeled` lists category ids already lifted off the ring.
 */
export const storageRing = ({ size = 320, stroke = 30, progress = 1, peeled = [], number } = {}) => {
  const r = size / 2 - stroke;
  const c = size / 2;
  const used = CATEGORIES.reduce((a, x) => a + x.share, 0);
  const reveal = progress * used;
  const pt = (f) => [c + r * Math.cos(f * 2 * Math.PI - Math.PI / 2), c + r * Math.sin(f * 2 * Math.PI - Math.PI / 2)];
  let a = 0;
  const arcs = CATEGORIES.map((cat) => {
    const start = a + 0.006;
    const end = Math.min(a + cat.share - 0.006, reveal);
    a += cat.share;
    if (end <= start || peeled.includes(cat.id)) return null;
    const [x0, y0] = pt(start);
    const [x1, y1] = pt(end);
    return svg`<path d="M ${x0} ${y0} A ${r} ${r} 0 ${end - start > 0.5 ? 1 : 0} 1 ${x1} ${y1}" stroke=${cat.color} stroke-width=${stroke} stroke-linecap="round" fill="none"></path>`;
  });
  return html`<div class="sc-ring" style="width:${size}px;height:${size}px">
    <svg width=${size} height=${size}>
      <circle cx=${c} cy=${c} r=${r} fill="none" stroke="var(--md-sys-color-primary-container)" stroke-width=${stroke} opacity="0.6"></circle>
      ${arcs}
    </svg>
    <div class="sc-ring__label">
      <span style="font:430 ${size * 0.2}px/1 var(--md-ref-typeface-brand)">${number ?? Math.round(progress * 80)}<small style="font-size:.35em">%</small></span>
      <span class="t-body-large c-variant">Used</span>
    </div>
  </div>`;
};

/** Floating category card (the storage chart segments peel off into these). */
export const categoryTile = (id, { u = 1 } = {}) => {
  const c = CATEGORIES.find((x) => x.id === id);
  return html`<div class="sc-cat-tile" style="--u:${u}">
    <span class="sc-cat-tile__icon" style="background:color-mix(in srgb, ${c.color} 15%, transparent);color:${c.color}"><md-icon>${c.icon}</md-icon></span>
    <div><div class="sc-cat-tile__label">${c.label}</div><div class="sc-cat-tile__size">${c.size}</div></div>
  </div>`;
};
