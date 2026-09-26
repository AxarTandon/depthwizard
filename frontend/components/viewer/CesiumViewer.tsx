"use client";

/**
 * Georeferenced viewer branch - places the calibrated DSM's GLB mesh
 * accurately on the WGS84 globe via CesiumJS/Resium. Used instead of
 * Viewer3D (Three.js) when a project has real CRS + bounds (mode === "DSM",
 * calibrated === true).
 *
 * Uses free OpenStreetMap imagery and Cesium's built-in ellipsoid terrain -
 * NO Cesium ion account or access token required. (A paid/free ion token
 * would only be needed if you later want Cesium World Terrain or Bing
 * imagery instead of OSM - not necessary for this project.)
 *
 * See next.config.mjs for the required Cesium static-asset webpack setup -
 * verify with a local `npm run build` before relying on this.
 */
import { useEffect, useState } from "react";
import { Viewer, Entity, CameraFlyTo, ImageryLayer } from "resium";
import { Cartesian3, OpenStreetMapImageryProvider } from "cesium";
import { GeoBounds } from "@/types";

const osmProvider = new OpenStreetMapImageryProvider({
  url: "https://tile.openstreetmap.org/",
});

export function CesiumViewer({ meshUrl, bounds }: { meshUrl: string; bounds: GeoBounds }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const centerLon = (bounds.west + bounds.east) / 2;
  const centerLat = (bounds.south + bounds.north) / 2;

  if (!ready) return null;

  return (
    <Viewer full timeline={false} animation={false} baseLayerPicker={false}>
      <ImageryLayer imageryProvider={osmProvider} />
      <CameraFlyTo
        destination={Cartesian3.fromDegrees(centerLon, centerLat, 2000)}
        duration={1.5}
      />
      <Entity
        name="Reconstructed terrain"
        position={Cartesian3.fromDegrees(centerLon, centerLat)}
        model={{ uri: meshUrl, scale: 1.0 }}
      />
    </Viewer>
  );
}
