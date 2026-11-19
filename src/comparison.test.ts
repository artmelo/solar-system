import {test} from 'node:test';
import assert from 'node:assert/strict';
import {planets,moons,smallBodies,sun} from './model';
import {sizeComparison,comparisonRows,comparisonName,formatMeasure} from './comparison';
test('size comparison preserves linear diameters and swaps without changing ratio',()=>{
 const [earth,jupiter]=[planets[2],planets[4]],sizes=sizeComparison(earth,jupiter)!;
 assert.equal(sizes.right,1);assert.equal(sizes.left,earth.radius!/jupiter.radius!);
 assert.equal(sizes.ratio,jupiter.radius!/earth.radius!);
 const swapped=sizeComparison(jupiter,earth)!;assert.equal(swapped.left,sizes.right);assert.equal(swapped.right,sizes.left);assert.equal(swapped.ratio,sizes.ratio);
});
test('tiny bodies keep real size ratios and unknown measurements remain unknown',()=>{
 const comet=smallBodies.find(b=>b.kind==='comet')!;
 assert.ok(sizeComparison(sun,comet)!.right<.001);
 assert.equal(sizeComparison({...comet,radius:null},sun),null);
 const rows=comparisonRows({...comet,radius:null,mass:null,day:null,a:null,e:null,period:null},sun);
 assert.equal(rows.find(r=>r.label==='Diameter')!.left,'Not recorded');
 assert.equal(rows.find(r=>r.label==='Mass')!.left,'Not recorded');
 assert.equal(rows.find(r=>r.label==='Orbital period')!.right,'—');
 assert.equal(formatMeasure(0),'0');assert.equal(formatMeasure(NaN),'Not recorded');
});
test('rotation flags retrograde spin and moon values keep their parent context',()=>{
 assert.match(comparisonRows(planets[1],planets[2]).find(r=>r.label==='Rotation period')!.left,/5,832.5 hours · retrograde/);
 const europa=moons.find(b=>b.name==='Europa')!;
 assert.match(comparisonName(europa),/Jupiter/);
 const row=comparisonRows(europa,planets[2]).find(r=>r.label==='Orbital period')!;
 assert.equal(row.orbital,true);assert.equal(row.left,formatMeasure(europa.period,'Earth days'));
 assert.ok(!comparisonRows(europa,planets[2]).find(r=>r.label==='Diameter')!.orbital);
});
