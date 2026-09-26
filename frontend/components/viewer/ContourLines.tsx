"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { generateContourSegments } from "@/lib/terrain";
import { CELL_SIZE, VERTICAL_SCALE } from "./useTerrainGeometry";

export function ContourLines({ elevations, interval = 5 }: { elevations: number[][]; interval?: number }) {
  const geometry = useMemo(() => {
    const size = elevations.length;
    const half = ((size - 1) * CELL_SIZE) / 2;
    const segments = generateContourSegments(elevations, interval);

    const positions: number[] = [];

    const sampleElevation = (gx: number, gz: number) => {
      const x0 = Math.min(size - 1, Math.max(0, Math.round(gx)));
      const z0 = Math.min(size - 1, Math.max(0, Math.round(gz)));
      return elevations[z0][x0];
    };

    for (const seg of segments) {
      const y1 = sampleElevation(seg.a[0], seg.a[1]) * VERTICAL_SCALE + 0.06;
      const y2 = sampleElevation(seg.b[0], seg.b[1]) * VERTICAL_SCALE + 0.06;
      positions.push(
        seg.a[0] * CELL_SIZE - half,
        y1,
        seg.a[1] * CELL_SIZE - half,
        seg.b[0] * CELL_SIZE - half,
        y2,
        seg.b[1] * CELL_SIZE - half
      );
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, [elevations, interval]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#0A2A2E" transparent opacity={0.85} />
    </lineSegments>
  );
}
