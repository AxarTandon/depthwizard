import { ImageIcon, Layers, Mountain } from "lucide-react";

const STEPS = [
  {
    icon: ImageIcon,
    title: "A single image goes in",
    body: "One optical frame — a satellite tile, a drone photograph, or an aerial scan — in PNG, JPEG, TIFF, or GeoTIFF.",
  },
  {
    icon: Layers,
    title: "Monocular cues become height",
    body: "Shading, shadow direction, texture gradients, and object scale are used to infer relative surface height across the frame.",
  },
  {
    icon: Mountain,
    title: "A terrain model comes out",
    body: "The estimated heights become a continuous elevation surface — viewable, measurable, and exportable as a mesh.",
  },
];

export function ProductExplanation() {
  return (
    <section id="platform" className="border-b border-line py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            One photograph holds more elevation information than it looks like.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
            Traditional elevation mapping needs stereo imagery, LiDAR, or
            ground control. DepthWizard is built around a different question:
            how much can be recovered from a single view? The frontend below
            is what a geospatial analyst uses to upload imagery, track a
            reconstruction job, and inspect the resulting surface.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-sm border border-line bg-line md:grid-cols-3">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="bg-void p-7">
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-sm border border-line-bright text-signal-cyan">
                  <Icon className="h-5 w-5" strokeWidth={1.6} />
                </div>
                <p className="mb-2 font-mono text-[11px] text-ink-faint">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mb-2 font-display text-[17px] font-medium text-ink">
                  {step.title}
                </h3>
                <p className="text-[13.5px] leading-relaxed text-ink-muted">{step.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
