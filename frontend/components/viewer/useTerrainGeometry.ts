"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { computeSlopeMatrix, getElevationBounds } from "@/lib/terrain";
import { ViewerRenderMode } from "@/types";

const VERTICAL_SCALE = 0.55;
const CELL_SIZE = 0.9;

// Color ramps expressed as [stop, r, g, b] with components 0..1.
const ELEVATION_RAMP: [number, number, number, number][] = [
  [0.0, 0.09, 0.16, 0.24],
  [0.25, 0.11, 0.32, 0.38],
  [0.5, 0.19, 0.55, 0.55],
  [0.72, 0.42, 0.72, 0.55],
  [0.88, 0.75, 0.72, 0.45],
  [1.0, 0.93, 0.91, 0.86],
];

const SLOPE_RAMP: [number, number, number, number][] = [
  [0.0, 0.11, 0.31, 0.35],
  [0.35, 0.16, 0.53, 0.55],
  [0.6, 0.55, 0.66, 0.32],
  [0.8, 0.82, 0.55, 0.25],
  [1.0, 0.85, 0.28, 0.24],
];

const HEIGHT_RAMP: [number, number, number, number][] = [
  [0.0, 0.05, 0.09, 0.12],
  [0.5, 0.13, 0.4, 0.46],
  [1.0, 0.28, 0.83, 0.9],
];

function sampleRamp(ramp: [number, number, number, number][], t: number): [number, number, number] {
  const clamped = Math.min(1, Math.max(0, t));
  for (let i = 0; i < ramp.length - 1; i++) {
    const [s0, r0, g0, b0] = ramp[i];
    const [s1, r1, g1, b1] = ramp[i + 1];
    if (clamped >= s0 && clamped <= s1) {
      const localT = (clamped - s0) / (s1 - s0 || 1);
      return [r0 + (r1 - r0) * localT, g0 + (g1 - g0) * localT, b0 + (b1 - b0) * localT];
    }
  }
  const last = ramp[ramp.length - 1];
  return [last[1], last[2], last[3]];
}

export interface TerrainGeometryResult {
  geometry: THREE.BufferGeometry;
  size: number;
  cellSize: number;
  verticalScale: number;
  minElevation: number;
  maxElevation: number;
  worldToGrid: (x: number, z: number) => { gx: number; gz: number };
  gridToWorld: (gx: number, gz: number) => [number, number];
}

export function useTerrainGeometry(
  elevations: number[][],
  mode: ViewerRenderMode
): TerrainGeometryResult {
  return useMemo(() => {
    const size = elevations.length;
    const { min, max } = getElevationBounds(elevations);
    const range = Math.max(max - min, 0.001);
    const slopeMatrix = mode === "slope" ? computeSlopeMatrix(elevations) : null;
    const maxSlope = slopeMatrix ? Math.max(...slopeMatrix.flat()) : 1;

    const geometry = new THREE.PlaneGeometry(
      (size - 1) * CELL_SIZE,
      (size - 1) * CELL_SIZE,
      size - 1,
      size - 1
    );
    geometry.rotateX(-Math.PI / 2);

    const position = geometry.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(position.count * 3);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = y * size + x;
        const elevation = elevations[y][x];
        position.setY(idx, elevation * VERTICAL_SCALE);

        let t = (elevation - min) / range;
        let rgb: [number, number, number];

        if (mode === "slope" && slopeMatrix) {
          const slope = slopeMatrix[y][x];
          rgb = sampleRamp(SLOPE_RAMP, slope / (maxSlope || 1));
        } else if (mode === "relative-height") {
          rgb = sampleRamp(HEIGHT_RAMP, t);
        } else {
          // elevation and contour modes share the same base ramp;
          // contour lines are drawn as an overlay in a separate layer.
          rgb = sampleRamp(ELEVATION_RAMP, t);
        }

        colors[idx * 3] = rgb[0];
        colors[idx * 3 + 1] = rgb[1];
        colors[idx * 3 + 2] = rgb[2];
      }
    }

    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const half = ((size - 1) * CELL_SIZE) / 2;

    return {
      geometry,
      size,
      cellSize: CELL_SIZE,
      verticalScale: VERTICAL_SCALE,
      minElevation: min,
      maxElevation: max,
      worldToGrid: (x: number, z: number) => ({
        gx: (x + half) / CELL_SIZE,
        gz: (z + half) / CELL_SIZE,
      }),
      gridToWorld: (gx: number, gz: number) => [gx * CELL_SIZE - half, gz * CELL_SIZE - half],
    };
  }, [elevations, mode]);
}

export { VERTICAL_SCALE, CELL_SIZE };
