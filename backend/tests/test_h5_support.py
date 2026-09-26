import os
import sys
import tempfile
import numpy as np
import h5py

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.geo.raster_io import is_h5_file, read_h5_image_array, read_image_array, read_geo_metadata
from app.api.v1.processing import ALLOWED_EXT
from app.services.validation import align_reference


def test_h5_allowed_in_processing():
    assert "h5" in ALLOWED_EXT
    assert "hdf5" in ALLOWED_EXT
    print("test_h5_allowed_in_processing passed")


def test_h5_synthetic_reading_and_geo():
    with tempfile.NamedTemporaryFile(suffix=".h5", delete=False) as tmp:
        path = tmp.name

    try:
        with h5py.File(path, "w") as f:
            data = np.random.randint(0, 255, (128, 128, 3), dtype=np.uint8)
            f.create_dataset("imagery", data=data)
            f.attrs["north"] = 28.7
            f.attrs["south"] = 28.5
            f.attrs["west"] = 77.1
            f.attrs["east"] = 77.3
            f.attrs["crs"] = "EPSG:4326"

        assert is_h5_file(path)
        img = read_image_array(path)
        assert img.shape == (128, 128, 3)

        meta = read_geo_metadata(path)
        assert meta is not None
        assert meta["bounds"]["north"] == 28.7
        assert meta["bounds"]["west"] == 77.1

        # Test align_reference with H5
        aligned = align_reference(path, (64, 64), meta["bounds"], meta["crs"])
        assert aligned is not None
        assert aligned.shape == (64, 64)

        print("test_h5_synthetic_reading_and_geo passed")
    finally:
        if os.path.exists(path):
            os.unlink(path)


if __name__ == "__main__":
    test_h5_allowed_in_processing()
    test_h5_synthetic_reading_and_geo()
    print("All H5 support tests passed!")
