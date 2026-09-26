# Depthwizard (GeoDepth-3D)

Single-view height estimation and 3D flythrough for disaster management.
Built for **Smart India Hackathon 2026**, Problem Statement **SIH26175** (ISRO)
by team **Doom's Dhoom**.

> **GeoDepth-3D upgrade**: primary depth model is now Depth Anything V2
> (DINOv2-Large), with a mesh-generation step (Open3D/Trimesh → GLB) and a
> dual viewer — Three.js for relative models, CesiumJS for georeferenced,
> globe-accurate DSMs. A LangGraph agent layer + Bhashini (Govt. of India) voice input let you
> query results conversationally. See `FRAMEWORK_AND_FLOW.md` for the full
> architecture. Everything from the original deployed system (auth,
> projects, disaster-management services, MiDaS/im2height fallback) is kept.

One RGB satellite/aerial photo in → an elevation surface, a navigable 3D
flythrough, flood simulation, crater/impact detection, building
collapse-damage mapping with auto-alerts, a population estimate, a disaster
classifier, and a multilingual AI assistant out.

```
depthwizard/
├── frontend/     Next.js + React + TypeScript + Three.js (React Three Fiber)
├── backend/      FastAPI + PostgreSQL + PyTorch (MiDaS / im2height / U-Net)
├── docker-compose.yml    runs the whole stack locally
└── .github/workflows/ci.yml   basic CI (backend tests + frontend build)
```

Each folder has its own detailed README (`frontend/README.md`,
`backend/README.md`). This file covers the two things that span both:
**running everything locally**, and **deploying it live**.

---

## Run locally

**Fastest: Docker Compose** (needs `backend/.env` filled in first — copy
`backend/.env.example` and add your keys):
```bash
docker compose up --build
```
- Frontend: http://localhost:3000
- Backend docs: http://localhost:8000/docs

**Without Docker** (two terminals):
```bash
# Terminal 1 — backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in SECRET_KEY, HF_API_TOKEN, OPENTOPOGRAPHY_API_KEY, etc.
uvicorn app.main:app --reload

# Terminal 2 — frontend
cd frontend
npm install
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1" >> .env.local
echo "NEXT_PUBLIC_USE_BACKEND=true" >> .env.local
npm run dev
```

---

## Deploy live — step by step

Three stops: **GitHub** (host the code) → **Render** (backend + database) →
**Vercel** (frontend). Total time: 20-30 minutes once you have accounts on
all three (GitHub, Render.com, Vercel — all free tier).

### 1. Push to GitHub

```bash
cd depthwizard          # this folder, containing frontend/ and backend/
git init
git add .
git commit -m "Initial commit: Depthwizard integrated system"
```

Then on github.com: **New repository** → name it `depthwizard` → **do not**
initialize with a README (you already have one) → Create repository. GitHub
will show you a remote URL; run:

```bash
git remote add origin https://github.com/<your-username>/depthwizard.git
git branch -M main
git push -u origin main
```

Your `.env` files are excluded by `.gitignore` — only `.env.example` goes up,
so your API keys never touch GitHub. Good practice, keep it that way.

### 2. Deploy the backend + database on Render

1. render.com → **New** → **PostgreSQL** → name it `depthwizard-db` → free
   plan → Create Database. Once it's up, copy its **Internal Database URL**.
2. render.com → **New** → **Web Service** → connect your GitHub repo →
   set **Root Directory** to `backend` → Render will detect the `Dockerfile`
   automatically (Environment: Docker).
3. Add environment variables (Render dashboard → Environment tab) — copy every
   value from your local `backend/.env`, **except** `DATABASE_URL`, which you
   replace with the Internal Database URL from step 1.
4. Deploy. Once live, Render gives you a URL like
   `https://depthwizard-backend.onrender.com`. Visit
   `https://depthwizard-backend.onrender.com/docs` to confirm it's up.

### 3. Deploy the frontend on Vercel

1. vercel.com → **Add New Project** → import your GitHub repo → set
   **Root Directory** to `frontend`.
2. Add environment variables:
   - `NEXT_PUBLIC_API_BASE_URL` = `https://depthwizard-backend.onrender.com/api/v1`
     (your real Render URL from step 2, plus `/api/v1`)
   - `NEXT_PUBLIC_USE_BACKEND` = `true`
3. Deploy. Vercel gives you a URL like `https://depthwizard.vercel.app`.

### 4. Connect them (the one step people forget)

The backend only accepts requests from origins listed in `CORS_ORIGINS`.
Go back to Render → your backend's Environment tab → set:
```
CORS_ORIGINS=https://depthwizard.vercel.app
```
Redeploy the backend (Render does this automatically when you save an env
var change). Now open your Vercel URL — sign up, upload an image, and it
runs through the real backend end to end.

---

## Environment variable checklist (for Render)

| Variable | Where it comes from |
|---|---|
| `SECRET_KEY` | any long random string |
| `DATABASE_URL` | Render PostgreSQL → Internal Database URL |
| `CORS_ORIGINS` | your Vercel URL, set after step 3 |
| `OPENTOPOGRAPHY_API_KEY` | opentopography.org → My Account |
| `HF_API_TOKEN` | huggingface.co → Settings → Access Tokens (Inference preset) |
| `HF_CHAT_MODEL`, `HF_TRANSLATE_MODEL_PREFIX` | defaults in `.env.example` are fine |
| `ALERT_SMTP_HOST/PORT/USER/PASSWORD/FROM_EMAIL/AUTHORITY_EMAIL` | Gmail App Password setup (optional — alerts degrade gracefully without it) |
| `DEPTH_MODEL_ADAPTER` | `midas` (working default) or `im2height` (needs a real trained checkpoint — see `backend/app/ml/adapters/im2height_adapter.py`) |

## Known limitations (read before demoing)

- **im2height** has no publicly available pretrained weights — MiDaS is the
  working default. Training im2height on GAMUS is a separate, multi-day task
  (see the chat history / backend README for the full breakdown).
- **Render's free tier spins down after inactivity** — the first request
  after idle time can take 30-60 seconds to wake up. Mention this if
  demoing live to judges, or ping the backend a minute before your demo.
- Every other limitation (SRTM edge cases, population estimate being a
  heuristic, disaster classification being rule-based) is documented in
  `backend/README.md` under "Known limitations."

## Team — Doom's Dhoom

| Name | Role |
|---|---|
| Axar Tandon | Project Lead / Domain Analyst |
| Prashant Yadav | Frontend / Presenter |
| Harshit Chauhan | Frontend / UI-UX Designer |
| Harshita Mishra | Research Analyst |
| Aastik Chhibar | Backend |
| Harsh Kumar Rai | Backend / Documentation |
