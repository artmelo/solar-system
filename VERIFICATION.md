# Verification

- TypeScript + Vite production build: passed.
- Orbital model tests: 4 passed (including hundreds of solver and catalogue assertions).
- Browser verified through the in-app browser: rendered scene, catalogue search, Earth and Io details, playback at Years speed, pause, educational/realistic toggle, correct Orbit Detective feedback, Jupiter Moon Dance and S/2009 S1 missing-orbit notice.
- Standalone Playwright suite: supplied but could not execute locally because the macOS sandbox denied Chromium's Mach-port registration. This is an execution-environment limitation; no passing automated browser result is claimed.
- Vite reports the core Three.js chunk exceeds its default 500 kB warning threshold. The app has separate application, rendering and Three.js chunks; this is not a build error.
- Deployment blocked: connected Vercel team `team_JmZzC5F9RUPEviNHoGcDlcab` returned HTTP 403 on creating `solar-system`. The CLI fallback had no signed-in credentials.

## Visual revision

Replaced pulsating wireframes with static screen-sized dot sprites and retained a larger transparent click area. Added three verified NASA images per supported body (51 archive records total), explicit parent-gallery fallback, failure handling, captions/credit/source links and keyboard-operable carousel controls. Replaced typography with locally bundled Oxanium and removed the curiosity tagline. Production build passes. Browser inspection confirms NASA photographs load and carousel navigation advances.

## Moon Dance and mobile revision — 25 October 2026

Moon Dance now explicitly resets the satellite group to the planet-centred origin when entered from Explore. Selecting a moon no longer adds its local position to the camera target. Camera framing uses the full system's apoapsis envelope and the current viewport aspect ratio, and switching back to Explore restores heliocentric positions. Panning is disabled in Moon Dance so its planet stays centred; orbit and zoom remain available.

Eight Node test groups pass, including regression coverage for all six planetary moon systems, all catalogue selections, time changes, both scales and portrait camera fitting. TypeScript and the Vite production build pass. Browser checks verify Jupiter remains centred with Io selected during playback, and planet changes continue to frame their moons.

Mobile layout uses normal grid flow instead of fixed page offsets. It includes compact mode/planet selectors, pinch/orbit guidance, full-width details and NASA galleries, touch-sized time controls, and scene/details jump buttons. Browser measurements at 320×568, 390×844, 768×1024 and 844×390 confirm no horizontal overflow and ordered, non-overlapping scene/tools/timeline/details in Explore, Moon Dance and Orbit Detective. Playback and date controls measure 44 CSS pixels high in every tested viewport. These are browser viewport checks, not tests on physical mobile devices. Responsive assertions are also included in the Playwright suite; standalone Chromium remains unavailable in the local sandbox as previously documented.
