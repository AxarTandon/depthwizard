"""
Real DSM validation against an independent reference raster (LiDAR, a
higher-resolution DEM, or anything a judge hands us on the day) - computes
RMSE, MAE and Pearson correlation. This is distinct from the calibration
step's internal fit stats (which compare against the SAME SRTM tile used to
calibrate, so it's not an independent check) - this module is the real,
independent accuracy measurement the evaluation criteria ask for.
"""
import numpy as np


def compute_validation_metrics(generated_elevation: np.ndarray, reference_elevation: np.ndarray) -> dict:
    """Both arrays must already be the same shape (caller aligns/resamples
    the reference onto the generated grid first - see align_reference())."""
    gen = generated_elevation.flatten()
    ref = reference_elevation.flatten()

    valid = ~(np.isnan(gen) | np.isnan(ref))
    gen, ref = gen[valid], ref[valid]

    if len(gen) < 2:
        return {"status": "not_available", "message": "Not enough overlapping valid pixels to validate."}

    residuals = gen - ref
    rmse = float(np.sqrt(np.mean(residuals ** 2)))
    mae = float(np.mean(np.abs(residuals)))

    # Correlation is undefined for a constant array (zero variance) - guard
    # against NaN, which isn't valid JSON, rather than letting it leak out.
    if np.std(gen) < 1e-9 or np.std(ref) < 1e-9:
        correlation = None
    else:
        correlation = float(np.corrcoef(gen, ref)[0, 1])

    return {
        "status": "available",
        "rmse": round(rmse, 3),
        "mae": round(mae, 3),
        "correlation": round(correlation, 4) if correlation is not None else None,
        "sample_count": int(len(gen)),
    }


def align_reference(reference_path: str, target_shape: tuple[int, int],
                     target_bounds: dict | None, target_crs: str | None) -> np.ndarray | None:
    """
    Reads a reference raster (any GeoTIFF LiDAR/DEM, or a plain single-band
    image) and resamples it onto `target_shape` so it lines up pixel-for-
    pixel with the generated elevation grid.
    - If the reference has real CRS/bounds AND the project does too, reproject
      properly with rasterio.warp (correct for judges' real georeferenced
      LiDAR).
    - Otherwise (either side lacks georeferencing - the common case for a
      plain "here's a PNG DEM" test file), just resize to match shape, which
      is the best you can do without a shared coordinate system.
    Returns None if the file can't be read at all.
    """
    import cv2
    from app.geo.raster_io import is_h5_file, read_h5_image_array

    if is_h5_file(reference_path):
        try:
            arr = read_h5_image_array(reference_path)
            if arr.ndim == 3:
                arr = cv2.cvtColor(arr, cv2.COLOR_BGR2GRAY)
            return cv2.resize(arr.astype(np.float32), (target_shape[1], target_shape[0]))
        except Exception:
            return None

    try:
        import rasterio
        with rasterio.open(reference_path) as src:
            band = src.read(1).astype(np.float32)
            if src.crs is not None and target_bounds and target_crs:
                from rasterio.warp import reproject, Resampling
                dst = np.empty(target_shape, dtype=np.float32)
                dst_transform = rasterio.transform.from_bounds(
                    target_bounds["west"], target_bounds["south"],
                    target_bounds["east"], target_bounds["north"],
                    target_shape[1], target_shape[0],
                )
                reproject(
                    source=band, destination=dst,
                    src_transform=src.transform, src_crs=src.crs,
                    dst_transform=dst_transform, dst_crs=target_crs or src.crs,
                    resampling=Resampling.bilinear,
                )
                return dst
            return cv2.resize(band, (target_shape[1], target_shape[0]))
    except Exception:
        pass

    try:
        raw_img = cv2.imread(reference_path, cv2.IMREAD_UNCHANGED)
        if raw_img is not None:
            if raw_img.ndim == 3:
                raw_img = cv2.cvtColor(raw_img, cv2.COLOR_BGR2GRAY)
            return cv2.resize(raw_img.astype(np.float32), (target_shape[1], target_shape[0]))
    except Exception:
        pass

    return None


if __name__ == "__main__":
    import sys

    print("=" * 65)
    print(" DepthWizard — DSM Accuracy Validation Service")
    print(" Independent raster-to-raster accuracy benchmarking")
    print("=" * 65)

    if len(sys.argv) >= 3:
        gen_file = sys.argv[1]
        ref_file = sys.argv[2]
        print(f"Loading generated raster: {gen_file}")
        print(f"Loading reference raster: {ref_file}")
        try:
            import cv2
            gen = cv2.imread(gen_file, cv2.IMREAD_GRAYSCALE)
            if gen is None:
                raise ValueError("Could not read generated raster image.")
            ref = align_reference(ref_file, gen.shape, None, None)
            if ref is None:
                ref = cv2.imread(ref_file, cv2.IMREAD_GRAYSCALE)
            if ref is None:
                raise ValueError("Could not read or align reference raster.")
            metrics = compute_validation_metrics(gen.astype(np.float32), ref.astype(np.float32))
            print("\nValidation Results:")
            for k, v in metrics.items():
                print(f"  {k}: {v}")
        except Exception as e:
            print(f"Error processing files: {e}")
            sys.exit(1)
    else:
        print("\n[Running Self-Test & Accuracy Benchmark Demonstration]")
        np.random.seed(42)

        # Scenario 1: Identical surfaces
        print("\n--- Test 1: Ground Truth vs Exact Reconstructed DSM ---")
        truth = np.random.uniform(10.0, 85.0, (100, 100))
        res1 = compute_validation_metrics(truth, truth.copy())
        print(f"  Status:       {res1['status']}")
        print(f"  RMSE:         {res1['rmse']} m (Expected: 0.0)")
        print(f"  MAE:          {res1['mae']} m (Expected: 0.0)")
        print(f"  Correlation:  {res1['correlation']} (Expected: 1.0)")
        print(f"  Sample Count: {res1['sample_count']} pixels")

        # Scenario 2: Realistic noisy reconstruction (simulating monocular depth estimation vs LiDAR)
        print("\n--- Test 2: Simulated LiDAR Reference vs Reconstructed Surface ---")
        noise = np.random.normal(0, 1.8, (100, 100))
        estimated = truth + noise
        res2 = compute_validation_metrics(estimated, truth)
        print(f"  Status:       {res2['status']}")
        print(f"  RMSE:         {res2['rmse']} m")
        print(f"  MAE:          {res2['mae']} m")
        print(f"  Correlation:  {res2['correlation']}")
        print(f"  Sample Count: {res2['sample_count']} pixels")

        # Scenario 3: Handling Missing / NaN Pixels
        print("\n--- Test 3: Handling Missing / NaN Pixels ---")
        partial_truth = truth.copy()
        partial_truth[:20, :20] = np.nan
        res3 = compute_validation_metrics(estimated, partial_truth)
        print(f"  Status:       {res3['status']}")
        print(f"  RMSE:         {res3['rmse']} m")
        print(f"  Correlation:  {res3['correlation']}")
        print(f"  Sample Count: {res3['sample_count']} pixels (masked out NaNs)")

        print("\n" + "=" * 65)
        print(" Validation service executed successfully!")
        print(" To benchmark real files: python validation.py <generated_dsm> <reference_lidar>")
        print("=" * 65)

