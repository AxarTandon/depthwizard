import { AnalysisMetrics, MeasurementPoint, MeasurementResult } from "@/types";
import { computeSlopeMatrix, getElevationBounds } from "./terrain";

function mean(values: number[]) {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function buildHistogram(values: number[], bucketCount: number, unit: string) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 0.001);
  const bucketSize = span / bucketCount;
  const buckets = new Array(bucketCount).fill(0);

  for (const v of values) {
    let idx = Math.floor((v - min) / bucketSize);
    if (idx >= bucketCount) idx = bucketCount - 1;
    if (idx < 0) idx = 0;
    buckets[idx]++;
  }

  return buckets.map((count, i) => {
    const start = min + i * bucketSize;
    const end = start + bucketSize;
    return {
      bucket: `${start.toFixed(0)}–${end.toFixed(0)}${unit}`,
      count,
    };
  });
}

export function computeAnalysisMetrics(elevations: number[][]): AnalysisMetrics {
  const flat = elevations.flat();
  const { min, max } = getElevationBounds(elevations);
  const slopeMatrix = computeSlopeMatrix(elevations);
  const flatSlope = slopeMatrix.flat();

  const meanElevation = mean(flat);
  const meanSlope = mean(flatSlope);
  const maxSlope = Math.max(...flatSlope);

  // Elevation profile along the central row, sampled every 2 cells.
  const midRow = elevations[Math.floor(elevations.length / 2)];
  const elevationProfile = midRow
    .filter((_, i) => i % 2 === 0)
    .map((elevation, i) => ({ distance: i * 2 * 10, elevation }));

  return {
    minElevation: min,
    maxElevation: max,
    meanElevation,
    elevationRange: max - min,
    meanSlope,
    maxSlope,
    relief: max - min,
    elevationHistogram: buildHistogram(flat, 8, "m"),
    slopeHistogram: buildHistogram(flatSlope, 8, "°"),
    elevationProfile,
  };
}

export function computeMeasurement(
  pointA: MeasurementPoint,
  pointB: MeasurementPoint
): MeasurementResult {
  const dx = pointB.worldPosition[0] - pointA.worldPosition[0];
  const dz = pointB.worldPosition[2] - pointA.worldPosition[2];
  const dy = pointB.elevation - pointA.elevation;

  const horizontalDistance = Math.hypot(dx, dz);
  const elevationDifference = Math.abs(dy);
  const distance3D = Math.hypot(horizontalDistance, dy);

  return {
    pointA,
    pointB,
    horizontalDistance,
    elevationDifference,
    distance3D,
  };
}

export function formatMeters(value: number, digits = 1) {
  return `${value.toFixed(digits)} m`;
}

export function formatDegrees(value: number, digits = 1) {
  return `${value.toFixed(digits)}°`;
}
