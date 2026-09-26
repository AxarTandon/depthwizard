import numpy as np


def submerged_mask(elevation: np.ndarray, water_level: float) -> np.ndarray:
    return (elevation <= water_level).astype(np.uint8)


def flood_summary(elevation: np.ndarray, water_level: float) -> dict:
    mask = submerged_mask(elevation, water_level)
    return {
        "water_level": water_level,
        "submerged_percent": round(100 * float(np.sum(mask)) / elevation.size, 1),
        "min_m": float(np.min(elevation)),
        "max_m": float(np.max(elevation)),
    }
