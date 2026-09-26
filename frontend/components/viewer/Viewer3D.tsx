"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { TerrainMesh } from "./TerrainMesh";
import { ContourLines } from "./ContourLines";
import { FlythroughControls } from "./FlythroughControls";
import { MeasurementLayer, QueryMarker } from "./MeasurementLayer";
import { useTerrainGeometry } from "./useTerrainGeometry";
import { computeSlopeMatrix } from "@/lib/terrain";
import { computeMeasurement } from "@/lib/calculations";
import { MeasurementPoint, MeasurementResult, TerrainQueryResult, ViewerRenderMode } from "@/types";
import { ViewerToolbar } from "./ViewerToolbar";
import { ViewerInfoPanel } from "./ViewerInfoPanel";

interface Viewer3DProps {
  elevations: number[][];
}

function CameraResetter({ triggerRef }: { triggerRef: React.MutableRefObject<() => void> }) {
  const { camera } = useThree();
  triggerRef.current = () => {
    camera.position.set(70, 55, 70);
    camera.lookAt(0, 0, 0);
  };
  return null;
}

export function Viewer3D({ elevations }: Viewer3DProps) {
  const [renderMode, setRenderMode] = useState<ViewerRenderMode>("elevation");
  const [wireframe, setWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [flythrough, setFlythrough] = useState(false);
  const [measuring, setMeasuring] = useState(false);

  const [pointA, setPointA] = useState<MeasurementPoint | null>(null);
  const [pointB, setPointB] = useState<MeasurementPoint | null>(null);
  const [measurement, setMeasurement] = useState<MeasurementResult | null>(null);
  const [query, setQuery] = useState<TerrainQueryResult | null>(null);
  const [queryWorldPoint, setQueryWorldPoint] = useState<THREE.Vector3 | null>(null);

  const orbitRef = useRef<OrbitControlsImpl>(null);
  const resetTriggerRef = useRef<() => void>(() => {});

  const geometryResult = useTerrainGeometry(elevations, renderMode);
  const slopeMatrix = useMemo(() => computeSlopeMatrix(elevations), [elevations]);

  const resetCamera = useCallback(() => {
    resetTriggerRef.current();
    orbitRef.current?.reset();
  }, []);

  const handleSurfaceClick = useCallback(
    (point: THREE.Vector3) => {
      const { worldToGrid } = geometryResult;
      const { gx, gz } = worldToGrid(point.x, point.z);
      const size = elevations.length;
      const gxRound = Math.min(size - 1, Math.max(0, Math.round(gx)));
      const gzRound = Math.min(size - 1, Math.max(0, Math.round(gz)));
      const elevation = elevations[gzRound][gxRound];
      const slope = slopeMatrix[gzRound][gxRound];

      const measurementPoint: MeasurementPoint = {
        x: gxRound,
        y: gzRound,
        elevation,
        worldPosition: [point.x, elevation * geometryResult.verticalScale, point.z],
      };

      if (measuring) {
        if (!pointA) {
          setPointA(measurementPoint);
          setMeasurement(null);
        } else if (!pointB) {
          setPointB(measurementPoint);
          setMeasurement(computeMeasurement(pointA, measurementPoint));
        } else {
          setPointA(measurementPoint);
          setPointB(null);
          setMeasurement(null);
        }
        return;
      }

      setQuery({ x: gxRound, y: gzRound, elevation, slope });
      setQueryWorldPoint(
        new THREE.Vector3(point.x, elevation * geometryResult.verticalScale, point.z)
      );
    },
    [geometryResult, elevations, slopeMatrix, measuring, pointA, pointB]
  );

  function clearMeasurement() {
    setPointA(null);
    setPointB(null);
    setMeasurement(null);
  }

  function toggleMeasuring() {
    setMeasuring((v) => {
      const next = !v;
      if (next) {
        clearMeasurement();
        setQuery(null);
        setQueryWorldPoint(null);
      }
      return next;
    });
  }

  return (
    <div className="relative h-full w-full bg-void">
      <Canvas
        shadows
        camera={{ position: [70, 55, 70], fov: 45, near: 0.1, far: 500 }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color("#080B0E"));
        }}
      >
        <CameraResetter triggerRef={resetTriggerRef} />
        <ambientLight intensity={0.55} />
        <directionalLight
          position={[40, 60, 20]}
          intensity={1.1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight position={[-30, 20, -40]} intensity={0.3} color="#48D3E6" />

        <TerrainMesh
          geometryResult={geometryResult}
          wireframe={wireframe}
          onSurfaceClick={handleSurfaceClick}
        />

        {renderMode === "contour" && <ContourLines elevations={elevations} interval={5} />}

        {showGrid && (
          <Grid
            position={[0, -0.05, 0]}
            args={[140, 140]}
            cellSize={5}
            cellThickness={0.5}
            cellColor="#1C2831"
            sectionSize={25}
            sectionThickness={1}
            sectionColor="#2A3D49"
            fadeDistance={160}
            fadeStrength={1}
            infiniteGrid={false}
          />
        )}

        <MeasurementLayer
          pointA={pointA ? new THREE.Vector3(...pointA.worldPosition) : null}
          pointB={pointB ? new THREE.Vector3(...pointB.worldPosition) : null}
        />
        {!measuring && <QueryMarker point={queryWorldPoint} />}

        <OrbitControls
          ref={orbitRef}
          enabled={!flythrough}
          enableDamping
          dampingFactor={0.08}
          minDistance={15}
          maxDistance={220}
          maxPolarAngle={Math.PI / 2.05}
        />
        <FlythroughControls active={flythrough} />
      </Canvas>

      <ViewerToolbar
        renderMode={renderMode}
        onRenderModeChange={setRenderMode}
        wireframe={wireframe}
        onWireframeToggle={() => setWireframe((v) => !v)}
        showGrid={showGrid}
        onGridToggle={() => setShowGrid((v) => !v)}
        flythrough={flythrough}
        onFlythroughToggle={() => setFlythrough((v) => !v)}
        measuring={measuring}
        onMeasuringToggle={toggleMeasuring}
        onReset={resetCamera}
      />

      <ViewerInfoPanel
        query={query}
        measurement={measurement}
        measuring={measuring}
        flythrough={flythrough}
      />
    </div>
  );
}
