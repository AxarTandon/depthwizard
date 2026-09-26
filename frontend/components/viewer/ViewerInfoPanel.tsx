"use client";

import { MeasurementResult, TerrainQueryResult } from "@/types";
import { formatDegrees, formatMeters } from "@/lib/calculations";

export function ViewerInfoPanel({
  query,
  measurement,
  measuring,
  flythrough,
}: {
  query: TerrainQueryResult | null;
  measurement: MeasurementResult | null;
  measuring: boolean;
  flythrough: boolean;
}) {
  const showQuery = query && !measuring && !flythrough;
  const showMeasurement = measurement && measuring;

  if (!showQuery && !showMeasurement) return null;

  return (
    <div className="pointer-events-none absolute bottom-4 right-4 w-64 rounded-sm border border-line-bright bg-surface-panel/95 backdrop-blur">
      {showQuery && (
        <div className="p-4">
          <p className="mb-3 text-[11px] uppercase tracking-wide text-ink-faint">Terrain query</p>
          <dl className="grid grid-cols-2 gap-y-2 font-mono text-[13px]">
            <dt className="text-ink-faint">X</dt>
            <dd className="text-right text-ink">{query!.x}</dd>
            <dt className="text-ink-faint">Y</dt>
            <dd className="text-right text-ink">{query!.y}</dd>
            <dt className="text-ink-faint">Elevation</dt>
            <dd className="text-right text-signal-cyan">{formatMeters(query!.elevation)}</dd>
            <dt className="text-ink-faint">Slope</dt>
            <dd className="text-right text-signal-cyan">{formatDegrees(query!.slope)}</dd>
          </dl>
        </div>
      )}

      {showMeasurement && (
        <div className="p-4">
          <p className="mb-3 text-[11px] uppercase tracking-wide text-ink-faint">Measurement</p>
          <dl className="grid grid-cols-2 gap-y-2 font-mono text-[13px]">
            <dt className="text-ink-faint">Horizontal</dt>
            <dd className="text-right text-ink">{formatMeters(measurement!.horizontalDistance)}</dd>
            <dt className="text-ink-faint">Elev. diff.</dt>
            <dd className="text-right text-ink">{formatMeters(measurement!.elevationDifference)}</dd>
            <dt className="text-ink-faint">3D distance</dt>
            <dd className="text-right text-signal-cyan">{formatMeters(measurement!.distance3D)}</dd>
          </dl>
        </div>
      )}
    </div>
  );
}
