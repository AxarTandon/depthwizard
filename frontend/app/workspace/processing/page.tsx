"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, Circle, ArrowRight, AlertTriangle } from "lucide-react";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { getProcessingStatus } from "@/lib/api";
import { ProcessingStatus } from "@/types";
import { USE_BACKEND } from "@/lib/config";

function ProcessingContent() {
  const router = useRouter();
  const params = useSearchParams();
  const projectId = params.get("project") ?? "proj-demo";

  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const elapsed = Date.now() - startTimeRef.current;
        const next = await getProcessingStatus(projectId, elapsed);
        if (!cancelled && next) {
          setStatus(next);
          if (next.isComplete || next.stages?.some((s) => s.status === "error")) {
            clearInterval(interval);
          }
        }
      } catch (err) {
        // Silently retry next second on transient connection drops
        console.warn("Polling processing status retry:", err);
      }
    }, 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [projectId]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h2 className="font-display text-xl font-semibold text-ink">Reconstruction in progress</h2>
      <p className="mt-1 text-[13.5px] text-ink-muted">
        Project <span className="font-mono text-ink">{projectId}</span> —{" "}
        {USE_BACKEND
          ? "Live backend pipeline execution. Polling processing status."
          : "Demo mode timers simulate each pipeline stage. Connect backend for live inference."}
      </p>

      <Panel className="mt-6">
        <PanelHeader>
          <h3 className="text-[14px] font-medium text-ink">Pipeline</h3>
          <span className="font-mono text-[12px] text-signal-cyan">
            {status?.overallProgress ?? 0}%
          </span>
        </PanelHeader>

        <div className="h-1 w-full bg-surface">
          <div
            className="h-1 bg-signal-cyan transition-all duration-200"
            style={{ width: `${status?.overallProgress ?? 0}%` }}
          />
        </div>

        <ul className="divide-y divide-line">
          {status?.stages.map((stage) => (
            <li key={stage.id} className="flex items-center gap-4 px-5 py-4">
              <div className="shrink-0">
                {stage.status === "complete" && (
                  <CheckCircle2 className="h-5 w-5 text-signal-green" />
                )}
                {stage.status === "active" && (
                  <Loader2 className="h-5 w-5 animate-spin text-signal-cyan" />
                )}
                {stage.status === "error" && (
                  <AlertTriangle className="h-5 w-5 text-signal-red" />
                )}
                {stage.status === "pending" && <Circle className="h-5 w-5 text-line-bright" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] text-ink">{stage.label}</p>
                <p className="text-[12px] text-ink-faint">{stage.description}</p>
              </div>
              <span className="font-mono text-[12px] text-ink-muted">{stage.progress}%</span>
            </li>
          ))}
        </ul>
      </Panel>

      {status?.stages.some((s) => s.status === "error") && (
        <div className="mt-6 flex items-center justify-between border border-signal-red/30 bg-signal-red/10 px-5 py-4">
          <p className="text-[13.5px] text-signal-red">
            Pipeline encountered an error during processing. You can retry with another file.
          </p>
          <Button variant="secondary" onClick={() => router.push("/workspace/upload")}>
            Upload imagery
          </Button>
        </div>
      )}

      {status?.isComplete && (
        <div className="mt-6 flex items-center justify-between border border-signal-green/30 bg-signal-green/10 px-5 py-4">
          <p className="text-[13.5px] text-ink">
            Reconstruction complete. The terrain mesh is ready to explore.
          </p>
          <Button onClick={() => router.push(`/workspace/viewer?project=${projectId}`)}>
            Open 3D viewer <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ProcessingPage() {
  return (
    <WorkspaceShell title="Processing">
      <Suspense fallback={null}>
        <ProcessingContent />
      </Suspense>
    </WorkspaceShell>
  );
}
