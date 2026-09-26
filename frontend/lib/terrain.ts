// ---------------------------------------------------------------------------
// DepthWizard — deterministic demo terrain generator
// Produces a fixed 128x128 elevation matrix that is identical on every load.
// This stands in for a real DSM/rDSM returned by the reconstruction backend.
// ---------------------------------------------------------------------------

export const TERRAIN_SIZE = 128;
const SEED = 913_057; // fixed seed -> deterministic output on every run

// Mulberry32 seeded PRNG — deterministic given the same seed.
function mulberry32(seed: number) {
  let a = seed;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Deterministic 2D value-noise built on a fixed-seed lattice.
function buildLattice(size: number, cell: number, seed: number): number[][] {
  const rand = mulberry32(seed);
  const rows = Math.ceil(size / cell) + 2;
  const cols = Math.ceil(size / cell) + 2;
  const lattice: number[][] = [];
  for (let y = 0; y < rows; y++) {
    const row: number[] = [];
    for (let x = 0; x < cols; x++) {
      row.push(rand() * 2 - 1);
    }
    lattice.push(row);
  }
  return lattice;
}

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

function sampleLattice(lattice: number[][], cell: number, x: number, y: number) {
  const gx = x / cell;
  const gy = y / cell;
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const x1 = x0 + 1;
  const y1 = y0 + 1;
  const tx = smoothstep(gx - x0);
  const ty = smoothstep(gy - y0);

  const v00 = lattice[y0]?.[x0] ?? 0;
  const v10 = lattice[y0]?.[x1] ?? 0;
  const v01 = lattice[y1]?.[x0] ?? 0;
  const v11 = lattice[y1]?.[x1] ?? 0;

  const a = v00 + (v10 - v00) * tx;
  const b = v01 + (v11 - v01) * tx;
  return a + (b - a) * ty;
}

function fractalNoise(x: number, y: number, lattices: { lattice: number[][]; cell: number; amp: number }[]) {
  let sum = 0;
  let maxAmp = 0;
  for (const { lattice, cell, amp } of lattices) {
    sum += sampleLattice(lattice, cell, x, y) * amp;
    maxAmp += amp;
  }
  return sum / maxAmp;
}

function gaussianBump(x: number, y: number, cx: number, cy: number, radius: number, height: number) {
  const dx = x - cx;
  const dy = y - cy;
  const d2 = dx * dx + dy * dy;
  return height * Math.exp(-d2 / (2 * radius * radius));
}

function ridgeContribution(x: number, y: number, size: number) {
  // A diagonal ridge line running across the terrain, softened with noise.
  const t = (x + y) / (size * 2); // 0..1 along the diagonal
  const ridgeCenter = size * 0.55 - t * size * 0.25;
  const dist = Math.abs(y - ridgeCenter - Math.sin(x * 0.09) * 6);
  const width = 9;
  return Math.max(0, 1 - dist / width) * 14;
}

function buildingBump(x: number, y: number, cx: number, cy: number, w: number, h: number, height: number) {
  const halfW = w / 2;
  const halfH = h / 2;
  const dx = Math.abs(x - cx);
  const dy = Math.abs(y - cy);
  if (dx <= halfW && dy <= halfH) {
    // sharp edges with a small parapet falloff for realism
    const edgeFalloff =
      1 - Math.max(0, Math.max(dx - halfW + 1.2, dy - halfH + 1.2)) / 1.2;
    return height * Math.max(0.85, edgeFalloff);
  }
  return 0;
}

/**
 * Generates the deterministic demo elevation matrix.
 * Identical output on every call — no randomness derived from time or Math.random().
 */
export function generateDemoElevation(size: number = TERRAIN_SIZE): number[][] {
  const largeLattice = buildLattice(size, 40, SEED);
  const midLattice = buildLattice(size, 16, SEED + 17);
  const fineLattice = buildLattice(size, 6, SEED + 91);

  const lattices = [
    { lattice: largeLattice, cell: 40, amp: 1.0 },
    { lattice: midLattice, cell: 16, amp: 0.45 },
    { lattice: fineLattice, cell: 6, amp: 0.15 },
  ];

  const elevations: number[][] = [];

  for (let y = 0; y < size; y++) {
    const row: number[] = [];
    for (let x = 0; x < size; x++) {
      let h = 18 + fractalNoise(x, y, lattices) * 16; // rolling base terrain

      // Hills
      h += gaussianBump(x, y, size * 0.22, size * 0.28, 16, 26);
      h += gaussianBump(x, y, size * 0.78, size * 0.18, 12, 18);
      h += gaussianBump(x, y, size * 0.65, size * 0.72, 20, 22);

      // Valleys (negative bumps)
      h -= gaussianBump(x, y, size * 0.4, size * 0.6, 14, 20);
      h -= gaussianBump(x, y, size * 0.15, size * 0.75, 10, 12);

      // Ridge line
      h += ridgeContribution(x, y, size);

      // Flat plateau area (blend toward a constant height)
      const plateauDist = Math.hypot(x - size * 0.82, y - size * 0.82);
      if (plateauDist < 14) {
        const blend = smoothstep(1 - plateauDist / 14);
        h = h * (1 - blend) + 34 * blend;
      }

      // Building-like structures — a small cluster, sharp rectangular bumps
      h += buildingBump(x, y, size * 0.32, size * 0.5, 5, 5, 14);
      h += buildingBump(x, y, size * 0.36, size * 0.47, 4, 4, 11);
      h += buildingBump(x, y, size * 0.29, size * 0.46, 3.5, 6, 9);
      h += buildingBump(x, y, size * 0.34, size * 0.54, 3, 3, 8);

      row.push(Math.max(0, h));
    }
    elevations.push(row);
  }

  return elevations;
}

export function getElevationBounds(elevations: number[][]) {
  let min = Infinity;
  let max = -Infinity;
  for (const row of elevations) {
    for (const v of row) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  return { min, max };
}

/** Approximate slope (degrees) from neighboring height samples, cell size in meters. */
export function computeSlopeMatrix(elevations: number[][], cellSize = 10): number[][] {
  const size = elevations.length;
  const slopes: number[][] = [];
  for (let y = 0; y < size; y++) {
    const row: number[] = [];
    for (let x = 0; x < size; x++) {
      const left = elevations[y][Math.max(0, x - 1)];
      const right = elevations[y][Math.min(size - 1, x + 1)];
      const up = elevations[Math.max(0, y - 1)][x];
      const down = elevations[Math.min(size - 1, y + 1)][x];

      const dzdx = (right - left) / (2 * cellSize);
      const dzdy = (down - up) / (2 * cellSize);
      const slopeRad = Math.atan(Math.hypot(dzdx, dzdy));
      row.push((slopeRad * 180) / Math.PI);
    }
    slopes.push(row);
  }
  return slopes;
}

/** Generates contour line segments (as pairs of points) using marching-squares on the elevation grid. */
export function generateContourSegments(
  elevations: number[][],
  interval = 5
): { a: [number, number]; b: [number, number]; level: number }[] {
  const size = elevations.length;
  const { min, max } = getElevationBounds(elevations);
  const segments: { a: [number, number]; b: [number, number]; level: number }[] = [];

  const levels: number[] = [];
  for (let lvl = Math.ceil(min / interval) * interval; lvl <= max; lvl += interval) {
    levels.push(lvl);
  }

  const interp = (
    p1: [number, number],
    v1: number,
    p2: [number, number],
    v2: number,
    level: number
  ): [number, number] => {
    const t = v2 === v1 ? 0.5 : (level - v1) / (v2 - v1);
    return [p1[0] + (p2[0] - p1[0]) * t, p1[1] + (p2[1] - p1[1]) * t];
  };

  for (const level of levels) {
    for (let y = 0; y < size - 1; y++) {
      for (let x = 0; x < size - 1; x++) {
        const tl = elevations[y][x];
        const tr = elevations[y][x + 1];
        const br = elevations[y + 1][x + 1];
        const bl = elevations[y + 1][x];

        let idx = 0;
        if (tl > level) idx |= 8;
        if (tr > level) idx |= 4;
        if (br > level) idx |= 2;
        if (bl > level) idx |= 1;

        if (idx === 0 || idx === 15) continue;

        const pTL: [number, number] = [x, y];
        const pTR: [number, number] = [x + 1, y];
        const pBR: [number, number] = [x + 1, y + 1];
        const pBL: [number, number] = [x, y + 1];

        const top = interp(pTL, tl, pTR, tr, level);
        const right = interp(pTR, tr, pBR, br, level);
        const bottom = interp(pBL, bl, pBR, br, level);
        const left = interp(pTL, tl, pBL, bl, level);

        const pushSeg = (a: [number, number], b: [number, number]) =>
          segments.push({ a, b, level });

        switch (idx) {
          case 1:
          case 14:
            pushSeg(left, bottom);
            break;
          case 2:
          case 13:
            pushSeg(bottom, right);
            break;
          case 3:
          case 12:
            pushSeg(left, right);
            break;
          case 4:
          case 11:
            pushSeg(top, right);
            break;
          case 6:
          case 9:
            pushSeg(top, bottom);
            break;
          case 7:
          case 8:
            pushSeg(left, top);
            break;
          case 5:
            pushSeg(left, top);
            pushSeg(bottom, right);
            break;
          case 10:
            pushSeg(top, right);
            pushSeg(left, bottom);
            break;
        }
      }
    }
  }

  return segments;
}
