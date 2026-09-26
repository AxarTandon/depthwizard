import { Panel, PanelHeader } from "@/components/ui/Panel";
import { TEAM_MEMBERS } from "@/lib/demo-data";

export function TeamSection() {
  return (
    <div className="mt-8">
      <Panel className="border border-line shadow-md">
        <PanelHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <h3 className="text-[14px] font-medium text-ink">Project Engineering Team</h3>
              <span className="rounded bg-signal-cyan/15 px-2 py-0.5 font-mono text-[10px] text-signal-cyan border border-signal-cyan/30">
                Doom&apos;s Dhoom
              </span>
            </div>
            <span className="font-mono text-[11px] text-ink-faint">Smart India Hackathon 2026</span>
          </div>
        </PanelHeader>

        <div className="grid grid-cols-2 gap-3.5 p-5 sm:grid-cols-3">
          {TEAM_MEMBERS.map((member) => {
            const initials = member.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .substring(0, 2);

            return (
              <div
                key={member.name}
                className="group flex items-start gap-3 rounded-sm border border-line bg-surface-panel p-3.5 transition-all hover:border-signal-cyan/40 hover:bg-surface-raised"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-signal-cyan/15 font-mono text-[11.5px] font-semibold text-signal-cyan border border-signal-cyan/30 group-hover:scale-105 transition-transform">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-ink truncate">{member.name}</p>
                  <p className="mt-0.5 text-[11px] text-ink-muted truncate">{member.role}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
