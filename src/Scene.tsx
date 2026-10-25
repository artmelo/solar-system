import { useMemo, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Line } from "@react-three/drei";
import { Group, Vector3, Mesh, CanvasTexture } from "three";
import type { OrbitControls as Controls } from "three-stdlib";
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
    <sprite position={[0, r + 0.75, 0]} scale={[4.5, 0.85, 1]}>
      <spriteMaterial map={texture} transparent depthTest={false} />
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
}: {
  body: Body;
  days: number;
  real: boolean;
  local?: boolean;
  select: (b: Body) => void;
  selected: boolean;
  labels: boolean;
}) {
  const group = useRef<Group>(null),
    marker = useRef<Mesh>(null);
  const r = size(body, real);
  useFrame(({ clock }) => {
    group.current?.position.set(
      ...position(body, days, axis(body, real, local)),
    );
    if (marker.current)
      marker.current.scale.setScalar(
        1 + 0.22 * Math.sin(clock.elapsedTime * 3),
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
      <mesh
        ref={marker}
        onClick={(e) => {
          e.stopPropagation();
          select(body);
        }}
      >
        <sphereGeometry
          args={[Math.max(r * 1.25, real ? 0.09 : 0.13), 12, 8]}
        />
        <meshBasicMaterial
          color={selected ? "#fff1b0" : body.color || "#b2c9e7"}
          wireframe
          transparent
          opacity={0.45}
        />
      </mesh>
      {(labels || selected) && (
        <Label name={body.name} r={Math.max(r, 0.1)} selected={selected} />
      )}
    </group>
  );
}
function World(p: SceneProps) {
  const controls = useRef<Controls>(null);
  const { camera } = useThree();
  const focus = p.dance
    ? p.selected.parent ||
      (["Sun", "Mercury", "Venus"].includes(p.selected.name)
        ? "Jupiter"
        : p.selected.name)
    : null;
  const parent = planets.find((b) => b.name === focus);
  const selectedParent = planets.find((b) => b.name === p.selected.parent);
  const targetBody = parent || selectedParent || p.selected;
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
    let target = new Vector3();
    if (!p.dance && targetBody.id !== "Sun")
      target.set(...position(targetBody, p.days, axis(targetBody, p.real)));
    if (p.selected.parent && validOrbit(p.selected))
      target.add(
        new Vector3(
          ...position(p.selected, p.days, axis(p.selected, p.real, true)),
        ),
      );
    const key = [p.selected.id, p.real, p.dance, p.home].join();
    if (previous.current !== key) {
      previous.current = key;
      const distance = p.dance
        ? 32
        : p.selected.id === "Sun"
          ? p.real
            ? 520
            : 85
          : p.real
            ? Math.max(
                size(p.selected, true) * 12,
                p.selected.parent ? 0.015 : 0.12,
              )
            : 14;
      destination.current = target
        .clone()
        .add(new Vector3(0, distance * 0.8, distance));
    }
    const delta = target.clone().sub(controls.current.target);
    camera.position.add(delta);
    controls.current.target.copy(target);
    if (destination.current) {
      camera.position.lerp(destination.current, 0.065);
      if (camera.position.distanceTo(destination.current) < 0.01)
        destination.current = null;
      else destination.current.add(delta);
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
          body={{ ...parent, a: 0, period: 0 }}
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
        <MoonSystem
          {...p}
          parent={
            parent ||
            selectedParent ||
            planets.find((b) => b.id === p.selected.id)
          }
          localMoons={localMoons}
        />
      )}
      <OrbitControls
        ref={controls}
        makeDefault
        enableDamping
        minDistance={0.003}
        maxDistance={1800}
      />
    </>
  );
}
function MoonSystem(p: SceneProps & { parent?: Body; localMoons: Body[] }) {
  const g = useRef<Group>(null);
  useFrame(() => {
    if (g.current && p.parent && !p.dance)
      g.current.position.set(
        ...position(p.parent, p.days, axis(p.parent, p.real)),
      );
  });
  if (!p.parent) return null;
  return (
    <group ref={g}>
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
      dpr={[1, 1.7]}
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
