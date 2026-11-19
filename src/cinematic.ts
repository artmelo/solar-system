import { type Body, size, AU } from './model';
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

export function cameraNearPlane(distance: number) {return Math.max(1e-7,Math.min(.1,distance*.01));}
export function minimumCameraDistance(body: Body, real: boolean) {const r=body.kind?(real?(body.radius||0)/AU*12:Math.max(.06,(body.diameter||1)/1000*.24)):displayRadius(body,real);return Math.max(1e-5,r*1.18);}
