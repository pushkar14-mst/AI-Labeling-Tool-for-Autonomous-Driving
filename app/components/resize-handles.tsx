"use client";
import { useThree } from "@react-three/fiber";
import { Sphere } from "@react-three/drei";
import { useState, useRef, useEffect } from "react";

export default function ResizeHandles({
  position,
  size,
  onResize,
  onDragStart,
  onDragEnd,
}: {
  position: [number, number, number];
  size: [number, number, number];
  onResize: (newSize: [number, number, number]) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const [activeDrag, setActiveDrag] = useState<number | null>(null);
  const { gl } = useThree();

  useEffect(() => {
    const handlePointerUp = (e: PointerEvent) => {
      e.stopPropagation();
      setActiveDrag(null);
      onDragEnd();
    };

    if (activeDrag !== null) {
      gl.domElement.addEventListener("pointerup", handlePointerUp, true);
      return () => {
        gl.domElement.removeEventListener("pointerup", handlePointerUp, true);
      };
    }
  }, [activeDrag, gl, onDragEnd]);

  const handles = [
    // X-axis handles
    {
      pos: [position[0] + size[0] / 2, position[1], position[2]],
      axis: 0,
      dir: 1,
    },
    {
      pos: [position[0] - size[0] / 2, position[1], position[2]],
      axis: 0,
      dir: -1,
    },
    // Z-axis handles
    {
      pos: [position[0], position[1], position[2] + size[2] / 2],
      axis: 2,
      dir: 1,
    },
    {
      pos: [position[0], position[1], position[2] - size[2] / 2],
      axis: 2,
      dir: -1,
    },
    // Y-axis handles (height)
    {
      pos: [position[0], position[1] + size[1] / 2, position[2]],
      axis: 1,
      dir: 1,
    },
  ];

  return (
    <>
      {handles.map((handle, i) => (
        <Sphere
          key={i}
          position={handle.pos as [number, number, number]}
          args={[0.2, 16, 16]}
          onPointerDown={(e) => {
            e.stopPropagation();
            (e as any).target.setPointerCapture((e as any).pointerId);
            setActiveDrag(i);
            onDragStart();
          }}
          onPointerMove={(e) => {
            if (activeDrag === i) {
              e.stopPropagation();
              const newSize = [...size] as [number, number, number];
              const pointValue = e.point.toArray()[handle.axis];
              const handleValue = handle.pos[handle.axis];
              const delta =
                handle.dir === 1
                  ? pointValue - handleValue
                  : handleValue - pointValue;

              newSize[handle.axis] = Math.max(
                0.5,
                size[handle.axis] + delta * 2
              );
              onResize(newSize);
            }
          }}
        >
          <meshBasicMaterial color="#ffff00" />
        </Sphere>
      ))}
    </>
  );
}
