import { test } from "node:test";
import assert from "node:assert/strict";
import {
  smallBodies,
  validOrbit,
  position,
  eccentricAnomaly,
  AU,
  planets,
  axis,
} from "./model";
import {
  smallOrbit,
  smallScenePosition,
  educationalRadius,
  perihelionInTimeline,
  tailActivity,
  ORBIT_VIEW_AU,
} from "./small-body-orbits";
test("20 unique NASA/JPL visitors have usable elliptical orbits and traceable sizes", () => {
  assert.equal(smallBodies.length, 20);
  assert.equal(smallBodies.filter((b) => b.kind === "asteroid").length, 9);
  assert.equal(new Set(smallBodies.map((b) => b.id)).size, 20);
  for (const b of smallBodies) {
    assert.ok(validOrbit(b));
    assert.ok(b.diameter! > 0);
    assert.match(b.source!, /^https:\/\/ssd.jpl.nasa.gov/);
    assert.ok(b.diameterSource);
  }
});
test("near-parabolic comet solver converges across perihelion", () => {
  for (const e of [0.9993879247799903, 0.99999])
    for (const m of [0, 1e-9, 1e-6, 0.01, 1, Math.PI, 2 * Math.PI - 1e-9]) {
      const E = eccentricAnomaly(m, e);
      assert.ok(Math.abs(E - e * Math.sin(E) - m) < 1e-10);
    }
});
test("epoch-specific trajectories reach their recorded perihelion and remain finite", () => {
  for (const b of smallBodies) {
    const d = b.tpJD! - 2451545;
    assert.ok(
      Math.abs(Math.hypot(...position(b, d)) / b.q! - 1) < 1e-6,
      b.name,
    );
    for (const t of [0, 9000, 36524]) {
      assert.ok(position(b, t).every(Number.isFinite));
      assert.deepEqual(position(b, t), position(b, t));
    }
    assert.ok(
      Math.hypot(...position(b, 9000).map((v, i) => v - position(b, 9001)[i])) >
        0,
    );
  }
});
test("orbital paths fit 70 AU and realistic display preserves physical distance", () => {
  for (const b of smallBodies) {
    for (const p of smallOrbit(b, true)) {
      assert.ok(p.every(Number.isFinite));
      assert.ok(Math.hypot(...p) <= ORBIT_VIEW_AU * 12 + 1e-5, b.name);
    }
    assert.ok(
      Math.abs(
        Math.hypot(...smallScenePosition(b, 9000, true)) -
          (Math.hypot(...position(b, 9000)) / AU) * 12,
      ) < 1e-8,
    );
  }
});
test("educational radial compression is monotonic and matches planetary scale anchors", () => {
  for (const p of planets)
    assert.ok(Math.abs(educationalRadius(p.a! / AU) - axis(p, false)) < 1e-10);
  let previous = 0;
  for (let r = 0.01; r < 200; r += 0.13) {
    const next = educationalRadius(r);
    assert.ok(next > previous);
    previous = next;
  }
});
test("watch shortcuts stay in timeline and distant comets have no visible tail activity", () => {
  const bb = smallBodies.find((b) => b.designation === "2014 UN271")!;
  const pass = perihelionInTimeline(bb, 9000)!;
  assert.ok(pass > 11000 && pass < 12000);
  assert.ok(
    perihelionInTimeline(
      smallBodies.find((b) => b.designation === "1P")!,
      9000,
    )! > 0,
  );
  assert.equal(
    perihelionInTimeline(
      smallBodies.find((b) => b.designation === "1995 O1")!,
      9000,
    ),
    null,
  );
  assert.equal(tailActivity(20), 0);
  assert.equal(tailActivity(1), 1);
});

test("comet tails follow past orbital positions in both scales, including retrograde paths", async () => {
  const { cometTailSpan, writeCometTail } = await import("./small-body-orbits");
  for (const b of smallBodies.filter((b) => b.kind === "comet"))
    for (const real of [false, true])
      for (const offset of [-40, 0, 40]) {
        const days = b.tpJD! - 2451545 + offset,
          length = real ? 0.8 : 5;
        const buffer = new Float32Array(96 * 3);
        writeCometTail(b, days, real, length, buffer);
        const span = cometTailSpan(b, days, real, length),
          head = smallScenePosition(b, days, real);
        assert.ok(span > 0 && Number.isFinite(span));
        assert.deepEqual(Array.from(buffer.slice(0, 3)), [0, 0, 0]);
        for (let i = 0; i < 96; i++) {
          const expected = smallScenePosition(b, days - (span * i) / 95, real);
          for (let j = 0; j < 3; j++)
            assert.ok(
              Math.abs(buffer[i * 3 + j] - (expected[j] - head[j])) < 1e-5,
              b.name,
            );
        }
        const later = smallScenePosition(b, days + 0.01, real),
          earlier = smallScenePosition(b, days - 0.01, real);
        assert.ok(
          [0, 1, 2].reduce(
            (sum, j) => sum + buffer[3 + j] * (later[j] - earlier[j]),
            0,
          ) < 0,
          b.name,
        );
        const paused = buffer.slice();
        writeCometTail(b, days, real, length, buffer);
        assert.deepEqual(buffer, paused);
      }
});
