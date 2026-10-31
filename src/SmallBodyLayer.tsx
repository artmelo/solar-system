import { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import {
  Group,
  Mesh,
  Points,
  CanvasTexture,
  Vector3,
  AdditiveBlending,
  BufferAttribute,
  PointsMaterial,
  Sprite,
} from "three";
import { type Body, smallBodies, position, AU } from "./model";
import {
  smallScenePosition,
  smallOrbit,
  smallTrail,
  tailActivity,
} from "./small-body-orbits";
import { Dot, Label } from "./Markers";
import type { SceneProps } from "./Scene";
function Tail({
  body,
  days,
  real,
}: {
  body: Body;
  days: number;
  real: boolean;
}) {
  const group = useRef<Group>(null),
    points = useRef<Points>(null);
  const coordinates = useMemo(() => new Float32Array(96 * 3), []);
  const direction = useMemo(() => new Vector3(), []),
    forward = useMemo(() => new Vector3(0, 0, 1), []);
  useFrame(() => {
    if (!group.current || !points.current) return;
    const point = smallScenePosition(body, days, real),
      activity = tailActivity(Math.hypot(...position(body, days)) / AU);
    group.current.visible = activity > 0.01;
    if (activity <= 0.01) return;
    group.current.quaternion.setFromUnitVectors(
      forward,
      direction.set(...point).normalize(),
    );
    const length = real ? 0.8 : 1.5 + activity * 4;
    for (let i = 0; i < 96; i++) {
      const t = i / 95,
        phase = i * 2.399 + days * 0.15;
      const spread = (real ? 0.02 : 0.12) * t;
      coordinates[i * 3] = Math.cos(phase) * spread * (0.3 + (i % 7) / 7);
      coordinates[i * 3 + 1] = Math.sin(phase) * spread;
      coordinates[i * 3 + 2] = t * length;
    }
    (
      points.current.geometry.attributes.position as BufferAttribute
    ).needsUpdate = true;
    (points.current.material as PointsMaterial).opacity = 0.65 * activity;
  });
  return (
    <group ref={group}>
      <points ref={points} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[coordinates, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#a3ebff"
          size={2.2}
          sizeAttenuation={false}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
    </group>
  );
}
function Coma({
  real,
  body,
  days,
}: {
  real: boolean;
  body: Body;
  days: number;
}) {
  const sprite = useRef<Sprite>(null);
  useFrame(() => {
    if (sprite.current) {
      const activity = tailActivity(Math.hypot(...position(body, days)) / AU);
      sprite.current.visible = activity > 0.01;
      sprite.current.material.opacity = activity;
    }
  });
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const x = c.getContext("2d")!,
      g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(215,255,255,.7)");
    g.addColorStop(0.25, "rgba(106,221,255,.2)");
    g.addColorStop(1, "rgba(106,221,255,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, 64, 64);
    return new CanvasTexture(c);
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <sprite ref={sprite} scale={real ? [0.04, 0.04, 1] : [0.6, 0.6, 1]}>
      <spriteMaterial
        map={texture}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </sprite>
  );
}
function Visitor({ body, p }: { body: Body; p: SceneProps }) {
  const group = useRef<Group>(null),
    rock = useRef<Mesh>(null);
  const selected = body.id === p.selected.id;
  const path = useMemo(() => smallOrbit(body, p.real), [body, p.real]);
  const trail = useMemo(
    () =>
      p.trails && selected
        ? smallTrail(body, Math.floor(p.days), p.real)
        : null,
    [body, p.real, Math.floor(p.days), p.trails, selected],
  );
  const r = p.real
    ? ((body.radius || 0) / AU) * 12
    : Math.max(0.06, ((body.diameter || 1) / 1000) * 0.24);
  useFrame(() => {
    group.current?.position.set(...smallScenePosition(body, p.days, p.real));
    if (rock.current && body.day)
      rock.current.rotation.y = ((p.days * 24) / body.day) * Math.PI * 2;
  });
  return (
    <>
      <Line
        points={path}
        color={body.color}
        transparent
        opacity={selected ? 0.7 : 0.15}
        lineWidth={selected ? 1.5 : 0.7}
      />
      {trail && (
        <Line
          points={trail}
          color={body.color}
          transparent
          opacity={0.9}
          lineWidth={2}
        />
      )}
      <group ref={group}>
        <mesh
          ref={rock}
          scale={[1, 0.72, 0.83]}
          onClick={(e) => {
            e.stopPropagation();
            p.select(body);
          }}
        >
          <icosahedronGeometry args={[r, 1]} />
          <meshStandardMaterial
            color={body.kind === "comet" ? "#a5bbb9" : "#9e8472"}
            flatShading
            roughness={1}
          />
        </mesh>
        <Dot
          select={() => p.select(body)}
          selected={selected}
          moon={false}
          color={body.color}
        />
        {body.kind === "comet" && (
          <>
            <Coma real={p.real} body={body} days={p.days} />
            <Tail body={body} days={p.days} real={p.real} />
          </>
        )}
        {selected && p.labels && <Label name={body.name} r={r} selected />}
      </group>
    </>
  );
}
export default function SmallBodyLayer(p: SceneProps) {
  return (
    <>
      {smallBodies
        .filter((b) => (b.kind === "comet" ? p.comets : p.asteroids))
        .map((body) => (
          <Visitor key={body.id} body={body} p={p} />
        ))}
    </>
  );
}
