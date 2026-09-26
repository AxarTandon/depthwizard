import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { MiniTerrainPreview } from "./MiniTerrainPreview";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line bg-fine-grid">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 pb-16 pt-20 lg:grid-cols-[1.05fr,0.95fr] lg:pb-24 lg:pt-28">
        <div>
          <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-signal-cyan/30 bg-surface-panel/80 px-3 py-1 font-mono text-[11px] text-ink-muted shadow-sm">
            <img src="/logo.png" alt="ISRO Emblem" className="h-5 w-5 rounded-full object-cover" />
            <span className="text-signal-cyan font-medium">ISRO & Smart India Hackathon 2026</span>
            <span>·</span>
            <span>Geospatial Innovation</span>
          </div>

          <div className="flex items-center gap-4">
            <h1 className="font-display text-[44px] font-semibold leading-[1.05] tracking-tight text-ink sm:text-[56px]">
              DepthWizard
            </h1>
            <span className="font-mono text-sm text-signal-cyan px-2 py-0.5 rounded bg-signal-cyan/15 border border-signal-cyan/30">
              डेप्थविज़ार्ड
            </span>
          </div>
          <p className="mt-3 font-display text-xl text-signal-cyan sm:text-2xl">
            From Imagery to Insight
          </p>

          <p className="mt-6 max-w-lg text-[15.5px] leading-relaxed text-ink-muted">
            DepthWizard turns a single overhead optical image into elevation
            information and an interactive 3D terrain model — no stereo pair,
            no LiDAR pass. Upload one frame, and explore the surface it
            describes: hills, ridges, structures, and slope, rendered as a
            navigable mesh.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/auth/signup">
              <Button size="lg">Launch workspace</Button>
            </Link>
            <Link href="#platform">
              <Button variant="secondary" size="lg">
                See how it works
              </Button>
            </Link>
          </div>

          <div className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-line pt-6">
            <div>
              <p className="font-mono text-lg text-ink">128×128</p>
              <p className="text-[12px] text-ink-faint">demo grid resolution</p>
            </div>
            <div>
              <p className="font-mono text-lg text-ink">7 stages</p>
              <p className="text-[12px] text-ink-faint">reconstruction pipeline</p>
            </div>
            <div>
              <p className="font-mono text-lg text-ink">rDSM / DSM</p>
              <p className="text-[12px] text-ink-faint">output modes</p>
            </div>
          </div>
        </div>

        <div className="relative h-[380px] rounded-sm border border-line bg-surface-panel sm:h-[440px]">
          <MiniTerrainPreview />
          <div className="pointer-events-none absolute left-3 top-3 rounded-sm border border-line-bright bg-surface-panel/85 px-2.5 py-1 font-mono text-[11px] text-ink-muted">
            demo_terrain.rdsm — live render
          </div>
          <div className="pointer-events-none absolute bottom-3 right-3 rounded-sm border border-line-bright bg-surface-panel/85 px-2.5 py-1 font-mono text-[11px] text-signal-cyan">
            28.04°N, 77.05°E
          </div>
        </div>
      </div>
    </section>
  );
}
