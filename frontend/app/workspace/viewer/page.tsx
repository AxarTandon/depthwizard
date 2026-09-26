"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { Viewer3D } from "@/components/viewer/Viewer3D";
import { getTerrainData, getMeshUrl, getProjects } from "@/lib/api";
import { TerrainResponse } from "@/types";

// Cesium touches `window` at import time - must be client-only, no SSR.
const CesiumViewer = dynamic(
  () => import("@/components/viewer/CesiumViewer").then((m) => m.CesiumViewer),
  { ssr: false }
);

function ViewerContent() {
  const params = useSearchParams();
  const rawProject = params.get("project");
  const [projectId, setProjectId] = useState<string>(rawProject ?? "proj-demo");
  const [terrain, setTerrain] = useState<TerrainResponse | null>(null);
  const [meshUrl, setMeshUrl] = useState<string | null>(null);

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
      getTerrainData(finalId)
        .then((t) => { if (!cancelled) setTerrain(t); })
        .catch(() => {});
      getMeshUrl(finalId)
        .then((m) => { if (!cancelled) setMeshUrl(m); })
        .catch(() => {});
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [rawProject]);

  // Georeferenced + calibrated -> globe-accurate CesiumJS branch.
  // Everything else (relative rDSM, or no bounds) -> the existing Three.js viewer.
  const useCesium = terrain?.calibrated && terrain?.mode === "DSM" && terrain?.bounds && meshUrl;

  return (
    <div className="h-full w-full">
      {!terrain ? (
        <div className="flex h-full w-full items-center justify-center bg-void">
          <div className="flex items-center gap-3 text-ink-muted">
            <span className="h-2 w-2 animate-pulseSoft rounded-full bg-signal-cyan" />
            <span className="font-mono text-sm">Loading terrain mesh…</span>
          </div>
        </div>
      ) : useCesium ? (
        <CesiumViewer meshUrl={meshUrl!} bounds={terrain.bounds!} />
      ) : (
        <Viewer3D elevations={terrain.elevations} />
      )}
    </div>
  );
}

export default function ViewerPage() {
  return (
    <WorkspaceShell title="3D Viewer">
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center bg-void">
            <span className="font-mono text-sm text-ink-muted">Loading viewer…</span>
          </div>
        }
      >
        <ViewerContent />
      </Suspense>
    </WorkspaceShell>
  );
}
