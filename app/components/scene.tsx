"use client";
import { useThree } from "@react-three/fiber";
import { OrbitControls, Box, useTexture, Sphere } from "@react-three/drei";
import { useState, useRef, useEffect } from "react";
import * as THREE from "three";

interface BoundingBox {
  id: string;
  position: [number, number, number];
  size: [number, number, number];
  label: "car" | "pedestrian" | "cyclist";
  color: string;
}

function BackgroundPlane() {
  const texture = useTexture("/images/street.png");

  return (
    <mesh position={[0, 0, -10]} rotation={[0, 0, 0]}>
      <planeGeometry args={[30, 15]} />
      <meshBasicMaterial map={texture} transparent opacity={0.9} />
    </mesh>
  );
}

function ResizeHandles({
  position,
  size,
  onResize,
}: {
  position: [number, number, number];
  size: [number, number, number];
  onResize: (newSize: [number, number, number]) => void;
}) {
  const [activeDrag, setActiveDrag] = useState<number | null>(null);

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
            setActiveDrag(i);
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
            setActiveDrag(null);
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

function DraggableBox({
  box,
  isSelected,
  onSelect,
  onDrag,
  onResize,
}: {
  box: BoundingBox;
  isSelected: boolean;
  onSelect: () => void;
  onDrag: (position: [number, number, number]) => void;
  onResize: (size: [number, number, number]) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <group>
      <Box
        ref={meshRef}
        position={box.position}
        args={box.size}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          setIsDragging(true);
        }}
        onPointerUp={() => setIsDragging(false)}
        onPointerMove={(e) => {
          if (isDragging) {
            e.stopPropagation();
            onDrag([e.point.x, box.position[1], e.point.z]);
          }
        }}
      >
        <meshStandardMaterial
          color={box.color}
          wireframe
          opacity={isSelected ? 0.8 : 0.5}
          transparent
        />
        {isSelected && (
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(...box.size)]} />
            <lineBasicMaterial color="#ffffff" linewidth={2} />
          </lineSegments>
        )}
      </Box>

      {isSelected && (
        <ResizeHandles
          position={box.position}
          size={box.size}
          onResize={onResize}
        />
      )}
    </group>
  );
}

export default function Scene({
  boxes,
  selectedBoxId,
  selectedLabel,
  onAddBox,
  onSelectBox,
  onDragBox,
  labelSizes,
  cameraView,
  onResizeBox,
}: {
  boxes: BoundingBox[];
  selectedBoxId: string | null;
  selectedLabel: "car" | "pedestrian" | "cyclist";
  onAddBox: (position: [number, number, number]) => void;
  onSelectBox: (id: string) => void;
  onDragBox: (id: string, position: [number, number, number]) => void;
  labelSizes: any;
  cameraView: "perspective" | "top" | "side";
  onResizeBox: (id: string, size: [number, number, number]) => void;
}) {
  const { camera } = useThree();

  useEffect(() => {
    switch (cameraView) {
      case "top":
        camera.position.set(0, 30, 0);
        camera.lookAt(0, 0, 0);
        break;
      case "side":
        camera.position.set(30, 5, 0);
        camera.lookAt(0, 0, 0);
        break;
      case "perspective":
        camera.position.set(0, 8, 20);
        camera.lookAt(0, 0, 0);
        break;
    }
  }, [cameraView, camera]);

  const handleCanvasClick = (e: any) => {
    if (
      e.object.type === "GridHelper" ||
      e.object.geometry.type === "PlaneGeometry"
    ) {
      const position: [number, number, number] = [
        e.point.x,
        labelSizes[selectedLabel][1] / 2,
        e.point.z,
      ];
      onAddBox(position);
    }
  };

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      <BackgroundPlane />

      {boxes.map((box) => (
        <DraggableBox
          key={box.id}
          box={box}
          isSelected={selectedBoxId === box.id}
          onSelect={() => onSelectBox(box.id)}
          onDrag={(position) => onDragBox(box.id, position)}
          onResize={(size) => onResizeBox(box.id, size)}
        />
      ))}

      <OrbitControls makeDefault />
      <gridHelper
        args={[30, 30, "#333", "#111"]}
        position={[0, 0, 0]}
        onClick={handleCanvasClick}
      />

      {/* Ground plane for clicking */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onClick={handleCanvasClick}
      >
        <planeGeometry args={[30, 30]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </>
  );
}
