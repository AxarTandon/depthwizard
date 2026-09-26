"""
SRTM 30m calibration - converts relative depth to absolute metric elevation
for georeferenced (GeoTIFF) inputs, using the free OpenTopography REST API.
"""
import os
import tempfile

import numpy as np
import requests


def fetch_srtm_tile(bounds: dict, shape: tuple[int, int], api_key: str = "") -> np.ndarray | None:
    """
    Fetches an SRTM GL1 30m elevation tile covering `bounds`
    (west/south/east/north, EPSG:4326) from the OpenTopography Global
    Datasets API, and resamples it to `shape` (height, width) so it lines up
    pixel-for-pixel with the relative depth map.

    Returns None (keeping the pipeline in relative/rDSM mode) if no API key
    is configured or the request fails - never fabricates elevation data.
    """
    if not api_key:
        return None

    try:
        resp = requests.get(
            "https://portal.opentopography.org/API/globaldem",
            params={
                "demtype": "SRTMGL1",
                "south": bounds["south"], "north": bounds["north"],
                "west": bounds["west"], "east": bounds["east"],
                "outputFormat": "GTiff",
                "API_Key": api_key,
            },
            timeout=30,
        )
        resp.raise_for_status()

        with tempfile.NamedTemporaryFile(suffix=".tif", delete=False) as tmp:
            tmp.write(resp.content)
            tmp_path = tmp.name

        try:
            import rasterio
            from rasterio.warp import reproject, Resampling

            with rasterio.open(tmp_path) as src:
                target_h, target_w = shape
                dest = np.empty((target_h, target_w), dtype=np.float32)
                reproject(
                    source=rasterio.band(src, 1),
                    destination=dest,
                    src_transform=src.transform, src_crs=src.crs,
                    dst_transform=src.transform, dst_crs=src.crs,
                    resampling=Resampling.bilinear,
                )
                return dest
        finally:
            os.unlink(tmp_path)

    except Exception:
        # Network hiccup, invalid bounds, rate limit, etc. - fall back to
        # relative-only mode rather than raising and failing the whole job.
        return None


def calibrate_with_srtm(relative_depth: np.ndarray, srtm_tile: np.ndarray) -> dict:
    """Robust linear fit: relative_depth -> meters, using the SRTM tile as
    ground truth. Also doubles as a validation signal (rmse/mae/correlation)."""
    x = relative_depth.flatten()
    y = srtm_tile.flatten()
    valid = ~(np.isnan(x) | np.isnan(y))
    x, y = x[valid], y[valid]

    A = np.vstack([x, np.ones_like(x)]).T
    scale, offset = np.linalg.lstsq(A, y, rcond=None)[0]
    absolute_elevation = relative_depth * scale + offset

    fitted = x * scale + offset
    residuals = fitted - y
    rmse = float(np.sqrt(np.mean(residuals ** 2)))
    mae = float(np.mean(np.abs(residuals)))
    correlation = float(np.corrcoef(x, y)[0, 1]) if len(x) > 1 else 0.0

    return {
        "elevation_m": absolute_elevation,
        "scale": float(scale), "offset": float(offset),
        "rmse": rmse, "mae": mae, "correlation": correlation,
    }


def normalize_relative(relative_depth: np.ndarray) -> np.ndarray:
    d = relative_depth.astype(np.float32)
    d_min, d_max = np.nanmin(d), np.nanmax(d)
    if d_max - d_min < 1e-6:
        return np.zeros_like(d)
    return (d - d_min) / (d_max - d_min)
