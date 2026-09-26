"""Building height extraction + collapse-damage radius simulation."""
import numpy as np
import cv2

from app.ml.adapters.segmentation_adapter import BUILDING_CLASS, ROAD_CLASS


def analyze_buildings(elevation: np.ndarray, segmentation_mask: np.ndarray,
                       collapse_radius_factor: float, pixel_to_meter: float = 1.0) -> list[dict]:
    building_mask = (segmentation_mask == BUILDING_CLASS).astype(np.uint8)
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(building_mask, connectivity=8)

    non_building = elevation[segmentation_mask != BUILDING_CLASS]
    # Defensive: an all-building (or entirely empty) mask would make
    # non_building empty - fall back to the scene's overall median rather
    # than crashing on np.median([]) for an unusual test image.
    ground_ref = float(np.median(non_building)) if non_building.size > 0 else float(np.median(elevation))

    buildings = []
    for label_id in range(1, num_labels):
        area_px = stats[label_id, cv2.CC_STAT_AREA]
        if area_px < 15:
            continue
        footprint = labels == label_id
        peak_elevation = float(np.max(elevation[footprint]))
        height_m = max(0.0, peak_elevation - ground_ref)
        cx, cy = centroids[label_id]
        collapse_radius_m = height_m * collapse_radius_factor
        collapse_radius_px = collapse_radius_m / pixel_to_meter if pixel_to_meter else collapse_radius_m

        at_risk = _structures_in_radius(labels, label_id, segmentation_mask, cx, cy, collapse_radius_px)
        buildings.append({
            "id": int(label_id), "x": float(cx), "y": float(cy),
            "footprint_px": int(area_px), "height_m": round(height_m, 2),
            "collapse_radius_m": round(collapse_radius_m, 2),
            "at_risk_buildings": at_risk["buildings"], "at_risk_roads_px": at_risk["road_px"],
            "risk_level": _risk_level(height_m, at_risk["buildings"]),
        })
    return buildings


def _structures_in_radius(labels, self_id, segmentation_mask, cx, cy, radius_px) -> dict:
    h, w = segmentation_mask.shape
    yy, xx = np.ogrid[:h, :w]
    within = (xx - cx) ** 2 + (yy - cy) ** 2 <= radius_px ** 2
    other = set(np.unique(labels[within & (labels > 0)])) - {self_id}
    road_px = int(np.sum(within & (segmentation_mask == ROAD_CLASS)))
    return {"buildings": len(other), "road_px": road_px}


def _risk_level(height_m: float, at_risk_buildings: int) -> str:
    if height_m >= 25 and at_risk_buildings >= 2:
        return "high"
    if height_m >= 10 or at_risk_buildings >= 1:
        return "medium"
    return "low"
