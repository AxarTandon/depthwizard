"use client";

import { useEffect, useState } from "react";
import { Users, TriangleAlert } from "lucide-react";
import { Panel, PanelHeader, Badge, StatReadout } from "@/components/ui/Panel";
import { getPopulationEstimate, getDisasterClassification } from "@/lib/api";
import { PopulationEstimate, DisasterClassification } from "@/types";

const CONFIDENCE_TONE: Record<string, "green" | "amber" | "red"> = {
  high: "red",
  medium: "amber",
  low: "green",
};

/** Population estimate + rule-based disaster classification, shown together
 * on the Analysis page next to the elevation/slope stats. */
export function RiskInsightsPanel({ projectId }: { projectId: string }) {
  const [population, setPopulation] = useState<PopulationEstimate | null>(null);
  const [classification, setClassification] = useState<DisasterClassification | null>(null);

  useEffect(() => {
    getPopulationEstimate(projectId).then(setPopulation);
    getDisasterClassification(projectId).then(setClassification);
  }, [projectId]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Panel>
        <PanelHeader>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-signal-cyan" strokeWidth={1.75} />
            <h3 className="text-[14px] font-medium text-ink">Population estimate</h3>
          </div>
        </PanelHeader>
        {!population ? (
          <div className="h-20 animate-pulseSoft bg-surface-raised/40" />
        ) : (
          <div className="p-4">
            <StatReadout
              label="Estimated people in scene"
              value={population.estimated_population.toLocaleString()}
              unit="residents"
            />
            {population.density_km2 && (
              <p className="mt-1 text-[12px] font-mono text-signal-cyan">
                {population.density_km2.toLocaleString()} people / km²
              </p>
            )}
            <p className="mt-2 text-[11.5px] leading-relaxed text-ink-faint">{population.note}</p>
            <div className="mt-3 flex items-center gap-2">
              <Badge tone={population.method.includes("worldpop") ? "green" : (CONFIDENCE_TONE[population.confidence] ?? "neutral")}>
                {population.method.includes("worldpop") ? "WorldPop Gridded" : `${population.confidence} confidence`}
              </Badge>
              {population.source && (
                <span className="text-[11px] text-ink-faint truncate max-w-[200px]">
                  {population.source}
                </span>
              )}
            </div>
          </div>
        )}
      </Panel>

      <Panel>
        <PanelHeader>
          <div className="flex items-center gap-2">
            <TriangleAlert className="h-4 w-4 text-signal-amber" strokeWidth={1.75} />
            <h3 className="text-[14px] font-medium text-ink">Disaster classification</h3>
          </div>
        </PanelHeader>
        {!classification ? (
          <div className="h-20 animate-pulseSoft bg-surface-raised/40" />
        ) : (
          <div className="divide-y divide-line">
            {classification.labels.map((label) => (
              <div key={label.label} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[12.5px] text-ink">{label.label}</p>
                  <p className="mt-0.5 text-[11px] text-ink-faint">{label.evidence}</p>
                </div>
                <Badge tone={CONFIDENCE_TONE[label.confidence]}>{label.confidence}</Badge>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
