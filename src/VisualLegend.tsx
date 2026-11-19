import './legend.css';
export default function VisualLegend({ real }: { real: boolean }) {
  return (
    <section id="visual-legend" popover="auto" className="visual-legend" aria-labelledby="legend-title">
      <div className="legend-heading">
        <h2 id="legend-title">Reading the sky</h2>
        <button popoverTarget="visual-legend" popoverTargetAction="hide" aria-label="Close legend">✕</button>
      </div>
      <h3>Dots you can select</h3>
      <ul className="legend-symbols">
        <li><span className="legend-dot legend-world" aria-hidden="true"/><span>White · Sun & planets</span></li>
        <li><span className="legend-dot legend-moon" aria-hidden="true"/><span>Small white · Moons</span></li>
        <li><span className="legend-dot legend-asteroid" aria-hidden="true"/><span>Amber · Asteroids</span></li>
        <li><span className="legend-dot legend-comet" aria-hidden="true"/><span>Cyan · Comets</span></li>
        <li><span className="legend-dot legend-selected" aria-hidden="true"/><span>Gold · Your selected body, of any kind</span></li>
      </ul>
      <p className="legend-hint">Click or tap a dot for its field guide. Background stars and distant galaxies are decorative.</p>
      <h3>Paths & trails</h3>
      <ul className="legend-symbols legend-paths">
        <li><span className="legend-line legend-orbit" aria-hidden="true"/><span><strong>Faint line</strong> · Full orbital path. Comet orbit lines show the region within 70 AU of the Sun.</span></li>
        <li><span className="legend-line legend-trail" aria-hidden="true"/><span><strong>Bright segment</strong> · Recent motion. Gold for planets; the body’s colour for a selected asteroid or comet. Toggle with Trails.</span></li>
        <li><span className="legend-line legend-wake" aria-hidden="true"/><span><strong>Cyan particles</strong> · A comet’s stylized wake follows its orbit. It is separate from the Trails toggle.</span></li>
      </ul>
      <h3>Two ways to see scale</h3>
      <p className="legend-current">Current view: {real ? 'Realistic' : 'Educational'}</p>
      <dl className="legend-scales">
        <div className={!real ? 'is-current' : ''}><dt>Educational</dt><dd>Distances are compressed. Worlds and moon systems are enlarged so they are easier to discover. Sizes and gaps are not directly comparable.</dd></div>
        <div className={real ? 'is-current' : ''}><dt>Realistic</dt><dd>Body sizes and orbital distances use one physical scale. Dots stay visible even when a world is too small to see; comet effects remain illustrative.</dd></div>
      </dl>
      <p className="legend-hint">Use the Educational / Realistic buttons to switch. Open Compare for a shared size scale.</p>
    </section>
  );
}
