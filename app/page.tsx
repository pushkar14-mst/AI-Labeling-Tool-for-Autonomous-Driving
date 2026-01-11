"use client";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Box, useTexture } from "@react-three/drei";
import { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import Scene from "./components/scene";
import { ViewSwitcher } from "./components/view-switcher";

interface BoundingBox {
  id: string;
  position: [number, number, number];
  size: [number, number, number];
  label: "car" | "pedestrian" | "cyclist";
  color: string;
}
const labelColors = {
  car: "#3b82f6",
  pedestrian: "#ef4444",
  cyclist: "#22c55e",
};

const labelSizes = {
  car: [4, 2, 2] as [number, number, number],
  pedestrian: [0.6, 1.8, 0.6] as [number, number, number],
  cyclist: [1.8, 1.8, 0.8] as [number, number, number],
};

export default function LabelingTool() {
  const [boxes, setBoxes] = useState<BoundingBox[]>([]);
  const [selectedLabel, setSelectedLabel] = useState<
    "car" | "pedestrian" | "cyclist"
  >("car");
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [history, setHistory] = useState<BoundingBox[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [fps, setFps] = useState(60);
  const [wireframeMode, setWireframeMode] = useState(true);
  const [cameraView, setCameraView] = useState<"perspective" | "top" | "side">(
    "perspective"
  );
  // FPS Counter

  useEffect(() => {
    let lastTime = performance.now();
    let frames = 0;

    const measureFps = () => {
      frames++;
      const currentTime = performance.now();
      if (currentTime >= lastTime + 1000) {
        setFps(Math.round((frames * 1000) / (currentTime - lastTime)));
        frames = 0;
        lastTime = currentTime;
      }
      requestAnimationFrame(measureFps);
    };

    const rafId = requestAnimationFrame(measureFps);
    return () => cancelAnimationFrame(rafId);
  }, []);
  const updateBoxSize = (id: string, size: [number, number, number]) => {
    const newBoxes = boxes.map((box) =>
      box.id === id ? { ...box, size } : box
    );
    setBoxes(newBoxes);
    addToHistory(newBoxes);
  };
  const addToHistory = (newBoxes: BoundingBox[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newBoxes);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const addBox = (position: [number, number, number]) => {
    const newBox: BoundingBox = {
      id: Math.random().toString(),
      position,
      size: labelSizes[selectedLabel],
      label: selectedLabel,
      color: labelColors[selectedLabel],
    };
    const newBoxes = [...boxes, newBox];
    setBoxes(newBoxes);
    addToHistory(newBoxes);
  };

  const deleteBox = (id: string) => {
    const newBoxes = boxes.filter((box) => box.id !== id);
    setBoxes(newBoxes);
    addToHistory(newBoxes);
    if (selectedBoxId === id) setSelectedBoxId(null);
  };

  const updateBoxPosition = (
    id: string,
    position: [number, number, number]
  ) => {
    const newBoxes = boxes.map((box) =>
      box.id === id ? { ...box, position } : box
    );
    setBoxes(newBoxes);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setBoxes(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setBoxes(history[historyIndex + 1]);
    }
  };

  const exportLabels = () => {
    const exportData = boxes.map((box) => ({
      class: box.label,
      position: box.position,
      dimensions: box.size,
      rotation: 0,
    }));

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `labels_${Date.now()}.json`;
    a.click();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Prevent if typing in input
      if (e.target instanceof HTMLInputElement) return;

      if (e.key === "c" || e.key === "C") setSelectedLabel("car");
      if (e.key === "p" || e.key === "P") setSelectedLabel("pedestrian");
      if (e.key === "b" || e.key === "B") setSelectedLabel("cyclist");
      if (e.key === "Delete" && selectedBoxId) deleteBox(selectedBoxId);
      if (e.key === "w" || e.key === "W") setWireframeMode(!wireframeMode);

      // Undo/Redo
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (
        (e.metaKey || e.ctrlKey) &&
        (e.key === "Z" || (e.shiftKey && e.key === "z"))
      ) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [selectedBoxId, boxes, historyIndex, wireframeMode]);

  const stats = {
    car: boxes.filter((b) => b.label === "car").length,
    pedestrian: boxes.filter((b) => b.label === "pedestrian").length,
    cyclist: boxes.filter((b) => b.label === "cyclist").length,
  };

  return (
    <div className="h-screen flex bg-black">
      <div className="flex-1 relative">
        <Canvas
          camera={{ position: [0, 8, 20], fov: 60 }}
          style={{ background: "#0a0a0a" }}
        >
          <Scene
            boxes={boxes}
            selectedBoxId={selectedBoxId}
            selectedLabel={selectedLabel}
            cameraView={cameraView}
            labelSizes={labelSizes}
            onAddBox={addBox}
            onSelectBox={setSelectedBoxId}
            onDragBox={updateBoxPosition}
            onResizeBox={updateBoxSize}
          />
        </Canvas>
        <ViewSwitcher currentView={cameraView} onViewChange={setCameraView} />

        <div className="absolute top-4 left-4 space-y-2">
          <div className="bg-black/70 text-green-400 px-3 py-2 rounded font-mono text-sm">
            {fps} FPS
          </div>
          <div className="bg-black/70 text-white px-3 py-2 rounded text-sm">
            Mode:{" "}
            <span className="text-blue-400 capitalize">{selectedLabel}</span>
          </div>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-4 left-4 bg-black/70 text-white px-4 py-3 rounded text-sm max-w-md">
          <p className="font-semibold mb-1">
            Click on ground to place {selectedLabel}
          </p>
          <p className="text-gray-400 text-xs">
            Drag boxes to move them around
          </p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="w-80 bg-gray-900 text-white p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            AI Labeling Tool for Autonomous Driving
          </h1>
          <div className="text-xs text-gray-400">v1.0</div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="bg-blue-900/30 border border-blue-500 p-3 rounded text-center">
            <div className="text-2xl font-bold">{stats.car}</div>
            <div className="text-xs text-gray-400">Cars</div>
          </div>
          <div className="bg-red-900/30 border border-red-500 p-3 rounded text-center">
            <div className="text-2xl font-bold">{stats.pedestrian}</div>
            <div className="text-xs text-gray-400">Pedestrians</div>
          </div>
          <div className="bg-green-900/30 border border-green-500 p-3 rounded text-center">
            <div className="text-2xl font-bold">{stats.cyclist}</div>
            <div className="text-xs text-gray-400">Cyclists</div>
          </div>
        </div>

        {/* Object Type Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Object Type</label>
          <div className="space-y-2">
            {(["car", "pedestrian", "cyclist"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedLabel(type)}
                className={`w-full p-3 rounded text-left transition ${
                  selectedLabel === type
                    ? "bg-blue-600 ring-2 ring-blue-400"
                    : "bg-gray-800 hover:bg-gray-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="capitalize font-medium">{type}</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: labelColors[type] }}
                    />
                    <span className="text-xs text-gray-400">
                      ({type[0].toUpperCase()})
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Undo/Redo */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={undo}
            disabled={historyIndex === 0}
            className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed p-2 rounded text-sm transition"
          >
            ← Undo
          </button>
          <button
            onClick={redo}
            disabled={historyIndex === history.length - 1}
            className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed p-2 rounded text-sm transition"
          >
            Redo →
          </button>
        </div>

        {/* Labeled Objects List */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Objects ({boxes.length})</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {boxes.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-8">
                Click on the ground to add objects
              </div>
            ) : (
              boxes.map((box) => (
                <div
                  key={box.id}
                  onClick={() => setSelectedBoxId(box.id)}
                  className={`bg-gray-800 p-3 rounded flex justify-between items-center cursor-pointer transition ${
                    selectedBoxId === box.id
                      ? "ring-2 ring-blue-500"
                      : "hover:bg-gray-700"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: box.color }}
                      />
                      <span className="font-medium capitalize text-sm">
                        {box.label}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 font-mono">
                      x:{box.position[0].toFixed(1)} y:
                      {box.position[1].toFixed(1)} z:
                      {box.position[2].toFixed(1)}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteBox(box.id);
                    }}
                    className="text-red-500 hover:text-red-400 text-2xl leading-none px-2"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={exportLabels}
          disabled={boxes.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed p-3 rounded font-semibold mb-6 transition"
        >
          📥 Export Labels (JSON)
        </button>

        {/* Keyboard Shortcuts */}
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-sm font-semibold mb-3">⌨️ Shortcuts</h4>
          <div className="text-xs text-gray-400 space-y-1.5">
            <div className="flex justify-between">
              <span>Car</span>
              <kbd className="bg-gray-800 px-2 py-0.5 rounded">C</kbd>
            </div>
            <div className="flex justify-between">
              <span>Pedestrian</span>
              <kbd className="bg-gray-800 px-2 py-0.5 rounded">P</kbd>
            </div>
            <div className="flex justify-between">
              <span>Cyclist</span>
              <kbd className="bg-gray-800 px-2 py-0.5 rounded">B</kbd>
            </div>
            <div className="flex justify-between">
              <span>Delete Selected</span>
              <kbd className="bg-gray-800 px-2 py-0.5 rounded">Del</kbd>
            </div>
            <div className="flex justify-between">
              <span>Undo</span>
              <kbd className="bg-gray-800 px-2 py-0.5 rounded">Ctrl+Z</kbd>
            </div>
            <div className="flex justify-between">
              <span>Redo</span>
              <kbd className="bg-gray-800 px-2 py-0.5 rounded">
                Ctrl+Shift+Z
              </kbd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
