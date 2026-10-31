import { useMemo, useEffect } from "react";
import { CanvasTexture } from "three";
export function Label({
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
export function Dot({
  select,
  selected,
  moon,
  color,
}: {
  select: () => void;
  selected: boolean;
  moon: boolean;
  color?: string;
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = selected ? "#f2d18b" : color || "#f4f8ff";
    ctx.beginPath();
    ctx.arc(32, 32, moon ? 4 : 8, 0, Math.PI * 2);
    ctx.fill();
    return new CanvasTexture(canvas);
  }, [selected, moon, color]);
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
