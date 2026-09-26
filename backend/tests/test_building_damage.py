import numpy as np
from app.services.building_damage import analyze_buildings
from app.ml.adapters.segmentation_adapter import BUILDING_CLASS

def test_analyze_buildings_computes_height_and_radius():
    elevation = np.full((40, 40), 5.0)
    seg = np.zeros((40, 40), dtype=np.uint8)
    seg[10:15, 10:15] = BUILDING_CLASS
    elevation[10:15, 10:15] = 30.0  # a 25m-tall building above ground level 5

    buildings = analyze_buildings(elevation, seg, collapse_radius_factor=0.6)
    assert len(buildings) == 1
    assert buildings[0]["height_m"] == 25.0
    assert buildings[0]["collapse_radius_m"] == 15.0
