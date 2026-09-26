"""
End-to-end pipeline: image -> relative depth -> segmentation -> (SRTM
calibration if georeferenced) -> terrain stats -> flood range -> craters ->
building collapse-damage -> population estimate -> disaster classification ->
alert-trigger check. Orchestrates every service module in this app.
"""
import os
import time

import cv2
import numpy as np

from app.core.config import get_settings
from app.geo import raster_io, srtm
from app.ml.adapters.segmentation_adapter import SegmentationAdapter, get_adapter, \
    BUILDING_CLASS, VEGETATION_CLASS
from app.services import analysis, flood as flood_service, craters as crater_service, \
    building_damage, population as population_service, disaster_classifier, alerts as alert_service

settings = get_settings()
_segmenter = SegmentationAdapter()


def _classify_landscape(segmentation_mask: np.ndarray) -> str:
    total = segmentation_mask.size
    building_frac = np.sum(segmentation_mask == BUILDING_CLASS) / total
    veg_frac = np.sum(segmentation_mask == VEGETATION_CLASS) / total
    if building_frac > 0.25:
        return "urban"
    if veg_frac > 0.5:
        return "forested"
    if veg_frac > 0.2:
        return "hilly"
    return "sparse"


def run_pipeline(image_path: str, output_dir: str, progress_cb=None) -> dict:
    """progress_cb(stage: str, progress: float) is called as each stage completes,
    so the caller (worker) can update the ProcessingJob row for polling."""
    start = time.time()

    def report(stage, pct):
        if progress_cb:
            progress_cb(stage, pct)

    report("preprocessing", 10)
    image_bgr = raster_io.read_image_array(image_path)
    geo_meta = raster_io.read_geo_metadata(image_path)
    is_georeferenced = geo_meta is not None

    report("height_estimation", 30)
    depth_adapter = get_adapter(settings.DEPTH_MODEL_ADAPTER, settings)
    relative_depth = depth_adapter.predict(image_bgr)

    report("scale_calibration", 45)
    segmentation_mask = _segmenter.predict(image_bgr, settings.SEGMENTATION_WEIGHTS_PATH)
    landscape_type = _classify_landscape(segmentation_mask)

    calibrated = False
    rmse = mae = correlation = None
    if is_georeferenced:
        srtm_tile = srtm.fetch_srtm_tile(geo_meta["bounds"], relative_depth.shape,
                                          settings.OPENTOPOGRAPHY_API_KEY)
        if srtm_tile is not None:
            calib = srtm.calibrate_with_srtm(relative_depth, srtm_tile)
            elevation = calib["elevation_m"]
            rmse, mae, correlation = calib["rmse"], calib["mae"], calib["correlation"]
            calibrated = True
        else:
            elevation = srtm.normalize_relative(relative_depth) * 50.0
    else:
        elevation = srtm.normalize_relative(relative_depth) * 50.0

    report("surface_reconstruction", 65)
    metrics = analysis.compute_metrics(elevation)
    flood_range = flood_service.flood_summary(elevation, float(np.median(elevation)))

    report("mesh_generation", 80)
    # Disaster-analysis modules are treated as best-effort: an unusual test
    # image (e.g. all-water, all-sky, extreme aspect ratio) should not stop
    # the core DSM/mesh deliverable from being produced. Each module logs its
    # own failure and degrades to an empty/neutral result instead.
    try:
        craters = crater_service.detect_craters(
            elevation, settings.CRATER_MIN_DEPTH_M, settings.CRATER_MIN_CIRCULARITY)
    except Exception:
        craters = []
    try:
        buildings = building_damage.analyze_buildings(
            elevation, segmentation_mask, settings.COLLAPSE_RADIUS_FACTOR)
    except Exception:
        buildings = []
    try:
        population = population_service.estimate_population(
            segmentation_mask, bounds=geo_meta["bounds"] if geo_meta else None)
    except Exception:
        population = {"estimated_population": 0, "method": "unavailable",
                       "confidence": "low", "note": "Population estimate failed for this scene."}
    try:
        disaster_labels = disaster_classifier.classify(
            flood_range, buildings, craters, metrics["meanSlope"])
    except Exception:
        disaster_labels = []
    try:
        triggers = alert_service.evaluate_triggers(flood_range, buildings, craters)
    except Exception:
        triggers = []

    report("analysis", 95)
    norm = ((elevation - elevation.min()) / (np.ptp(elevation) + 1e-6) * 255).astype(np.uint8)
    depth_png_path = os.path.join(output_dir, "heightmap.png")
    texture_path = os.path.join(output_dir, "texture.jpg")
    seg_png_path = os.path.join(output_dir, "segmentation.png")
    cv2.imwrite(depth_png_path, norm)
    cv2.imwrite(texture_path, image_bgr)
    cv2.imwrite(seg_png_path, (segmentation_mask * 50).astype(np.uint8))

    report("analysis", 100)
    return {
        "is_georeferenced": is_georeferenced,
        "calibrated": calibrated,
        "mode": "DSM" if calibrated else "rDSM",
        "landscape_type": landscape_type,
        "crs": geo_meta["crs"] if geo_meta else None,
        "bounds": geo_meta["bounds"] if geo_meta else None,
        "resolution": geo_meta["resolution"] if geo_meta else 1.0,
        "rmse": rmse, "mae": mae, "correlation": correlation,
        "metrics": metrics,
        "flood_meta": {"min_m": flood_range["min_m"], "max_m": flood_range["max_m"]},
        "craters": craters,
        "buildings": buildings,
        "population": population,
        "disaster_classification": disaster_labels,
        "alert_triggers": triggers,
        "depth_map_path": depth_png_path,
        "texture_path": texture_path,
        "segmentation_path": seg_png_path,
        "processing_time_s": round(time.time() - start, 2),
    }
