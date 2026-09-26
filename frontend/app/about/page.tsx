import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/CTAFooter";
import { Panel } from "@/components/ui/Panel";

const FRONTEND_STACK = [
  "Next.js (App Router)",
  "React + TypeScript",
  "Tailwind CSS",
  "Three.js / React Three Fiber / Drei",
  "Recharts",
  "Lucide React",
];

const BACKEND_STACK = [
  "FastAPI + Pydantic",
  "PostgreSQL + SQLAlchemy",
  "Rasterio / GDAL",
  "MiDaS + im2height (pluggable depth adapters)",
  "U-Net + ResNet18 segmentation",
  "Hugging Face Inference API (chatbot + translation)",
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-void">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="flex items-center gap-5 mb-6">
          <img
            src="/logo.png"
            alt="DepthWizard Mission Patch"
            className="h-24 w-24 rounded-full object-cover shadow-xl ring-2 ring-signal-cyan/50"
          />
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
              About DepthWizard
            </h1>
            <p className="mt-1 font-mono text-[12px] text-signal-cyan">
              डेप्थविज़ार्ड · ISRO & Smart India Hackathon 2026 (PS 26175)
            </p>
          </div>
        </div>

        <p className="text-[15px] leading-relaxed text-ink-muted">
          DepthWizard, built by team Doom&apos;s Dhoom for Smart India Hackathon
          2026 (PS 26175), turns a single optical image into an elevation
          surface and a navigable 3D reconstruction — then goes further for
          disaster response: flood-level simulation, crater and impact-damage
          detection, building collapse-risk mapping with automatic authority
          alerts, WorldPop spatial demographic analysis, a rule-based disaster classifier, and
          a multilingual AI assistant for interpreting the results.
        </p>

        <Panel className="mt-8 p-6">
          <h2 className="mb-3 text-[15px] font-medium text-ink">How this build works</h2>
          <p className="text-[13.5px] leading-relaxed text-ink-muted">
            This interface talks to a FastAPI backend for height estimation,
            DSM generation, SRTM-based calibration, and every disaster-analysis
            module listed above. When no backend is connected (or a given
            module — like SRTM calibration or the chatbot — isn&apos;t
            configured), the interface falls back to clearly-generated demo
            data rather than failing, so it stays reviewable end-to-end at any
            stage of setup.
          </p>
        </Panel>

        <Panel className="mt-6 p-6">
          <h2 className="mb-3 text-[15px] font-medium text-ink">Frontend stack</h2>
          <ul className="grid grid-cols-2 gap-2 text-[13.5px] text-ink-muted">
            {FRONTEND_STACK.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-signal-cyan" />
                {item}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className="mt-6 p-6">
          <h2 className="mb-3 text-[15px] font-medium text-ink">Backend stack</h2>
          <ul className="grid grid-cols-2 gap-2 text-[13.5px] text-ink-muted">
            {BACKEND_STACK.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-signal-green" />
                {item}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className="mt-6 p-6">
          <h2 className="mb-3 text-[15px] font-medium text-ink">Known limitations</h2>
          <ul className="flex flex-col gap-2 text-[13.5px] leading-relaxed text-ink-muted">
            <li>
              Relative height (rDSM) output does not carry a real-world
              coordinate reference; only a metric DSM with SRTM or
              ground-control-point calibration does.
            </li>
            <li>
              A .tif or .tiff extension does not guarantee valid GeoTIFF
              metadata — that is confirmed and calibrated by the backend.
            </li>
            <li>
              Population estimates are heuristic approximations, not census
              figures. Disaster classification is a transparent, rule-based
              signal, not a trained model — each label ships with its
              evidence.
            </li>
            <li>
              Validation metrics are only populated once a reference
              DSM/LiDAR raster is supplied; otherwise they show as not
              available rather than an invented number.
            </li>
          </ul>
        </Panel>
      </main>
      <Footer />
    </div>
  );
}
