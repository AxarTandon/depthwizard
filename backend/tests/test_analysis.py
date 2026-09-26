import numpy as np
from app.services.analysis import compute_metrics


def test_compute_metrics_shapes():
    elevation = np.random.uniform(0, 100, (20, 20))
    metrics = compute_metrics(elevation)
    assert metrics["minElevation"] <= metrics["maxElevation"]
    assert len(metrics["elevationHistogram"]) == 10
    assert len(metrics["elevationProfile"]) > 0
