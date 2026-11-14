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

  // Standing neutral human figure (0.00..1.80 m height, feet at y = 0, realistic ~0.42 m shoulder width)
  const shape = new THREE.Shape();
  shape.moveTo(-0.072, 0.0);
  // Left leg outer -> hip
  shape.lineTo(-0.115, 0.0);
  shape.lineTo(-0.105, 0.45);
  shape.lineTo(-0.125, 0.88);
  shape.lineTo(-0.135, 1.08);
  // Left arm hanging naturally beside hip
  shape.lineTo(-0.195, 0.86);
  shape.lineTo(-0.215, 1.15);
  shape.lineTo(-0.2, 1.38);
  // Left shoulder -> neck
  shape.quadraticCurveTo(-0.185, 1.46, -0.048, 1.49);
  shape.lineTo(-0.042, 1.56);
  // Head oval
  shape.bezierCurveTo(-0.092, 1.58, -0.09, 1.8, 0.0, 1.8);
  shape.bezierCurveTo(0.09, 1.8, 0.092, 1.58, 0.042, 1.56);
  shape.lineTo(0.048, 1.49);
  // Right shoulder -> right arm
  shape.quadraticCurveTo(0.185, 1.46, 0.2, 1.38);
  shape.lineTo(0.215, 1.15);
  shape.lineTo(0.195, 0.86);
  // Right hip -> right leg outer -> foot
  shape.lineTo(0.135, 1.08);
  shape.lineTo(0.125, 0.88);
  shape.lineTo(0.105, 0.45);
  shape.lineTo(0.115, 0.0);
  shape.lineTo(0.072, 0.0);
  // Inner leg gap up to stride crotch
  shape.lineTo(0.036, 0.46);
  shape.lineTo(0.0, 0.84);
  shape.lineTo(-0.036, 0.46);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.058,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.012,
    bevelSegments: 2,
    curveSegments: 14,
  });
  geo.translate(0, 0, -0.029);
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
 * Always rendered at exact 1:1 world meter height (1.80 m) at equal camera distance.
 */
export function ScaleSilhouette({
  position,
  rotationY = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
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
      castShadow
      receiveShadow
    />
  );
}
