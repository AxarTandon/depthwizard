"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { generateDemoElevation } from "@/lib/terrain";
import { TerrainMesh } from "@/components/viewer/TerrainMesh";
import { useTerrainGeometry } from "@/components/viewer/useTerrainGeometry";

function Scene() {
  const elevations = useMemo(() => generateDemoElevation(), []);
  const geometryResult = useTerrainGeometry(elevations, "elevation");

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[40, 60, 20]} intensity={1.1} />
      <directionalLight position={[-30, 15, -30]} intensity={0.35} color="#48D3E6" />
      <TerrainMesh geometryResult={geometryResult} wireframe={false} />
      <OrbitControls
        autoRotate
        autoRotateSpeed={0.6}
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 3.4}
        maxPolarAngle={Math.PI / 2.3}
      />
    </>
  );
}

export function MiniTerrainPreview() {
  return (
    <Canvas
      camera={{ position: [65, 48, 65], fov: 42 }}
      onCreated={({ gl }) => gl.setClearColor(new THREE.Color("#080B0E"), 0)}
      className="!absolute inset-0"
    >
      <Scene />
    </Canvas>
  );
}
