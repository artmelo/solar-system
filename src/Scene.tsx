import { useMemo, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Line } from "@react-three/drei";
import { Group, Vector3 } from "three";
import PlanetSurface from "./PlanetSurface";
import { displayRadius, closeupDistance, cinematicOverviewDistance, cameraNearPlane, minimumCameraDistance, flightPose, type Point3 } from "./cinematic";
import { Dot, Label } from "./Markers";
import SmallBodyLayer from "./SmallBodyLayer";
import SpaceBackdrop from "./SpaceBackdrop";
import type { OrbitControls as Controls } from "three-stdlib";
import {
  dancePlanet,
  systemOrigin,
  focusPoint,
  systemExtent,
  overviewExtent,
  fitDistance,
} from "./scene-frame";
import {
  type Body,
  planets,
  sun,
  moons,
  position,
  axis,
  size,
  validOrbit,
} from "./model";
export type SceneProps = {
  days: number;
  real: boolean;
  selected: Body;
  select: (b: Body) => void;
  trails: boolean;
  orbits: boolean;
  immersive: boolean;
  labels: boolean;
  dance: boolean;
  home: number;
  asteroids: boolean;
  comets: boolean;
  reducedMotion: boolean;
  onFlightChange: (flying: boolean) => void;
  overview: boolean;
};
function Orbit({
  body,
  real,
  local = false,
  days,
  trail = false,
}: {
  body: Body;
  real: boolean;
  local?: boolean;
  days: number;
  trail?: boolean;
}) {
  const a = axis(body, real, local);
  const sampled = useMemo(
    () =>
      Array.from({ length: 129 }, (_, j) =>
        position(
          body,
          trail
            ? days - body.period! * 0.3 + (j / 128) * body.period! * 0.3
            : (j / 128) * body.period!,
          a,
        ),
      ),
    [body, a, trail, trail ? Math.floor(days) : 0],
  );
  const points=useMemo(()=>{
    if(!trail)return sampled;
    const centre=position(body,days,a),radius=displayRadius(body,real)*1.08;
    return sampled.filter(point=>Math.hypot(...point.map((v,i)=>v-centre[i]))>radius);
  },[sampled,body,days,a,real,trail]);
  if(points.length<2)return null;
  return (
    <Line
      points={points}
      color={trail ? "#f9d68a" : body.color || "#647891"}
      transparent
      opacity={trail ? 0.85 : 0.25}
      depthTest
      depthWrite={false}
      lineWidth={trail ? 2 : 1}
    />
  );
}
function Orb({
  body,
  days,
  real,
  local,
  select,
  selected,
  labels,
  centred = false,
  showMarker = true,
}: {
  body: Body;
  days: number;
  real: boolean;
  local?: boolean;
  select: (b: Body) => void;
  selected: boolean;
  labels: boolean;
  centred?: boolean;
  showMarker?: boolean;
}) {
  const group = useRef<Group>(null);
  const r = displayRadius(body, real);
  useFrame(() => {
    group.current?.position.set(
      ...(centred
        ? ([0, 0, 0] as [number, number, number])
        : position(body, days, axis(body, real, local))),
    );
  },-1);
  return (
    <group ref={group}>
      <PlanetSurface body={body} radius={Math.max(r,real?0:.04)} days={days} onSelect={()=>select(body)}/>
      {body.name === "Saturn" && (
        <mesh rotation={[-Math.PI / 2 + 0.45, 0, 0]}>
          <ringGeometry args={[r * 1.35, r * 2.2, 80]} />
          <meshStandardMaterial
            color="#bda47c"
            side={2}
            transparent
            opacity={0.65}
          />
        </mesh>
      )}
      {showMarker&&<Dot
        select={() => select(body)}
        selected={selected}
        moon={!!body.parent}
        radius={r}
      />}
      {labels && (
        <Label name={body.name} r={Math.max(r, 0.1)} selected={selected} />
      )}
    </group>
  );
}
function World(p: SceneProps) {
  const controls = useRef<Controls>(null);
  const { camera, size: viewport, pointer } = useThree();
  const parent = p.dance ? dancePlanet(p.selected) : undefined;
  const focused=!p.dance&&!p.overview;
  const selectedParent = planets.find((b) => b.name === p.selected.parent);
  const familyParent =
    parent || selectedParent || planets.find((b) => b.id === p.selected.id);
  const extent = useMemo(
    () =>
      p.dance && parent
        ? systemExtent(parent, p.real)
        : overviewExtent(p.real, p.asteroids || p.comets),
    [p.dance, parent, p.real, p.asteroids, p.comets],
  );
  const previous = useRef("");
  const flight = useRef<{from:Point3;lookFrom:Point3;offset:Point3;elapsed:number;duration:number}|null>(null);
  const lastTarget=useRef(new Vector3());
  const parallax=useRef(new Vector3());
  const interacting=useRef(false);
  const localMoons = useMemo(
    () =>
      moons.filter(
        (b) =>
          b.parent ===
            (parent?.name || selectedParent?.name || p.selected.name) &&
          validOrbit(b),
      ),
    [parent, selectedParent, p.selected],
  );
  useEffect(() => {
    previous.current = "";
  }, [p.home]);
  useFrame((_,dt) => {
    if(!controls.current)return;
    const target = new Vector3(...focusPoint(p.selected,p.days,p.real,p.dance));
    const aspect=(viewport.width-(viewport.width>900&&p.overview&&!p.immersive?220:0))/Math.max(viewport.height,1);
    const key=[p.dance?parent!.id:p.selected.id,p.real,p.dance,p.overview,p.immersive,p.home,viewport.width,viewport.height].join();
    if(previous.current!==key){
      camera.position.sub(parallax.current);parallax.current.set(0,0,0);
      previous.current=key;
      const overview=p.overview&&!p.dance;
      const distance=p.dance?fitDistance(extent,aspect):overview?cinematicOverviewDistance(overviewExtent(p.real,false),aspect):p.selected.kind?(p.real?.12:10):closeupDistance(p.selected,p.real,aspect);
      const offset=new Vector3(0,overview?.4:.18,1).normalize().multiplyScalar(distance);
      flight.current={from:camera.position.toArray() as Point3,lookFrom:controls.current.target.toArray() as Point3,offset:offset.toArray() as Point3,elapsed:0,duration:p.reducedMotion?.15:2.4};
      lastTarget.current.copy(target);p.onFlightChange(true);
    }
    if(flight.current){
      const f=flight.current;f.elapsed=Math.min(f.duration,f.elapsed+Math.min(dt,.1));
      const pose=flightPose(f.from,f.lookFrom,target.toArray() as Point3,f.offset,f.elapsed/f.duration);
      camera.position.set(...pose.position);controls.current.target.set(...pose.target);
      if(f.elapsed>=f.duration){flight.current=null;p.onFlightChange(false);}
    }else{
      const delta=target.clone().sub(lastTarget.current);camera.position.add(delta);controls.current.target.add(delta);
      if(!p.reducedMotion&&!interacting.current&&!p.dance&&viewport.width>900){
        const distance=camera.position.distanceTo(controls.current.target);
        const next=new Vector3(pointer.x*distance*.018,pointer.y*distance*.01,0);
        next.lerp(parallax.current,Math.exp(-dt*3));camera.position.add(next.clone().sub(parallax.current));parallax.current.copy(next);
      }
    }
    lastTarget.current.copy(target);
    controls.current.update();
    const near=cameraNearPlane(camera.position.distanceTo(controls.current.target));
    if(Math.abs(camera.near-near)>near*.02){camera.near=near;camera.updateProjectionMatrix();}
  },-2);
  return (
    <>
      <SpaceBackdrop real={p.real}/>
      <ambientLight intensity={p.real?.22:.45} />
      <hemisphereLight args={["#c2d5ef","#27344a",p.real?.12:.55]}/>
      <directionalLight position={[-6,3,2]} intensity={1.8}/>
      <pointLight
        position={[0, 0, 0]}
        intensity={p.dance ? 0 : 110}
        decay={2}
      />
      {p.dance && <directionalLight position={[4, 8, 5]} intensity={2} />}
      {p.dance && parent ? (
        <Orb
          body={parent}
          centred
          days={p.days}
          real={p.real}
          select={p.select}
          selected={p.selected.id === parent.id}
          labels={p.labels&&!p.immersive}
          showMarker={!p.immersive}
        />
      ) : (
        <>
          <Orb
            body={sun}
            days={p.days}
            real={p.real}
            select={p.select}
            selected={p.selected.id === "Sun"}
            labels={p.labels&&!focused&&!p.immersive}
            showMarker={!p.immersive&&(!focused||p.selected.id==="Sun")}
          />
          {planets.map((b) => (
            <group key={b.id}>
              {p.orbits&&(!focused||b.name===p.selected.parent)&&<Orbit body={b} real={p.real} days={p.days} />}
              {p.trails&&(!focused||b.id===p.selected.id)&&<Orbit body={b} real={p.real} days={p.days} trail />}
              <Orb
                body={b}
                days={p.days}
                real={p.real}
                select={p.select}
                selected={p.selected.id === b.id}
                labels={p.labels&&!p.immersive&&(!focused||b.id===p.selected.id)}
                showMarker={!p.immersive&&(!focused||b.id===p.selected.id||b.name===p.selected.parent)}
              />
            </group>
          ))}
        </>
      )}
      {(p.dance || selectedParent || localMoons.length > 0) && (
        <MoonSystem {...p} parent={familyParent} localMoons={localMoons} />
      )}
      {!p.dance && <SmallBodyLayer {...p} />}
      <OrbitControls
        ref={controls}
        makeDefault
        enableDamping
        enablePan={!p.dance}
        onStart={() => {
          if(flight.current){flight.current=null;p.onFlightChange(false);}
          interacting.current=true;
        }}
        onEnd={()=>{interacting.current=false;}}
        minDistance={minimumCameraDistance(parent||p.selected,p.real)}
        maxDistance={100000}
      />
    </>
  );
}
function MoonSystem(p: SceneProps & { parent?: Body; localMoons: Body[] }) {
  const g = useRef<Group>(null);
  useFrame(() => {
    if (g.current && p.parent)
      g.current.position.set(
        ...systemOrigin(p.parent, p.days, p.real, p.dance),
      );
  },-1);
  if (!p.parent) return null;
  return (
    <group ref={g} position={systemOrigin(p.parent, p.days, p.real, p.dance)}>
      {p.localMoons.map((b) => (
        <group key={b.id}>
          {p.orbits && (p.dance || p.selected.id === b.id) && (
            <Orbit body={b} real={p.real} local days={p.days} />
          )}
          <Orb
            body={b}
            days={p.days}
            real={p.real}
            local
            select={p.select}
            selected={p.selected.id === b.id}
            showMarker={!p.immersive}
            labels={
              p.labels && !p.immersive && (p.localMoons.length < 20 || p.selected.id === b.id)
            }
          />
        </group>
      ))}
    </group>
  );
}
export default function Scene(p: SceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 65, 80], fov: 45, near: 0.00001, far: 50000 }}
      dpr={[1, 1.5]}
      fallback={
        <div className="fallback">
          This 3D explorer needs WebGL. You can still browse every body in the
          catalogue.
        </div>
      }
    >
      <World {...p} />
    </Canvas>
  );
}
