"use client";

import {
  Mountain,
  TrendingUp,
  Layers,
  Waves,
  Grid3x3,
  Box,
  RotateCcw,
  Plane,
  Ruler,
} from "lucide-react";
import { ViewerRenderMode } from "@/types";
import { cn } from "@/lib/utils";

const MODE_OPTIONS: { id: ViewerRenderMode; label: string; icon: typeof Mountain }[] = [
  { id: "elevation", label: "Elevation", icon: Mountain },
  { id: "slope", label: "Slope", icon: TrendingUp },
  { id: "relative-height", label: "Relative height", icon: Layers },
  { id: "contour", label: "Contour", icon: Waves },
];

interface ViewerToolbarProps {
  renderMode: ViewerRenderMode;
  onRenderModeChange: (mode: ViewerRenderMode) => void;
  wireframe: boolean;
  onWireframeToggle: () => void;
  showGrid: boolean;
  onGridToggle: () => void;
  flythrough: boolean;
  onFlythroughToggle: () => void;
  measuring: boolean;
  onMeasuringToggle: () => void;
  onReset: () => void;
}

function ToolButton({
  active,
  onClick,
  label,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: typeof Mountain;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={label}
      className={cn(
        "focus-ring flex h-9 items-center gap-2 rounded-sm border px-3 text-[12.5px] transition-colors",
        active
          ? "border-signal-cyan/50 bg-signal-cyan/10 text-signal-cyan"
          : "border-line-bright bg-surface-panel/90 text-ink-muted hover:text-ink"
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export function ViewerToolbar(props: ViewerToolbarProps) {
  const {
    renderMode,
    onRenderModeChange,
    wireframe,
    onWireframeToggle,
    showGrid,
    onGridToggle,
    flythrough,
    onFlythroughToggle,
    measuring,
    onMeasuringToggle,
    onReset,
  } = props;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col gap-2 p-4">
      <div className="pointer-events-auto flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-sm border border-line-bright bg-surface-panel/90 p-1 backdrop-blur">
          {MODE_OPTIONS.map((opt) => (
            <ToolButton
              key={opt.id}
              active={renderMode === opt.id}
              onClick={() => onRenderModeChange(opt.id)}
              label={opt.label}
              icon={opt.icon}
            />
          ))}
        </div>

        <div className="flex items-center gap-1">
          <ToolButton active={wireframe} onClick={onWireframeToggle} label="Wireframe" icon={Box} />
          <ToolButton active={showGrid} onClick={onGridToggle} label="Grid" icon={Grid3x3} />
          <ToolButton active={measuring} onClick={onMeasuringToggle} label="Measure" icon={Ruler} />
          <ToolButton active={flythrough} onClick={onFlythroughToggle} label="Flythrough" icon={Plane} />
          <button
            type="button"
            onClick={onReset}
            title="Reset camera"
            className="focus-ring flex h-9 items-center gap-2 rounded-sm border border-line-bright bg-surface-panel/90 px-3 text-[12.5px] text-ink-muted hover:text-ink"
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {flythrough && (
        <div className="pointer-events-none flex w-fit items-center gap-3 rounded-sm border border-line-bright bg-surface-panel/90 px-3 py-2 font-mono text-[11px] text-ink-muted backdrop-blur">
          <span><span className="text-signal-cyan">W/A/S/D</span> move</span>
          <span><span className="text-signal-cyan">Space</span> up</span>
          <span><span className="text-signal-cyan">Shift</span> down</span>
          <span><span className="text-signal-cyan">drag</span> look</span>
        </div>
      )}

      {measuring && (
        <div className="pointer-events-none w-fit rounded-sm border border-line-bright bg-surface-panel/90 px-3 py-2 font-mono text-[11px] text-ink-muted backdrop-blur">
          Click the terrain to place point A, then point B.
        </div>
      )}
    </div>
  );
}
