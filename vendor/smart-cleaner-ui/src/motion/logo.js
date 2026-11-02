import { svg } from "lit";

/**
 * The launcher foreground (app/src/main/res/drawable-anydpi/ic_launcher_foreground.xml)
 * split into parts that animate independently (scale / rotate / offset around their own origin).
 * Coordinates are in the 108 × 108 adaptive-icon viewport. Ported from the first promo.
 */
export const LOGO_PARTS = {
  handle: { color: "#D2D2D4", origin: [39.5, 39.5], d: "M41.31,46.91l-6.93,-12.01c-0.49,-0.8 -0.2,-1.86 0.62,-2.34l0.18,-0.1c0.82,-0.47 1.88,-0.2 2.36,0.64L44.44,45.03L41.31,46.91z" },
  red: { color: "#DD3039", origin: [53, 62], d: "M61.38,71.76l7.97,-5.13c0.02,0 0.03,-0.02 0.05,-0.03L49.31,48.21l-6.14,3.79l-1.32,23.66c2.38,0.23 6.2,0.15 8.54,-0.2L61.38,71.76z" },
  yellow: {
    color: "#F4B400",
    origin: [63, 56],
    d: "M54.01,45.81c1.56,1.77 2.8,3.12 4.62,4.63c3.97,3.3 9.14,5.09 14.25,5.43c0.77,0.05 2.29,-0.1 2.85,0.5c0.27,0.3 0.32,0.72 0.28,1.11c-0.18,1.94 -4.92,7.87 -6.61,9.13c-0.02,0.02 -0.03,0.03 -0.05,0.03c-0.05,0 -0.1,0 -0.15,0c-0.77,-0.02 -2.04,-0.35 -2.8,-0.59c-4,-1.27 -6.48,-3.32 -9.29,-6.26c-0.13,-0.15 -0.27,-0.34 -0.4,-0.49c-2.58,-2.93 -4.37,-6.35 -6.43,-9.63c-0.3,-0.49 -0.62,-0.99 -0.95,-1.46C50.78,47.34 52.55,46.76 54.01,45.81z",
  },
  green: {
    color: "#3D9447",
    origin: [60, 67],
    d: "M57.08,59.75c2.81,2.95 5.37,4.99 9.37,6.26c0.75,0.23 2.03,0.57 2.8,0.59c0.05,0 0.1,0 0.15,0c-4.59,4.47 -10.73,7.4 -17.01,8.54c-0.35,0.05 -1.74,0.32 -2.01,0.32c0.28,-0.2 1.42,-0.52 1.94,-0.79c0.1,-0.1 0.97,-0.57 1.17,-0.69c4.25,-2.8 5.49,-7.27 4.37,-11.99c-0.1,-0.4 -0.22,-0.79 -0.35,-1.17C57.41,60.52 57.1,60.03 57.08,59.75z",
  },
  blue: {
    color: "#1666D3",
    origin: [41, 60],
    d: "M43.29,52.32l10.72,-6.52c-0.9,-0.94 -2.31,-2.79 -3.58,-3.16c-1.49,-0.44 -2.68,0.38 -3.9,1.12c-0.77,0.47 -1.59,0.99 -2.38,1.42l-3.3,1.99c-1.61,0.97 -3.72,1.83 -4.22,3.82c-0.52,2.03 1.21,3.1 1.19,4.94c-0.12,4.17 -1.61,8.91 -3.62,12.53c-0.35,0.64 -0.72,1.26 -1.11,1.88c-0.34,0.54 -0.79,1.07 -1,1.67c-0.22,0.59 -0.12,1.05 0.32,1.51c1.37,1.42 7.5,2.01 9.44,2.13c1.57,-1.96 2.76,-4.19 3.5,-6.58c1,-3.18 1,-7.43 0.28,-10.68C45.21,56.47 44.21,54.12 43.29,52.32z",
  },
  sparkleYellow: {
    color: "#F4B400",
    origin: [63.75, 45.94],
    d: "M65.78,43.91l-2.03,-4.47l-2.03,4.47l-4.49,2.03l4.47,2.03l2.03,4.59l2.03,-4.47l4.47,-2.03L65.78,43.91zM64.63,46.84l-0.75,1.79l-0.75,-1.79l-1.79,-0.75l1.79,-0.75l0.75,-1.79l0.75,1.79l1.79,0.75L64.63,46.84z",
  },
  sparkleBlue: {
    color: "#1666D3",
    origin: [68.39, 37.66],
    d: "M69.93,36.12l-1.54,-3.33l-1.54,3.33l-3.33,1.54l3.33,1.54l1.54,3.33l1.54,-3.33l3.33,-1.54L69.93,36.12zM69.16,38.28l-0.64,1.27l-0.64,-1.27l-1.27,-0.64l1.27,-0.64l0.64,-1.27l0.64,1.27l1.27,0.64L69.16,38.28z",
  },
};

export const LOGO_BOX = { x: 31, y: 30, w: 46, h: 47 };

/** The broom's pivot: the adaptive-icon centre, as in anim_splash (the splash turns the whole broom about it). */
export const BROOM_PIVOT = [54, 54];

/**
 * Broom logo. `broom` ({ s, r, o }) turns and scales the whole broom as one piece about
 * BROOM_PIVOT, like the splash screen, so the mark never comes apart. `parts` maps a part name to
 * { s, r, x, y, o } around the part's own origin: use it for the two sparkles (which pop on their
 * own in the splash), and only for the broom pieces when a shot really needs them apart.
 * Width is `size` px.
 */
export const logo = (size = 96, parts = {}, { broom = {} } = {}) => {
  const part = ([k, p]) => {
    const st = parts[k] ?? {};
    const [ox, oy] = p.origin;
    return svg`<path d=${p.d} fill=${p.color} opacity=${st.o ?? 1} transform="translate(${(st.x ?? 0) + ox} ${(st.y ?? 0) + oy}) rotate(${st.r ?? 0}) scale(${st.s ?? 1}) translate(${-ox} ${-oy})"></path>`;
  };
  const entries = Object.entries(LOGO_PARTS);
  const [px, py] = BROOM_PIVOT;
  return svg`<svg width=${size} height=${(size * LOGO_BOX.h) / LOGO_BOX.w} viewBox="${LOGO_BOX.x} ${LOGO_BOX.y} ${LOGO_BOX.w} ${LOGO_BOX.h}" style="overflow:visible;display:block">
    <g opacity=${broom.o ?? 1} transform="translate(${px} ${py}) rotate(${broom.r ?? 0}) scale(${broom.s ?? 1}) translate(${-px} ${-py})">
      ${entries.filter(([k]) => !k.startsWith("sparkle")).map(part)}
    </g>
    ${entries.filter(([k]) => k.startsWith("sparkle")).map(part)}
  </svg>`;
};
