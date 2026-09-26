# Depthwizard Backend

FastAPI + PostgreSQL backend for Depthwizard (SIH 2026, PS 26175). Built to
plug directly into the existing Next.js frontend's `lib/api.ts` contract, and
extends the original spec with the disaster-management modules discussed
across the project (flood simulation, crater detection, building
collapse-damage, auto-alerts, AI chatbot) plus three new differentiators
(population estimate, disaster-type classifier, multi-language translation).

## 1. File structure
```
app/
  core/         config, database session, JWT/password security
  models/       SQLAlchemy tables (user, project, processing, calibration,
                 validation, alert, chat)
  schemas/      Pydantic request/response models
  api/v1/       one router file per resource, aggregated in router.py
  ml/adapters/  pluggable depth-model interface: midas, im2height, segmentation
  geo/          SRTM calibration + GeoTIFF metadata helpers
  services/     flood, craters, building_damage, alerts, chatbot, translate,
                 population, disaster_classifier, analysis, processing_pipeline
  storage/      filesystem storage abstraction
  workers/      background job runner (FastAPI BackgroundTasks)
  main.py       FastAPI app + CORS + router registration
alembic/        migration scaffold (env.py configured; generate versions with
                 `alembic revision --autogenerate` once the DB is reachable)
tests/          pytest suite
```

## 2. Setup commands
```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # fill in SECRET_KEY at minimum
docker compose up -d db         # or run your own local Postgres
uvicorn app.main:app --reload
```
Or run the whole stack (db + backend) with `docker compose up --build`.

## 3. Environment variables
See `.env.example` for the full list. Minimum to run: `SECRET_KEY`,
`DATABASE_URL`. Everything else (HF_API_TOKEN, SMTP alert settings,
OpenTopography key) degrades gracefully to a "not configured" response
instead of crashing when left blank.

## 4. Model setup
- **MiDaS** (default adapter): downloads automatically via `torch.hub` on
  first request - needs internet once, then it's cached.
- **im2height**: set `DEPTH_MODEL_ADAPTER=im2height` and
  `IM2HEIGHT_WEIGHTS_PATH` to a real checkpoint. **Read the docstring in
  `app/ml/adapters/im2height_adapter.py` first** - the architecture in that
  file is a placeholder because this build environment had no network access
  to clone and inspect https://github.com/dettmar/im2height. Replace it with
  the real network definition before trusting its output.
- **Segmentation** (U-Net + ResNet18): put a fine-tuned checkpoint at
  `SEGMENTATION_WEIGHTS_PATH`. Until then, a color/texture heuristic keeps
  every endpoint working.

## 5. DEM/SRTM setup
`app/geo/srtm.py -> fetch_srtm_tile()` is the integration point. Wire it to
the OpenTopography REST API (free, needs `OPENTOPOGRAPHY_API_KEY`) or a local
SRTM `.hgt`/GeoTIFF store + `rasterio.warp.reproject`. Until implemented,
georeferenced uploads still process fully, just in relative (`rDSM`) mode.

## 6. API documentation
Run the server and open `/docs` (Swagger UI) or `/redoc`. Every endpoint from
the original spec is present, plus:
```
GET  /api/v1/projects/{id}/flood?water_level=
GET  /api/v1/projects/{id}/craters
GET  /api/v1/projects/{id}/buildings
POST /api/v1/projects/{id}/alerts/toggle
GET  /api/v1/projects/{id}/alerts/history
POST /api/v1/projects/{id}/chat
GET  /api/v1/projects/{id}/population
GET  /api/v1/projects/{id}/disaster-classification
POST /api/v1/projects/translate
```

## 7. Frontend integration
In the Next.js app, set `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1`
and flip `USE_BACKEND = true` in `lib/api.ts` (see the frontend's own README
section added alongside this one). Response shapes match
`types/index.ts` exactly, including the `mode: "rDSM" | "DSM"` /
`height_unit: "rel" | "m"` / `calibrated: boolean` fields the frontend already
checks for.

## 8. Testing
```bash
pytest
```
Covers: flood math, crater detection on a synthetic depression, building
height/collapse-radius calculation, terrain metrics, the disaster classifier,
and password/JWT round-trips. Every test in this suite was run standalone
against the pure-numpy/OpenCV service functions in this build environment and
passed; the FastAPI-dependent tests (auth endpoints, etc.) still need
`pip install -r requirements.txt` since this sandbox had no network access to
install FastAPI/SQLAlchemy for a full endpoint test run.

## 9. Docker instructions
```bash
docker compose up --build
```
Starts Postgres + the API on port 8000. Mounts `./storage` so uploaded images
and generated rasters persist across restarts.

## 10. Known limitations
- **im2height** is not really wired in yet (see section 4) - MiDaS is the
  working default.
- **SRTM/OpenTopography** fetch is a documented stub - georeferenced inputs
  run in relative mode until you implement `fetch_srtm_tile()`.
- **Population estimates** are heuristic (building footprint area × an
  assumed persons-per-area constant) unless you wire `fetch_gridded_population()`
  to WorldPop/Meta HDX - always returned with a `method` and `confidence`
  field so the frontend can show it as an estimate, not a fact.
- **Disaster classification** is rule-based and transparent (not a trained
  model) - each label comes with its evidence string.
- **Background jobs** use FastAPI's in-process `BackgroundTasks`, which is
  fine for a hackathon demo but won't survive a server restart mid-job or
  scale across multiple worker processes - swap in Celery + Redis for that.
- **Alembic** is configured but no migration versions are committed yet
  (`Base.metadata.create_all()` runs on startup instead) - generate a real
  initial migration once you're developing against a live Postgres instance.
- **Validation against reference LiDAR** (`POST /validation`) is a stub that
  returns `not_available` - no reference rasters were available in this
  environment to implement real raster-diff comparison against.
