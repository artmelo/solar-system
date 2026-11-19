import { useEffect, useRef, useState, useMemo } from 'react';
import { bodies, type Body } from './model';
import { bodyDescription, comparisonName, comparisonRows, formatMeasure, orbitParent, sizeComparison } from './comparison';
import './compare.css';
const groups = [
  {label:'Sun & planets', items:bodies.filter(b=>!b.parent&&!b.kind)},
  ...['Earth','Mars','Jupiter','Saturn','Uranus','Neptune'].map(parent=>({label:`${parent}’s moons`,items:bodies.filter(b=>b.parent===parent)})),
  {label:'Asteroids & comets',items:bodies.filter(b=>b.kind)},
];
function BodyPicker({side,body,other,onChange}:{side:'First'|'Second';body:Body;other:Body;onChange:(body:Body)=>void}) {
  const [query,setQuery]=useState('');
  const filtered=useMemo(()=>groups.map(group=>({...group,items:group.items.filter(b=>b.id===body.id||`${comparisonName(b)} ${bodyDescription(b)}`.toLowerCase().includes(query.trim().toLowerCase()))})),[query,body.id]);
  const matches=filtered.flatMap(g=>g.items).filter(b=>b.id!==other.id&&`${comparisonName(b)} ${bodyDescription(b)}`.toLowerCase().includes(query.trim().toLowerCase())).length;
  return <div className="compare-picker">
    <label htmlFor={`compare-${side}`}>{side} world</label>
    <input type="search" aria-label={`Search ${side.toLowerCase()} world`} placeholder="Search names…" value={query} onChange={e=>setQuery(e.target.value)}/>
    <select id={`compare-${side}`} value={body.id} onChange={e=>{const next=bodies.find(b=>b.id===e.target.value);if(next){onChange(next);setQuery('');}}}>
      {filtered.filter(g=>g.items.length).map(group=><optgroup key={group.label} label={group.label}>{group.items.map(b=><option key={b.id} value={b.id} disabled={b.id===other.id}>{comparisonName(b)}</option>)}</optgroup>)}
    </select>
    <p>{query&&matches===0?'No matching worlds. Try another name.':bodyDescription(body)}</p>
  </div>;
}
export default function CompareDialog({left,right,onChange,onClose,returnFocusTo}:{left:Body;right:Body;onChange:(left:Body,right:Body)=>void;onClose:()=>void;returnFocusTo:HTMLElement|null}) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const dialog=ref.current!;dialog.showModal();const previous=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{dialog.close();document.body.style.overflow=previous;returnFocusTo?.focus({preventScroll:true});};},[returnFocusTo]);
  const sizes=sizeComparison(left,right);
  const summary=!sizes?'Size comparison needs a recorded radius for both worlds.':sizes.ratio<1.005?`${left.name} and ${right.name} have approximately the same diameter.`:`${sizes.larger.name} is about ${formatMeasure(sizes.ratio)}× wider than ${sizes.smaller.name}.`;
  return <dialog className="comparison" ref={ref} aria-labelledby="compare-title" onCancel={e=>{e.preventDefault();onClose();}} onClose={onClose}>
    <div className="compare-heading"><div><div className="eyebrow">WORLDS, SIDE BY SIDE</div><h2 id="compare-title">A matter of scale.</h2></div><button aria-label="Close comparison" onClick={onClose}>✕</button></div>
    <p className="compare-lede">Choose any two worlds. See how their sizes and rhythms measure up.</p>
    <div className="compare-pickers"><BodyPicker side="First" body={left} other={right} onChange={b=>onChange(b,right)}/><BodyPicker side="Second" body={right} other={left} onChange={b=>onChange(left,b)}/></div>
    <div className="compare-actions"><button onClick={()=>onChange(right,left)}>⇄ Swap worlds</button><span>One shared size scale</span></div>
    <figure className="compare-figure">
      {sizes?<svg viewBox="0 0 600 240" role="img" aria-labelledby="size-title size-desc"><title id="size-title">Relative diameters of {left.name} and {right.name}</title><desc id="size-desc">{summary} Both circles use the same linear diameter scale.</desc><defs><radialGradient id="compare-shade" cx="30%" cy="25%"><stop offset="0" stopColor="white" stopOpacity=".22"/><stop offset="1" stopColor="black" stopOpacity=".5"/></radialGradient></defs>{[left,right].map((body,i)=>{const ratio=i===0?sizes.left:sizes.right,radius=105*ratio,x=i===0?150:450;return <g key={body.id}><circle cx={x} cy="120" r={radius} fill={body.color||'#95a8bc'}/><circle cx={x} cy="120" r={radius} fill="url(#compare-shade)"/>{radius<1&&<><path d={`M ${x} 128 v 30`} stroke="#b4c2d5"/></>}</g>;})}</svg>:<div className="compare-no-size">Size visual unavailable — radius not recorded.</div>}
      {sizes&&<div className="compare-visual-labels">{[left,right].map((body,i)=><div key={body.id}><strong>{body.name}</strong><small>{formatMeasure(body.radius!*2,'km')} across</small>{(i===0?sizes.left:sizes.right)*105<1&&<small>Too small to see at this scale</small>}</div>)}</div>}
      <figcaption aria-live="polite">{summary}</figcaption>
    </figure>
    <div className="compare-table-wrap"><table className="compare-table"><caption>Facts at a glance</caption><thead><tr><th scope="col">Measurement</th><th scope="col">{comparisonName(left)}</th><th scope="col">{comparisonName(right)}</th></tr></thead><tbody>{comparisonRows(left,right).map(row=><tr key={row.label}><th scope="row">{row.label}</th><td>{row.left}{row.orbital&&left.id!=='Sun'&&<small>Around {orbitParent(left)}</small>}</td><td>{row.right}{row.orbital&&right.id!=='Sun'&&<small>Around {orbitParent(right)}</small>}</td></tr>)}</tbody></table></div>
    <p className="compare-note">Sizes use recorded mean radii; small-body diameters may be estimates. Shapes are simplified circles, and separation is for layout. Rotation is a spin, not a sunrise-to-sunrise day. A moon’s orbital values describe its path around its planet; a planet’s describe its path around the Sun. “Not recorded” means the catalogue has no value.</p>
  </dialog>;
}
