import { type Body, AU, planets, position, axis, rad } from "./model";
export const ORBIT_VIEW_AU = 70;
export const JULIAN_J2000 = 2451545;
export function educationalRadius(au: number): number {
  const anchors = [[0, 0], ...planets.map((p) => [p.a! / AU, axis(p, false)])];
  for (let k = 1; k < anchors.length; k++) {
    const [r, x] = anchors[k],
      [prevR, prevX] = anchors[k - 1];
    if (au <= r) return prevX + ((au - prevR) / (r - prevR)) * (x - prevX);
  }
  const last = anchors[anchors.length - 1];
  return last[1] + 8 * Math.log1p((au - last[0]) / 10);
}
export function sceneFromKm(
  point: [number, number, number],
  real: boolean,
): [number, number, number] {
  const distance = Math.hypot(...point);
  if (distance === 0) return [0, 0, 0];
  const scale = real ? 12 / AU : educationalRadius(distance / AU) / distance;
  return point.map((v) => v * scale) as [number, number, number];
}
export function smallScenePosition(body: Body, days: number, real: boolean) {
  return sceneFromKm(position(body, days), real);
}
// Sample true anomaly rather than uniform time: very eccentric comets need detail near perihelion.
export function smallOrbit(
  body: Body,
  real: boolean,
): [number, number, number][] {
  const e = body.e!,
    a = body.a! / AU,
    q = a * (1 - e),
    aphelion = a * (1 + e);
  const max =
    aphelion <= ORBIT_VIEW_AU
      ? Math.PI
      : Math.acos(
          Math.max(-1, Math.min(1, ((q * (1 + e)) / ORBIT_VIEW_AU - 1) / e)),
        );
  return Array.from({ length: 257 }, (_, j) => {
    const nu = -max + (2 * max * j) / 256;
    const E =
      2 *
      Math.atan2(
        Math.sqrt(1 - e) * Math.sin(nu / 2),
        Math.sqrt(1 + e) * Math.cos(nu / 2),
      );
    const M = E - e * Math.sin(E);
    const days =
      body.epochJD! -
      JULIAN_J2000 +
      ((M - body.m! * rad) * body.period!) / (2 * Math.PI);
    return smallScenePosition(body, days, real);
  });
}
export function smallTrail(body: Body, days: number, real: boolean) {
  const span = Math.min(body.period! * 0.08, 500);
  return Array.from({ length: 65 }, (_, i) =>
    smallScenePosition(body, days - span + (span * i) / 64, real),
  );
}
export function perihelionInTimeline(body: Body, days: number): number | null {
  if (!body.tpJD || !body.period) return null;
  const base = body.tpJD - JULIAN_J2000;
  const first = Math.ceil((0 - base) / body.period),
    last = Math.floor((36524 - base) / body.period);
  if (first > last) return null;
  const n = Math.max(
    first,
    Math.min(last, Math.round((days - base) / body.period)),
  );
  return base + n * body.period;
}
export function tailActivity(distanceAU: number) {
  return Math.max(0, Math.min(1, (15 - distanceAU) / 12));
}
