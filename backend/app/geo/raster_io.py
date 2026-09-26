"""GeoTIFF and HDF5 (.h5/.hdf5) metadata helpers and imagery readers."""
import os
import numpy as np


def is_h5_file(path: str) -> bool:
    """Checks whether a given file path is an HDF5 / .h5 file by extension or signature."""
    if not os.path.exists(path):
        return False
    ext = os.path.splitext(path)[1].lower()
    if ext in {".h5", ".hdf5", ".he5", ".hdf"}:
        return True
    try:
        with open(path, "rb") as f:
            header = f.read(8)
            return header.startswith(b"\x89HDF\r\n\x1a\n")
    except Exception:
        return False


def _find_datasets(group, prefix=""):
    """Recursively collects (dataset_path, dataset_obj) pairs from an HDF5 group."""
    import h5py
    datasets = []
    for key, item in group.items():
        full_key = f"{prefix}/{key}" if prefix else f"/{key}"
        if isinstance(item, h5py.Dataset):
            datasets.append((full_key, item))
        elif isinstance(item, h5py.Group):
            datasets.extend(_find_datasets(item, full_key))
    return datasets


def _find_separate_bands(datasets_dict):
    """Detects if individual color/satellite bands exist as distinct datasets."""
    lower_map = {k.lower().rstrip("/").split("/")[-1]: v for k, v in datasets_dict.items()}

    # Check for red, green, blue
    if all(k in lower_map for k in ("red", "green", "blue")):
        r, g, b = lower_map["red"][()], lower_map["green"][()], lower_map["blue"][()]
        if r.ndim == 2 and r.shape == g.shape == b.shape:
            return np.stack([r, g, b], axis=-1)

    # Check for Sentinel-2 / Landsat true-color bands (B04=Red, B03=Green, B02=Blue)
    for r_k, g_k, b_k in [("b04", "b03", "b02"), ("b4", "b3", "b2"), ("band_4", "band_3", "band_2")]:
        if r_k in lower_map and g_k in lower_map and b_k in lower_map:
            r, g, b = lower_map[r_k][()], lower_map[g_k][()], lower_map[b_k][()]
            if r.ndim == 2 and r.shape == g.shape == b.shape:
                return np.stack([r, g, b], axis=-1)

    # Check for sequential band 1, 2, 3
    for b1, b2, b3 in [("b1", "b2", "b3"), ("band1", "band2", "band3"), ("band_1", "band_2", "band_3")]:
        if b1 in lower_map and b2 in lower_map and b3 in lower_map:
            r, g, b = lower_map[b1][()], lower_map[b2][()], lower_map[b3][()]
            if r.ndim == 2 and r.shape == g.shape == b.shape:
                return np.stack([r, g, b], axis=-1)

    return None


def read_h5_image_array(path: str) -> np.ndarray:
    """Reads imagery from an HDF5 (.h5 / .hdf5) file and returns a BGR uint8 ndarray."""
    import cv2
    import h5py

    with h5py.File(path, "r") as f:
        datasets = _find_datasets(f)
        if not datasets:
            raise ValueError(f"No datasets found in HDF5 file: {path}")

        dset_dict = {k: v for k, v in datasets}

        # Check for separated band datasets
        composite = _find_separate_bands(dset_dict)
        if composite is not None:
            raw_arr = composite
        else:
            # Score and pick best candidate dataset
            PRIORITY_KEYWORDS = [
                "image", "img", "rgb", "radiance", "reflectance", "imagery",
                "source", "raster", "optical", "data", "surface", "band", "dsm", "dem"
            ]

            def score_dataset(item):
                name, ds = item
                s = 0
                if ds.ndim not in (2, 3, 4):
                    return -100
                lower_name = name.lower()
                for idx, kw in enumerate(PRIORITY_KEYWORDS):
                    if kw in lower_name:
                        s += 50 - idx * 2
                # Favor typical image shapes
                shape = ds.shape
                if ds.ndim == 3 and shape[-1] in (3, 4):
                    s += 40
                elif ds.ndim == 3 and shape[0] in (3, 4):
                    s += 35
                elif ds.ndim == 2 and shape[0] >= 32 and shape[1] >= 32:
                    s += 20
                return s

            best_dset_name, best_dset = max(datasets, key=score_dataset)
            raw_arr = best_dset[()]

    if raw_arr is None or raw_arr.size == 0:
        raise ValueError(f"Empty data array read from HDF5 file: {path}")

    # Clean non-finite values
    raw_arr = np.nan_to_num(raw_arr, copy=False, nan=0.0, posinf=0.0, neginf=0.0)

    # Squeeze unit dimensions (e.g. (1, H, W, 3) or (1, 1, H, W))
    raw_arr = np.squeeze(raw_arr)

    # Handle shape and channel dimensions
    if raw_arr.ndim == 2:
        # Grayscale / single band
        gray = _stretch_to_uint8(raw_arr)
        return cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)

    elif raw_arr.ndim == 3:
        # Check channel dimension: (C, H, W) vs (H, W, C)
        if raw_arr.shape[0] in (1, 3, 4) and raw_arr.shape[1] > 4 and raw_arr.shape[2] > 4:
            # Channel first -> transpose to (H, W, C)
            raw_arr = raw_arr.transpose(1, 2, 0)
        elif raw_arr.shape[0] > 4 and raw_arr.shape[1] > 4 and raw_arr.shape[2] not in (1, 2, 3, 4):
            # Many channels first (e.g. hyperspectral) -> take first 3
            raw_arr = raw_arr[:3].transpose(1, 2, 0)

        c = raw_arr.shape[-1]
        if c == 1:
            gray = _stretch_to_uint8(raw_arr[:, :, 0])
            return cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
        elif c >= 3:
            # Take first 3 channels (assumed RGB in H5 format)
            rgb_arr = raw_arr[:, :, :3]
            rgb_uint8 = _stretch_to_uint8(rgb_arr)
            return cv2.cvtColor(rgb_uint8, cv2.COLOR_RGB2BGR)
        else:
            # 2 channels -> pad with zero
            h, w = raw_arr.shape[:2]
            three_ch = np.zeros((h, w, 3), dtype=raw_arr.dtype)
            three_ch[:, :, :c] = raw_arr
            rgb_uint8 = _stretch_to_uint8(three_ch)
            return cv2.cvtColor(rgb_uint8, cv2.COLOR_RGB2BGR)

    elif raw_arr.ndim == 4:
        # Take first sample if batch dimension
        sub_arr = raw_arr[0]
        if sub_arr.shape[0] in (1, 3, 4):
            sub_arr = sub_arr.transpose(1, 2, 0)
        rgb_uint8 = _stretch_to_uint8(sub_arr[:, :, :3])
        return cv2.cvtColor(rgb_uint8, cv2.COLOR_RGB2BGR)

    raise ValueError(f"Unsupported array shape {raw_arr.shape} in HDF5 file: {path}")


def _stretch_to_uint8(arr: np.ndarray) -> np.ndarray:
    """Applies robust percentile contrast stretch and converts any numerical range to uint8."""
    if arr.dtype == np.uint8:
        return arr

    arr_f = arr.astype(np.float32)
    # Check if already in standard normalized [0, 1] range
    arr_min, arr_max = float(np.min(arr_f)), float(np.max(arr_f))
    if 0.0 <= arr_min and arr_max <= 1.0:
        return np.clip(arr_f * 255.0, 0, 255).astype(np.uint8)

    # 2nd to 98th percentile linear stretch (standard remote sensing visual stretch)
    p2, p98 = np.percentile(arr_f, (2, 98))
    if p98 > p2:
        stretched = np.clip((arr_f - p2) / (p98 - p2) * 255.0, 0, 255)
        return stretched.astype(np.uint8)
    elif arr_max > arr_min:
        stretched = np.clip((arr_f - arr_min) / (arr_max - arr_min) * 255.0, 0, 255)
        return stretched.astype(np.uint8)
    return np.zeros_like(arr, dtype=np.uint8)


def read_h5_geo_metadata(path: str) -> dict | None:
    """Extracts CRS and geospatial bounding box from HDF5 attributes or coordinates datasets."""
    import h5py

    try:
        with h5py.File(path, "r") as f:
            crs = None
            west = south = east = north = None
            width = height = resolution = None

            # Helper to inspect an attribute dict
            def check_attrs(attrs):
                nonlocal crs, west, south, east, north, resolution
                for k, v in attrs.items():
                    kl = k.lower()
                    if kl in ("crs", "epsg", "projection", "srs", "coord_sys") and crs is None:
                        crs = str(v)
                    elif kl in ("bounds", "bbox", "extent"):
                        try:
                            vals = [float(x) for x in v]
                            if len(vals) == 4:
                                west, south, east, north = vals
                        except Exception:
                            pass
                    elif kl in ("upperleftlatitude", "top_latitude", "north", "lat_max"):
                        north = float(v)
                    elif kl in ("upperleftlongitude", "left_longitude", "west", "lon_min"):
                        west = float(v)
                    elif kl in ("lowerrightlatitude", "bottom_latitude", "south", "lat_min"):
                        south = float(v)
                    elif kl in ("lowerrightlongitude", "right_longitude", "east", "lon_max"):
                        east = float(v)
                    elif kl in ("resolution", "pixel_size", "spatial_resolution") and resolution is None:
                        try:
                            resolution = float(v)
                        except Exception:
                            pass

            check_attrs(f.attrs)

            # Check datasets and their attributes
            datasets = _find_datasets(f)
            for name, ds in datasets:
                check_attrs(ds.attrs)
                nl = name.lower().split("/")[-1]
                # Check for lat/lon coordinate datasets
                if nl in ("latitude", "lat") and (south is None or north is None):
                    try:
                        vals = ds[()]
                        south = float(np.min(vals))
                        north = float(np.max(vals))
                    except Exception:
                        pass
                elif nl in ("longitude", "lon") and (west is None or east is None):
                    try:
                        vals = ds[()]
                        west = float(np.min(vals))
                        east = float(np.max(vals))
                    except Exception:
                        pass
                if ds.ndim >= 2 and width is None and height is None:
                    shape = ds.shape
                    if ds.ndim == 2:
                        height, width = shape
                    elif ds.ndim == 3:
                        if shape[0] in (1, 3, 4):
                            height, width = shape[1], shape[2]
                        else:
                            height, width = shape[0], shape[1]

            if west is not None and south is not None and east is not None and north is not None:
                if width and not resolution:
                    resolution = abs((east - west) / width)
                return {
                    "crs": crs or "EPSG:4326",
                    "bounds": {
                        "west": float(west),
                        "south": float(south),
                        "east": float(east),
                        "north": float(north),
                    },
                    "width": int(width or 512),
                    "height": int(height or 512),
                    "resolution": float(resolution or 0.0001),
                }
    except Exception:
        pass
    return None


def read_geo_metadata(path: str) -> dict | None:
    """Returns CRS/bounds/transform/resolution for a GeoTIFF or HDF5, or None if
    the file has no georeferencing."""
    if is_h5_file(path):
        meta = read_h5_geo_metadata(path)
        if meta is not None:
            return meta

    try:
        import rasterio
        with rasterio.open(path) as src:
            if src.crs is None:
                return None
            bounds = src.bounds
            return {
                "crs": str(src.crs),
                "bounds": {
                    "west": bounds.left, "south": bounds.bottom,
                    "east": bounds.right, "north": bounds.top,
                },
                "width": src.width,
                "height": src.height,
                "resolution": abs(src.transform.a),
            }
    except Exception:
        return None


def read_image_array(path: str, max_dimension: int = 1536) -> np.ndarray:
    """Reads any image OpenCV or HDF5 supports. Downscales very large images
    (keeping aspect ratio) before they reach the depth/segmentation models -
    keeps inference time and memory bounded regardless of what size file a
    user or judge hands us, without needing to know the source in advance."""
    import cv2

    if is_h5_file(path):
        img = read_h5_image_array(path)
    else:
        img = cv2.imread(path)
        if img is None:
            # Fallback: check if file is HDF5 regardless of extension
            try:
                img = read_h5_image_array(path)
            except Exception:
                raise ValueError(f"Could not read image: {path}. Unsupported or corrupt file.")

    h, w = img.shape[:2]
    longest_side = max(h, w)
    if longest_side > max_dimension:
        scale = max_dimension / longest_side
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    return img
