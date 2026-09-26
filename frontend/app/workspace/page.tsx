"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  FolderKanban,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Box,
  LineChart,
  ShieldCheck,
  FileCode2,
  Compass,
} from "lucide-react";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { Panel, PanelHeader, Badge, StatReadout } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { getProjects } from "@/lib/api";
import { DASHBOARD_STATS } from "@/lib/demo-data";
import { TeamSection } from "@/components/workspace/TeamSection";
import { ProjectSummary } from "@/types";
import { formatDate } from "@/lib/utils";

const STATUS_TONE: Record<ProjectSummary["status"], "cyan" | "green" | "amber" | "red"> = {
  processing: "amber",
  complete: "green",
  queued: "cyan",
  failed: "red",
};

export default function WorkspaceOverviewPage() {
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);

  useEffect(() => {
    getProjects().then(setProjects);
  }, []);

  const totalProjects = projects ? projects.length : DASHBOARD_STATS.totalProjects;
  const completedProjects = projects
    ? projects.filter((p) => p.status === "complete").length
    : DASHBOARD_STATS.completedReconstructions;
  const inQueue = projects
    ? projects.filter((p) => p.status === "processing" || p.status === "queued").length
    : DASHBOARD_STATS.activeQueue;

  const latestCompleted = projects?.find((p) => p.status === "complete") || projects?.[0];

  return (
    <WorkspaceShell title="Overview">
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        {/* Mission Showcase Hero Banner */}
        <div className="relative overflow-hidden rounded-sm border border-line bg-gradient-to-r from-surface-panel via-surface to-surface-raised p-6 shadow-xl">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-signal-cyan/5 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start sm:items-center gap-5">
              <div className="relative shrink-0">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-signal-cyan/30 to-signal-green/20 blur-sm" />
                <img
                  src="/logo.png"
                  alt="DepthWizard Mission Emblem"
                  className="relative h-20 w-20 rounded-full object-cover shadow-lg ring-2 ring-signal-cyan/50"
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-xl font-semibold text-ink tracking-tight">
                    DepthWizard Mission Control
                  </h2>
                  <span className="font-mono text-[11px] text-signal-cyan rounded bg-signal-cyan/15 px-2 py-0.5 border border-signal-cyan/30">
                    डेप्थविज़ार्ड · ISRO / SIH 2026
                  </span>
                </div>
                <p className="mt-1 text-[13px] text-ink-muted max-w-2xl leading-relaxed">
                  Autonomous Monocular 3D Digital Surface Model (DSM) Reconstruction, Ground-Truth Validation & WorldPop Disaster Impact Analytics.
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-mono text-ink-faint">
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-signal-cyan" />
                    Depth Anything V2
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-signal-green" />
                    WorldPop Gridded Analytics
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-signal-amber" />
                    Metric Elevation Calibration
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Link href="/workspace/upload">
                <Button className="flex items-center gap-1.5 shadow-md">
                  <Sparkles className="h-3.5 w-3.5" />
                  New reconstruction
                </Button>
              </Link>
              {latestCompleted && (
                <Link href={`/workspace/viewer?project=${latestCompleted.id}`}>
                  <Button variant="secondary" className="flex items-center gap-1.5">
                    <Box className="h-3.5 w-3.5 text-signal-cyan" />
                    3D Viewer
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* 4 Dashboard Stats with colored top borders */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Panel className="p-5 border-t-2 border-t-signal-cyan">
            <div className="mb-3 flex items-center justify-between">
              <FolderKanban className="h-4 w-4 text-signal-cyan" strokeWidth={1.75} />
              <span className="font-mono text-[10px] text-ink-faint uppercase">Projects</span>
            </div>
            <StatReadout label="Total projects" value={totalProjects} />
          </Panel>

          <Panel className="p-5 border-t-2 border-t-signal-green">
            <div className="mb-3 flex items-center justify-between">
              <CheckCircle2 className="h-4 w-4 text-signal-green" strokeWidth={1.75} />
              <span className="font-mono text-[10px] text-signal-green uppercase">Ready</span>
            </div>
            <StatReadout label="Completed" value={completedProjects} />
          </Panel>

          <Panel className="p-5 border-t-2 border-t-signal-amber">
            <div className="mb-3 flex items-center justify-between">
              <Clock className="h-4 w-4 text-signal-amber" strokeWidth={1.75} />
              <span className="font-mono text-[10px] text-signal-amber uppercase">Speed</span>
            </div>
            <StatReadout
              label="Avg. processing"
              value={DASHBOARD_STATS.averageProcessingMinutes}
              unit="min"
            />
          </Panel>

          <Panel className="p-5 border-t-2 border-t-signal-cyan">
            <div className="mb-3 flex items-center justify-between">
              <Layers className="h-4 w-4 text-signal-cyan" strokeWidth={1.75} />
              <span className="font-mono text-[10px] text-ink-faint uppercase">Queue</span>
            </div>
            <StatReadout label="In queue" value={inQueue} />
          </Panel>
        </div>

        {/* Recent Projects List */}
        <div id="projects" className="scroll-mt-20">
          <Panel className="border border-line shadow-md">
            <PanelHeader>
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-signal-cyan" />
                <h3 className="text-[14px] font-medium text-ink">Reconstructed Projects</h3>
              </div>
              <span className="font-mono text-[11px] text-ink-faint">
                {projects?.length ?? "—"} active
              </span>
            </PanelHeader>

            <div className="divide-y divide-line">
              {projects === null &&
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulseSoft bg-surface-raised/40" />
                ))}

              {projects?.map((project) => {
                const isH5 = project.name.toLowerCase().endsWith(".h5") || project.name.toLowerCase().endsWith(".hdf5");

                return (
                  <div
                    key={project.id}
                    className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-surface-raised/40"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-surface-raised border border-line">
                        <FileCode2 className="h-4 w-4 text-signal-cyan" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-mono text-[13.5px] font-medium text-ink">
                            {project.name}
                          </p>
                          {isH5 && (
                            <Badge tone="cyan">HDF5</Badge>
                          )}
                        </div>
                        <p className="mt-0.5 text-[12px] text-ink-faint">
                          {project.thumbnailLabel} · {project.mode} mode · {formatDate(project.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge tone={STATUS_TONE[project.status]}>{project.status}</Badge>

                      <div className="flex items-center gap-1">
                        <Link
                          href={`/workspace/viewer?project=${project.id}`}
                          className="focus-ring flex items-center gap-1 rounded px-2.5 py-1 text-[12px] font-medium text-signal-cyan hover:bg-signal-cyan/10 transition-colors"
                        >
                          <Box className="h-3.5 w-3.5" />
                          Viewer
                        </Link>

                        <Link
                          href={`/workspace/analysis?project=${project.id}`}
                          className="focus-ring flex items-center gap-1 rounded px-2.5 py-1 text-[12px] font-medium text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors"
                        >
                          <LineChart className="h-3.5 w-3.5" />
                          Analysis
                        </Link>

                        <Link
                          href={`/workspace/validation?project=${project.id}`}
                          className="focus-ring flex items-center gap-1 rounded px-2.5 py-1 text-[12px] font-medium text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Validate
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>

        {/* Team Section */}
        <TeamSection />
      </div>
    </WorkspaceShell>
  );
}

