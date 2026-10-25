import { useMemo, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Line } from "@react-three/drei";
import { Group, Vector3, CanvasTexture } from "three";
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
  labels: boolean;
  dance: boolean;
  home: number;
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
  const points = useMemo(
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
  return (
    <Line
      points={points}
      color={trail ? "#f9d68a" : body.color || "#647891"}
      transparent
      opacity={trail ? 0.85 : 0.25}
      lineWidth={trail ? 2 : 1}
    />
  );
}
function Label({
  name,
  r,
  selected,
}: {
  name: string;
  r: number;
  selected: boolean;
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 96;
    const ctx = canvas.getContext("2d")!;
    ctx.font = "500 32px sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = selected ? "#f2d18b" : "#bdcde0";
    ctx.fillText(name, 256, 58);
    return new CanvasTexture(canvas);
  }, [name, selected]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <sprite position={[0, r + 0.75, 0]} scale={[0.24, 0.045, 1]}>
      <spriteMaterial
        map={texture}
        transparent
        depthTest={false}
        sizeAttenuation={false}
      />
    </sprite>
  );
}
function Dot({
  select,
  selected,
  moon,
}: {
  select: () => void;
  selected: boolean;
  moon: boolean;
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = selected ? "#f2d18b" : "#f4f8ff";
    ctx.beginPath();
    ctx.arc(32, 32, moon ? 4 : 8, 0, Math.PI * 2);
    ctx.fill();
    return new CanvasTexture(canvas);
  }, [selected, moon]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <sprite
      renderOrder={10}
      scale={[0.032, 0.032, 1]}
      onClick={(e) => {
        e.stopPropagation();
        select();
      }}
    >
      <spriteMaterial
        map={texture}
        transparent
        depthTest={false}
        sizeAttenuation={false}
        toneMapped={false}
      />
    </sprite>
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
}: {
  body: Body;
  days: number;
  real: boolean;
  local?: boolean;
  select: (b: Body) => void;
  selected: boolean;
  labels: boolean;
  centred?: boolean;
}) {
  const group = useRef<Group>(null);
  const r = size(body, real);
  useFrame(() => {
    group.current?.position.set(
      ...(centred
        ? ([0, 0, 0] as [number, number, number])
        : position(body, days, axis(body, real, local))),
    );
  });
  return (
    <group ref={group}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          select(body);
        }}
      >
        <sphereGeometry args={[Math.max(r, real ? 0 : 0.04), 32, 24]} />
        <meshStandardMaterial
          color={body.color || "#b6c7da"}
          roughness={0.85}
          emissive={body.id === "Sun" ? "#ffad3e" : "#000000"}
          emissiveIntensity={body.id === "Sun" ? 2 : 0}
        />
      </mesh>
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
      <Dot
        select={() => select(body)}
        selected={selected}
        moon={!!body.parent}
      />
      {(labels || selected) && (
        <Label name={body.name} r={Math.max(r, 0.1)} selected={selected} />
      )}
    </group>
  );
}
function World(p: SceneProps) {
  const controls = useRef<Controls>(null);
  const { camera, size: viewport } = useThree();
  const parent = p.dance ? dancePlanet(p.selected) : undefined;
  const selectedParent = planets.find((b) => b.name === p.selected.parent);
  const familyParent =
    parent || selectedParent || planets.find((b) => b.id === p.selected.id);
  const extent = useMemo(
    () =>
      p.dance && parent ? systemExtent(parent, p.real) : overviewExtent(p.real),
    [p.dance, parent, p.real],
  );
  const previous = useRef("");
  const destination = useRef<Vector3 | null>(null);
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
  useFrame(() => {
    if (!controls.current) return;
    const target = new Vector3(
      ...focusPoint(p.selected, p.days, p.real, p.dance),
    );
    // Track moving solar-system targets, but keep Moon Dance at its shared origin.
    const delta = target.clone().sub(controls.current.target);
    camera.position.add(delta);
    controls.current.target.copy(target);
    if (destination.current) destination.current.add(delta);
    const aspect = viewport.width / Math.max(viewport.height, 1);
    const focusId = p.dance ? parent!.id : p.selected.id;
    const key = [
      focusId,
      p.real,
      p.dance,
      p.home,
      viewport.width,
      viewport.height,
    ].join();
    if (previous.current !== key) {
      previous.current = key;
      const distance =
        p.dance || p.selected.id === "Sun"
          ? fitDistance(extent, aspect)
          : p.real
            ? Math.max(
                size(p.selected, true) * 12,
                p.selected.parent ? 0.015 : 0.12,
              )
            : 14;
      destination.current = target
        .clone()
        .add(new Vector3(0, 0.8, 1).normalize().multiplyScalar(distance));
    }
    if (destination.current) {
      camera.position.lerp(destination.current, 0.09);
      if (
        camera.position.distanceTo(destination.current) <
        Math.max(extent * 1e-7, 1e-8)
      )
        destination.current = null;
    }
    controls.current.update();
  });
  return (
    <>
      <ambientLight intensity={0.7} />
      <pointLight
        position={[0, 0, 0]}
        intensity={p.dance ? 0 : 250}
        decay={1}
      />
      {p.dance && <directionalLight position={[4, 8, 5]} intensity={2} />}
      <Stars
        radius={450}
        depth={200}
        count={2500}
        factor={3}
        fade
        speed={0.15}
      />
      {p.dance && parent ? (
        <Orb
          body={parent}
          centred
          days={p.days}
          real={p.real}
          select={p.select}
          selected={p.selected.id === parent.id}
          labels={p.labels}
        />
      ) : (
        <>
          <Orb
            body={sun}
            days={p.days}
            real={p.real}
            select={p.select}
            selected={p.selected.id === "Sun"}
            labels={p.labels}
          />
          {planets.map((b) => (
            <group key={b.id}>
              <Orbit body={b} real={p.real} days={p.days} />
              {p.trails && <Orbit body={b} real={p.real} days={p.days} trail />}
              <Orb
                body={b}
                days={p.days}
                real={p.real}
                select={p.select}
                selected={p.selected.id === b.id}
                labels={p.labels}
              />
            </group>
          ))}
        </>
      )}
      {(p.dance || selectedParent || localMoons.length > 0) && (
        <MoonSystem {...p} parent={familyParent} localMoons={localMoons} />
      )}
      <OrbitControls
        ref={controls}
        makeDefault
        enableDamping
        enablePan={!p.dance}
        onStart={() => {
          destination.current = null;
        }}
        minDistance={0.003}
        maxDistance={1800}
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
  });
  if (!p.parent) return null;
  return (
    <group ref={g} position={systemOrigin(p.parent, p.days, p.real, p.dance)}>
      {p.localMoons.map((b) => (
        <group key={b.id}>
          {(p.dance || p.selected.id === b.id) && (
            <Orbit body={b} real={p.real} local days={p.days} />
          )}
          <Orb
            body={b}
            days={p.days}
            real={p.real}
            local
            select={p.select}
            selected={p.selected.id === b.id}
            labels={
              p.labels && (p.localMoons.length < 20 || p.selected.id === b.id)
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
      camera={{ position: [0, 65, 80], fov: 45, near: 0.00001, far: 3000 }}
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
