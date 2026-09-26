"""Terrain statistics (slope, histograms, profile) for the /analysis endpoint
and for the Recharts-ready data the frontend expects."""
import numpy as np


def compute_slope_degrees(elevation: np.ndarray, cell_size_m: float = 1.0) -> np.ndarray:
    gy, gx = np.gradient(elevation, cell_size_m)
    slope_rad = np.arctan(np.sqrt(gx ** 2 + gy ** 2))
    return np.degrees(slope_rad)


def histogram(values: np.ndarray, buckets: int = 10) -> list[dict]:
    counts, edges = np.histogram(values, bins=buckets)
    return [
        {"bucket": f"{edges[i]:.1f}-{edges[i + 1]:.1f}", "count": int(counts[i])}
        for i in range(buckets)
    ]


def elevation_profile(elevation: np.ndarray, cell_size_m: float = 1.0) -> list[dict]:
    """Diagonal cross-section profile - simple, deterministic, chart-ready."""
    h, w = elevation.shape
    n = min(h, w)
    idx = np.linspace(0, n - 1, min(n, 50)).astype(int)
    return [
        {"distance": round(float(i * cell_size_m), 2), "elevation": round(float(elevation[i, i]), 2)}
        for i in idx
    ]


def compute_metrics(elevation: np.ndarray, cell_size_m: float = 1.0) -> dict:
    slope = compute_slope_degrees(elevation, cell_size_m)
    return {
        "minElevation": round(float(np.min(elevation)), 2),
        "maxElevation": round(float(np.max(elevation)), 2),
        "meanElevation": round(float(np.mean(elevation)), 2),
        "elevationRange": round(float(np.ptp(elevation)), 2),
        "meanSlope": round(float(np.mean(slope)), 2),
        "maxSlope": round(float(np.max(slope)), 2),
        "relief": round(float(np.max(elevation) - np.min(elevation)), 2),
        "elevationHistogram": histogram(elevation),
        "slopeHistogram": histogram(slope),
        "elevationProfile": elevation_profile(elevation, cell_size_m),
    }
