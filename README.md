# Solar System Explorer

Get to know our celestial neighbours through an interactive 3D solar system. Explore the Sun, all eight planets, and hundreds of moons. Watch their paths, travel through time, and discover the worlds around each planet.

**[Open the web version →](https://solar-system-beryl-pi.vercel.app/)**  
Built by **[artmelo](https://github.com/artmelo)**.

## Explore a world

Click a planet’s dot or search for a planet or moon to bring up its field guide. Discover its mass, radius, day length, and orbital period, then browse real NASA images with captions and links to the originals.

Drag to look around, zoom in for a closer view, and use **Overview** to return to the wider solar system. Toggle **Labels** and **Trails** to see names and recent orbital paths.

![Explore mode focused on Jupiter, with a NASA image in the field guide and time-travel controls below.](docs/images/explore-jupiter.png)

*Get closer to Jupiter, browse its NASA photo gallery, and follow its path around the Sun.*

## Watch the moons dance

Open **Moon Dance** and choose a planet. The planet stays at the centre while its moons move around it. Select a moon to read its details without losing your view of the whole system.

Try **Watch Jupiter’s rhythm** to start playback: Io completes roughly four orbits while Europa completes two and Ganymede completes one. Or choose Saturn to explore its busy family of moons.

![Moon Dance showing Saturn centred among its moons and orbital paths, with a selectable moon list in the field guide.](docs/images/moon-dance-saturn.png)

*Saturn’s moons trace many different paths around their shared planetary centre.*

## Follow asteroids and comets

Turn on **Asteroids** and **Comets** below the scene. Amber dots mark asteroids; blue dots mark comets. Click a dot, search by name, or open **20 asteroids & comet visitors** in the field guide to choose one.

Try **Watch Halley’s pass** to jump near its modelled closest approach to the Sun and start playback. Use **Days** for a close look or **Years** to see a longer journey. Comet tails curve along each comet’s recent orbital path, trailing behind its motion and fading with distance. Pause freezes the animation. These stylized orbital wakes do not predict physical tail direction, appearance, or brightness.

The set includes nine large main-belt bodies, including Ceres and Vesta, and eleven large comet nuclei, including Bernardinelli–Bernstein, Hale–Bopp, and Halley. It uses [NASA/JPL’s Small-Body Database](https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html) and [NASA’s giant-comet size estimates](https://science.nasa.gov/missions/hubble/hubble-confirms-largest-comet-nucleus-ever-seen/). Diameter records are incomplete, so this is a curated collection rather than a definitive top-20 ranking. Ceres is also a dwarf planet.

Each visitor follows its own dated Keplerian orbit. Fixed orbital elements are approximate over the timeline; close encounters, perturbations, and comet outgassing are not modelled. “Sun pass” dates are simulation estimates, not precision forecasts. Orbit lines show the region within 70 AU; objects farther away still follow their trajectories. Educational scale compresses radial distances while preserving direction. Realistic scale uses the same physical distance scale as the planets, with visible selection dots and illustrative comet effects.

The data snapshot is dated **2026-10-31**. To refresh it, run `node scripts/import-small-bodies.mjs`, then review the selection and run the tests and build. The importer requests JPL data sequentially; the app uses bundled records and makes no live JPL API requests.

## Travel through time

Press **Play** to start, or pause whenever something catches your eye. Choose how quickly time passes:

| Speed | What happens in one real second |
| --- | --- |
| **Days** | One Earth day passes |
| **Years** | One Earth year passes |
| **10 Years** | Ten Earth years pass |

Drag the timeline or enter a date to explore **2000–2099**. **Reset date** returns to the starting date.

## Become an Orbit Detective

Which planet has the most stretched orbit? Open **Orbit Detective**, compare the eccentricity values in the field guide, and choose your answer. You’ll get a clue or an explanation to help you learn.

## Choose your sense of scale

- **Educational:** enlarged worlds and compressed distances make planets and moons easier to explore.
- **Realistic:** planet sizes and orbital distances share one scale. Tiny worlds keep visible dots so you can still find them.

## Use it on your phone or tablet

The app adapts to smaller screens, with larger touch controls and a dedicated space view.

| Action | Computer | Phone or tablet |
| --- | --- | --- |
| Look around | Drag the scene | Drag with one finger |
| Zoom | Scroll | Pinch with two fingers |
| Select a world | Click its dot or search | Tap its dot or search |
| Read details | Use the sidebar | Tap **Details** below the scene |
| Return to the scene | Click **Focus** or **Overview** | Tap **Back to space** |

Use a browser with WebGL support for the 3D view. NASA photographs load over the internet.

## A little about the science

Planet and moon motion follows approximate Keplerian orbits using NASA/JPL data. This is an educational simulation with simplified display scales. Some moons have incomplete records; their catalogue entries remain available even when an orbit or measurement is missing.

- Orbital and physical data: [NASA/JPL Solar System Dynamics](https://ssd.jpl.nasa.gov/sats/)
- Photographs: [NASA Image and Video Library](https://images.nasa.gov/), with individual credits and source links inside the app
- Code: [MIT License](LICENSE)

<details>
<summary>Run the app on your own computer</summary>

With Node.js 22 or 24 installed, download or clone this repository, open its folder in a terminal, and run:

```sh
npm ci
npm run dev
```

Open the local address shown in your terminal.

</details>
