import {
  ScanLine,
  Ruler,
  Waves,
  TrendingUp,
  ShieldCheck,
  FolderKanban,
} from "lucide-react";

const CAPABILITIES = [
  {
    icon: ScanLine,
    title: "Monocular height estimation",
    body: "Recovers relative elevation from a single optical image, without a stereo pair or overlapping passes.",
  },
  {
    icon: Waves,
    title: "Contour & slope analysis",
    body: "Generates contour lines and per-cell slope directly from the reconstructed surface for terrain reading.",
  },
  {
    icon: Ruler,
    title: "In-scene measurement",
    body: "Pick two points on the terrain to read horizontal distance, elevation difference, and 3D distance.",
  },
  {
    icon: TrendingUp,
    title: "Elevation & slope statistics",
    body: "Minimum, maximum, mean, and relief are computed automatically, with distribution charts for both.",
  },
  {
    icon: ShieldCheck,
    title: "Validation dashboards",
    body: "Track demo accuracy metrics — MAE, RMSE, correlation — broken down by terrain category.",
  },
  {
    icon: FolderKanban,
    title: "Project workspace",
    body: "Every upload becomes a tracked project with its own processing history, viewer state, and analysis.",
  },
];

export function Capabilities() {
  return (
    <section className="border-b border-line py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Built for reading terrain, not just viewing it
          </h2>
          <p className="max-w-sm text-[13.5px] text-ink-muted">
            Each panel below is a working part of the workspace — not a
            marketing illustration.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((cap) => {
            const Icon = cap.icon;
            return (
              <div
                key={cap.title}
                className="border border-line bg-surface-panel p-6 transition-colors hover:border-line-bright"
              >
                <Icon className="mb-4 h-5 w-5 text-signal-cyan" strokeWidth={1.6} />
                <h3 className="mb-2 text-[15px] font-medium text-ink">{cap.title}</h3>
                <p className="text-[13.5px] leading-relaxed text-ink-muted">{cap.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
