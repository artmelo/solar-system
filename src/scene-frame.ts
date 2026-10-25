import {
  type Body,
  planets,
  moons,
  sun,
  position,
  axis,
  size,
  validOrbit,
} from "./model";
type Point = [number, number, number];
export function dancePlanet(selected: Body): Body {
  return (
    planets.find(
      (b) =>
        b.name === (selected.parent || selected.name) &&
        moons.some((m) => m.parent === b.name),
    ) || planets[4]
  );
}
// A system has exactly one origin. Switching modes must never retain a solar offset.
export function systemOrigin(
  parent: Body,
  days: number,
  real: boolean,
  dance: boolean,
): Point {
  return dance ? [0, 0, 0] : position(parent, days, axis(parent, real));
}
export function focusPoint(
  selected: Body,
  days: number,
  real: boolean,
  dance: boolean,
): Point {
  // Selecting a moon changes its details, not the planet-centred reference frame.
  if (dance) return [0, 0, 0];
  const parent = selected.parent
    ? planets.find((p) => p.name === selected.parent)
    : selected;
  const centre = parent
    ? position(parent, days, axis(parent, real))
    : [0, 0, 0];
  if (!selected.parent || !validOrbit(selected)) return centre as Point;
  const local = position(selected, days, axis(selected, real, true));
  return centre.map((value, i) => value + local[i]) as Point;
}
export function systemExtent(parent: Body, real: boolean): number {
  return moons
    .filter((b) => b.parent === parent.name && validOrbit(b))
    .reduce(
      (extent, b) =>
        Math.max(extent, axis(b, real, true) * (1 + b.e!) + size(b, real)),
      size(parent, real) * 2.4,
    );
}
export function overviewExtent(real: boolean): number {
  return Math.max(
    size(sun, real),
    ...planets.map((b) => axis(b, real) * (1 + b.e!) + size(b, real) * 2.4),
  );
}
export function fitDistance(radius: number, aspect: number, fov = 45): number {
  const vertical = (fov * Math.PI) / 360;
  const horizontal = Math.atan(Math.tan(vertical) * Math.max(aspect, 0.1));
  return (
    (Math.max(radius, 1e-6) / Math.sin(Math.min(vertical, horizontal))) * 1.12
  );
}
