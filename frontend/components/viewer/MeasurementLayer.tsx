"use client";

import * as THREE from "three";
import { useMemo } from "react";
import { Line } from "@react-three/drei";

export function MeasurementLayer({
  pointA,
  pointB,
}: {
  pointA: THREE.Vector3 | null;
  pointB: THREE.Vector3 | null;
}) {
  const points = useMemo(() => {
    if (pointA && pointB) return [pointA, pointB];
    return null;
  }, [pointA, pointB]);

  return (
    <group>
      {pointA && (
        <mesh position={pointA}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshBasicMaterial color="#48D3E6" />
        </mesh>
      )}
      {pointB && (
        <mesh position={pointB}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshBasicMaterial color="#E2A44E" />
        </mesh>
      )}
      {points && <Line points={points} color="#DCE7ED" lineWidth={1.5} dashed={false} />}
    </group>
  );
}

export function QueryMarker({ point }: { point: THREE.Vector3 | null }) {
  if (!point) return null;
  return (
    <mesh position={point}>
      <sphereGeometry args={[0.45, 16, 16]} />
      <meshBasicMaterial color="#4FCE93" />
    </mesh>
  );
}
