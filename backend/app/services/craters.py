"""Depression + circularity heuristic - needs zero labeled training data."""
import numpy as np
import cv2


def detect_craters(elevation: np.ndarray, min_depth_m: float, min_circularity: float,
                    pixel_to_meter: float = 1.0) -> list[dict]:
    smoothed = cv2.GaussianBlur(elevation.astype(np.float32), (9, 9), 0)
    local_avg = cv2.blur(smoothed, (31, 31))
    depression = local_avg - smoothed

    mask = (depression > min_depth_m).astype(np.uint8) * 255
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    craters = []
    for c in contours:
        area = cv2.contourArea(c)
        if area < 20:
            continue
        perimeter = cv2.arcLength(c, True)
        if perimeter == 0:
            continue
        circularity = 4 * np.pi * area / (perimeter ** 2)
        if circularity < min_circularity:
            continue
        (cx, cy), radius = cv2.minEnclosingCircle(c)
        region_mask = np.zeros_like(mask)
        cv2.drawContours(region_mask, [c], -1, 255, -1)
        depth_values = depression[region_mask > 0]
        craters.append({
            "x": float(cx), "y": float(cy),
            "radius_px": float(radius), "radius_m": float(radius * pixel_to_meter),
            "depth_m": float(np.max(depth_values)), "circularity": float(circularity),
        })
    return craters
