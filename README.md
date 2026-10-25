# Solar System Explorer — Mode 1

An educational React + TypeScript + Three.js / React Three Fiber explorer. Includes the Sun, eight planets, and a bundled catalogue of **456 planetary moons** from the union of JPL's satellite mean-elements and discovery tables (retrieved 24 October 2026). This includes provisional designations. Pluto and small-body satellites are outside the eight-planet scope.

## Run

Node 22 or 24 is recommended.

```sh
npm ci
npm run dev
npm test
npm run build
```

`npm run preview` serves the built app. For browser tests: `npx playwright install chromium`, then `npx playwright test` (starts Vite automatically). Browser tests require an environment that permits Chromium to launch; macOS sandbox process restrictions can prevent local execution.

## Experiences

- **Explore:** clickable pulsating markers, searchable planets and moons, physical and orbital details, camera focus, orbit/zoom navigation, labels, orbit paths, and recent orbital trails.
- **Time Travel:** pause/play, Days (1 day/second), Years (365.25 days/second), 10 Years (3652.5 days/second), date input, timeline scrubbing across 2000–2099, and reset.
- **Orbit Detective:** compare eccentricities, select a candidate, and receive explanatory feedback.
- **Moon Dance:** planet-centred satellite systems, with a Jupiter 4:2:1 rhythm introduction and a one-click playback preset.
- **Educational scale:** compressed planetary semimajor axes; enlarged body radii and satellite systems. Eccentricity, orbital orientation, and periods remain unchanged. This deliberately changes relative spacing.
- **Realistic scale:** radii and orbital distances use the same linear kilometres-to-scene conversion. Markers retain a visible minimum size and are not physical radii.

The application requires WebGL for 3D. The searchable catalogue and controls are outside the renderer error boundary. Physical appearances are illustrative colours, not spacecraft imagery. The date and day units are Earth-based. Negative rotation periods are labelled retrograde. Missing rotation periods, masses and radii are shown as “Not recorded”.

## Scientific model and provenance

Planet positions use approximate fixed J2000 elements, Newton iteration for Kepler's equation, and inclination/node/periapsis rotation. Satellite positions use individual JPL epochs, mean orbital elements and periods; Laplace-plane pole bases are transformed to equatorial and then ecliptic J2000 coordinates. The Moon uses JPL ecliptic elements. These are educational two-body approximations: no perturbations, secular element evolution, precession, light time, barycentric motion or precise eclipse predictions. The 2000–2099 timeline is an exploration range, not a precision validity guarantee.

Sources:

- [JPL approximate planetary positions](https://ssd.jpl.nasa.gov/planets/approx_pos.html)
- [JPL satellite mean elements](https://ssd.jpl.nasa.gov/sats/elem/)
- [JPL satellite physical parameters](https://ssd.jpl.nasa.gov/sats/phys_par/)
- [JPL satellite discovery catalogue](https://ssd.jpl.nasa.gov/sats/discovery.html)
- [NASA planetary fact sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/)

`src/moons.json` is bundled; there is no live API dependency. Refresh it with `node scripts/import-catalogue.mjs`. The importer unions discovery records with element records, normalizes provisional designations, resolves the source spelling variants Magaclite/Megaclite and Philophrosyn/Philophrosyne, and deduplicates JPL IDs (including Puck). Records without valid complete orbital elements remain searchable but are never assigned an invented orbit. At this snapshot, S/2009 S1 has no complete orbit. Masses are derived only where GM is recorded, using G = 6.67430e-20 km³/kg/s². Unknown radii retain a visible educational marker, but are not given a physical radius in realistic mode.

## Implementation and verification

- `src/model.ts`: typed records, Kepler solver, coordinate transforms, scale functions.
- `src/Scene.tsx`: Three.js scene, orbital paths/trails, sprites, camera navigation, moon systems.
- `src/main.tsx`: application state, catalogue, timeline, learning activities, details.
- `src/model.test.ts`: solver residuals, periapsis/apoapsis, period closure, catalogue integrity, finite positions, incomplete-record fallback, realistic scale invariants.
- `tests/explorer.spec.ts`: browser interaction regression coverage.

The referenced ChatGPT assistant specification was inaccessible as content-reference placeholders; implementation follows the original user requirements and the explicit continuation request. No Mode 2 starship experience is included.

## Vercel

Import `artmelo/solar-system`, choose the Vite preset, root directory `.`, build `npm run build`, output `dist`. No environment variables or backend services are required. `vercel.json` declares these settings. Preview deployments can build the `feat/mode-1-explorer` branch before merge. Promote or merge only after checking that deployment.

Deployment attempt in the connected team returned 403 forbidden on project creation. The CLI fallback had no credentials. No hosted deployment URL has been claimed.
