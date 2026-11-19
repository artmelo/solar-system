import { useEffect, useState, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { TextureLoader, Texture, SRGBColorSpace, Mesh, AdditiveBlending, BackSide, Color, CanvasTexture } from 'three';
import { type Body } from './model';
const maps: Record<string,string> = {Sun:'sun',Mercury:'mercury',Venus:'venus_atmosphere',Earth:'earth_daymap',Mars:'mars',Jupiter:'jupiter',Saturn:'saturn',Uranus:'uranus',Neptune:'neptune',Moon:'moon'};
function useSurfaceMap(name: string | undefined, alpha=false) {
  const [texture,setTexture]=useState<Texture>();
  useEffect(()=>{
    if(!name)return;
    let cancelled=false;
    const loaded=new TextureLoader().load(`/textures/${name}.jpg`,t=>{if(cancelled){t.dispose();return;}if(!alpha)t.colorSpace=SRGBColorSpace;t.anisotropy=4;setTexture(t);},undefined,()=>{});
    return()=>{cancelled=true;loaded.dispose();};
  },[name,alpha]);
  return texture;
}
function Atmosphere({radius,color}:{radius:number;color:string}) {
  const uniforms=useMemo(()=>({rim:{value:new Color(color)}}),[color]);
  return <mesh scale={1.035} raycast={()=>null}>
    <sphereGeometry args={[radius,48,32]}/>
    <shaderMaterial uniforms={uniforms} transparent depthWrite={false} side={BackSide} blending={AdditiveBlending}
      vertexShader={`varying vec3 n; varying vec3 v; void main(){vec4 world=modelMatrix*vec4(position,1.);n=normalize(mat3(modelMatrix)*normal);v=cameraPosition-world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}`}
      fragmentShader={`uniform vec3 rim; varying vec3 n; varying vec3 v; void main(){float edge=pow(1.-abs(dot(normalize(n),normalize(v))),3.);gl_FragColor=vec4(rim,edge*.48);}`}/>
  </mesh>;
}
function Clouds({radius}:{radius:number}) {
  const map=useSurfaceMap('earth_clouds',true);
  if(!map)return null;
  return <mesh scale={1.008} raycast={()=>null}><sphereGeometry args={[radius,48,32]}/><meshStandardMaterial color="white" alphaMap={map} transparent opacity={.6} depthWrite={false} roughness={1}/></mesh>;
}
function SunGlow({radius}:{radius:number}) {
 const texture=useMemo(()=>{const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d')!,g=ctx.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,190,90,.32)');g.addColorStop(.25,'rgba(255,160,55,.16)');g.addColorStop(1,'rgba(255,120,30,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);return new CanvasTexture(c);},[]);
 useEffect(()=>()=>texture.dispose(),[texture]);
 return <sprite scale={[radius*7,radius*7,1]} raycast={()=>null}><spriteMaterial map={texture} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false}/></sprite>;
}
export default function PlanetSurface({body,radius,days,onSelect}:{body:Body;radius:number;days:number;onSelect:()=>void}) {
  const texture=useSurfaceMap(maps[body.name]);
  const spin=useRef<Mesh>(null);
  const segments=body.parent&&body.name!=='Moon'?[16,12]:[64,48];
  useFrame(()=>{if(spin.current)spin.current.rotation.y=body.day ? ((days*24/body.day)%1)*Math.PI*2 : 0;});
  return <group rotation={[0,0,body.id==='Earth'?.409:0]}>
    <mesh ref={spin} onClick={e=>{e.stopPropagation();onSelect();}}>
      <sphereGeometry args={[radius,segments[0],segments[1]]}/>
      {body.id==='Sun'?<meshBasicMaterial key={texture?.uuid||'fallback'} map={texture} transparent={false} opacity={1} depthTest depthWrite color={texture?'white':'#ffd17a'} toneMapped={false}/>:<meshStandardMaterial key={texture?.uuid||'fallback'} map={texture} transparent={false} opacity={1} depthTest depthWrite metalness={0} color={texture?'white':body.color||'#b6c7da'} roughness={body.id==='Earth'?.82:.95}/>}
      {body.id==='Earth'&&<Clouds radius={radius}/>}
    </mesh>
    {body.id==='Earth'&&<Atmosphere radius={radius} color="#448fff"/>}
    {body.id==='Venus'&&<Atmosphere radius={radius} color="#d9b977"/>}
    {body.id==='Sun'&&<SunGlow radius={radius}/>}
    {body.id==='Sun'&&<Atmosphere radius={radius} color="#ffad3e"/>}
  </group>;
}
