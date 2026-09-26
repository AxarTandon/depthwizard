// ---------------------------------------------------------------------------
// DepthWizard — backend integration layer
//
// When NEXT_PUBLIC_USE_BACKEND=true and NEXT_PUBLIC_API_BASE_URL is set,
// every function below calls the real FastAPI backend. Otherwise it falls
// back to generated demo data after a short simulated delay, so the app
// still runs end-to-end with no backend configured.
// ---------------------------------------------------------------------------

import {
  AnalysisMetrics,
  AlertEvent,
  BuildingDamage,
  ChatMessage,
  CraterAnomaly,
  DisasterClassification,
  FloodSummary,
  PopulationEstimate,
  ProcessingStage,
  ProcessingStatus,
  ProjectSummary,
  TerrainResponse,
  UploadedImageMeta,
  ValidationMetric,
} from "@/types";
import {
  DEMO_PROJECTS,
  PROCESSING_STAGE_DEFS,
  VALIDATION_METRICS,
  DEMO_BUILDINGS,
  DEMO_CRATERS,
  DEMO_ALERT_HISTORY,
  DEMO_POPULATION,
  DEMO_DISASTER_CLASSIFICATION,
} from "./demo-data";
import { computeAnalysisMetrics } from "./calculations";
import { generateDemoElevation } from "./terrain";
import { API_BASE_URL, USE_BACKEND } from "./config";
import { getToken } from "./auth-token";

export { API_BASE_URL, USE_BACKEND };

function delay<T>(value: T, ms = 500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Request to ${path} failed (${res.status})`);
  }
  return res.json();
}

/** Uploads a source image and registers a new project, then uploads the file. */
export async function uploadImage(
  meta: UploadedImageMeta,
  file?: File
): Promise<{ projectId: string }> {
  if (USE_BACKEND) {
    const project = await apiFetch<{ id: string }>("/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: meta.filename }),
    });
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      await apiFetch(`/projects/${project.id}/upload`, { method: "POST", body: formData });
    }
    return { projectId: project.id };
  }
  return delay({ projectId: `proj-${Date.now()}` }, 400);
}

/** Kicks off reconstruction for a previously uploaded image. */
export async function startReconstruction(projectId: string): Promise<{ started: boolean }> {
  if (USE_BACKEND) {
    return apiFetch(`/projects/${projectId}/process`, { method: "POST" });
  }
  return delay({ started: true }, 300);
}

/** Polls the processing status of a project. In demo mode this is derived from elapsed time. */
export async function getProcessingStatus(
  projectId: string,
  elapsedMs: number
): Promise<ProcessingStatus> {
  if (USE_BACKEND) {
    return apiFetch(`/projects/${projectId}/status`);
  }

  const stageDurationMs = 1400;
  const totalStages = PROCESSING_STAGE_DEFS.length;
  const stageIndex = Math.min(totalStages - 1, Math.floor(elapsedMs / stageDurationMs));
  const stageElapsed = elapsedMs - stageIndex * stageDurationMs;
  const stageProgress = Math.min(100, Math.round((stageElapsed / stageDurationMs) * 100));

  const stages: ProcessingStage[] = PROCESSING_STAGE_DEFS.map((def, i) => {
    let status: ProcessingStage["status"] = "pending";
    let progress = 0;
    if (i < stageIndex) {
      status = "complete";
      progress = 100;
    } else if (i === stageIndex) {
      status = "active";
      progress = stageProgress;
    }
    return { ...def, status, progress };
  });

  const isComplete = stageIndex === totalStages - 1 && stageProgress >= 100;
  if (isComplete) {
    stages[totalStages - 1].status = "complete";
    stages[totalStages - 1].progress = 100;
  }

  const overallProgress = Math.round(
    (stages.reduce((acc, s) => acc + s.progress, 0) / (totalStages * 100)) * 100
  );

  return {
    projectId,
    stages,
    overallProgress,
    currentStageId: isComplete ? null : stages[stageIndex].id,
    isComplete,
  };
}

export function isDemoProjectId(projectId?: string | null): boolean {
  if (!projectId) return true;
  return projectId === "proj-demo" || projectId.startsWith("proj-20");
}

/** Fetches the terrain (elevation) data for a project. */
export async function getTerrainData(projectId: string): Promise<TerrainResponse> {
  if (USE_BACKEND && !isDemoProjectId(projectId)) {
    try {
      return await apiFetch(`/projects/${projectId}/terrain`);
    } catch (err) {
      console.warn(`Failed to fetch terrain for ${projectId}, falling back to demo:`, err);
    }
  }

  const elevations = generateDemoElevation();
  return delay(
    {
      project_id: projectId,
      mode: "rDSM",
      width: elevations[0].length,
      height: elevations.length,
      elevations,
      resolution: 10,
    },
    400
  );
}

/** Fetches summary metadata for a single project. */
export async function getProject(projectId: string): Promise<ProjectSummary | undefined> {
  if (USE_BACKEND && !isDemoProjectId(projectId)) {
    try {
      return await apiFetch(`/projects/${projectId}`);
    } catch (err) {
      console.warn(`Failed to fetch project ${projectId}:`, err);
    }
  }
  return delay(DEMO_PROJECTS.find((p) => p.id === projectId) ?? DEMO_PROJECTS[0], 250);
}

/** Fetches the list of all projects for the current user. */
export async function getProjects(): Promise<ProjectSummary[]> {
  if (USE_BACKEND) {
    try {
      return await apiFetch("/projects");
    } catch (err) {
      console.warn("Failed to fetch user projects from backend, using demo projects:", err);
    }
  }
  return delay(DEMO_PROJECTS, 250);
}

/** Fetches computed analysis metrics for a project's terrain. */
export async function getAnalysis(projectId: string): Promise<AnalysisMetrics> {
  if (USE_BACKEND && !isDemoProjectId(projectId)) {
    try {
      return await apiFetch(`/projects/${projectId}/analysis`);
    } catch (err) {
      console.warn(`Failed to fetch analysis for ${projectId}, falling back to demo:`, err);
    }
  }
  const elevations = generateDemoElevation();
  return delay(computeAnalysisMetrics(elevations), 400);
}

/** Fetches validation metrics — real ones from the backend once a reference
 * raster has been supplied for the given project, illustrative demo values
 * otherwise. */
export async function getValidation(projectId = "proj-demo"): Promise<ValidationMetric[]> {
  if (USE_BACKEND && !isDemoProjectId(projectId)) {
    try {
      return await apiFetch(`/projects/${projectId}/validation`);
    } catch (err) {
      console.warn(`Failed to fetch validation for ${projectId}, falling back to demo:`, err);
    }
  }
  return delay(VALIDATION_METRICS, 300);
}

/** Uploads an independent ground-truth reference raster (LiDAR DEM / GeoTIFF / HDF5 / PNG) to validate the DSM. */
export async function submitValidationFile(
  projectId: string,
  file: File
): Promise<{ status: string; rmse?: number; mae?: number; correlation?: number; sample_count?: number; message?: string }> {
  if (USE_BACKEND && !isDemoProjectId(projectId)) {
    const formData = new FormData();
    formData.append("file", file);
    return apiFetch(`/projects/${projectId}/validation`, {
      method: "POST",
      body: formData,
    });
  }
  return delay(
    {
      status: "available",
      rmse: 1.25,
      mae: 0.98,
      correlation: 0.986,
      sample_count: 65536,
    },
    700
  );
}

/** Runs an automated independent accuracy benchmark against the reconstructed DSM. */
export async function runAutoBenchmark(
  projectId: string
): Promise<{ status: string; rmse?: number; mae?: number; correlation?: number; sample_count?: number }> {
  if (USE_BACKEND && !isDemoProjectId(projectId)) {
    return apiFetch(`/projects/${projectId}/validation/auto-benchmark`, {
      method: "POST",
    });
  }
  return delay(
    {
      status: "available",
      rmse: 1.249,
      mae: 0.996,
      correlation: 0.986,
      sample_count: 1048576,
    },
    500
  );
}

// ---------------------------------------------------------------------------
// Disaster-management + unique-differentiator endpoints
// ---------------------------------------------------------------------------

/** Live flood-submersion summary at a given water level. */
export async function getFlood(projectId: string, waterLevel: number): Promise<FloodSummary> {
  if (USE_BACKEND && !isDemoProjectId(projectId)) {
    try {
      return await apiFetch(`/projects/${projectId}/flood?water_level=${waterLevel}`);
    } catch (err) {
      console.warn(`Failed to fetch flood for ${projectId}, falling back to demo:`, err);
    }
  }
  return delay(
    {
      water_level: waterLevel,
      submerged_percent: Math.max(0, Math.min(100, Math.round((50 - waterLevel) * 2.4))),
      min_m: 0,
      max_m: 50,
    },
    250
  );
}

/** Detected crater / impact-anomaly markers for a project. */
export async function getCraters(projectId: string): Promise<CraterAnomaly[]> {
  if (USE_BACKEND && !isDemoProjectId(projectId)) {
    try {
      return await apiFetch(`/projects/${projectId}/craters`);
    } catch (err) {
      console.warn(`Failed to fetch craters for ${projectId}, falling back to demo:`, err);
    }
  }
  return delay(DEMO_CRATERS, 300);
}

/** Building height + collapse-damage radius markers for a project. */
export async function getBuildingDamage(projectId: string): Promise<BuildingDamage[]> {
  if (USE_BACKEND && !isDemoProjectId(projectId)) {
    try {
      return await apiFetch(`/projects/${projectId}/buildings`);
    } catch (err) {
      console.warn(`Failed to fetch buildings for ${projectId}, falling back to demo:`, err);
    }
  }
  return delay(DEMO_BUILDINGS, 300);
}

/** Enables/disables auto-alerting the configured authority contact for a project. */
export async function toggleAlerts(projectId: string, enabled: boolean): Promise<{ auto_alert_enabled: boolean }> {
  if (USE_BACKEND) {
    return apiFetch(`/projects/${projectId}/alerts/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
  }
  return delay({ auto_alert_enabled: enabled }, 200);
}

/** Alert history for a project (for the alerts panel). */
export async function getAlertHistory(projectId: string): Promise<AlertEvent[]> {
  if (USE_BACKEND && !isDemoProjectId(projectId)) {
    try {
      return await apiFetch(`/projects/${projectId}/alerts/history`);
    } catch (err) {
      console.warn(`Failed to fetch alert history for ${projectId}:`, err);
    }
  }
  return delay(DEMO_ALERT_HISTORY, 250);
}

/** Sends a message to the in-app AI assistant, scoped to the project's current analysis. */
export async function sendChatMessage(
  projectId: string | null,
  message: string,
  language = "en"
): Promise<ChatMessage> {
  if (USE_BACKEND) {
    try {
      const targetId = projectId && !isDemoProjectId(projectId) ? projectId : "active";
      const data = await apiFetch<{ response: string; language: string }>(
        `/projects/${targetId}/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, language }),
        }
      );
      return { role: "assistant", text: data.response, timestamp: new Date().toISOString() };
    } catch (err) {
      console.warn("Failed to send chat message to backend:", err);
    }
  }
  return delay(
    {
      role: "assistant",
      text:
        "DepthWizard assistant is ready. Ask about terrain elevation, flood risk, or compare formats like H5 vs PNG.",
      timestamp: new Date().toISOString(),
    },
    500
  );
}


/** Approximate population estimate for the analyzed footprint. */
export async function getPopulationEstimate(projectId: string): Promise<PopulationEstimate> {
  if (USE_BACKEND) {
    try {
      const targetId = projectId && !isDemoProjectId(projectId) ? projectId : "active";
      return await apiFetch(`/projects/${targetId}/population`);
    } catch (err) {
      console.warn(`Failed to fetch population for ${projectId}:`, err);
    }
  }
  return delay(DEMO_POPULATION, 300);
}

/** Queries WorldPop open gridded population API for a specific spatial bounding box and updates project analysis. */
export async function analyzeWorldPopSpace(
  projectId: string,
  bounds: { west: number; south: number; east: number; north: number },
  year = "2020"
): Promise<PopulationEstimate> {
  if (USE_BACKEND) {
    const targetId = projectId && !isDemoProjectId(projectId) ? projectId : "active";
    return apiFetch<PopulationEstimate>(`/projects/${targetId}/population/worldpop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...bounds, year }),
    });
  }
  return delay(
    {
      estimated_population: 12175,
      method: "worldpop_gridded_dataset",
      confidence: "high",
      note: "WorldPop gridded population dataset (demo fallback).",
      density_km2: 2817.0,
      area_km2: 4.32,
      bounds,
      source: "WorldPop REST API (wpgppop)",
      demographics: {
        children_under_15: 2922,
        working_age_15_64: 8035,
        elderly_65_plus: 1217,
      },
      relief_requirements: {
        water_liters_day: 182625,
        emergency_shelters: 2435,
        medical_priority_cases: 974,
      },
    },
    700
  );
}

/** Rule-based disaster-type classification with evidence, derived from the other analysis results. */
export async function getDisasterClassification(projectId: string): Promise<DisasterClassification> {
  if (USE_BACKEND && !isDemoProjectId(projectId)) {
    try {
      return await apiFetch(`/projects/${projectId}/disaster-classification`);
    } catch (err) {
      console.warn(`Failed to fetch disaster classification for ${projectId}:`, err);
    }
  }
  return delay(DEMO_DISASTER_CLASSIFICATION, 300);
}

/** Translates chatbot responses / report text into another language. */
export async function translateText(text: string, targetLanguage: string): Promise<string> {
  if (!text || targetLanguage === "en") return text;
  if (USE_BACKEND) {
    try {
      const data = await apiFetch<{ translated_text: string }>("/projects/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, target_language: targetLanguage }),
      });
      return data.translated_text || text;
    } catch (err) {
      console.warn("Translation failed, falling back to original:", err);
      return text;
    }
  }
  return delay(text, 200); // demo mode: no-op, returns the original text
}

// ---------------------------------------------------------------------------
// GeoDepth-3D additions: mesh export + agentic AI (text + voice)
// ---------------------------------------------------------------------------

/** URL for the georeferenced GLB mesh (used by CesiumViewer). Demo mode
 * returns null, since there's no real mesh file to serve. */
export async function getMeshUrl(projectId: string): Promise<string | null> {
  if (USE_BACKEND) {
    return `${API_BASE_URL}/projects/${projectId}/mesh`;
  }
  return delay(null, 200);
}

/** Sends a text query through the LangGraph agent layer, scoped to a project. */
export async function sendAgentMessage(projectId: string | null, message: string): Promise<ChatMessage> {
  if (USE_BACKEND) {
    const data = await apiFetch<{ response: string }>("/agent/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, project_id: projectId }),
    });
    return { role: "assistant", text: data.response, timestamp: new Date().toISOString() };
  }
  return sendChatMessage(projectId, message);
}

/** Sends a recorded voice clip -> Bhashini transcription -> agent response. */
export async function sendVoiceMessage(
  projectId: string | null,
  audioBlob: Blob
): Promise<{ transcript: string; response: string }> {
  if (USE_BACKEND) {
    const formData = new FormData();
    formData.append("file", audioBlob, "voice.webm");
    const qs = projectId ? `?project_id=${projectId}` : "";
    const res = await fetch(`${API_BASE_URL}/agent/voice${qs}`, {
      method: "POST",
      headers: authHeaders(),
      body: formData,
    });
    if (!res.ok) throw new Error("Voice request failed");
    return res.json();
  }
  return delay(
    { transcript: "(demo) Simulate a 3 meter flood surge", response: "This is a demo voice response — connect the backend for a real transcription and agent reply." },
    600
  );
}
