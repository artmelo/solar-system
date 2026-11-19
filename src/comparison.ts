import { type Body, moons } from './model';
export function bodyDescription(body: Body): string {
  return body.parent ? `Moon of ${body.parent}` : body.kind === 'comet' ? 'Comet' : body.kind === 'asteroid' ? 'Asteroid / small body' : body.id === 'Sun' ? 'Star' : 'Planet';
}
export function comparisonName(body: Body): string {
  return `${body.name}${body.parent ? ` · ${body.parent}` : ''}`;
}
export function knownPositive(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}
export function formatMeasure(value: number | null | undefined, unit = ''): string {
  if (value == null || !Number.isFinite(value)) return 'Not recorded';
  return `${value.toLocaleString(undefined, { maximumSignificantDigits: 5 })}${unit ? ` ${unit}` : ''}`;
}
export function sizeComparison(left: Body, right: Body) {
  if (!knownPositive(left.radius) || !knownPositive(right.radius)) return null;
  const max = Math.max(left.radius, right.radius);
  return {left: left.radius / max, right: right.radius / max, ratio: max / Math.min(left.radius, right.radius), larger: left.radius >= right.radius ? left : right, smaller: left.radius >= right.radius ? right : left};
}
export function orbitParent(body: Body): string {
  return body.parent || 'Sun';
}
export function comparisonRows(left: Body, right: Body) {
  const values = (body: Body) => [
    formatMeasure(knownPositive(body.radius) ? body.radius * 2 : null, 'km'),
    knownPositive(body.mass) ? `${body.mass.toExponential(3)} kg` : 'Not recorded',
    knownPositive(Math.abs(body.day ?? 0)) ? `${formatMeasure(Math.abs(body.day!), 'hours')}${body.day! < 0 ? ' · retrograde' : ''}` : 'Not recorded',
    body.id === 'Sun' ? '—' : formatMeasure(body.period, 'Earth days'),
    body.id === 'Sun' ? '—' : formatMeasure(body.a, 'km'),
    body.id === 'Sun' ? '—' : formatMeasure(body.e),
    body.id === 'Sun' || body.parent || body.kind ? '—' : formatMeasure(moons.filter(m => m.parent === body.name).length),
  ];
  const a = values(left), b = values(right);
  return ['Diameter', 'Mass', 'Rotation period', 'Orbital period', 'Mean orbital distance', 'Orbital eccentricity', 'Catalogued moons'].map((label, i) => ({label, left: a[i], right: b[i], orbital: i === 3 || i === 4}));
}
