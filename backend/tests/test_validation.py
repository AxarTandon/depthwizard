import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import numpy as np
from app.services.validation import compute_validation_metrics


def test_compute_validation_metrics_identical_arrays():
    elevation = np.random.uniform(0, 100, (20, 20))
    result = compute_validation_metrics(elevation, elevation.copy())
    assert result["status"] == "available"
    assert result["rmse"] == 0.0
    assert result["mae"] == 0.0
    assert abs(result["correlation"] - 1.0) < 1e-6


def test_compute_validation_metrics_known_offset():
    np.random.seed(0)
    elevation = np.random.uniform(40, 60, (10, 10))
    reference = elevation - 5.0
    result = compute_validation_metrics(elevation, reference)
    assert abs(result["rmse"] - 5.0) < 1e-6
    assert abs(result["mae"] - 5.0) < 1e-6
    assert result["correlation"] > 0.99


def test_compute_validation_metrics_constant_arrays_no_nan():
    elevation = np.full((10, 10), 50.0)
    reference = np.full((10, 10), 45.0)
    result = compute_validation_metrics(elevation, reference)
    assert result["rmse"] == 5.0
    assert result["correlation"] is None  # undefined for zero-variance input, not NaN


if __name__ == "__main__":
    import os
    import sys
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
    print("Running test_compute_validation_metrics_identical_arrays()...")
    test_compute_validation_metrics_identical_arrays()
    print("Running test_compute_validation_metrics_known_offset()...")
    test_compute_validation_metrics_known_offset()
    print("Running test_compute_validation_metrics_constant_arrays_no_nan()...")
    test_compute_validation_metrics_constant_arrays_no_nan()
    print("All validation unit tests passed successfully!")
