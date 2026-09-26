import Link from "next/link";
import { Mountain, TrendingUp, Waves, Plane, Ruler } from "lucide-react";
import { MiniTerrainPreview } from "./MiniTerrainPreview";
import { Button } from "@/components/ui/Button";

const MODES = [
  { icon: Mountain, label: "Elevation" },
  { icon: TrendingUp, label: "Slope" },
  { icon: Waves, label: "Contour" },
  { icon: Ruler, label: "Measurement" },
  { icon: Plane, label: "Flythrough" },
];

export function VisualizationShowcase() {
  return (
    <section id="viewer" className="border-b border-line py-20">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 lg:grid-cols-[0.9fr,1.1fr] lg:items-center">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            A terrain you can actually fly through
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
            The 3D viewer renders reconstructed terrain as a real Three.js
            mesh — orbit around it, switch between elevation, slope, and
            contour shading, drop into a first-person flythrough with WASD,
            or click any point to read its elevation and slope directly from
            the underlying height data.
          </p>

          <ul className="mt-8 flex flex-wrap gap-2">
            {MODES.map((mode) => {
              const Icon = mode.icon;
              return (
                <li
                  key={mode.label}
                  className="flex items-center gap-2 border border-line-bright px-3 py-1.5 text-[12.5px] text-ink-muted"
                >
                  <Icon className="h-3.5 w-3.5 text-signal-cyan" strokeWidth={1.75} />
                  {mode.label}
                </li>
              );
            })}
          </ul>

          <Link href="/auth/signup" className="mt-8 inline-block">
            <Button variant="secondary" size="lg">
              Open the viewer
            </Button>
          </Link>
        </div>

        <div className="relative h-[420px] border border-line bg-surface-panel">
          <MiniTerrainPreview />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-line-bright bg-surface-panel/90 px-4 py-2 font-mono text-[11px] text-ink-faint">
            <span>preview render — orbit only</span>
            <span>128×128 · 10 m/cell</span>
          </div>
        </div>
      </div>
    </section>
  );
}
