import { type Body, size } from './model';
import { fitDistance } from './scene-frame';
export type Point3 = [number, number, number];
export function displayRadius(body: Body, real: boolean) {
  const radius = size(body, real);
  return !real && !body.parent && body.id !== 'Sun' ? radius * 2 : radius;
}
export function easeFlight(progress: number) {
  const t = Math.max(0, Math.min(1, progress));
  return t * t * t * (t * (t * 6 - 15) + 10);
}
export function closeupDistance(body: Body, real: boolean, aspect: number) {
  const radius = displayRadius(body, real) * (body.id === 'Saturn' ? 2.2 : 1);
  return Math.max(real ? 0.003 : 0.8, fitDistance(radius * 1.32, aspect));
}
export function flightPose(from: Point3, lookFrom: Point3, target: Point3, offset: Point3, progress: number) {
  const t = easeFlight(progress);
  return {
    position: from.map((v, i) => v + (target[i] + offset[i] - v) * t) as Point3,
    target: lookFrom.map((v, i) => v + (target[i] - v) * t) as Point3,
  };
}

export function cinematicOverviewDistance(radius: number, aspect: number) {
 const vertical=Math.PI/8,horizontal=Math.atan(Math.tan(vertical)*Math.max(aspect,.1));
 return Math.max(radius/Math.sin(horizontal),radius*.45/Math.sin(vertical))*1.12;
}
