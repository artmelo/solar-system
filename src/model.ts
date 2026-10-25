import catalogue from "./moons.json";
export type Body = {
  id: string;
  name: string;
  parent?: string;
  a: number | null;
  e: number | null;
  i?: number;
  w?: number;
  node?: number;
  m?: number;
  period: number | null;
  radius?: number | null;
  mass?: number | null;
  day?: number;
  epoch?: string;
  frame?: string;
  poleRA?: number;
  poleDec?: number;
  color?: string;
  fact?: string;
};
export const AU = 149597870.7,
  J2000 = Date.UTC(2000, 0, 1, 12),
  rad = Math.PI / 180;
const data = [
  [
    "Mercury",
    0.387099,
    0.205636,
    7.005,
    29.125,
    48.331,
    174.796,
    87.969,
    2439.7,
    3.3011e23,
    1407.6,
    "#b6aaa0",
    "A year here is shorter than two Mercury days.",
  ],
  [
    "Venus",
    0.723336,
    0.006777,
    3.395,
    54.884,
    76.68,
    50.115,
    224.701,
    6051.8,
    4.8675e24,
    -5832.5,
    "#e9c78d",
    "Venus spins backwards, and its day is longer than its year.",
  ],
  [
    "Earth",
    1.000003,
    0.016711,
    0,
    102.938,
    0,
    -2.473,
    365.256,
    6371,
    5.97237e24,
    23.934,
    "#58a9dd",
    "Our ocean world travels about 30 kilometres every second.",
  ],
  [
    "Mars",
    1.52371,
    0.093394,
    1.85,
    286.502,
    49.56,
    19.39,
    686.98,
    3389.5,
    6.4171e23,
    24.623,
    "#e07d56",
    "Mars has the tallest known volcano in the solar system.",
  ],
  [
    "Jupiter",
    5.202887,
    0.048386,
    1.304,
    274.254,
    100.474,
    19.667,
    4332.59,
    69911,
    1.8982e27,
    9.925,
    "#d8b18c",
    "Io, Europa and Ganymede keep a remarkable 4:2:1 rhythm.",
  ],
  [
    "Saturn",
    9.536676,
    0.053862,
    2.486,
    338.936,
    113.662,
    -42.644,
    10759.22,
    58232,
    5.6834e26,
    10.656,
    "#e4cfa0",
    "Saturn’s rings are made mostly of countless pieces of ice.",
  ],
  [
    "Uranus",
    19.189165,
    0.047257,
    0.773,
    96.938,
    74.017,
    142.284,
    30688.5,
    25362,
    8.681e25,
    -17.24,
    "#8ed9df",
    "Uranus rolls around the Sun tilted almost on its side.",
  ],
  [
    "Neptune",
    30.069923,
    0.00859,
    1.77,
    273.18,
    131.784,
    259.915,
    60182,
    24622,
    1.02413e26,
    16.11,
    "#5880ec",
    "Neptune takes about 165 Earth years to orbit the Sun.",
  ],
] as const;
export const sun: Body = {
  id: "Sun",
  name: "Sun",
  a: 0,
  e: 0,
  period: 0,
  radius: 695700,
  mass: 1.9885e30,
  day: 609.12,
  color: "#ffca69",
  fact: "The Sun holds about 99.8% of the mass of our solar system.",
};
export const planets: Body[] = data.map(
  ([name, a, e, i, w, node, m, period, radius, mass, day, color, fact]) => ({
    id: name,
    name,
    a: a * AU,
    e,
    i,
    w,
    node,
    m,
    period,
    radius,
    mass,
    day,
    color,
    fact,
  }),
);
export const moons: Body[] = catalogue;
export const bodies = [sun, ...planets, ...moons];
export function validOrbit(b: Body) {
  return (
    b.a !== null &&
    b.a > 0 &&
    b.e !== null &&
    b.e >= 0 &&
    b.e < 1 &&
    b.period !== null &&
    b.period > 0 &&
    ["i", "w", "node", "m"].every((k) => Number.isFinite(b[k as keyof Body]))
  );
}
export function eccentricAnomaly(m: number, e: number) {
  m = ((m % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  let E = e < 0.8 ? m : Math.PI;
  for (let n = 0; n < 20; n++) {
    const d = (E - e * Math.sin(E) - m) / (1 - e * Math.cos(E));
    E -= d;
    if (Math.abs(d) < 1e-12) break;
  }
  return E;
}
export function position(
  b: Body,
  days: number,
  a = b.a || 0,
): [number, number, number] {
  if (!validOrbit(b)) return [0, 0, 0];
  const epoch = b.epoch
    ? (Date.parse(b.epoch.slice(0, 10) + "T00:00:00Z") +
        Number("0." + (b.epoch.split(".")[1] || "0")) * 86400000 -
        J2000) /
      86400000
    : 0;
  const E = eccentricAnomaly(
    (b.m || 0) * rad + (2 * Math.PI * (days - epoch)) / b.period!,
    b.e!,
  );
  const x = a * (Math.cos(E) - b.e!),
    y = a * Math.sqrt(1 - b.e! ** 2) * Math.sin(E);
  const w = (b.w || 0) * rad,
    n = (b.node || 0) * rad,
    i = (b.i || 0) * rad;
  const u = x * Math.cos(w) - y * Math.sin(w),
    v = x * Math.sin(w) + y * Math.cos(w);
  let X = u * Math.cos(n) - v * Math.sin(n) * Math.cos(i),
    Y = u * Math.sin(n) + v * Math.cos(n) * Math.cos(i),
    Z = v * Math.sin(i);
  // JPL Laplace plane pole is equatorial J2000. Rotate its local basis to ecliptic J2000.
  if (
    b.frame === "Laplace" &&
    b.poleRA !== undefined &&
    b.poleDec !== undefined
  ) {
    const ra = b.poleRA * rad,
      de = b.poleDec * rad;
    const qx =
      -Math.sin(ra) * X -
      Math.sin(de) * Math.cos(ra) * Y +
      Math.cos(de) * Math.cos(ra) * Z;
    const qy =
      Math.cos(ra) * X -
      Math.sin(de) * Math.sin(ra) * Y +
      Math.cos(de) * Math.sin(ra) * Z;
    const qz = Math.cos(de) * Y + Math.sin(de) * Z;
    X = qx;
    Y = qy * Math.cos(23.43928 * rad) + qz * Math.sin(23.43928 * rad);
    Z = -qy * Math.sin(23.43928 * rad) + qz * Math.cos(23.43928 * rad);
  }
  return [X, Z, -Y];
}
export function axis(b: Body, real: boolean, local = false) {
  if (real) return ((b.a || 0) / AU) * 12;
  if (local) return 2 + Math.log10(1 + (b.a || 0) / 10000) * 2.5;
  return 6 + planets.findIndex((p) => p.id === b.id) * 4.5;
}
export function size(b: Body, real: boolean) {
  return real
    ? ((b.radius || 0) / AU) * 12
    : b.id === "Sun"
      ? 1.7
      : b.parent
        ? Math.max(0.06, Math.min(0.24, (b.radius || 100) / 10000))
        : Math.max(0.25, Math.min(1.05, (b.radius || 1) / 65000));
}
