import {test} from 'node:test';
import assert from 'node:assert/strict';
import {planets,size} from './model';
import {easeFlight,flightPose,closeupDistance,displayRadius} from './cinematic';
test('camera flight starts exactly at current pose and arrives at moving target plus offset',()=>{
 const from:[number,number,number]=[0,60,80],look:[number,number,number]=[0,0,0],target:[number,number,number]=[17,2,-3],offset:[number,number,number]=[0,1,4];
 assert.deepEqual(flightPose(from,look,target,offset,0),{position:from,target:look});
 assert.deepEqual(flightPose(from,look,target,offset,1),{position:[17,3,1],target});
 assert.deepEqual(flightPose(from,look,[18,2,-3],offset,1).position,[18,3,1]);
});
test('flight easing is bounded, monotonic and independent of frame count',()=>{
 let last=0;for(let i=0;i<=100;i++){const t=easeFlight(i/100);assert.ok(t>=last&&t<=1);last=t;}
 assert.equal(easeFlight(-1),0);assert.equal(easeFlight(2),1);assert.equal(easeFlight(.5),.5);
 assert.ok(easeFlight(.01)<.0001);assert.ok(1-easeFlight(.99)<.0001);
});
test('closeups fit planetary discs and Saturn rings, including portrait screens and physical scales',()=>{
 for(const b of planets)for(const real of [false,true])for(const aspect of [.5,1,2]){
 const r=displayRadius(b,real)*(b.id==='Saturn'?2.2:1),distance=closeupDistance(b,real,aspect);
 const half=Math.min(Math.PI/8,Math.atan(Math.tan(Math.PI/8)*aspect));
 assert.ok(distance*Math.sin(half)>r);if(real)assert.equal(displayRadius(b,true),size(b,true));
 }
 assert.ok(closeupDistance(planets[2],false,.5)>closeupDistance(planets[2],false,2));
});
test('low-angle opening fits projected orbital disc in desktop and portrait views',async()=>{
 const {cinematicOverviewDistance}=await import('./cinematic');
 for(const aspect of [.5,1,2.5]){const radius=45,d=cinematicOverviewDistance(radius,aspect),v=Math.PI/8,h=Math.atan(Math.tan(v)*aspect);assert.ok(d*Math.sin(h)>radius);assert.ok(d*Math.sin(v)>radius*.45);}
});
