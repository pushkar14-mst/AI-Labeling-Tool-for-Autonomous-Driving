"use client";
import { useThree } from "@react-three/fiber";
import { OrbitControls, Box, useTexture, Sphere } from "@react-three/drei";
import { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import DraggableBox from "./draggable-box";

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
  const [isManipulating, setIsManipulating] = useState(false);
  const controlsRef = useRef<any>(null);

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
    if (isManipulating) {
      return;
    }

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

  function handleDragStart() {
    setIsManipulating(true);
  }

  function handleDragEnd() {
    setIsManipulating(false);
  }

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
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        />
      ))}

      <OrbitControls ref={controlsRef} makeDefault enabled={!isManipulating} />
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
