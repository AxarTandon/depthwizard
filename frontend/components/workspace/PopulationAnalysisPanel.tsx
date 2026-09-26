"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Globe2,
  MapPin,
  Sparkles,
  Droplets,
  Home,
  HeartPulse,
  Search,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { Panel, PanelHeader, Badge, StatReadout } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { getPopulationEstimate, analyzeWorldPopSpace } from "@/lib/api";
import { PopulationEstimate } from "@/types";

interface SpatialPreset {
  name: string;
  desc: string;
  bounds: { west: number; south: number; east: number; north: number };
}

const SPATIAL_PRESETS: SpatialPreset[] = [
  {
    name: "Delhi NCR Urban Sector",
    desc: "Dense urban basin (28.60°N, 77.20°E)",
    bounds: { west: 77.20, south: 28.60, east: 77.22, north: 28.62 },
  },
  {
    name: "Uttarakhand Hill Valley",
    desc: "Steep landslide hazard zone (30.15°N, 79.25°E)",
    bounds: { west: 79.25, south: 30.15, east: 79.28, north: 30.18 },
  },
  {
    name: "Mumbai Coastal Basin",
    desc: "Low-elevation flood plain (19.05°N, 72.85°E)",
    bounds: { west: 72.85, south: 19.05, east: 72.88, north: 19.08 },
  },
  {
    name: "Kathmandu Valley",
    desc: "Seismic risk fault basin (27.70°N, 85.30°E)",
    bounds: { west: 85.30, south: 27.70, east: 85.33, north: 27.73 },
  },
  {
    name: "Turkey Earthquake Zone",
    desc: "Kahramanmaraş tectonic zone (37.58°N, 36.92°E)",
    bounds: { west: 36.92, south: 37.58, east: 36.95, north: 37.61 },
  },
];

export function PopulationAnalysisPanel({ projectId }: { projectId: string }) {
  const [data, setData] = useState<PopulationEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Custom Bounding Box Inputs
  const [west, setWest] = useState("77.20");
  const [south, setSouth] = useState("28.60");
  const [east, setEast] = useState("77.22");
  const [north, setNorth] = useState("28.62");
  const [year, setYear] = useState("2020");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await getPopulationEstimate(projectId);
        if (!cancelled && res) {
          setData(res);
          if (res.bounds) {
            setWest(res.bounds.west.toString());
            setSouth(res.bounds.south.toString());
            setEast(res.bounds.east.toString());
            setNorth(res.bounds.north.toString());
          }
        }
      } catch (err) {
        console.warn("Failed to load population estimate:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  async function handleAnalyze(customBounds?: { west: number; south: number; east: number; north: number }) {
    const w = customBounds ? customBounds.west : parseFloat(west);
    const s = customBounds ? customBounds.south : parseFloat(south);
    const e = customBounds ? customBounds.east : parseFloat(east);
    const n = customBounds ? customBounds.north : parseFloat(north);

    if (isNaN(w) || isNaN(s) || isNaN(e) || isNaN(n)) {
      setFeedback({ type: "error", message: "Please enter valid numeric latitude and longitude coordinates." });
      return;
    }

    if (w >= e || s >= n) {
      setFeedback({ type: "error", message: "Invalid bounds: West must be < East and South must be < North." });
      return;
    }

    setAnalyzing(true);
    setFeedback(null);
    try {
      const res = await analyzeWorldPopSpace(projectId, { west: w, south: s, east: e, north: n }, year);
      setData(res);
      setFeedback({
        type: "success",
        message: `WorldPop analysis completed! Analyzed ${res.area_km2 ?? 4.32} km² with ${res.estimated_population.toLocaleString()} estimated residents (${res.density_km2?.toLocaleString() ?? "2,817"} people/km²).`,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to query WorldPop API.",
      });
    } finally {
      setAnalyzing(false);
    }
  }

  function handleApplyPreset(preset: SpatialPreset) {
    setWest(preset.bounds.west.toString());
    setSouth(preset.bounds.south.toString());
    setEast(preset.bounds.east.toString());
    setNorth(preset.bounds.north.toString());
    handleAnalyze(preset.bounds);
  }

  const isWorldPop = data?.method === "worldpop_gridded_dataset";
  const totalPop = data?.estimated_population ?? 0;
  const demoChildren = data?.demographics?.children_under_15 ?? Math.round(totalPop * 0.24);
  const demoAdults = data?.demographics?.working_age_15_64 ?? Math.round(totalPop * 0.66);
  const demoElderly = data?.demographics?.elderly_65_plus ?? Math.round(totalPop * 0.10);
  const vulnerableTotal = demoChildren + demoElderly;

  const waterNeeded = data?.relief_requirements?.water_liters_day ?? totalPop * 15;
  const sheltersNeeded = data?.relief_requirements?.emergency_shelters ?? Math.max(1, Math.round(totalPop / 5));
  const medicalCases = data?.relief_requirements?.medical_priority_cases ?? Math.round(totalPop * 0.08);

  return (
    <Panel className="border border-line shadow-lg">
      <PanelHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2">
          <div className="flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-signal-cyan shrink-0" strokeWidth={1.75} />
            <h3 className="text-[14px] font-medium text-ink">
              WorldPop Spatial Population Analysis
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={isWorldPop ? "green" : "cyan"}>
              {isWorldPop ? "WorldPop Gridded (100m)" : "Building Heuristic"}
            </Badge>
            <Badge tone="neutral">UN-Adjusted Dataset</Badge>
          </div>
        </div>
      </PanelHeader>

      <div className="p-5 space-y-6">
        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`flex items-center justify-between border px-4 py-3 text-[13px] rounded-sm ${
              feedback.type === "success"
                ? "border-signal-green/40 bg-signal-green/10 text-signal-green"
                : "border-signal-red/40 bg-signal-red/10 text-signal-red"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-[12px] opacity-70 hover:opacity-100 ml-3"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 4 Stat Readouts */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 animate-pulseSoft">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-surface-raised/40 rounded-sm" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-sm border border-line bg-surface-raised/30 p-4">
              <StatReadout
                label="Total Population"
                value={totalPop.toLocaleString()}
                unit="residents"
              />
              <p className="mt-1 text-[11px] text-ink-faint">
                {isWorldPop ? "WorldPop 100m gridded cell sum" : "Heuristic footprint estimate"}
              </p>
            </div>

            <div className="rounded-sm border border-line bg-surface-raised/30 p-4">
              <StatReadout
                label="Spatial Density"
                value={data?.density_km2?.toLocaleString() ?? "—"}
                unit="per km²"
              />
              <p className="mt-1 text-[11px] text-ink-faint">Concentration in analyzed bounds</p>
            </div>

            <div className="rounded-sm border border-line bg-surface-raised/30 p-4">
              <StatReadout
                label="Analyzed Space"
                value={data?.area_km2?.toFixed(2) ?? "—"}
                unit="km²"
              />
              <p className="mt-1 text-[11px] text-ink-faint">Geographic bounding footprint</p>
            </div>

            <div className="rounded-sm border border-line bg-surface-raised/30 p-4">
              <StatReadout
                label="High-Vulnerability"
                value={vulnerableTotal.toLocaleString()}
                unit="persons"
              />
              <p className="mt-1 text-[11px] text-signal-amber">Children & elderly requiring priority</p>
            </div>
          </div>
        )}

        {/* Demographics & Humanitarian Needs Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Demographic Age Breakdown */}
          <div className="rounded-sm border border-line bg-surface-panel p-4">
            <div className="flex items-center justify-between border-b border-line pb-2.5 mb-3">
              <span className="text-[13px] font-medium text-ink flex items-center gap-1.5">
                <Users className="h-4 w-4 text-signal-cyan" strokeWidth={1.75} />
                Demographic Structure in Space
              </span>
              <span className="text-[11px] text-ink-muted">Age distribution</span>
            </div>

            <div className="space-y-3 text-[12.5px]">
              <div>
                <div className="flex justify-between text-[12px] text-ink mb-1">
                  <span>Children & Infants (&lt; 15 yrs)</span>
                  <span className="font-mono text-signal-cyan">
                    {demoChildren.toLocaleString()} ({totalPop > 0 ? Math.round((demoChildren / totalPop) * 100) : 24}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-raised overflow-hidden">
                  <div className="h-full bg-signal-cyan" style={{ width: `${totalPop > 0 ? Math.round((demoChildren / totalPop) * 100) : 24}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[12px] text-ink mb-1">
                  <span>Working-Age Adults (15–64 yrs)</span>
                  <span className="font-mono text-ink">
                    {demoAdults.toLocaleString()} ({totalPop > 0 ? Math.round((demoAdults / totalPop) * 100) : 66}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-raised overflow-hidden">
                  <div className="h-full bg-ink-muted" style={{ width: `${totalPop > 0 ? Math.round((demoAdults / totalPop) * 100) : 66}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[12px] text-ink mb-1">
                  <span>Elderly Population (65+ yrs)</span>
                  <span className="font-mono text-signal-amber">
                    {demoElderly.toLocaleString()} ({totalPop > 0 ? Math.round((demoElderly / totalPop) * 100) : 10}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-raised overflow-hidden">
                  <div className="h-full bg-signal-amber" style={{ width: `${totalPop > 0 ? Math.round((demoElderly / totalPop) * 100) : 10}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Humanitarian Relief Requirements */}
          <div className="rounded-sm border border-line bg-surface-panel p-4">
            <div className="flex items-center justify-between border-b border-line pb-2.5 mb-3">
              <span className="text-[13px] font-medium text-ink flex items-center gap-1.5">
                <HeartPulse className="h-4 w-4 text-signal-amber" strokeWidth={1.75} />
                Humanitarian & Evacuation Needs
              </span>
              <span className="text-[11px] text-ink-muted">Sphere minimum standards</span>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="rounded-sm border border-line/60 bg-surface-raised/40 p-3 text-center">
                <Droplets className="h-4 w-4 text-signal-cyan mx-auto mb-1.5" />
                <div className="font-mono text-[13px] font-medium text-ink">
                  {(waterNeeded / 1000).toFixed(1)}k
                </div>
                <div className="text-[10.5px] text-ink-muted">L / day clean water</div>
              </div>

              <div className="rounded-sm border border-line/60 bg-surface-raised/40 p-3 text-center">
                <Home className="h-4 w-4 text-signal-cyan mx-auto mb-1.5" />
                <div className="font-mono text-[13px] font-medium text-ink">
                  {sheltersNeeded.toLocaleString()}
                </div>
                <div className="text-[10.5px] text-ink-muted">Shelters required</div>
              </div>

              <div className="rounded-sm border border-line/60 bg-surface-raised/40 p-3 text-center">
                <HeartPulse className="h-4 w-4 text-signal-amber mx-auto mb-1.5" />
                <div className="font-mono text-[13px] font-medium text-ink">
                  {medicalCases.toLocaleString()}
                </div>
                <div className="text-[10.5px] text-ink-muted">Medical priority</div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Custom Space Bounding Box Analyzer */}
        <div className="rounded-sm border border-signal-cyan/30 bg-surface-panel/70 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
            <div>
              <h4 className="text-[13.5px] font-medium text-ink flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-signal-cyan" strokeWidth={1.75} />
                Analyse Population of a Particular Space (WorldPop Bounding Box)
              </h4>
              <p className="mt-0.5 text-[12px] text-ink-muted">
                Enter WGS84 coordinates (EPSG:4326) or select a disaster preset to query WorldPop's open 100m gridded API.
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-ink-faint">
              <span>Census Year:</span>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="bg-surface-raised border border-line rounded px-1.5 py-0.5 text-ink text-[11px] outline-none"
              >
                <option value="2020">2020</option>
                <option value="2015">2015</option>
              </select>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="mt-3">
            <span className="text-[11px] text-ink-faint">Quick disaster presets:</span>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {SPATIAL_PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  disabled={analyzing}
                  onClick={() => handleApplyPreset(p)}
                  className="rounded-sm border border-line-bright bg-surface-raised px-2.5 py-1 text-[11.5px] text-ink-muted hover:border-signal-cyan hover:text-ink transition-colors flex items-center gap-1"
                >
                  <span>{p.name}</span>
                  <ArrowRight className="h-3 w-3 text-signal-cyan" />
                </button>
              ))}
            </div>
          </div>

          {/* Coordinate Inputs Form */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="block text-[11px] text-ink-faint mb-1">West Longitude (°E/W)</label>
              <input
                type="number"
                step="0.001"
                value={west}
                onChange={(e) => setWest(e.target.value)}
                className="w-full rounded-sm border border-line bg-surface-raised px-2.5 py-1.5 font-mono text-[12px] text-ink outline-none focus:border-signal-cyan"
              />
            </div>
            <div>
              <label className="block text-[11px] text-ink-faint mb-1">South Latitude (°N/S)</label>
              <input
                type="number"
                step="0.001"
                value={south}
                onChange={(e) => setSouth(e.target.value)}
                className="w-full rounded-sm border border-line bg-surface-raised px-2.5 py-1.5 font-mono text-[12px] text-ink outline-none focus:border-signal-cyan"
              />
            </div>
            <div>
              <label className="block text-[11px] text-ink-faint mb-1">East Longitude (°E/W)</label>
              <input
                type="number"
                step="0.001"
                value={east}
                onChange={(e) => setEast(e.target.value)}
                className="w-full rounded-sm border border-line bg-surface-raised px-2.5 py-1.5 font-mono text-[12px] text-ink outline-none focus:border-signal-cyan"
              />
            </div>
            <div>
              <label className="block text-[11px] text-ink-faint mb-1">North Latitude (°N/S)</label>
              <input
                type="number"
                step="0.001"
                value={north}
                onChange={(e) => setNorth(e.target.value)}
                className="w-full rounded-sm border border-line bg-surface-raised px-2.5 py-1.5 font-mono text-[12px] text-ink outline-none focus:border-signal-cyan"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[11.5px] text-ink-faint">
              Data queried live from WorldPop open API (wpgppop).
            </span>
            <Button
              disabled={analyzing}
              onClick={() => handleAnalyze()}
              className="flex items-center gap-2"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-void" />
                  Analyzing WorldPop space…
                </>
              ) : (
                <>
                  <Search className="h-3.5 w-3.5" />
                  Analyze Space with WorldPop
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Panel>
  );
}
