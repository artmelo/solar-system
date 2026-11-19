import { useMemo, useEffect, useRef } from "react";
import { CanvasTexture, Sprite, Vector3 } from "three";
import {useFrame,useThree} from "@react-three/fiber";
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
        depthTest
        depthWrite={false}
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
  radius=0,
}: {
  select: () => void;
  selected: boolean;
  moon: boolean;
  color?: string;
  radius?: number;
}) {
  const sprite=useRef<Sprite>(null);
  const {camera}=useThree();
  const centre=useMemo(()=>new Vector3(),[]),direction=useMemo(()=>new Vector3(),[]);
  useFrame(()=>{if(!sprite.current?.parent)return;const parent=sprite.current.parent;parent.getWorldPosition(centre);direction.copy(camera.position).sub(centre).normalize().multiplyScalar(radius*1.03);sprite.current.position.copy(parent.worldToLocal(centre.add(direction)));});
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
      ref={sprite}
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
        depthTest
        depthWrite={false}
        sizeAttenuation={false}
        toneMapped={false}
      />
    </sprite>
  );
}
