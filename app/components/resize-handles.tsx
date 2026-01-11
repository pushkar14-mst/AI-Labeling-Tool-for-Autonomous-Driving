import { Sphere } from "@react-three/drei";
import { useState } from "react";
import * as THREE from "three";

interface ResizeHandlesProps {
  position: [number, number, number];
  size: [number, number, number];
  onResize: (newSize: [number, number, number]) => void;
}

export function ResizeHandles({
  position,
  size,
  onResize,
}: ResizeHandlesProps) {
  const [isDragging, setIsDragging] = useState(false);

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
            setIsDragging(true);
          }}
          onPointerUp={() => setIsDragging(false)}
          onPointerMove={(e) => {
            if (isDragging) {
              e.stopPropagation();
              const newSize = [...size] as [number, number, number];
              const axisName = ['x', 'y', 'z'][handle.axis] as 'x' | 'y' | 'z';
              const delta =
                handle.dir === 1
                  ? e.point[axisName] - handle.pos[handle.axis]
                  : handle.pos[handle.axis] - e.point[axisName];

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
