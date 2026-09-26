"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { Panel, PanelHeader, StatReadout } from "@/components/ui/Panel";
import { getAnalysis, getProjects } from "@/lib/api";
import { AnalysisMetrics } from "@/types";
import { AlertsPanel } from "@/components/workspace/AlertsPanel";
import { RiskInsightsPanel } from "@/components/workspace/RiskInsightsPanel";
import { PopulationAnalysisPanel } from "@/components/workspace/PopulationAnalysisPanel";

const chartTooltipStyle = {
  backgroundColor: "#0F151B",
  border: "1px solid #2A3D49",
  borderRadius: 2,
  fontSize: 12,
  fontFamily: "var(--font-mono)",
  color: "#DCE7ED",
};

function AnalysisContent() {
  const params = useSearchParams();
  const rawProject = params.get("project");
  const [projectId, setProjectId] = useState<string>(rawProject ?? "proj-demo");
  const [metrics, setMetrics] = useState<AnalysisMetrics | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      let target = rawProject;
      if (!target) {
        try {
          const projs = await getProjects();
          const completed = projs.find((p) => p.status === "complete");
          if (completed) {
            target = completed.id;
          } else if (projs.length > 0) {
            target = projs[0].id;
          }
        } catch {
          // fallback
        }
      }
      const finalId = target ?? "proj-demo";
      if (!cancelled) setProjectId(finalId);
      try {
        const data = await getAnalysis(finalId);
        if (!cancelled) setMetrics(data);
      } catch (err) {
        console.warn("Failed to load analysis:", err);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [rawProject]);

  return (
    <WorkspaceShell title="Analysis">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <h2 className="font-display text-xl font-semibold text-ink">Terrain analysis</h2>
        <p className="mt-1 text-[13.5px] text-ink-muted">
          Computed from the reconstructed elevation surface for this project.
        </p>

        {!metrics ? (
          <div className="mt-8 h-40 animate-pulseSoft bg-surface-panel" />
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Panel className="p-5">
                <StatReadout label="Min elevation" value={metrics.minElevation.toFixed(1)} unit="m" />
              </Panel>
              <Panel className="p-5">
                <StatReadout label="Max elevation" value={metrics.maxElevation.toFixed(1)} unit="m" />
              </Panel>
              <Panel className="p-5">
                <StatReadout label="Mean elevation" value={metrics.meanElevation.toFixed(1)} unit="m" />
              </Panel>
              <Panel className="p-5">
                <StatReadout label="Elevation range" value={metrics.elevationRange.toFixed(1)} unit="m" />
              </Panel>
              <Panel className="p-5">
                <StatReadout label="Mean slope" value={metrics.meanSlope.toFixed(1)} unit="°" />
              </Panel>
              <Panel className="p-5">
                <StatReadout label="Max slope" value={metrics.maxSlope.toFixed(1)} unit="°" />
              </Panel>
              <Panel className="p-5">
                <StatReadout label="Relief" value={metrics.relief.toFixed(1)} unit="m" />
              </Panel>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Panel>
                <PanelHeader>
                  <h3 className="text-[14px] font-medium text-ink">Elevation distribution</h3>
                </PanelHeader>
                <div className="h-64 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.elevationHistogram}>
                      <CartesianGrid stroke="#1C2831" vertical={false} />
                      <XAxis
                        dataKey="bucket"
                        tick={{ fill: "#8199A6", fontSize: 10 }}
                        axisLine={{ stroke: "#1C2831" }}
                        tickLine={false}
                      />
                      <YAxis tick={{ fill: "#8199A6", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: "rgba(72,211,230,0.06)" }} />
                      <Bar dataKey="count" fill="#48D3E6" radius={[1, 1, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              <Panel>
                <PanelHeader>
                  <h3 className="text-[14px] font-medium text-ink">Slope distribution</h3>
                </PanelHeader>
                <div className="h-64 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.slopeHistogram}>
                      <CartesianGrid stroke="#1C2831" vertical={false} />
                      <XAxis
                        dataKey="bucket"
                        tick={{ fill: "#8199A6", fontSize: 10 }}
                        axisLine={{ stroke: "#1C2831" }}
                        tickLine={false}
                      />
                      <YAxis tick={{ fill: "#8199A6", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: "rgba(226,164,78,0.08)" }} />
                      <Bar dataKey="count" fill="#E2A44E" radius={[1, 1, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              <Panel className="lg:col-span-2">
                <PanelHeader>
                  <h3 className="text-[14px] font-medium text-ink">Elevation profile — central transect</h3>
                </PanelHeader>
                <div className="h-64 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metrics.elevationProfile}>
                      <CartesianGrid stroke="#1C2831" vertical={false} />
                      <XAxis
                        dataKey="distance"
                        tick={{ fill: "#8199A6", fontSize: 10 }}
                        axisLine={{ stroke: "#1C2831" }}
                        tickLine={false}
                        label={{ value: "distance (m)", position: "insideBottom", offset: -4, fill: "#4C6169", fontSize: 10 }}
                      />
                      <YAxis tick={{ fill: "#8199A6", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Line
                        type="monotone"
                        dataKey="elevation"
                        stroke="#48D3E6"
                        strokeWidth={1.75}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
            </div>

            {/* WorldPop Population Analysis */}
            <div className="mt-6">
              <PopulationAnalysisPanel projectId={projectId} />
            </div>

            <div className="mt-6">
              <RiskInsightsPanel projectId={projectId} />
            </div>

            <div className="mt-6">
              <AlertsPanel projectId={projectId} />
            </div>
          </>
        )}
      </div>
    </WorkspaceShell>
  );
}

export default function AnalysisPage() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulseSoft bg-surface-panel" />}>
      <AnalysisContent />
    </Suspense>
  );
}
