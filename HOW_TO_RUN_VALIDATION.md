# DepthWizard — How to Run Validation

This guide explains how to run the **DSM Accuracy Validation Service** ([validation.py](file:///c:/llast/depthwizard-fixed/backend/app/services/validation.py)) across multiple execution modes:
1. **Standalone Direct CLI** (built-in self-test & benchmark demonstration)
2. **Comparing Custom Rasters via CLI** (evaluating generated DSM vs reference LiDAR)
3. **Unit Tests** ([test_validation.py](file:///c:/llast/depthwizard-fixed/backend/tests/test_validation.py))
4. **FastAPI Backend REST API**
5. **Next.js Frontend Workspace UI**

---

## 1. Quick Start: Run the Validation File Directly

You can execute the validation file directly using Python from the workspace root:

```powershell
python backend/app/services/validation.py
```

### What Happens:
The file will run a complete self-contained accuracy validation benchmark across 3 scenarios:
- **Test 1: Exact Match** — Validates generated elevation against ground truth (expected RMSE = 0.0 m, MAE = 0.0 m, Pearson correlation = 1.0).
- **Test 2: Realistic Monocular Noise** — Simulates LiDAR reference data vs a reconstructed surface with sensor noise (computes RMSE, MAE, correlation over 10,000 pixels).
- **Test 3: Missing / NaN Overlap** — Demonstrates graceful masking of missing/unaligned pixels without NaN leakage.

### Expected Output:
```text
=================================================================
 DepthWizard — DSM Accuracy Validation Service
 Independent raster-to-raster accuracy benchmarking
=================================================================

[Running Self-Test & Accuracy Benchmark Demonstration]

--- Test 1: Ground Truth vs Exact Reconstructed DSM ---
  Status:       available
  RMSE:         0.0 m (Expected: 0.0)
  MAE:          0.0 m (Expected: 0.0)
  Correlation:  1.0 (Expected: 1.0)
  Sample Count: 10000 pixels

--- Test 2: Simulated LiDAR Reference vs Reconstructed Surface ---
  Status:       available
  RMSE:         1.8 m
  MAE:          1.433 m
  Correlation:  0.9965
  Sample Count: 10000 pixels

--- Test 3: Handling Missing / NaN Pixels ---
  Status:       available
  RMSE:         1.8 m
  Correlation:  0.9965
  Sample Count: 9600 pixels (masked out NaNs)

=================================================================
 Validation service executed successfully!
 To benchmark real files: python validation.py <generated_dsm> <reference_lidar>
=================================================================
```

---

## 2. Compare Your Own Raster Files (CLI Mode)

To benchmark a reconstructed DSM against an independent reference image or LiDAR raster:

```powershell
python backend/app/services/validation.py "path/to/generated_dsm.png" "path/to/reference_lidar.tif"
```

The script will:
1. Load both rasters.
2. Resample and reproject the reference raster to match the geometry of the generated DSM (via `rasterio` if georeferenced, or bilinear resize if unreferenced).
3. Compute and display:
   - **RMSE (m)**: Root Mean Square Error in meters.
   - **MAE (m)**: Mean Absolute Error in meters.
   - **Correlation**: Pearson correlation coefficient (-1.0 to 1.0).
   - **Sample count**: Total number of valid overlapping pixels.

---

## 3. Run the Unit Tests

DepthWizard includes automated tests for the validation algorithms in [backend/tests/test_validation.py](file:///c:/llast/depthwizard-fixed/backend/tests/test_validation.py).

### Method A: Direct Python Execution
```powershell
python backend/tests/test_validation.py
```
**Output:**
```text
Running test_compute_validation_metrics_identical_arrays()...
Running test_compute_validation_metrics_known_offset()...
Running test_compute_validation_metrics_constant_arrays_no_nan()...
All validation unit tests passed successfully!
```

### Method B: Using Pytest (if installed in your virtualenv)
```powershell
pytest backend/tests/test_validation.py -v
```

---

## 4. Run via the Backend REST API

The validation module is integrated into the FastAPI backend service.

### Step 1: Install Dependencies & Start the Backend Server
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Step 2: Upload a Reference Raster for Validation
Send an HTTP `POST` request with the reference file:
```bash
curl -X POST "http://localhost:8000/api/v1/projects/<YOUR_PROJECT_ID>/validation" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -F "file=@reference_lidar.tif"
```

### Step 3: Fetch Categorized Validation Metrics
Send an HTTP `GET` request:
```bash
curl -X GET "http://localhost:8000/api/v1/projects/<YOUR_PROJECT_ID>/validation" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

**Sample API Response:**
```json
[
  {
    "category": "Urban",
    "mae": 1.42,
    "rmse": 1.85,
    "correlation": 0.985,
    "sampleCount": 65536,
    "status": "available"
  },
  {
    "category": "Sparse",
    "mae": null,
    "rmse": null,
    "correlation": null,
    "sampleCount": 0,
    "status": "not_available"
  },
  {
    "category": "Hilly",
    "mae": null,
    "rmse": null,
    "correlation": null,
    "sampleCount": 0,
    "status": "not_available"
  },
  {
    "category": "Forested",
    "mae": null,
    "rmse": null,
    "correlation": null,
    "sampleCount": 0,
    "status": "not_available"
  }
]
```

---

## 5. View Validation in the Frontend UI

1. Start the Next.js frontend dev server:
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```
2. Open your browser at `http://localhost:3000`.
3. Log in (or explore in demo mode) and navigate to the **Validation** page in the workspace sidebar:
   `http://localhost:3000/workspace/validation`
4. The page renders the accuracy metrics table (MAE, RMSE, Pearson Correlation, and Sample Count) broken down across terrain categories (`Urban`, `Sparse`, `Hilly`, and `Forested`).
