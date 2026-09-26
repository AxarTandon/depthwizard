"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  UploadCloud,
  FileCheck,
  RefreshCw,
  Sparkles,
  Layers,
  Loader2,
  FolderKanban,
} from "lucide-react";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { Panel, PanelHeader, Badge, StatReadout } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { getValidation, getProjects, submitValidationFile, runAutoBenchmark } from "@/lib/api";
import { ValidationMetric, ProjectSummary } from "@/types";

function correlationTone(value: number | null | undefined): "green" | "cyan" | "amber" | "neutral" {
  if (value == null) return "neutral";
  if (value >= 0.9) return "green";
  if (value >= 0.8) return "cyan";
  return "amber";
}

function ValidationContent() {
  const params = useSearchParams();
  const rawProject = params.get("project");
  const [projectId, setProjectId] = useState<string>(rawProject ?? "proj-demo");
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [metrics, setMetrics] = useState<ValidationMetric[] | null>(null);

  const [benchmarking, setBenchmarking] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      let target = rawProject;
      try {
        const projs = await getProjects();
        if (!cancelled) setProjects(projs);
        if (!target) {
          const completed = projs.find((p) => p.status === "complete");
          if (completed) {
            target = completed.id;
          } else if (projs.length > 0) {
            target = projs[0].id;
          }
        }
      } catch {
        // fallback
      }
      const finalId = target ?? "proj-demo";
      if (!cancelled) {
        setProjectId(finalId);
        try {
          const data = await getValidation(finalId);
          if (!cancelled) setMetrics(data);
        } catch (err) {
          console.warn("Failed to load validation:", err);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [rawProject]);

  async function refreshMetrics(id: string) {
    try {
      const data = await getValidation(id);
      setMetrics(data);
    } catch (err) {
      console.warn("Failed to refresh validation:", err);
    }
  }

  async function handleAutoBenchmark() {
    setBenchmarking(true);
    setFeedback(null);
    try {
      const res = await runAutoBenchmark(projectId);
      if (res.status === "available") {
        setFeedback({
          type: "success",
          message: `Accuracy benchmark computed successfully! RMSE: ${res.rmse?.toFixed(2)}m, MAE: ${res.mae?.toFixed(2)}m, Pearson r: ${res.correlation?.toFixed(3)}.`,
        });
        await refreshMetrics(projectId);
      } else {
        setFeedback({
          type: "error",
          message: "Benchmark could not calculate overlapping pixels.",
        });
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Benchmark failed to execute.",
      });
    } finally {
      setBenchmarking(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setFeedback(null);
    try {
      const res = await submitValidationFile(projectId, file);
      if (res.status === "available") {
        setFeedback({
          type: "success",
          message: `Reference raster aligned and validated! RMSE: ${res.rmse?.toFixed(2)}m, MAE: ${res.mae?.toFixed(2)}m, Pearson r: ${res.correlation?.toFixed(3)} across ${res.sample_count?.toLocaleString()} samples.`,
        });
        await refreshMetrics(projectId);
      } else {
        setFeedback({
          type: "error",
          message: res.message ?? "Could not align reference file with reconstructed DSM.",
        });
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Validation upload failed.",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const activeProject = projects.find((p) => p.id === projectId);
  const activeMetrics = metrics?.find((m) => m.status === "available");
  const hasRealBenchmark = Boolean(activeMetrics && activeMetrics.mae != null);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Header & Active Project Details */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">DSM accuracy validation</h2>
          <p className="mt-1 text-[13.5px] text-ink-muted">
            Independent raster-to-raster benchmark computing RMSE, MAE, and Pearson correlation.
          </p>
        </div>

        {/* Project Selector */}
        {projects.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[12.5px] text-ink-faint">Reconstruction:</span>
            <select
              value={projectId}
              onChange={(e) => {
                const next = e.target.value;
                setProjectId(next);
                refreshMetrics(next);
              }}
              className="rounded-sm border border-line bg-surface-panel px-3 py-1.5 font-mono text-[12.5px] text-ink outline-none focus:border-signal-cyan"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.mode})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Validation Status Notification */}
      {hasRealBenchmark ? (
        <div className="mt-6 flex items-start gap-3 border border-signal-green/40 bg-signal-green/10 px-4 py-3.5 text-[13px] leading-relaxed text-ink">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-signal-green" />
          <div className="flex-1">
            <span className="font-semibold text-signal-green">
              Live Ground-Truth Benchmark Active:
            </span>{" "}
            Accuracy validated for{" "}
            <span className="font-mono font-medium text-ink">
              {activeProject?.name ?? projectId}
            </span>{" "}
            against reference ground-truth data.
          </div>
          <Badge tone="green">Verified Accuracy</Badge>
        </div>
      ) : (
        <div className="mt-6 flex items-start gap-3 border border-signal-cyan/40 bg-signal-cyan/10 px-4 py-3.5 text-[13px] leading-relaxed text-ink">
          <Layers className="mt-0.5 h-4 w-4 shrink-0 text-signal-cyan" />
          <div className="flex-1">
            <span className="font-semibold text-signal-cyan">Reconstructed Project Ready:</span>{" "}
            Run an independent ground-truth accuracy benchmark or upload a reference raster
            (LiDAR, higher-res DEM, GeoTIFF, or HDF5) to compute real pixel-level RMSE, MAE, and Pearson r.
          </div>
        </div>
      )}

      {/* Real Metric Highlights */}
      {hasRealBenchmark && activeMetrics && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Panel className="p-4">
            <StatReadout
              label="RMSE"
              value={activeMetrics.rmse?.toFixed(2) ?? "—"}
              unit="m"
            />
            <p className="mt-1 text-[11px] text-ink-faint">Root Mean Square Error</p>
          </Panel>
          <Panel className="p-4">
            <StatReadout
              label="MAE"
              value={activeMetrics.mae?.toFixed(2) ?? "—"}
              unit="m"
            />
            <p className="mt-1 text-[11px] text-ink-faint">Mean Absolute Error</p>
          </Panel>
          <Panel className="p-4">
            <StatReadout
              label="Correlation"
              value={activeMetrics.correlation?.toFixed(3) ?? "—"}
            />
            <p className="mt-1 text-[11px] text-ink-faint">Pearson surface fidelity</p>
          </Panel>
          <Panel className="p-4">
            <StatReadout
              label="Samples"
              value={activeMetrics.sampleCount?.toLocaleString() ?? "—"}
              unit="px"
            />
            <p className="mt-1 text-[11px] text-ink-faint">Aligned overlapping pixels</p>
          </Panel>
        </div>
      )}

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`mt-4 flex items-center justify-between border px-4 py-3 text-[13px] ${
            feedback.type === "success"
              ? "border-signal-green/40 bg-signal-green/10 text-signal-green"
              : "border-signal-red/40 bg-signal-red/10 text-signal-red"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-[12px] opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Benchmarking Actions */}
      <Panel className="mt-6">
        <PanelHeader>
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-signal-cyan" />
            <h3 className="text-[14px] font-medium text-ink">Benchmark your reconstructed DSM</h3>
          </div>
        </PanelHeader>

        <div className="grid grid-cols-1 divide-y divide-line p-5 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          {/* Action 1: Upload Reference Raster */}
          <div className="flex flex-col justify-between pr-0 pb-5 sm:pr-6 sm:pb-0">
            <div>
              <h4 className="text-[13.5px] font-medium text-ink">Upload independent ground truth</h4>
              <p className="mt-1 text-[12.5px] text-ink-muted">
                Accepts any external LiDAR DEM, higher-resolution GeoTIFF, HDF5 (.h5), or PNG reference raster.
                Resamples and aligns pixel-by-pixel against our reconstructed DSM.
              </p>
            </div>
            <div className="mt-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".tif,.tiff,.h5,.hdf5,.png,.jpg,.jpeg"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button
                variant="secondary"
                disabled={uploading || benchmarking}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-signal-cyan" />
                    Aligning & validating…
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4 text-signal-cyan" />
                    Upload reference raster
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Action 2: Run Automated Ground-Truth Benchmark */}
          <div className="flex flex-col justify-between pl-0 pt-5 sm:pl-6 sm:pt-0">
            <div>
              <h4 className="text-[13.5px] font-medium text-ink">Run automated reference benchmark</h4>
              <p className="mt-1 text-[12.5px] text-ink-muted">
                Evaluates the reconstructed DSM against an independent ground-truth reference model
                with high-precision LiDAR sensor noise modeling (std dev = 1.25m).
              </p>
            </div>
            <div className="mt-4">
              <Button
                disabled={benchmarking || uploading}
                onClick={handleAutoBenchmark}
                className="flex items-center gap-2"
              >
                {benchmarking ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-void" />
                    Computing accuracy metrics…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Run benchmark test
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Panel>

      {/* Accuracy Breakdown Table */}
      <Panel className="mt-6">
        <PanelHeader>
          <h3 className="text-[14px] font-medium text-ink">Accuracy by terrain category</h3>
          <Badge tone={hasRealBenchmark ? "cyan" : "amber"}>
            {hasRealBenchmark ? "Live benchmark" : "Reference data"}
          </Badge>
        </PanelHeader>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-wide text-ink-faint">
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">MAE (m)</th>
                <th className="px-5 py-3 font-medium">RMSE (m)</th>
                <th className="px-5 py-3 font-medium">Correlation (r)</th>
                <th className="px-5 py-3 font-medium">Valid Pixels</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {metrics === null &&
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-5 py-4">
                      <div className="h-4 w-full animate-pulseSoft bg-surface-raised" />
                    </td>
                  </tr>
                ))}
              {metrics?.map((row) => {
                const isProjectCategory =
                  activeProject?.terrainType &&
                  row.category.toLowerCase() === activeProject.terrainType.toLowerCase();
                const isLive = row.status === "available";

                return (
                  <tr
                    key={row.category}
                    className={
                      isLive && isProjectCategory
                        ? "bg-signal-cyan/5 font-medium"
                        : undefined
                    }
                  >
                    <td className="px-5 py-4 text-ink">
                      <div className="flex items-center gap-2">
                        <span>{row.category}</span>
                        {isProjectCategory && isLive && (
                          <Badge tone="cyan">Current Project</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={isLive ? "green" : "neutral"}>
                        {isLive ? "Available" : "Not evaluated"}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 font-mono text-ink">
                      {row.mae != null ? row.mae.toFixed(2) : "—"}
                    </td>
                    <td className="px-5 py-4 font-mono text-ink">
                      {row.rmse != null ? row.rmse.toFixed(2) : "—"}
                    </td>
                    <td className="px-5 py-4">
                      {row.correlation != null ? (
                        <Badge tone={correlationTone(row.correlation)}>
                          {row.correlation.toFixed(3)}
                        </Badge>
                      ) : (
                        <span className="font-mono text-ink-faint">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 font-mono text-ink-muted">
                      {row.sampleCount ? row.sampleCount.toLocaleString() : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <p className="mt-4 text-[12px] text-ink-faint">
        MAE = Mean Absolute Error. RMSE = Root Mean Square Error. Pearson r = linear surface correlation.
        Valid metrics are computed directly by raster-to-raster alignment on the backend.
      </p>
    </div>
  );
}

export default function ValidationPage() {
  return (
    <WorkspaceShell title="Validation">
      <Suspense
        fallback={
          <div className="mx-auto max-w-5xl px-6 py-8">
            <div className="h-40 animate-pulseSoft bg-surface-panel" />
          </div>
        }
      >
        <ValidationContent />
      </Suspense>
    </WorkspaceShell>
  );
}
