import React, { useState, useEffect, useRef, Component } from "react";
import { createRoot } from "react-dom/client";
import Scene from "./Scene";
import { dancePlanet } from "./scene-frame";
import NasaCarousel from "./NasaCarousel";
import "@fontsource/oxanium/400.css";
import "@fontsource/oxanium/500.css";
import "@fontsource/oxanium/600.css";
import "@fontsource/oxanium/700.css";
import {
  bodies,
  planets,
  moons,
  sun,
  J2000,
  type Body,
  validOrbit,
} from "./model";
import "./style.css";
class Boundary extends Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="fallback">
        3D could not start. Try a browser with WebGL enabled. The catalogue
        remains available.
      </div>
    ) : (
      this.props.children
    );
  }
}
const initial = (Date.UTC(2026, 9, 24, 12) - J2000) / 86400000;
function App() {
  const [selected, select] = useState<Body>(sun),
    [days, setDays] = useState(initial),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1),
    [real, setReal] = useState(false),
    [trails, setTrails] = useState(true),
    [labels, setLabels] = useState(true),
    [mode, setMode] = useState("Explore"),
    [query, setQuery] = useState(""),
    [home, setHome] = useState(0),
    [answer, setAnswer] = useState(""),
    [help, setHelp] = useState(false);
  const clock = useRef(0);
  const detailsRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const scrollTo = (element: HTMLElement | null) =>
    element?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  useEffect(() => {
    let id: number;
    const tick = (t: number) => {
      const dt = clock.current ? Math.min((t - clock.current) / 1000, 0.1) : 0;
      clock.current = t;
      if (playing) setDays((d) => Math.min(36524, Math.max(0, d + dt * speed)));
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(id);
      clock.current = 0;
    };
  }, [playing, speed]);
  const date = new Date(J2000 + days * 86400000).toISOString().slice(0, 10);
  const parent = selected.parent
    ? planets.find((p) => p.name === selected.parent)
    : selected;
  const family = moons.filter((b) => b.parent === parent?.name);
  const pick = (b: Body) => {
    select(b);
    setQuery("");
  };
  const number = (v: number | null | undefined, suffix: string) =>
    v == null
      ? "Not recorded"
      : `${v.toLocaleString(undefined, { maximumSignificantDigits: 6 })} ${suffix}`;
  return (
    <main data-mode={mode}>
      <div
        className="universe"
        ref={sceneRef}
        aria-label="Interactive solar system"
      >
        <Boundary>
          <Scene
            days={days}
            real={real}
            selected={selected}
            select={pick}
            trails={trails}
            labels={labels}
            dance={mode === "Moon Dance"}
            home={home}
          />
        </Boundary>
      </div>
      <header>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            select(sun);
            setMode("Explore");
            setHome((x) => x + 1);
          }}
        >
          <span className="logo">✺</span>
          <span>
            SOLAR SYSTEM<small>EXPLORER / MODE 01</small>
          </span>
        </a>
        <nav aria-label="Experiences">
          {["Explore", "Orbit Detective", "Moon Dance"].map((m) => (
            <button
              className={mode === m ? "active" : ""}
              onClick={() => {
                setMode(m);
                setAnswer("");
                if (m === "Moon Dance") select(dancePlanet(selected));
              }}
              key={m}
            >
              {m}
            </button>
          ))}
        </nav>
        <button
          className="help"
          onClick={() => setHelp(!help)}
          aria-label="Show help"
        >
          ?
        </button>
      </header>
      <section className="intro">
        <h1>
          {mode === "Explore" ? (
            <>
              Your place
              <br />
              in space.
            </>
          ) : mode === "Moon Dance" ? (
            <>
              A thousand
              <br />
              little rhythms.
            </>
          ) : (
            <>
              Follow the clues.
              <br />
              Find a world.
            </>
          )}
        </h1>
        <p>
          {mode === "Explore"
            ? "Travel through time. Follow an orbit. Get to know our celestial neighbours."
            : mode === "Moon Dance"
              ? "Meet the worlds around a world. Choose a planet and watch its family move."
              : "Look closely at the paths. Every orbit has a story to tell."}
        </p>
        <div className="view-options">
          <button
            className={!real ? "active" : ""}
            onClick={() => setReal(false)}
          >
            Educational
          </button>
          <button
            className={real ? "active" : ""}
            onClick={() => setReal(true)}
          >
            Realistic
          </button>
        </div>
        <p className="scale-note">
          {real
            ? "True relative distances and radii. Markers stay enlarged so you can find tiny worlds."
            : "Distances compressed. Worlds and moon systems enlarged for discovery."}
        </p>
        {mode === "Orbit Detective" && (
          <div className="activity">
            <div className="eyebrow">MISSION 01 · THE ECCENTRIC ONE</div>
            <h3>Which planet has the most stretched orbit?</h3>
            <p>
              Compare eccentricity in each planet’s details. Zero is a perfect
              circle.
            </p>
            <div className="answers">
              {planets.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    pick(b);
                    setAnswer(
                      b.name === "Mercury"
                        ? "Correct! Mercury’s eccentricity is 0.206. It speeds up near the Sun and slows down farther away."
                        : "Keep looking! Find the planet with the largest eccentricity.",
                    );
                  }}
                >
                  {b.name}
                </button>
              ))}
            </div>
            <p role="status">{answer}</p>
          </div>
        )}
        {mode === "Moon Dance" && (
          <div className="activity">
            <label>
              CHOOSE A PLANET
              <select
                value={parent?.name || "Jupiter"}
                onChange={(e) =>
                  pick(planets.find((b) => b.name === e.target.value)!)
                }
              >
                {planets
                  .filter((p) => moons.some((m) => m.parent === p.name))
                  .map((p) => (
                    <option key={p.id}>{p.name}</option>
                  ))}
              </select>
            </label>
            <p>
              Try Jupiter: Io completes roughly four laps while Europa completes
              two and Ganymede one. Use Days and press play.
            </p>
            <button
              onClick={() => {
                pick(planets[4]);
                setSpeed(1);
                setPlaying(true);
              }}
            >
              Watch Jupiter’s rhythm ↗
            </button>
          </div>
        )}
      </section>
      <aside ref={detailsRef} aria-label="Body details">
        <button
          className="mobile-only back-to-space"
          onClick={() => scrollTo(sceneRef.current)}
        >
          ↑ Back to space
        </button>
        <div className="eyebrow">YOUR FIELD GUIDE</div>
        <label className="search">
          <span>⌕</span>
          <input
            aria-label="Search planets and moons"
            placeholder="Find a planet or moon…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        {query && (
          <div className="results">
            {bodies
              .filter((b) =>
                `${b.name} ${b.parent || ""}`
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              )
              .map((b) => (
                <button key={b.id} onClick={() => pick(b)}>
                  {b.name}
                  <small>
                    {b.parent || "Solar system"}
                    {b.parent && !validOrbit(b) ? " · orbit unavailable" : ""}
                  </small>
                </button>
              ))}
          </div>
        )}
        <div className="eyebrow">
          {selected.parent
            ? `MOON OF ${selected.parent.toUpperCase()}`
            : selected.id === "Sun"
              ? "OUR STAR"
              : `PLANET ${planets.findIndex((p) => p.id === selected.id) + 1} / 08`}
        </div>
        <h2>{selected.name}</h2>
        <NasaCarousel body={selected} />
        <p className="fact">
          {selected.fact ||
            "A natural satellite with its own path around a planetary world."}
        </p>
        <dl>
          <div>
            <dt>Mass</dt>
            <dd>
              {selected.mass
                ? selected.mass.toExponential(3) + " kg"
                : "Not recorded"}
            </dd>
          </div>
          <div>
            <dt>
              {selected.parent
                ? "Orbit around " + selected.parent
                : "Orbit around Sun"}
            </dt>
            <dd>
              {selected.id === "Sun"
                ? "—"
                : number(selected.period, "Earth days")}
            </dd>
          </div>
          {selected.parent && (
            <div>
              <dt>Parent’s solar orbit</dt>
              <dd>{number(parent?.period, "Earth days")}</dd>
            </div>
          )}
          <div>
            <dt>Day length</dt>
            <dd>
              {selected.day
                ? number(Math.abs(selected.day), "hours") +
                  (selected.day < 0 ? " · retrograde" : "")
                : "Not recorded"}
            </dd>
          </div>
          <div>
            <dt>Mean radius</dt>
            <dd>{number(selected.radius, "km")}</dd>
          </div>
          {selected.id !== "Sun" && (
            <div>
              <dt>Orbital eccentricity</dt>
              <dd>{selected.e ?? "Not recorded"}</dd>
            </div>
          )}
        </dl>
        {selected.parent && (
          <p className="data-note">
            {validOrbit(selected)
              ? `Mean Keplerian orbit · ${selected.frame} frame. Fixed elements, not a precision ephemeris.`
              : "Incomplete orbital record. Listed in the catalogue; no invented orbit is displayed."}
          </p>
        )}
        {family.length > 0 && (
          <details open={mode === "Moon Dance"}>
            <summary>
              {family.length} catalogued moons <span>↗</span>
            </summary>
            <div className="moon-list">
              {family.map((b) => (
                <button key={b.id} onClick={() => pick(b)}>
                  {b.name}
                  <small>{validOrbit(b) ? "↗" : "No orbit"}</small>
                </button>
              ))}
            </div>
          </details>
        )}
        <button className="focus" onClick={() => setHome((n) => n + 1)}>
          ◎ Focus on {selected.name}
        </button>
      </aside>
      <div className="scene-tools">
        <button
          className="mobile-only mobile-details"
          onClick={() => scrollTo(detailsRef.current)}
        >
          Details: {selected.name} ↓
        </button>
        <button
          onClick={() => {
            select(sun);
            setMode("Explore");
            setHome((n) => n + 1);
          }}
        >
          ⌂ Overview
        </button>
        <label>
          <input
            type="checkbox"
            checked={trails}
            onChange={(e) => setTrails(e.target.checked)}
          />{" "}
          Trails
        </label>
        <label>
          <input
            type="checkbox"
            checked={labels}
            onChange={(e) => setLabels(e.target.checked)}
          />{" "}
          Labels
        </label>
      </div>
      <section className="timeline" aria-label="Time Travel">
        <div className="time-heading">
          <span className="eyebrow">
            TIME TRAVEL <span className="live-dot" />
          </span>
          <span className="date">
            {date} <small>UTC</small>
          </span>
          <button
            onClick={() => {
              setDays(initial);
              setPlaying(false);
            }}
          >
            Reset date ↺
          </button>
        </div>
        <div className="time-controls">
          <button
            className="play"
            aria-label={playing ? "Pause simulation" : "Play simulation"}
            onClick={() => setPlaying(!playing)}
          >
            {playing ? "Ⅱ" : "▶"}
          </button>
          <div className="speeds">
            {[
              [1, "Days"],
              [365.25, "Years"],
              [3652.5, "10 Years"],
            ].map(([s, l]) => (
              <button
                key={s}
                className={speed === s ? "active" : ""}
                onClick={() => setSpeed(Number(s))}
              >
                {l}
              </button>
            ))}
          </div>
          <input
            aria-label="Timeline date"
            type="range"
            min="0"
            max="36524"
            step="0.1"
            value={days}
            onChange={(e) => {
              setDays(+e.target.value);
              setPlaying(false);
            }}
          />
          <input
            aria-label="Choose date"
            type="date"
            min="2000-01-01"
            max="2099-12-31"
            value={date}
            onChange={(e) => {
              const d =
                (Date.parse(e.target.value + "T12:00:00Z") - J2000) / 86400000;
              if (Number.isFinite(d)) setDays(Math.max(0, Math.min(36524, d)));
            }}
          />
        </div>
        <div className="timeline-bottom">
          <span>2000</span>
          <span>
            {speed === 1 ? "1 day" : speed === 365.25 ? "1 year" : "10 years"} /
            second · Drag to travel through time
          </span>
          <span>2099</span>
        </div>
      </section>
      <footer>
        <span className="desktop-only">
          DRAG TO ORBIT · SCROLL TO ZOOM · CLICK TO DISCOVER
        </span>
        <span className="mobile-only">
          DRAG TO ORBIT · PINCH TO ZOOM · TAP TO DISCOVER
        </span>
        <span>
          KEPLERIAN MODEL <b>✧</b> JPL CATALOGUE
        </span>
      </footer>
      {help && (
        <div
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-label="Explorer help"
        >
          <div>
            <button onClick={() => setHelp(false)}>Close ×</button>
            <h2>A universe to explore</h2>
            <p>
              Drag to orbit the camera. Scroll or pinch to zoom. Select a marker
              or search any world for details. Focus returns the camera to your
              selection.
            </p>
            <p>
              Days, Years and 10 Years set simulated time per real second. Pause
              before closely inspecting a moon. Drag the timeline or enter a
              date to time travel.
            </p>
            <p>
              Educational scale compresses distances and enlarges worlds.
              Realistic scale uses one consistent kilometre scale; markers stay
              visible. Moon Dance centres the camera on a planet.
            </p>
            <p>
              Planet elements: JPL approximate J2000. Satellite records: JPL
              mean elements, physical parameters and discovery catalogue,
              retrieved 24 October 2026. Some provisional records lack complete
              orbits. Unknown properties are never guessed. Fixed two-body
              orbits exclude perturbations and precession, and are educational
              approximations.
            </p>
            <p>
              <a
                href="https://ssd.jpl.nasa.gov/sats/elem/"
                target="_blank"
                rel="noreferrer"
              >
                Satellite elements
              </a>{" "}
              ·{" "}
              <a
                href="https://ssd.jpl.nasa.gov/sats/discovery.html"
                target="_blank"
                rel="noreferrer"
              >
                Discovery catalogue
              </a>{" "}
              ·{" "}
              <a
                href="https://ssd.jpl.nasa.gov/planets/approx_pos.html"
                target="_blank"
                rel="noreferrer"
              >
                Planet model
              </a>
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
