"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileImage, X, AlertTriangle, Info } from "lucide-react";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { Panel, PanelHeader, Badge } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { buildUploadedImageMeta, formatFileSize, isAcceptedFormat } from "@/lib/file-utils";
import { UploadedImageMeta } from "@/types";
import { uploadImage, startReconstruction } from "@/lib/api";

const ACCEPTED = ".png,.jpg,.jpeg,.tif,.tiff,.h5,.hdf5";

export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<UploadedImageMeta | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [starting, setStarting] = useState(false);

  const handleFile = useCallback((file: File) => {
    setError(null);
    if (!isAcceptedFormat(file.name)) {
      setError("Unsupported file type. Please upload PNG, JPG, JPEG, TIFF, GeoTIFF, or HDF5 (.h5 / .hdf5).");
      return;
    }
    setImage(buildUploadedImageMeta(file));
    setRawFile(file);
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  async function handleStart() {
    if (!image) return;
    setStarting(true);
    const { projectId } = await uploadImage(image, rawFile ?? undefined);
    await startReconstruction(projectId);
    router.push(`/workspace/processing?project=${projectId}`);
  }

  return (
    <WorkspaceShell title="Upload">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <h2 className="font-display text-xl font-semibold text-ink">Upload source imagery</h2>
        <p className="mt-1 text-[13.5px] text-ink-muted">
          Supported formats: PNG, JPG, JPEG, TIFF, GeoTIFF, and HDF5 (.h5 / .hdf5).
        </p>

        {!image ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`mt-6 flex flex-col items-center justify-center gap-4 border border-dashed px-6 py-20 text-center transition-colors ${
              dragActive ? "border-signal-cyan bg-signal-cyan/5" : "border-line-bright bg-surface-panel"
            }`}
          >
            <UploadCloud className="h-9 w-9 text-signal-cyan" strokeWidth={1.5} />
            <div>
              <p className="text-[14.5px] text-ink">Drag and drop an image here</p>
              <p className="mt-1 text-[12.5px] text-ink-faint">or select a file from your device</p>
            </div>
            <Button variant="secondary" onClick={() => inputRef.current?.click()}>
              Browse files
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED}
              className="hidden"
              onChange={handleInputChange}
              aria-label="Upload imagery"
            />
          </div>
        ) : (
          <Panel className="mt-6">
            <PanelHeader>
              <h3 className="text-[14px] font-medium text-ink">Selected file</h3>
              <button
                type="button"
                onClick={() => {
                  setImage(null);
                  setError(null);
                }}
                className="focus-ring flex items-center gap-1 rounded-sm text-[12.5px] text-ink-muted hover:text-signal-red"
              >
                <X className="h-3.5 w-3.5" /> Remove
              </button>
            </PanelHeader>

            <div className="flex flex-col gap-6 p-5 sm:flex-row">
              <div className="flex h-40 w-full shrink-0 items-center justify-center overflow-hidden border border-line bg-surface sm:w-56">
                {image.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image.previewUrl}
                    alt={`Preview of ${image.filename}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-ink-faint">
                    <FileImage className="h-8 w-8" strokeWidth={1.5} />
                    <span className="text-[11px]">No preview for TIFF / HDF5</span>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <dl className="grid grid-cols-2 gap-y-3 text-[13px]">
                  <dt className="text-ink-faint">Filename</dt>
                  <dd className="truncate text-ink">{image.filename}</dd>
                  <dt className="text-ink-faint">Size</dt>
                  <dd className="text-ink">{formatFileSize(image.sizeBytes)}</dd>
                  <dt className="text-ink-faint">Format</dt>
                  <dd className="text-ink uppercase">{image.format}</dd>
                  <dt className="text-ink-faint">Output mode</dt>
                  <dd>
                    <Badge tone={image.isGeoTagged ? "cyan" : "neutral"}>
                      {image.isGeoTagged ? "DSM candidate" : "rDSM"}
                    </Badge>
                  </dd>
                </dl>

                <div className="mt-5 flex items-start gap-2 border border-line-bright bg-surface px-3 py-3 text-[12.5px] leading-relaxed text-ink-muted">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-signal-cyan" />
                  {image.isGeoTagged ? (
                    <span>
                      This file carries a TIFF or HDF5 format, which can (but
                      does not always) mean it includes geospatial metadata. A
                      metric DSM with real-world coordinates requires that
                      metadata to be present and valid, and the backend to
                      calibrate against it. Until confirmed, this will be
                      processed as a relative surface model.
                    </span>
                  ) : (
                    <span>
                      This frontend will represent output as relative
                      surface height (rDSM) — elevation is meaningful in
                      relation to itself, not tied to a real-world datum.
                    </span>
                  )}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <Button variant="secondary" onClick={() => inputRef.current?.click()}>
                    Replace file
                  </Button>
                  <Button onClick={handleStart} disabled={starting}>
                    {starting ? "Starting…" : "Start reconstruction"}
                  </Button>
                  <input
                    ref={inputRef}
                    type="file"
                    accept={ACCEPTED}
                    className="hidden"
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          </Panel>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 border border-signal-red/40 bg-signal-red/10 px-3 py-2 text-[13px] text-signal-red">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}
