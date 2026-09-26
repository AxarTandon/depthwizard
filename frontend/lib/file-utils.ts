import { ImageFormat, UploadedImageMeta } from "@/types";

const ACCEPTED_EXTENSIONS: ImageFormat[] = ["png", "jpg", "jpeg", "tif", "tiff", "h5", "hdf5"];

export function getExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

export function isAcceptedFormat(filename: string): boolean {
  return ACCEPTED_EXTENSIONS.includes(getExtension(filename) as ImageFormat);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Determines whether a file is likely to carry geospatial metadata.
 * In demo mode this is a heuristic based on extension only — a real backend
 * would parse TIFF tags (GeoKeyDirectoryTag) or HDF5 coordinates/attributes to confirm georeferenced status.
 * A .tif/.tiff or .h5/.hdf5 extension does NOT guarantee valid georeferencing.
 */
export function isLikelyGeoTagged(filename: string): boolean {
  const ext = getExtension(filename);
  return ext === "tif" || ext === "tiff" || ext === "h5" || ext === "hdf5";
}

export function buildUploadedImageMeta(file: File): UploadedImageMeta {
  const ext = getExtension(file.name) as ImageFormat;
  return {
    id: `img-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    filename: file.name,
    sizeBytes: file.size,
    format: ext,
    isGeoTagged: isLikelyGeoTagged(file.name),
    previewUrl: ext === "png" || ext === "jpg" || ext === "jpeg" ? URL.createObjectURL(file) : undefined,
    uploadedAt: new Date().toISOString(),
  };
}

export function elevationModeLabel(isGeoTagged: boolean): string {
  return isGeoTagged ? "DSM (candidate)" : "rDSM";
}
