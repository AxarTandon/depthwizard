// ---------------------------------------------------------------------------
// DepthWizard — shared type definitions
// These interfaces define the contract between this frontend and a future
// reconstruction backend. A backend developer should be able to implement
// endpoints that satisfy these shapes without touching UI code.
// ---------------------------------------------------------------------------

export type ImageFormat = "png" | "jpg" | "jpeg" | "tif" | "tiff" | "h5" | "hdf5";

export type ElevationMode = "rDSM" | "DSM";

export interface UploadedImageMeta {
  id: string;
  filename: string;
  sizeBytes: number;
  format: ImageFormat;
  isGeoTagged: boolean; // whether the file carries geospatial metadata (GeoTIFF)
  previewUrl?: string;
  uploadedAt: string;
}

export type ProcessingStageId =
  | "upload"
  | "preprocessing"
  | "height_estimation"
  | "scale_calibration"
  | "surface_reconstruction"
  | "mesh_generation"
  | "analysis";

export interface ProcessingStage {
  id: ProcessingStageId;
  label: string;
  description: string;
  status: "pending" | "active" | "complete" | "error";
  progress: number; // 0 - 100
}

export interface ProcessingStatus {
  projectId: string;
  stages: ProcessingStage[];
  overallProgress: number;
  currentStageId: ProcessingStageId | null;
  isComplete: boolean;
}

export interface GeoBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface TerrainResponse {
  project_id: string;
  mode: ElevationMode;
  width: number;
  height: number;
  elevations: number[][];
  crs?: string; // present when mode === "DSM"
  bounds?: GeoBounds; // present when mode === "DSM"
  resolution: number; // meters per cell (approximate in demo)
  calibrated?: boolean;
}

export interface ProjectSummary {
  id: string;
  name: string;
  thumbnailLabel: string;
  createdAt: string;
  status: "queued" | "processing" | "complete" | "failed";
  mode: ElevationMode;
  terrainType: string;
}

export interface AnalysisMetrics {
  minElevation: number;
  maxElevation: number;
  meanElevation: number;
  elevationRange: number;
  meanSlope: number;
  maxSlope: number;
  relief: number;
  elevationHistogram: { bucket: string; count: number }[];
  slopeHistogram: { bucket: string; count: number }[];
  elevationProfile: { distance: number; elevation: number }[];
}

export type ValidationCategory = "Urban" | "Sparse" | "Hilly" | "Forested";

export interface ValidationMetric {
  category: ValidationCategory;
  mae?: number | null;
  rmse?: number | null;
  correlation?: number | null;
  sampleCount?: number;
  status?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  organization?: string;
  createdAt: string;
}

export interface TerrainQueryResult {
  x: number;
  y: number;
  elevation: number;
  slope: number;
}

export interface MeasurementPoint {
  x: number;
  y: number;
  elevation: number;
  worldPosition: [number, number, number];
}

export interface MeasurementResult {
  pointA: MeasurementPoint;
  pointB: MeasurementPoint;
  horizontalDistance: number;
  elevationDifference: number;
  distance3D: number;
}

export type ViewerRenderMode = "elevation" | "slope" | "relative-height" | "contour";

// ---------------------------------------------------------------------------
// Disaster-management + unique-differentiator additions
// ---------------------------------------------------------------------------

export interface FloodSummary {
  water_level: number;
  submerged_percent: number;
  min_m: number;
  max_m: number;
}

export interface CraterAnomaly {
  x: number;
  y: number;
  radius_px: number;
  radius_m: number;
  depth_m: number;
  circularity: number;
}

export type RiskLevel = "low" | "medium" | "high";

export interface BuildingDamage {
  id: number;
  x: number;
  y: number;
  footprint_px: number;
  height_m: number;
  collapse_radius_m: number;
  at_risk_buildings: number;
  at_risk_roads_px: number;
  risk_level: RiskLevel;
}

export interface AlertEvent {
  id: string;
  trigger_type: "flood" | "building_collapse" | "crater";
  message: string;
  sent: "pending" | "sent" | "failed";
  created_at: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

export interface DemographicsBreakdown {
  children_under_15: number;
  working_age_15_64: number;
  elderly_65_plus: number;
}

export interface ReliefRequirements {
  water_liters_day: number;
  emergency_shelters: number;
  medical_priority_cases: number;
}

export interface PopulationEstimate {
  estimated_population: number;
  method: string;
  confidence: "low" | "medium" | "high";
  note: string;
  density_km2?: number;
  area_km2?: number;
  bounds?: { west: number; south: number; east: number; north: number };
  source?: string;
  demographics?: DemographicsBreakdown;
  relief_requirements?: ReliefRequirements;
}

export interface DisasterLabel {
  label: string;
  confidence: "low" | "medium" | "high";
  evidence: string;
}

export interface DisasterClassification {
  labels: DisasterLabel[];
}

export interface TeamMember {
  name: string;
  role: string;
}
