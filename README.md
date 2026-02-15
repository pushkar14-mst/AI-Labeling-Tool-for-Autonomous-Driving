# 3D Bounding Box Labeling Tool for Autonomous Driving

A web-based annotation tool for labeling objects in autonomous driving datasets with 3D bounding boxes.

## Tech Stack

- React
- TypeScript
- Three.js / React Three Fiber
- Redux Toolkit
- Tailwind CSS

## Features

- Load street scene images from datasets
- Place 3D bounding boxes around objects (cars, pedestrians, cyclists)
- Adjust box dimensions (width, height, depth)
- Rotate boxes around Y-axis for object orientation
- Multiple box selection and editing
- Export annotations in KITTI format
- Undo/redo functionality
- Keyboard shortcuts for power users

## How It Works

The tool overlays a 3D grid on top of a 2D street scene image. Users can click to place bounding boxes, then drag corners to resize and rotate handles to orient the boxes. All boxes are positioned on the ground plane (Y=0) to match real-world autonomous driving scenarios.

## Problems Faced and Solutions

### 1. Converting Mouse Clicks to 3D Positions

**Problem**: When a user clicks on the screen, I needed to convert that 2D mouse position into a 3D coordinate on the ground plane.

**Challenge**: The screen is 2D but the scene is 3D. A single mouse click could correspond to infinite points along a ray in 3D space.

**Solution**: Used raycasting with plane intersection.

Process:

1. Create a ray from the camera through the mouse position
2. Define the ground plane (Y = 0)
3. Calculate where the ray intersects the plane
4. Use that intersection point as the 3D position

```typescript
const plane = new Plane(new Vector3(0, 1, 0), 0); // Y = 0 plane
const raycaster = new Raycaster();
raycaster.setFromCamera(mousePosition, camera);

const intersectPoint = new Vector3();
raycaster.ray.intersectPlane(plane, intersectPoint);
// intersectPoint now has the 3D coordinates
```

### 2. Intuitive Box Rotation

**Problem**: Users needed to rotate boxes to match object orientation, but 3D rotation controls are typically confusing.

**Solution**: Added a draggable torus (ring) handle at the top of each box. When dragged, it calculates the angle from the box center to the mouse position.

```typescript
const angle = Math.atan2(mousePos.z - boxCenter.z, mousePos.x - boxCenter.x);
```

This gives natural rotation behavior where dragging in a circle rotates the box. Only Y-axis rotation is allowed since ground-based objects don't pitch or roll.

### 3. Corner-Based Box Resizing

**Problem**: Needed to resize boxes by dragging corners, but calculating new dimensions from corner movement was tricky.

**Initial Approach**: Track corner absolute positions.

**Problem with Initial Approach**: Boxes have a center position and dimensions. When you drag a corner, both the center and dimensions need to update, which created complex calculations.

**Solution**: Calculate distance from box center to mouse position, multiply by 2 (since box extends in both directions from center), and constrain to minimum size.

```typescript
const newWidth = Math.abs((mousePos.x - boxCenter.x) * 2);
const newDepth = Math.abs((mousePos.z - boxCenter.z) * 2);

updateBoxDimensions({
  width: Math.max(0.5, newWidth), // Minimum 0.5 units
  depth: Math.max(0.5, newDepth),
});
```

Height is controlled separately with arrow keys for precision.

### 4. Image and 3D Space Alignment

**Problem**: The 2D street image needed to align perfectly with the 3D coordinate system so boxes appear in the correct locations.

**Challenge**: Images have pixel dimensions, but 3D space uses arbitrary units.

**Solution**: Created a plane geometry with dimensions matching the image aspect ratio, then rotated it 90 degrees to lay flat on the ground.

```typescript
const aspectRatio = imageWidth / imageHeight;
const planeWidth = 16;  // Standard width in 3D units
const planeHeight = planeWidth / aspectRatio;

// Rotate plane to lie on ground (XZ plane instead of XY)
<mesh rotation={[-Math.PI / 2, 0, 0]}>
  <planeGeometry args={[planeWidth, planeHeight]} />
  <meshBasicMaterial map={imageTexture} />
</mesh>
```

### 5. Exporting to KITTI Format

**Problem**: Autonomous driving datasets use the KITTI format, which has a specific structure with 15 values per line.

**Challenge**: Understanding what each value represents and converting from my internal representation.

**Solution**: Mapped my box data structure to KITTI format specifications.

KITTI format per object:

```
label truncated occluded alpha bbox_2d(4 values) dimensions(3) location(3) rotation_y score
```

Since this is a 3D-only tool without 2D bounding boxes, I filled in placeholder values for 2D bbox and focused on accurate 3D data.

```typescript
const kitti = [
  box.label, // 'car', 'pedestrian', etc.
  0, // truncated
  box.occluded ? 1 : 0, // occluded
  -10, // alpha (observation angle)
  0,
  0,
  0,
  0, // 2D bbox (placeholder)
  box.dimensions.height, // 3D dimensions
  box.dimensions.width,
  box.dimensions.depth,
  box.position.x, // 3D location
  box.position.y,
  box.position.z,
  box.rotation.y, // rotation around vertical axis
  1.0, // confidence score
].join(" ");
```

### 6. State Management for Undo/Redo

**Problem**: Users needed undo/redo for complex annotation sessions.

**Solution**: Maintained a state history stack in Redux.

```typescript
const undoStack: AnnotationState[] = [];
const redoStack: AnnotationState[] = [];

// On each action
undoStack.push(deepCopy(currentState));
redoStack = []; // Clear redo on new action

// On undo
redoStack.push(currentState);
const previousState = undoStack.pop();
setState(previousState);
```

This simple stack approach works well for annotation tools where states are relatively small.

## Setup Instructions

1. Clone the repository

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open http://localhost:3000

## Usage

1. Load a street scene image from your dataset
2. Click on the ground to place a bounding box
3. Select object type (car, pedestrian, cyclist, etc.)
4. Drag corners to resize the box
5. Drag the top ring to rotate the box
6. Use arrow keys to adjust height
7. Press 'D' to duplicate selected box
8. Press Delete to remove selected box
9. Click "Export KITTI" to download annotations

## Keyboard Shortcuts

- Arrow Up/Down: Adjust box height
- D: Duplicate selected box
- Delete: Remove selected box
- Ctrl+Z: Undo
- Ctrl+Shift+Z: Redo
- Esc: Deselect

## Key Learnings

- Raycasting is essential for 3D interaction in web applications
- Plane intersection math converts 2D input to 3D positions accurately
- atan2 provides intuitive rotation behavior for circular dragging
- Constraining user input (min/max values, single axis rotation) improves usability
- Industry-standard export formats are crucial for tool adoption
- Keyboard shortcuts significantly speed up annotation workflows
- State history for undo/redo is simpler than command pattern for small states

## Future Improvements

- Support for loading LiDAR point clouds
- Automatic object detection with pre-filled boxes
- Multi-frame annotation with tracking
- Collaboration features for team annotation
- Validation to prevent overlapping boxes
- Import existing KITTI annotations for editing
