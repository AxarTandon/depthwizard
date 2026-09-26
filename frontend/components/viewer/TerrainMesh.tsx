"use client";

import { useRef } from "react";
import * as THREE from "three";
import { ThreeEvent } from "@react-three/fiber";
import { TerrainGeometryResult } from "./useTerrainGeometry";

interface TerrainMeshProps {
  geometryResult: TerrainGeometryResult;
  wireframe: boolean;
  onSurfaceClick?: (point: THREE.Vector3, faceIndex: number | undefined) => void;
}

export function TerrainMesh({ geometryResult, wireframe, onSurfaceClick }: TerrainMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { geometry } = geometryResult;

  function handleClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    if (onSurfaceClick && e.point) {
      onSurfaceClick(e.point.clone(), e.faceIndex);
    }
  }

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      onClick={handleClick}
      receiveShadow
      castShadow
    >
      <meshStandardMaterial
        vertexColors
        wireframe={wireframe}
        roughness={0.85}
        metalness={0.05}
        flatShading={false}
      />
    </mesh>
  );
}
