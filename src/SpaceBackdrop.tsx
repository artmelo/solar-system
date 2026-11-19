import { useMemo, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { BackSide, CanvasTexture, SRGBColorSpace, Group } from 'three';
// Decorative distant sky, not a catalogue or a map of observed galaxy positions.
export default function SpaceBackdrop() {
  const mesh=useRef<Group>(null);
  const {camera}=useThree();
  const texture=useMemo(()=>{
    const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1024;
    const ctx=canvas.getContext('2d')!;
    let seed=7319;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    ctx.fillStyle='#030610';ctx.fillRect(0,0,2048,1024);
    for(let i=0;i<7;i++){
      const x=i*350,y=430+Math.sin(i*.9)*110;
      const haze=ctx.createRadialGradient(x,y,0,x,y,340);
      haze.addColorStop(0,'rgba(61,80,125,.1)');haze.addColorStop(1,'rgba(8,14,28,0)');
      ctx.fillStyle=haze;ctx.fillRect(x-340,y-340,680,680);
    }
    for(const [x,y,r,angle] of [[1610,475,84,-.5],[1430,650,48,.6],[1010,410,54,.4],[410,570,65,-.7],[1920,360,42,.3]]){
      ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(1,.42);
      const glow=ctx.createRadialGradient(0,0,0,0,0,r);glow.addColorStop(0,'rgba(225,217,199,.25)');glow.addColorStop(.25,'rgba(162,178,214,.09)');glow.addColorStop(1,'rgba(89,116,165,0)');ctx.fillStyle=glow;ctx.fillRect(-r,-r,r*2,r*2);
      for(let i=0;i<1100;i++){
        const distance=Math.pow(random(),.6)*r,arm=i%2*Math.PI,theta=arm+distance/r*5+(random()-.5)*.65;
        const px=Math.cos(theta)*distance,py=Math.sin(theta)*distance;
        ctx.fillStyle=`rgba(181,199,232,${.035+(1-distance/r)*.1})`;
        ctx.beginPath();ctx.arc(px,py,.35+random()*.85,0,Math.PI*2);ctx.fill();
      }
      const core=ctx.createRadialGradient(0,0,0,0,0,r*.16);core.addColorStop(0,'rgba(246,226,191,.6)');core.addColorStop(1,'rgba(227,218,203,0)');ctx.fillStyle=core;ctx.fillRect(-r*.2,-r*.2,r*.4,r*.4);ctx.restore();
    }
    const map=new CanvasTexture(canvas);map.colorSpace=SRGBColorSpace;return map;
  },[]);
  const stars=useMemo(()=>{
    const positions=new Float32Array(8500*3),colors=new Float32Array(8500*3);let seed=2917;
    const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    for(let i=0;i<8500;i++){const y=random()*2-1,theta=random()*Math.PI*2,r=Math.sqrt(1-y*y),brightness=.22+random()*.75;positions.set([r*Math.cos(theta)*9000,y*9000,r*Math.sin(theta)*9000],i*3);colors.set([brightness*.88,brightness*.94,brightness],i*3);}
    return {positions,colors};
  },[]);
  useEffect(()=>()=>texture.dispose(),[texture]);
  useFrame(()=>{mesh.current?.position.copy(camera.position);});
  return <group ref={mesh}>
    <mesh renderOrder={-100} raycast={()=>null}><sphereGeometry args={[15000,32,24]}/><meshBasicMaterial map={texture} side={BackSide} depthWrite={false} toneMapped={false}/></mesh>
    <points renderOrder={-90} frustumCulled={false} raycast={()=>null}><bufferGeometry><bufferAttribute attach="attributes-position" args={[stars.positions,3]}/><bufferAttribute attach="attributes-color" args={[stars.colors,3]}/></bufferGeometry><pointsMaterial size={1.2} sizeAttenuation={false} vertexColors depthWrite={false} toneMapped={false}/></points>
  </group>;
}
