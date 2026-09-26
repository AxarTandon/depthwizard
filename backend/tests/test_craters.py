import numpy as np
from app.services.craters import detect_craters


def test_detect_craters_finds_circular_depression():
    elevation = np.full((60, 60), 10.0)
    yy, xx = np.ogrid[:60, :60]
    dist = np.sqrt((xx - 30) ** 2 + (yy - 30) ** 2)
    elevation[dist < 8] -= 5.0  # circular depression

    craters = detect_craters(elevation, min_depth_m=1.0, min_circularity=0.5)
    assert len(craters) >= 1
    assert craters[0]["depth_m"] > 1.0
