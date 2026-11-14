"use client";

import { useMemo } from "react";
import * as THREE from "three";

let cachedBodyGeo: THREE.BufferGeometry | null = null;
let cachedSilhouetteMat: THREE.MeshStandardMaterial | null = null;

/**
 * Builds a single timeless 1.80 m minimalist human silhouette geometry
 * (neutral standing figure — no spacesuit, backpack, visor, flags, or text).
 */
function getSilhouetteBodyGeometry(): THREE.BufferGeometry {
  if (cachedBodyGeo) return cachedBodyGeo;

  // Profile curves along height 0.00..1.80 m built smoothly from merged primitives
  const shape = new THREE.Shape();
  // Standing silhouette front-on profile (total height = 1.80 m exactly, feet at y = 0)
  // Right half mirrored cleanly via extruded gentle bevel -> readable from any horizontal angle
  shape.moveTo(-0.08, 0.0);
  // Left leg outer -> hip
  shape.lineTo(-0.145, 0.0);
  shape.lineTo(-0.125, 0.44);
  shape.lineTo(-0.14, 0.88);
  // Left arm hanging calmly beside torso
  shape.lineTo(-0.225, 0.84);
  shape.lineTo(-0.245, 1.12);
  shape.lineTo(-0.22, 1.38);
  // Left shoulder -> neck
  shape.quadraticCurveTo(-0.21, 1.47, -0.055, 1.5);
  shape.lineTo(-0.048, 1.56);
  // Head oval left
  shape.bezierCurveTo(-0.11, 1.58, -0.108, 1.8, 0.0, 1.8);
  // Head oval right
  shape.bezierCurveTo(0.108, 1.8, 0.11, 1.58, 0.048, 1.56);
  shape.lineTo(0.055, 1.5);
  // Right shoulder -> right arm
  shape.quadraticCurveTo(0.21, 1.47, 0.22, 1.38);
  shape.lineTo(0.245, 1.12);
  shape.lineTo(0.225, 0.84);
  // Right hip -> right leg outer -> right foot
  shape.lineTo(0.14, 0.88);
  shape.lineTo(0.125, 0.44);
  shape.lineTo(0.145, 0.0);
  shape.lineTo(0.08, 0.0);
  // Inner leg gap up to stride crotch
  shape.lineTo(0.04, 0.45);
  shape.lineTo(0.0, 0.82);
  shape.lineTo(-0.04, 0.45);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.11,
    bevelEnabled: true,
    bevelThickness: 0.032,
    bevelSize: 0.022,
    bevelSegments: 2,
    curveSegments: 10,
  });
  geo.translate(0, 0, -0.055);
  // Clamp vertical bounds cleanly to [0, 1.80]
  geo.computeBoundingBox();
  if (geo.boundingBox) {
    const h = geo.boundingBox.max.y - geo.boundingBox.min.y || 1.8;
    geo.translate(0, -geo.boundingBox.min.y, 0);
    geo.scale(1, 1.8 / h, 1);
  }
  geo.computeVertexNormals();
  cachedBodyGeo = geo;
  return geo;
}

function getSilhouetteMaterial(): THREE.MeshStandardMaterial {
  if (cachedSilhouetteMat) return cachedSilhouetteMat;
  cachedSilhouetteMat = new THREE.MeshStandardMaterial({
    color: "#1B2130",
    emissive: "#111724",
    emissiveIntensity: 0.35,
    roughness: 0.82,
    metalness: 0.14,
  });
  return cachedSilhouetteMat;
}

/**
 * Reusable neutral 1.8 m standing human silhouette for visual scale next to each exhibit.
 * Casts a soft real shadow to anchor human scale against lunar and Martian machinery.
 */
export function ScaleSilhouette({
  position,
  rotationY = 0.25,
  scale = 1,
}: {
  position: [number, number, number];
  rotationY?: number;
  scale?: number;
}) {
  const geo = useMemo(() => getSilhouetteBodyGeometry(), []);
  const mat = useMemo(() => getSilhouetteMaterial(), []);

  return (
    <mesh
      name="scale-silhouette"
      geometry={geo}
      material={mat}
      position={position}
      rotation={[0, rotationY, 0]}
      scale={scale}
      castShadow
      receiveShadow
    />
  );
}
