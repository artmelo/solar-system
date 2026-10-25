import { test } from "node:test";
import assert from "node:assert/strict";
import { planets, moons, sun, axis, position, validOrbit, size } from "./model";
import {
  dancePlanet,
  systemOrigin,
  focusPoint,
  systemExtent,
  fitDistance,
} from "./scene-frame";
test("entering Moon Dance resets every planetary system from solar coordinates to origin", () => {
  for (const parent of planets.filter((p) =>
    moons.some((m) => m.parent === p.name),
  ))
    for (const real of [false, true])
      for (const days of [0, 9793, 12000]) {
        assert.deepEqual(
          systemOrigin(parent, days, real, false),
          position(parent, days, axis(parent, real)),
        );
        assert.deepEqual(systemOrigin(parent, days, real, true), [0, 0, 0]);
        assert.deepEqual(focusPoint(parent, days, real, true), [0, 0, 0]);
      }
});
test("selecting any moon and advancing time never moves the Moon Dance camera off its planet", () => {
  for (const moon of moons)
    for (const real of [false, true])
      for (const days of [9793, 9794, 10000]) {
        assert.equal(dancePlanet(moon).name, moon.parent);
        assert.deepEqual(focusPoint(moon, days, real, true), [0, 0, 0]);
      }
  assert.equal(dancePlanet(sun).name, "Jupiter");
  assert.equal(dancePlanet(planets[0]).name, "Jupiter");
});
test("moon systems fit desktop and portrait viewports, including realistic scale", () => {
  for (const parent of planets.filter((p) =>
    moons.some((m) => m.parent === p.name),
  ))
    for (const real of [false, true]) {
      const extent = systemExtent(parent, real);
      assert.ok(extent > 0 && Number.isFinite(extent));
      for (const moon of moons.filter(
        (m) => m.parent === parent.name && validOrbit(m),
      ))
        assert.ok(
          extent >= axis(moon, real, true) * (1 + moon.e!) + size(moon, real),
        );
      assert.ok(fitDistance(extent, 0.65) > fitDistance(extent, 1.8));
      for (const aspect of [0.65, 1, 1.8]) {
        const halfAngle = Math.min(
          Math.PI / 8,
          Math.atan(Math.tan(Math.PI / 8) * aspect),
        );
        assert.ok(fitDistance(extent, aspect) * Math.sin(halfAngle) > extent);
      }
    }
});
test("Explore still follows a moon in its parent solar frame after leaving Moon Dance", () => {
  const moon = moons.find((m) => m.name === "Io")!,
    parent = planets.find((p) => p.name === "Jupiter")!;
  for (const real of [false, true]) {
    const centre = systemOrigin(parent, 9793, real, false),
      local = position(moon, 9793, axis(moon, real, true));
    assert.deepEqual(
      focusPoint(moon, 9793, real, false),
      centre.map((x, i) => x + local[i]),
    );
  }
});
