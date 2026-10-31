import fs from "node:fs";
const AU = 149597870.7;
const nasa =
  "https://science.nasa.gov/missions/hubble/hubble-confirms-largest-comet-nucleus-ever-seen/";
const fields =
  "spkid,full_name,pdes,diameter,epoch,e,a,q,i,om,w,ma,tp,per,rot_per";
const records = [];
const queries = [];
// JPL requests are intentionally sequential and run at import time, never in a visitor's browser.
for (const kind of ["a", "c"]) {
  const u = new URL("https://ssd-api.jpl.nasa.gov/sbdb_query.api");
  Object.entries({
    fields,
    sort: "-diameter",
    limit: "9",
    "sb-kind": kind,
    "full-prec": "true",
    ...(kind === "a" ? { "sb-class": "MBA,IMB,OMB" } : { "sb-xfrag": "true" }),
  }).forEach(([k, v]) => u.searchParams.set(k, v));
  const r = await fetch(u);
  if (!r.ok) throw new Error("JPL " + r.status);
  const j = await r.json();
  if (j.signature?.version !== "1.0" || j.data?.length !== 9)
    throw new Error("Review JPL schema/count");
  queries.push(u.href);
  for (const row of j.data) {
    const d = Object.fromEntries(j.fields.map((key, i) => [key, row[i]]));
    records.push(convert(d, kind === "a" ? "asteroid" : "comet"));
  }
}
for (const [designation, diameter] of [
  ["2014 UN271", 129],
  ["2002 VQ94", 97],
]) {
  const u =
    "https://ssd-api.jpl.nasa.gov/sbdb.api?" +
    new URLSearchParams({
      sstr: designation,
      "phys-par": "1",
      "full-prec": "1",
    });
  const r = await fetch(u);
  if (!r.ok) throw new Error("JPL " + r.status);
  const j = await r.json();
  if (j.signature?.version !== "1.3")
    throw new Error("Review SBDB lookup schema " + j.signature?.version);
  const d = Object.fromEntries(j.orbit.elements.map((x) => [x.name, x.value]));
  records.push(
    convert(
      {
        ...d,
        spkid: j.object.spkid,
        full_name: j.object.fullname,
        pdes: designation,
        epoch: j.orbit.epoch,
        diameter,
      },
      "comet",
      nasa,
    ),
  );
  queries.push(u);
}
function convert(d, kind, diameterSource) {
  const num = (k) =>
    d[k] === null || d[k] === undefined ? null : Number(d[k]);
  const b = {
    id: "sb-" + d.spkid,
    name: d.full_name.trim().replace(/\s*\(A\d{3}[^)]*\)/, ""),
    designation: d.pdes,
    kind,
    a: num("a") * AU,
    e: num("e"),
    q: num("q") * AU,
    i: num("i"),
    node: num("om"),
    w: num("w"),
    m: num("ma"),
    period: num("per"),
    epochJD: num("epoch"),
    tpJD: num("tp"),
    radius: num("diameter") / 2,
    diameter: num("diameter"),
    mass: null,
    day: num("rot_per"),
    color: kind === "comet" ? "#83e6f3" : "#e6ad79",
    source:
      "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=" +
      encodeURIComponent(d.pdes),
    diameterSource:
      diameterSource ||
      "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=" +
        encodeURIComponent(d.pdes),
    diameterNote: diameterSource
      ? "Approximate nucleus diameter: NASA’s rounded 80-mile / 60-mile estimates converted to kilometres."
      : "SBDB recorded effective diameter; estimates and measurement methods vary.",
    fact:
      kind === "comet"
        ? "An icy visitor following an elongated path around the Sun. Its coma and tail in this explorer are illustrative."
        : "One of the largest recorded main-belt bodies. Watch its tilted orbit between the inner planets and Jupiter.",
  };
  if (!(b.a > 0 && b.e >= 0 && b.e < 1 && b.period > 0 && b.radius > 0))
    throw new Error("Unsupported/incomplete orbit " + b.name);
  return b;
}
records.sort((a, b) => a.kind.localeCompare(b.kind) || b.diameter - a.diameter);
fs.writeFileSync(
  new URL("../src/small-bodies.json", import.meta.url),
  JSON.stringify(
    {
      retrieved: new Date().toISOString().slice(0, 10),
      frame: "Heliocentric ecliptic J2000; epochs in TDB",
      selection:
        "Nine largest main-belt entries by recorded SBDB diameter; nine largest non-fragment comet entries with recorded diameters, plus NASA’s giant comets C/2014 UN271 and C/2002 VQ94. Not an exhaustive ranking: many nuclei lack diameter records. Ceres is also classified as a dwarf planet.",
      queries,
      objects: records,
    },
    null,
    2,
  ) + "\n",
);
console.log(records.map((x) => [x.kind, x.name, x.diameter, x.e]));
