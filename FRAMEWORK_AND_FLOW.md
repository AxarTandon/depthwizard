# GeoDepth-3D — Framework & Flow
### SIH 2026 · PS 26175 · Team Doom's Dhoom

This is the architectural blueprint for the upgraded system, evolving the
existing deployed DepthWizard stack (Next.js on Vercel + FastAPI on Render,
already live) into GeoDepth-3D: dual-precision 3D reconstruction, richer
disaster intelligence, and an agentic, voice-driven interface. It keeps every
working piece (auth, projects, deployment pipeline, database) and adds the
new layers your senior's brief called for.

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  INPUT                                                               │
│  RGB (PNG/JPG) or GeoTIFF  →  format sniffer (GDAL/Rasterio)         │
│  extracts CRS, affine transform, bounding box if present             │
└──────────────────────────────┬────────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  ELEVATION EXTRACTION                                                 │
│  Depth Anything V2 (DINOv2-Large backbone) → dense relative depth     │
│  cached as a tensor for both the 3D pipeline and the agent tools      │
└──────────────────────────────┬────────────────────────────────────────┘
                                ▼
                    ┌───────────┴───────────┐
                    ▼                       ▼
        Branch A: no georeference   Branch B: GeoTIFF present
        normalize relative depth    SRTM 30m/Copernicus DEM or GCPs
        (rDSM, visual-only)         RANSAC scale+shift fit → metric DSM
                    │                       │
                    └───────────┬───────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  MESH GENERATION                                                      │
│  Open3D/Trimesh: Poisson/Delaunay surface → GLB/glTF, RGB UV-mapped   │
│  onto the mesh, LOD-optimized for the browser                         │
└──────────────────────────────┬────────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  DISASTER INTELLIGENCE (runs on the DSM, both branches)               │
│  Flood inundation · Building-collapse/slope risk · Population         │
│  exposure (GHSL/WorldPop overlay) · rule-based disaster classifier    │
└──────────────────────────────┬────────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  VALIDATION                                                           │
│  DSM vs. reference LiDAR/SRTM → RMSE, MAE, Pearson r, live in the UI  │
└──────────────────────────────┬────────────────────────────────────────┘
                                ▼
                    ┌───────────┴───────────┐
                    ▼                       ▼
        Branch A viewer:            Branch B viewer:
        Three.js (orbit controls,   CesiumJS (3D Tiles, WGS84 globe,
        contour/height slicer)      terrain-accurate flythrough)
                    │                       │
                    └───────────┬───────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  AGENTIC AI LAYER (LangGraph StateGraph)                              │
│  Routing Agent → Reconstruction Tool-Calling Agent →                  │
│  Disaster-Assessment Agent → Verification Agent                       │
│  Voice in: Bhashini ASR (Govt. of India, speech-to-text)              │
│  Reasoning: vision-capable model inspects the mesh + analysis outputs │
│  and answers conversationally ("simulate a 3m flood surge...")        │
└─────────────────────────────────────────────────────────────────────┘
```

## 2. Folder Structure

```
geodepth3d/
├── frontend/                   Next.js + React + TypeScript
│   ├── components/
│   │   ├── viewer/
│   │   │   ├── Viewer3D.tsx        (existing) Three.js — relative models
│   │   │   └── CesiumViewer.tsx    (new) CesiumJS — georeferenced DSMs
│   │   ├── workspace/
│   │   │   ├── VoiceInput.tsx      (new) mic capture → /agent/voice
│   │   │   └── ChatbotWidget.tsx   (existing) extended to route through agents
│   │   └── ...
│   └── lib/api.ts                 extended with mesh/agent/voice calls
│
├── backend/                    FastAPI + PostgreSQL
│   ├── app/
│   │   ├── ml/adapters/
│   │   │   ├── dav2_adapter.py     (new) Depth Anything V2 (DINOv2-Large)
│   │   │   ├── midas_adapter.py    (existing) fallback, no GPU required
│   │   │   └── im2height_adapter.py (existing) documented placeholder
│   │   ├── services/
│   │   │   ├── mesh_generation.py  (new) Open3D/Trimesh → GLB/glTF
│   │   │   ├── population.py       (extended) GHSL/WorldPop overlay
│   │   │   └── ...existing flood/craters/building_damage/alerts/etc.
│   │   ├── agents/                 (new)
│   │   │   ├── graph.py            LangGraph StateGraph — 4 agents
│   │   │   ├── tools.py            tool-calling functions the agents use
│   │   │   └── voice.py            Bhashini ASR transcription
│   │   └── api/v1/
│   │       ├── mesh.py             (new) GET /projects/{id}/mesh
│   │       ├── agent.py            (new) POST /agent/chat, /agent/voice
│   │       └── ...existing routers
│   └── workers/                    background job runner (existing)
│
└── docker-compose.yml           postgres + backend + frontend, local-first
```

## 3. API Contract (new endpoints, on top of the existing set)

```
GET  /api/v1/projects/{id}/mesh              → GLB/glTF download URL
POST /api/v1/agent/chat                      → { message, project_id? } -> { response, actions_taken[] }
POST /api/v1/agent/voice                     → multipart audio -> transcribes (Bhashini),
                                                 routes through the same agent graph as /agent/chat
GET  /api/v1/system/model-status             → (extended) reports dav2 / langgraph / Bhashini availability
```
Every new endpoint follows the existing demo-mode / auth / structured-error conventions.

## 4. Staged Build Plan (local-first, as requested)

| Step | What | Status |
|---|---|---|
| 1 | This document — architecture, folder structure, API contract | done |
| 2 | Local backend: DAV2 adapter, mesh generation, disaster modules on the DSM | in this delivery |
| 3 | Local frontend: dual viewer (Three.js + CesiumJS), voice input widget | in this delivery |
| 4 | Agent layer: LangGraph graph + Bhashini voice endpoint, wired to the existing chatbot UI | in this delivery (skeleton — see Known Limitations) |
| 5 | Full local run via `docker compose up` — verify end to end before touching cloud | your next step |
| 6 | Redeploy to the existing Render (backend) + Vercel (frontend) once step 5 is verified | after step 5 |

## 5. What's real vs. what's a documented integration point

Consistent with how the existing MiDaS/im2height adapters were built: every
new module here is real, runnable code — but three pieces need resources
this sandbox doesn't have (no network, no GPU) to fully wire and verify:

- **Depth Anything V2**: adapter follows the same `predict()` contract as
  MiDaS; weights download via `torch.hub`/HuggingFace on first run (needs
  internet once, same as MiDaS today).
- **LangGraph agents**: the graph, nodes and tool-calling wiring are real;
  the reasoning model each agent calls is pluggable (defaults to the
  Hugging Face Inference API you already have a token for — swap in
  GPT-4o/Claude/Qwen-2.5-VL by changing one config value).
- **Bhashini**: uses the Government of India's ULCA pipeline API (free BHASHINI_USER_ID/BHASHINI_API_KEY from bhashini.gov.in) —
  the first run downloads the model weights once.

## 7. QA pass — what was fixed after the first build

A self-review against this whole conversation caught real gaps, now fixed:

- **Validation was a stub.** `POST /projects/{id}/validation` now genuinely
  accepts a reference raster (LiDAR DSM, a higher-res DEM, even a plain
  grayscale reference), aligns it to the generated DSM (reprojects with
  `rasterio.warp` when both sides have real CRS, resizes otherwise), and
  computes real RMSE/MAE/Pearson correlation — not the calibration step's
  internal (non-independent) fit stats. This is the piece that lets the
  system be validated against **whatever dataset a judge hands us on the
  day**, which the evaluation criteria weight at 50%.
- **Population's WorldPop link was a permanent stub.** `fetch_gridded_population()`
  now calls WorldPop's free public stats API for real, falling back to the
  building-density heuristic on any failure (matching the same honest
  best-effort pattern as the SRTM integration).
- **Pipeline robustness for arbitrary judge-provided images:** large images
  are now downscaled before inference (bounded memory/time regardless of
  input size); an all-building or unusual mask no longer divides by an
  empty array in the building-damage module; each disaster-analysis
  sub-module (craters/buildings/population/classifier/alerts) now fails
  independently rather than taking down the whole job if one of them chokes
  on an unusual scene — the core DSM and mesh always still get produced.
- **Auto-alerts to authorities** and the **LangGraph + Bhashini conversational
  layer** were implemented in code but had dropped out of the pitch-deck
  bullets during the GeoDepth-3D rewrite — added back explicitly to slides
  2 and 3.
- Confirmed the **"Our team" section is still present** on the frontend
  dashboard and the **alerts panel/toggle** is still fully wired — both
  survived the GeoDepth-3D upgrade untouched.


## 8. Team — Doom's Dhoom
Axar Tandon (Project Lead / Domain Analyst) · Prashant Yadav (Frontend/Presenter) ·
Harshit Chauhan (Frontend/UI-UX) · Harshita Mishra (Research Analyst) ·
Aastik Chhibbar (Backend) · Harsh Kumar Rai (Backend/Documentation)
