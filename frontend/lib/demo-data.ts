import {
  AlertEvent,
  BuildingDamage,
  CraterAnomaly,
  DisasterClassification,
  PopulationEstimate,
  ProjectSummary,
  TeamMember,
  ValidationMetric,
} from "@/types";

export const DEMO_PROJECTS: ProjectSummary[] = [
  {
    id: "proj-2031",
    name: "Sector 12 Urban Block",
    thumbnailLabel: "Urban / Dense",
    createdAt: "2026-09-08T10:14:00Z",
    status: "complete",
    mode: "DSM",
    terrainType: "Urban",
  },
  {
    id: "proj-2030",
    name: "Aravalli Foothill Survey",
    thumbnailLabel: "Hilly / Sparse",
    createdAt: "2026-09-06T07:42:00Z",
    status: "complete",
    mode: "rDSM",
    terrainType: "Hilly",
  },
  {
    id: "proj-2029",
    name: "Yamuna Floodplain Patch",
    thumbnailLabel: "Sparse / Riverine",
    createdAt: "2026-09-04T15:03:00Z",
    status: "processing",
    mode: "rDSM",
    terrainType: "Sparse",
  },
  {
    id: "proj-2028",
    name: "Terai Forest Canopy Tile",
    thumbnailLabel: "Forested / Canopy",
    createdAt: "2026-09-01T09:20:00Z",
    status: "complete",
    mode: "rDSM",
    terrainType: "Forested",
  },
  {
    id: "proj-2027",
    name: "Industrial Corridor Test",
    thumbnailLabel: "Urban / Mixed",
    createdAt: "2026-08-29T12:55:00Z",
    status: "failed",
    mode: "DSM",
    terrainType: "Urban",
  },
];

export const DASHBOARD_STATS = {
  totalProjects: DEMO_PROJECTS.length,
  completedReconstructions: DEMO_PROJECTS.filter((p) => p.status === "complete").length,
  averageProcessingMinutes: 6.4,
  activeQueue: DEMO_PROJECTS.filter((p) => p.status === "processing").length,
};

export const VALIDATION_METRICS: ValidationMetric[] = [
  { category: "Urban", mae: 2.31, rmse: 3.42, correlation: 0.91, sampleCount: 184 },
  { category: "Sparse", mae: 1.68, rmse: 2.4, correlation: 0.94, sampleCount: 132 },
  { category: "Hilly", mae: 3.87, rmse: 5.12, correlation: 0.86, sampleCount: 97 },
  { category: "Forested", mae: 4.55, rmse: 6.03, correlation: 0.79, sampleCount: 118 },
];

export const PROCESSING_STAGE_DEFS = [
  {
    id: "upload" as const,
    label: "Image upload",
    description: "Transferring source imagery and verifying file integrity.",
  },
  {
    id: "preprocessing" as const,
    label: "Preprocessing",
    description: "Normalizing radiometry, correcting artifacts, and tiling the image.",
  },
  {
    id: "height_estimation" as const,
    label: "Height estimation",
    description: "Estimating relative surface height from monocular cues.",
  },
  {
    id: "scale_calibration" as const,
    label: "Scale calibration",
    description: "Aligning relative heights against reference control where available.",
  },
  {
    id: "surface_reconstruction" as const,
    label: "Surface reconstruction",
    description: "Building a continuous elevation surface from estimated heights.",
  },
  {
    id: "mesh_generation" as const,
    label: "Mesh generation",
    description: "Converting the elevation surface into a renderable 3D mesh.",
  },
  {
    id: "analysis" as const,
    label: "Analysis",
    description: "Computing terrain statistics and preparing viewer assets.",
  },
];

// ---------------------------------------------------------------------------
// Disaster-management + unique-differentiator demo data
// ---------------------------------------------------------------------------

export const DEMO_BUILDINGS: BuildingDamage[] = [
  { id: 1, x: 48, y: 62, footprint_px: 220, height_m: 28.5, collapse_radius_m: 17.1, at_risk_buildings: 2, at_risk_roads_px: 340, risk_level: "high" },
  { id: 2, x: 90, y: 40, footprint_px: 140, height_m: 14.2, collapse_radius_m: 8.5, at_risk_buildings: 1, at_risk_roads_px: 90, risk_level: "medium" },
  { id: 3, x: 20, y: 100, footprint_px: 95, height_m: 6.4, collapse_radius_m: 3.8, at_risk_buildings: 0, at_risk_roads_px: 0, risk_level: "low" },
];

export const DEMO_CRATERS: CraterAnomaly[] = [
  { x: 65, y: 75, radius_px: 9, radius_m: 9, depth_m: 3.2, circularity: 0.82 },
];

export const DEMO_ALERT_HISTORY: AlertEvent[] = [
  {
    id: "alert-1",
    trigger_type: "building_collapse",
    message: "Building #1 flagged high collapse-risk, with 2 neighboring structures inside the debris radius.",
    sent: "sent",
    created_at: "2026-09-08T10:22:00Z",
  },
];

export const DEMO_POPULATION: PopulationEstimate = {
  estimated_population: 1840,
  method: "building_density_heuristic",
  confidence: "low",
  note: "Rough estimate from building footprint area x an assumed persons-per-area constant - not a census figure.",
  density_km2: 7360,
  area_km2: 0.25,
  source: "Building Footprint Segmentation",
  demographics: {
    children_under_15: 442,
    working_age_15_64: 1214,
    elderly_65_plus: 184,
  },
  relief_requirements: {
    water_liters_day: 27600,
    emergency_shelters: 368,
    medical_priority_cases: 147,
  },
};

export const DEMO_DISASTER_CLASSIFICATION: DisasterClassification = {
  labels: [
    { label: "Structural collapse risk", confidence: "high", evidence: "1 building with high collapse-damage radius overlap." },
    { label: "Impact / blast damage", confidence: "medium", evidence: "1 circular depression consistent with impact damage." },
  ],
};

export const TEAM_MEMBERS: TeamMember[] = [
  { name: "Axar Tandon", role: "Project Lead / Domain Analyst" },
  { name: "Prashant Yadav", role: "Frontend / Presenter" },
  { name: "Harshit Chauhan", role: "Frontend / UI-UX Designer" },
  { name: "Harshita Mishra", role: "Research Analyst" },
  { name: "Aastik Chhibar", role: "Backend" },
  { name: "Harsh Kumar Rai", role: "Backend / Documentation" },
];
