import { PROCESSING_STAGE_DEFS } from "@/lib/demo-data";

export function Workflow() {
  return (
    <section id="workflow" className="border-b border-line bg-surface py-20">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Seven stages, start to surface
        </h2>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-ink-muted">
          The processing workspace tracks a project through each of these
          stages in order, with live progress for the current one.
        </p>

        <ol className="mt-12 grid grid-cols-1 gap-0 sm:grid-cols-2 lg:grid-cols-4">
          {PROCESSING_STAGE_DEFS.map((stage, i) => (
            <li
              key={stage.id}
              className="relative border-b border-r border-line px-5 py-6 first:border-l lg:[&:nth-child(4n+1)]:border-l"
            >
              <span className="font-mono text-[11px] text-signal-cyan">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-2 text-[14.5px] font-medium text-ink">{stage.label}</h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-muted">
                {stage.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
