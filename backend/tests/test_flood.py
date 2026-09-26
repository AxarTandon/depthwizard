import numpy as np
from app.services.flood import flood_summary, submerged_mask


def test_submerged_mask_basic():
    elevation = np.array([[0, 5], [10, 15]], dtype=float)
    mask = submerged_mask(elevation, water_level=5)
    assert mask.tolist() == [[1, 1], [0, 0]]


def test_flood_summary_percent():
    elevation = np.array([[0, 10], [20, 30]], dtype=float)
    summary = flood_summary(elevation, water_level=10)
    assert summary["submerged_percent"] == 50.0
    assert summary["min_m"] == 0
    assert summary["max_m"] == 30
