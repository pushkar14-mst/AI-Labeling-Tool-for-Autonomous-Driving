"use client";
import { useThree } from "@react-three/fiber";
import { OrbitControls, Box, useTexture, Sphere } from "@react-three/drei";
import { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import ResizeHandles from "./resize-handles";

interface BoundingBox {
  id: string;
  position: [number, number, number];
  size: [number, number, number];
  label: "car" | "pedestrian" | "cyclist";
  color: string;
}

export default function DraggableBox({
  box,
  isSelected,
  onSelect,
  onDrag,
  onResize,
  onDragStart,
  onDragEnd,
}: {
  box: BoundingBox;
  isSelected: boolean;
  onSelect: () => void;
  onDrag: (position: [number, number, number]) => void;
  onResize: (size: [number, number, number]) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { gl } = useThree();

  useEffect(() => {
    const handlePointerUp = () => {
      setIsDragging(false);
      onDragEnd();
    };

    if (isDragging) {
      gl.domElement.addEventListener("pointerup", handlePointerUp);
      return () => {
        gl.domElement.removeEventListener("pointerup", handlePointerUp);
      };
    }
  }, [isDragging, gl, onDragEnd]);

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
          (e as any).target.setPointerCapture((e as any).pointerId);
          setIsDragging(true);
          onDragStart();
        }}
        onPointerMove={(e) => {
          if (isDragging) {
            e.stopPropagation();
            onDrag([e.point.x, box.position[1], e.point.z]);
          }
        }}
      >
        <meshStandardMaterial
          color={box.color}
          metalness={0.2}
          roughness={0.8}
        />
      </Box>
      <lineSegments position={box.position}>
        <edgesGeometry args={[new THREE.BoxGeometry(...box.size)]} />
        <lineBasicMaterial
          color={isSelected ? "#ffffff" : "#000000"}
          linewidth={isSelected ? 3 : 2}
        />
      </lineSegments>

      {isSelected && (
        <ResizeHandles
          position={box.position}
          size={box.size}
          onResize={onResize}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        />
      )}
    </group>
  );
}
