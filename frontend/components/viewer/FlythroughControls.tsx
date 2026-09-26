"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const MOVE_SPEED = 12;
const LOOK_SPEED = 0.0024;

export function FlythroughControls({ active }: { active: boolean }) {
  const { camera, gl } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const yaw = useRef(0);
  const pitch = useRef(0);
  const dragging = useRef(false);

  useEffect(() => {
    if (!active) return;

    const euler = new THREE.Euler(0, 0, 0, "YXZ");
    euler.setFromQuaternion(camera.quaternion);
    yaw.current = euler.y;
    pitch.current = euler.x;

    function onKeyDown(e: KeyboardEvent) {
      keys.current[e.code] = true;
    }
    function onKeyUp(e: KeyboardEvent) {
      keys.current[e.code] = false;
    }
    function onPointerDown() {
      dragging.current = true;
    }
    function onPointerUp() {
      dragging.current = false;
    }
    function onPointerMove(e: PointerEvent) {
      if (!dragging.current) return;
      yaw.current -= e.movementX * LOOK_SPEED;
      pitch.current -= e.movementY * LOOK_SPEED;
      pitch.current = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, pitch.current));
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    gl.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointermove", onPointerMove);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      gl.domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointermove", onPointerMove);
      keys.current = {};
    };
  }, [active, camera, gl]);

  useFrame((_, delta) => {
    if (!active) return;

    const euler = new THREE.Euler(pitch.current, yaw.current, 0, "YXZ");
    camera.quaternion.setFromEuler(euler);

    const forward = new THREE.Vector3(0, 0, -1).applyEuler(euler);
    const right = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, yaw.current, 0));
    const up = new THREE.Vector3(0, 1, 0);

    const move = new THREE.Vector3();
    if (keys.current["KeyW"]) move.add(forward);
    if (keys.current["KeyS"]) move.sub(forward);
    if (keys.current["KeyD"]) move.add(right);
    if (keys.current["KeyA"]) move.sub(right);
    if (keys.current["Space"]) move.add(up);
    if (keys.current["ShiftLeft"] || keys.current["ShiftRight"]) move.sub(up);

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(MOVE_SPEED * delta);
      camera.position.add(move);
    }
  });

  return null;
}
