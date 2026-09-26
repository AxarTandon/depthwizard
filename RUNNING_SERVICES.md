# DepthWizard — Active Running Services Guide

Both the **FastAPI Backend** and **Next.js Frontend** are installed, configured, and currently actively running on your Windows machine.

---

## 1. Running Service Status & Endpoints

| Service | Host & Port | Status | Health / Quick Test |
| :--- | :--- | :--- | :--- |
| **FastAPI Backend** | `http://localhost:8000` | **RUNNING** | [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health) |
| **Interactive Swagger API Docs** | `http://localhost:8000/docs` | **RUNNING** | [http://localhost:8000/docs](http://localhost:8000/docs) |
| **System & Model Status** | `http://localhost:8000/api/v1/system/model-status` | **RUNNING** | [model-status](http://localhost:8000/api/v1/system/model-status) |
| **Next.js Frontend UI** | `http://localhost:3000` | **RUNNING** | [http://localhost:3000](http://localhost:3000) |
| **Frontend Workspace** | `http://localhost:3000/workspace` | **RUNNING** | [http://localhost:3000/workspace](http://localhost:3000/workspace) |
| **Validation Dashboard** | `http://localhost:3000/workspace/validation` | **RUNNING** | [validation](http://localhost:3000/workspace/validation) |

---

## 2. Configuration Details

### Backend Configuration (`backend/.env`)
- **Database**: Configured to use embedded local SQLite (`sqlite:///./depthwizard.db`). No external PostgreSQL container or Docker daemon required.
- **Port**: `8000` (Listening on all interfaces `0.0.0.0:8000`).
- **Dependencies Installed**: `fastapi`, `uvicorn`, `pydantic`, `pydantic-settings`, `sqlalchemy`, `python-jose`, `passlib`, `bcrypt`, `python-multipart`, `numpy`, `scipy`, `opencv-python-headless`, `Pillow`, `requests`, `python-dotenv`, `httpx`.

### Frontend Configuration (`frontend/.env.local`)
- **Backend API Base**: `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1`
- **Use Real Backend**: `NEXT_PUBLIC_USE_BACKEND=true`
- **Port**: `3000` (Next.js 14 dev server).
- **Dependencies Installed**: All 569 npm packages including Three.js, React Three Fiber/Drei, Cesium, Resium, and Lucide React.

---

## 3. How to Restart or Run Manually in New Terminals

If you ever restart your computer or want to run the servers in dedicated terminal windows:

### Terminal 1: Backend
```powershell
cd c:\llast\depthwizard-fixed\backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Terminal 2: Frontend
```powershell
cd c:\llast\depthwizard-fixed\frontend
cmd /c npm run dev
```

---

## 4. How to Stop the Servers

### Option A: From PowerShell terminal
If running in dedicated terminal windows, simply press `Ctrl + C`.

### Option B: Command to terminate by port
```powershell
# Terminate Backend (Port 8000)
Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# Terminate Frontend (Port 3000)
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```
