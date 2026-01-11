"use client";

interface ViewSwitcherProps {
  currentView: "perspective" | "top" | "side";
  onViewChange: (view: "perspective" | "top" | "side") => void;
}

export function ViewSwitcher({ currentView, onViewChange }: ViewSwitcherProps) {
  const views = [
    { id: "perspective", label: "3D View", icon: "🎮" },
    { id: "top", label: "Top View", icon: "⬇️" },
    { id: "side", label: "Side View", icon: "↔️" },
  ] as const;

  return (
    <div className="absolute top-4 right-4 bg-black/70 rounded-lg p-2 flex gap-2">
      {views.map((view) => (
        <button
          key={view.id}
          onClick={() => onViewChange(view.id)}
          className={`px-3 py-2 rounded text-sm transition ${
            currentView === view.id
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          <span className="mr-1">{view.icon}</span>
          {view.label}
        </button>
      ))}
    </div>
  );
}
