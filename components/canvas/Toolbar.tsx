"use client";

import { MousePointer2, MoveRight, Minus, Plus } from "lucide-react";
import type { ToolMode } from "@/types/item";

type ToolbarProps = {
  toolMode: ToolMode;
  setToolMode: (mode: ToolMode) => void;
  zoomPercent: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
};

export function Toolbar({
  toolMode,
  setToolMode,
  zoomPercent,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <button
          className={`toolbar-btn ${toolMode === "select" ? "toolbar-btn-active" : ""}`}
          onClick={() => setToolMode("select")}
          title="Select mode (V)"
          aria-label="Select mode"
        >
          <MousePointer2 size={16} />
        </button>
        <button
          className={`toolbar-btn ${toolMode === "arrow" ? "toolbar-btn-active" : ""}`}
          onClick={() => setToolMode("arrow")}
          title="Arrow mode (A)"
          aria-label="Arrow mode"
        >
          <MoveRight size={16} />
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          onClick={onZoomOut}
          title="Zoom out"
          aria-label="Zoom out"
        >
          <Minus size={16} />
        </button>
        <button
          className="toolbar-zoom-label"
          onClick={onZoomReset}
          title="Reset zoom"
          aria-label="Reset zoom"
        >
          {zoomPercent}%
        </button>
        <button
          className="toolbar-btn"
          onClick={onZoomIn}
          title="Zoom in"
          aria-label="Zoom in"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
