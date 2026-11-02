import { html, nothing } from "lit";

/**
 * Procedural "camera roll" photos: pure CSS gradients, deterministic per seed.
 * Ported from the first promo (marketing/video/first-motion-design). No stock imagery.
 */
const hash = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * Nine photo subjects, each built from layered gradients (sky, light, depth, atmosphere) so a
 * tile reads as a real photo at any size. `h` is a small per-seed hue shift.
 */
export const PHOTO_STYLES = [
  // 0 Sunset over hills: glowing sun, haze band, two hill layers shaded from rim light to shadow
  (h) =>
    [
      `radial-gradient(circle at 62% 56%, #FFF6D8 0 4%, #FFD98A 7%, rgba(255,190,110,.55) 14%, rgba(255,150,90,0) 32%)`,
      `radial-gradient(140% 55% at 22% 112%, hsl(${h + 150},18%,16%) 0 44%, hsl(${h + 160},20%,26%) 50%, transparent 51%)`,
      `radial-gradient(150% 62% at 88% 118%, hsl(${h + 140},16%,22%) 0 46%, hsl(${h + 150},22%,34%) 52%, transparent 53%)`,
      `linear-gradient(180deg, transparent 52%, rgba(255,214,160,.55) 60%, transparent 70%)`,
      `linear-gradient(180deg, hsl(${h + 250},48%,26%) 0%, hsl(${h + 290},46%,42%) 24%, hsl(${h + 340},70%,62%) 46%, #FF9E6B 62%, #FFD39A 76%, #FFE9C4 100%)`,
    ].join(","),
  // 1 Sea horizon: deep sky to warm haze, sun glow on the horizon, reflection column, sea shading and swell
  (h) =>
    [
      `radial-gradient(22% 30% at 58% 50%, rgba(255,250,235,.95) 0, rgba(255,236,200,.55) 35%, transparent 70%)`,
      `radial-gradient(10% 42% at 58% 72%, rgba(255,244,214,.7) 0, rgba(255,236,200,.25) 45%, transparent 75%)`,
      `repeating-linear-gradient(178deg, rgba(255,255,255,0) 0 7px, rgba(255,255,255,.08) 7px 8px) 0 100% / 100% 49.6% no-repeat`,
      `linear-gradient(180deg, transparent 50%, hsl(${h + 185},60%,46%) 50.4%, hsl(${h + 200},64%,32%) 70%, hsl(${h + 215},70%,16%) 100%)`,
      `linear-gradient(180deg, hsl(${h + 210},70%,38%) 0%, hsl(${h + 200},70%,58%) 22%, hsl(${h + 195},60%,78%) 40%, #F3F0E6 50%)`,
    ].join(","),
  // 2 Mountains: layered ridges with aerial perspective under a bright sky
  (h) =>
    [
      `linear-gradient(155deg, transparent 58%, hsl(${h + 150},22%,30%) 58.4%, hsl(${h + 160},26%,14%) 100%)`,
      `linear-gradient(212deg, transparent 50%, hsl(${h + 165},18%,44%) 50.4%, hsl(${h + 170},22%,26%) 100%)`,
      `linear-gradient(168deg, transparent 40%, hsl(${h + 200},18%,66%) 40.4%, hsl(${h + 195},20%,48%) 100%)`,
      `radial-gradient(70% 50% at 75% 10%, rgba(255,255,255,.8) 0, transparent 70%)`,
      `linear-gradient(180deg, hsl(${h + 205},55%,62%) 0%, hsl(${h + 195},45%,80%) 45%, hsl(${h + 30},60%,90%) 100%)`,
    ].join(","),
  // 3 Aurora abstract: glowing ribbons over a deep violet field
  (h) =>
    [
      `radial-gradient(55% 35% at 28% 30%, rgba(210,200,255,.95) 0, rgba(170,150,245,.4) 45%, transparent 75%)`,
      `radial-gradient(65% 45% at 78% 72%, rgba(236,206,255,.9) 0, rgba(200,160,240,.35) 45%, transparent 75%)`,
      `radial-gradient(40% 30% at 70% 22%, rgba(120,220,255,.6) 0, transparent 70%)`,
      `radial-gradient(90% 80% at 55% 20%, hsl(${h + 255},60%,54%) 0, transparent 70%)`,
      `linear-gradient(160deg, hsl(${h + 245},62%,34%), hsl(${h + 265},58%,48%) 50%, hsl(${h + 285},55%,40%))`,
    ].join(","),
  // 4 Night bokeh: soft out-of-focus lights with glowing edges on a deep gradient, plus a light leak
  (h) =>
    [
      `radial-gradient(circle at 70% 22%, rgba(255,196,120,.95) 0 4%, rgba(255,170,90,.5) 6.5%, transparent 8.5%)`,
      `radial-gradient(circle at 78% 36%, rgba(255,128,96,.85) 0 3.4%, rgba(255,110,80,.35) 5.5%, transparent 7.5%)`,
      `radial-gradient(circle at 30% 60%, rgba(255,96,110,.6) 0 5.5%, rgba(255,90,100,.25) 8%, transparent 10.5%)`,
      `radial-gradient(circle at 56% 80%, rgba(255,210,140,.55) 0 4%, rgba(255,200,130,.2) 6%, transparent 8%)`,
      `radial-gradient(circle at 18% 24%, rgba(140,180,255,.35) 0 3%, transparent 6%)`,
      `radial-gradient(circle at 88% 70%, rgba(170,140,255,.35) 0 3.5%, transparent 6.5%)`,
      `radial-gradient(80% 60% at 100% 0%, rgba(255,120,80,.22) 0, transparent 70%)`,
      `linear-gradient(180deg, hsl(${h + 225},34%,10%), hsl(${h + 245},28%,20%) 55%, hsl(${h + 265},30%,14%))`,
    ].join(","),
  // 5 Forest: sun rays through the canopy, layered greens and a bright clearing
  (h) =>
    [
      `repeating-linear-gradient(115deg, rgba(255,250,210,0) 0 26px, rgba(255,250,210,.09) 38px, rgba(255,250,210,0) 52px)`,
      `linear-gradient(115deg, rgba(255,250,210,.18), transparent 60%)`,
      `radial-gradient(45% 35% at 30% 30%, rgba(236,255,190,.75) 0, transparent 70%)`,
      `radial-gradient(55% 45% at 72% 66%, hsl(${h + 135},50%,22%) 0, transparent 70%)`,
      `radial-gradient(60% 50% at 18% 85%, hsl(${h + 120},45%,18%) 0, transparent 70%)`,
      `linear-gradient(160deg, hsl(${h + 95},48%,54%), hsl(${h + 120},42%,34%) 50%, hsl(${h + 145},48%,16%))`,
    ].join(","),
  // 6 Dunes: warm sky, sun haze and sand ridges lit on one side, shaded on the other
  (h) =>
    [
      `radial-gradient(30% 22% at 76% 30%, rgba(255,246,220,.9) 0, transparent 70%)`,
      `radial-gradient(140% 60% at 18% 118%, #B8662E 0 42%, #D98A48 48%, transparent 50%)`,
      `radial-gradient(150% 58% at 86% 112%, #E7A865 0 44%, #F5C58A 50%, transparent 52%)`,
      `radial-gradient(120% 40% at 50% 104%, #C97A3C 0 40%, transparent 42%)`,
      `linear-gradient(180deg, hsl(${h + 205},58%,62%), hsl(${h + 190},45%,80%) 45%, #F9E3C2 70%, #F2CFA0 100%)`,
    ].join(","),
  // 7 City at dusk: glowing sky, gradient-shaded towers with lit windows, warm street glow
  (h) =>
    [
      `radial-gradient(90% 30% at 50% 100%, rgba(255,170,90,.55) 0, transparent 70%)`,
      `repeating-linear-gradient(0deg, transparent 0 9px, rgba(255,214,140,.55) 9px 11px) 6% 100% / 12% 44% no-repeat`,
      `repeating-linear-gradient(0deg, transparent 0 11px, rgba(255,220,160,.5) 11px 13px) 48% 100% / 10% 58% no-repeat`,
      `repeating-linear-gradient(0deg, transparent 0 8px, rgba(255,208,130,.45) 8px 10px) 84% 100% / 12% 38% no-repeat`,
      `linear-gradient(180deg, #2A3048, #151A28) 0% 100% / 22% 50% no-repeat`,
      `linear-gradient(180deg, #333A55, #191E2E) 30% 100% / 16% 36% no-repeat`,
      `linear-gradient(180deg, #2C3350, #141826) 50% 100% / 18% 64% no-repeat`,
      `linear-gradient(180deg, #363D5A, #1A1F30) 74% 100% / 16% 42% no-repeat`,
      `linear-gradient(180deg, #2A3048, #131725) 100% 100% / 22% 54% no-repeat`,
      `linear-gradient(180deg, hsl(${h + 250},45%,28%) 0%, hsl(${h + 320},55%,50%) 38%, hsl(${h + 15},85%,64%) 62%, #FFC98A 100%)`,
    ].join(","),
  // 8 Soft sky: pastel dawn with drifting clouds
  (h) =>
    [
      `radial-gradient(30% 14% at 28% 34%, rgba(255,255,255,.95) 0, rgba(255,255,255,0) 70%)`,
      `radial-gradient(38% 16% at 66% 58%, rgba(255,255,255,.9) 0, rgba(255,255,255,0) 70%)`,
      `radial-gradient(26% 12% at 80% 24%, rgba(255,255,255,.8) 0, rgba(255,255,255,0) 70%)`,
      `radial-gradient(90% 60% at 20% 20%, rgba(255,255,255,.55) 0, transparent 60%)`,
      `linear-gradient(200deg, hsl(${h + 205},72%,78%), hsl(${h + 260},60%,84%) 50%, hsl(${h + 330},65%,86%))`,
    ].join(","),
];

export const photoKind = (seed) => (seed * 7 + Math.floor(seed / 3)) % (PHOTO_STYLES.length + 1);

const screenshotLines = (seed) =>
  [0, 1, 2, 3, 4].map((i) => html`<i style="width:${60 + hash(seed * 10 + i) * 38}%"></i>`);

/** A photo tile. Kind === PHOTO_STYLES.length renders a phone screenshot (common clutter). */
export const photo = (seed, { w = 120, h = 120, radius = 16, cls = "", style = "", overlay } = {}) => {
  const kind = photoKind(seed);
  const hue = Math.floor(hash(seed) * 40) - 20;
  const isShot = kind >= PHOTO_STYLES.length;
  return html`<span
    class="sc-photo ${isShot ? "sc-photo--shot" : ""} ${cls}"
    style="width:${w}px;height:${h}px;border-radius:${radius}px;${isShot ? "" : `background:${PHOTO_STYLES[kind](hue)};`}${style}"
    >${isShot ? html`<b></b>${screenshotLines(seed)}<u></u>` : nothing}${overlay ?? nothing}</span
  >`;
};
