import { test } from "node:test";
import assert from "node:assert/strict";
import {
  eccentricAnomaly,
  position,
  planets,
  moons,
  validOrbit,
  axis,
  size,
  AU,
} from "./model";
test("Kepler solver residual over eccentricities and positive/negative time", () => {
  for (const e of [0, 0.0167, 0.2056, 0.7, 0.95])
    for (const m of [-100, -3, 0, 0.1, 2, 100]) {
      const E = eccentricAnomaly(m, e),
        wrapped = ((m % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      assert.ok(Math.abs(E - e * Math.sin(E) - wrapped) < 1e-10);
    }
});
test("periapsis, apoapsis and period closure", () => {
  const b = { ...planets[0], m: 0, w: 0, node: 0, i: 0 };
  assert.ok(Math.abs(Math.hypot(...position(b, 0)) - b.a! * (1 - b.e!)) < 1e-7);
  assert.ok(
    Math.abs(Math.hypot(...position(b, b.period! / 2)) - b.a! * (1 + b.e!)) <
      1e-7,
  );
  assert.ok(
    position(b, b.period!).every(
      (x, i) => Math.abs(x - position(b, 0)[i]) < 1e-7,
    ),
  );
});
test("catalogue has unique ids and names, finite valid orbits; missing records stay unrendered", () => {
  assert.equal(new Set(moons.map((m) => m.id)).size, moons.length);
  assert.equal(
    new Set(moons.map((m) => m.parent + ":" + m.name)).size,
    moons.length,
  );
  assert.ok(moons.length > 400);
  for (const b of moons)
    if (validOrbit(b)) assert.ok(position(b, 9000).every(Number.isFinite));
  const missing = moons.find((b) => !validOrbit(b));
  assert.ok(missing);
  assert.deepEqual(position(missing, 9000), [0, 0, 0]);
});
test("realistic mode preserves distance and radius ratios", () => {
  for (const b of planets) {
    assert.equal(axis(b, true), (b.a! / AU) * 12);
    assert.equal(size(b, true), (b.radius! / AU) * 12);
  }
});
