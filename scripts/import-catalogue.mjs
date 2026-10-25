import fs from "node:fs";
const clean = (s) =>
  s
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
const rows = (s) =>
  [...s.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)].map((m) =>
    m[1]
      .split(/<td\b[^>]*>/)
      .slice(1)
      .map(clean),
  );
const sources = {
  elements: "https://ssd.jpl.nasa.gov/sats/elem/",
  physical: "https://ssd.jpl.nasa.gov/sats/phys_par/",
  discovery: "https://ssd.jpl.nasa.gov/sats/discovery.html",
};
const pages = Object.fromEntries(
  await Promise.all(
    Object.entries(sources).map(async ([k, url]) => {
      const r = await fetch(url);
      if (!r.ok) throw new Error(url + ": " + r.status);
      return [k, await r.text()];
    }),
  ),
);
const read = (n) => pages[n];
const planets = ["Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"];
let moons = [];
for (const r of rows(read("elements")))
  if (planets.includes(r[1]))
    moons.push({
      id: r[3],
      name: r[2],
      parent: r[1],
      frame: r[5],
      epoch: r[6],
      a: +r[7],
      e: +r[8],
      w: +r[9],
      m: +r[10],
      i: +r[11],
      node: +r[12],
      period: +r[13],
      poleRA: +r[16],
      poleDec: +r[17],
      radius: null,
      mass: null,
    });
moons = moons.filter(
  (m, index) => moons.findIndex((b) => b.id === m.id) === index,
);
for (const r of rows(read("physical"))) {
  let b = moons.find((m) => m.id === r[2]);
  if (b) {
    b.radius = Number(r[6]) || null;
    b.mass = Number(r[3]) ? Number(r[3]) / 6.6743e-20 : null;
  }
}
moons.forEach((m) => {
  if (m.name === "Magaclite") m.name = "Megaclite";
  if (m.name === "Philophrosyn") m.name = "Philophrosyne";
});
const key = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
let parent = "";
for (const r of rows(read("discovery"))) {
  if (r.length === 1) {
    parent = r[0].match(/Satellites of\s+(\w+)/)?.[1] || "";
    continue;
  }
  if (!planets.includes(parent)) continue;
  let name = r[1] || r[2];
  if (!name) continue;
  let existing = moons.find(
    (m) =>
      m.parent === parent &&
      [name, r[2].split("=")[0].trim()].some((n) => key(m.name) === key(n)),
  );
  if (existing) {
    existing.name = name;
    continue;
  }
  moons.push({
    id: `${parent}-${name}`,
    name,
    parent,
    period: null,
    a: null,
    e: null,
  });
}
fs.writeFileSync(
  new URL("../src/moons.json", import.meta.url),
  JSON.stringify(moons, null, 2),
);
console.log(
  moons.length,
  "moons",
  Object.fromEntries(
    planets.map((p) => [p, moons.filter((m) => m.parent === p).length]),
  ),
);
