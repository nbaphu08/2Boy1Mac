"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { beats } from "@/content/beats";
import { exhibitBySlug } from "@/content/exhibits";
import { teaserItems } from "@/content/teaser";
import type { Exhibit } from "@/content/types";
import { useMuseum } from "@/lib/store";
import { scrollState, smoothstep } from "@/lib/scroll/progress";
import { EXHIBIT_PLINTH_ANCHORS } from "./trajectory";
import { HallOneLunarDiorama } from "./MoonDioramas";

const PLINTH_SURFACE_Y = 0.22;

function GlbExhibitMesh({
  url,
  isApolloLm,
}: {
  url: string;
  isApolloLm: boolean;
}) {
  const { scene } = useGLTF(url, false, true);

  const { cloned, scale, offset } = useMemo(() => {
    const copy = scene.clone(true);
    const box = new THREE.Box3().setFromObject(copy);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z, 0.001);
    const s = (isApolloLm ? 2.8 : 2.15) / maxDim;

    if (isApolloLm) {
      // In SM-L-001_apollo_lunar_module.web.glb, all Descent Stage meshes sit at y <= 1.85
      // and all Ascent Stage meshes sit at y >= 2.14. Hide the Ascent Stage meshes cleanly
      // at the node level so no jagged cross-section triangles remain (AG-1b #4).
      copy.traverse((child) => {
        if ((child as THREE.Mesh).isMesh && child.position.y > 1.85) {
          child.visible = false;
        }
      });
    }

    return {
      cloned: copy,
      scale: s,
      offset: [-center.x * s, PLINTH_SURFACE_Y - box.min.y * s, -center.z * s] as [number, number, number],
    };
  }, [scene, isApolloLm]);

  return (
    <group>
      <primitive object={cloned} scale={scale} position={offset} />
    </group>
  );
}

function LightboxExhibitMesh({ imageSrc }: { imageSrc: string }) {
  const tex = useTexture(imageSrc);
  return (
    <group position={[0, PLINTH_SURFACE_Y + 1.05, 0]}>
      {/* Platinum bezel frame */}
      <mesh>
        <boxGeometry args={[2.52, 1.72, 0.08]} />
        <meshStandardMaterial color="#C7CDD8" roughness={0.32} metalness={0.78} />
      </mesh>
      {/* Obsidian inner backing */}
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[2.36, 1.56, 0.06]} />
        <meshStandardMaterial color="#0A0E18" roughness={0.6} metalness={0.2} />
      </mesh>
      {/* Illuminated NASA archival image */}
      <mesh position={[0, 0, 0.055]}>
        <planeGeometry args={[2.24, 1.46]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  );
}

function PlinthFallback() {
  return (
    <mesh position={[0, PLINTH_SURFACE_Y + 0.75, 0]}>
      <octahedronGeometry args={[0.55, 0]} />
      <meshStandardMaterial color="#9DB8FF" wireframe transparent opacity={0.45} />
    </mesh>
  );
}

function SingleExhibitPlinth({
  exhibit,
  beatIndex,
  reducedMotion,
}: {
  exhibit: Exhibit;
  beatIndex: number;
  reducedMotion: boolean;
}) {
  const anchor = EXHIBIT_PLINTH_ANCHORS[exhibit.slug];
  const openExhibit = useMuseum((s) => s.openExhibit);
  const activeExhibit = useMuseum((s) => s.activeExhibit);
  const spinRef = useRef<THREE.Group>(null);
  const spotRef = useRef<THREE.SpotLight>(null);
  const coneRef = useRef<THREE.Mesh>(null);
  const rootRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const isApolloLm = exhibit.catalogNo === "SM-L-001" || exhibit.catalogNo === "SM-L-004";
  const lightboxImg = exhibit.media.then.src.replace("-1600.avif", "-800.jpg");

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hovered]);

  const isMoon = anchor?.planet === "moon";

  useFrame((state, delta) => {
    const p = scrollState.current;
    const dist = Math.abs(p - beatIndex);
    const vis = 1 - smoothstep(0.42, 0.78, dist);
    if (!rootRef.current) return;
    rootRef.current.visible = vis > 0.01;
    if (!rootRef.current.visible) return;

    rootRef.current.scale.setScalar(0.76 + 0.24 * vis);

    if (spinRef.current && !reducedMotion) {
      if (isMoon) {
        // Subtle diorama presentation sway so mountain backdrops and laser beams remain oriented toward camera
        spinRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.28 + beatIndex) * 0.08;
      } else {
        spinRef.current.rotation.y += delta * 0.22;
      }
    }

    const boost = activeExhibit === exhibit.slug ? 1.45 : hovered ? 1.22 : 1.0;
    if (spotRef.current) {
      spotRef.current.intensity = (isMoon ? 58 : 42) * vis * boost;
    }
    if (coneRef.current) {
      const mat = coneRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = (isMoon ? 0.065 : 0.08) * vis * boost;
    }
  });

  if (!anchor) return null;
  const plinthColor = isMoon ? "#3A404D" : "#4E2E24";
  const accentColor = isMoon ? "#B9BEC8" : "#C8603A";

  return (
    <group
      ref={rootRef}
      position={anchor.pos}
      rotation={[0, anchor.rotY, 0]}
      onClick={(e) => {
        e.stopPropagation();
        openExhibit(exhibit.slug);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Cold museum spotlight (#DCE6FF) */}
      <spotLight
        ref={spotRef}
        position={[0, isMoon ? 6.4 : 5.2, isMoon ? 1.35 : 1.1]}
        angle={isMoon ? 0.56 : 0.42}
        penumbra={0.85}
        intensity={isMoon ? 58 : 42}
        distance={isMoon ? 18 : 14}
        color="#DCE6FF"
      />

      {/* Volumetric spotlight beam */}
      <mesh
        ref={coneRef}
        position={[0, isMoon ? 3.2 : 2.65, isMoon ? 0.42 : 0.35]}
        rotation={[0.15, 0, 0]}
      >
        <coneGeometry args={[isMoon ? 3.35 : 2.1, isMoon ? 6.2 : 5.2, 28, 1, true]} />
        <meshBasicMaterial
          color="#DCE6FF"
          transparent
          opacity={isMoon ? 0.065 : 0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {isMoon ? (
        <group ref={spinRef}>
          <HallOneLunarDiorama slug={exhibit.slug} reducedMotion={reducedMotion}>
            {exhibit.media.model ? (
              <Suspense fallback={<PlinthFallback />}>
                <GlbExhibitMesh url={exhibit.media.model} isApolloLm={isApolloLm} />
              </Suspense>
            ) : null}
          </HallOneLunarDiorama>
        </group>
      ) : (
        <>
          {/* Bevelled planetary museum plinth (Hall II Mars until AG-2) */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[1.55, 1.85, 0.44, 32]} />
            <meshStandardMaterial color={plinthColor} roughness={0.86} metalness={0.12} />
          </mesh>
          <mesh position={[0, 0.21, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.48, 1.55, 36]} />
            <meshBasicMaterial color={accentColor} transparent opacity={0.45} />
          </mesh>

          {/* Rotating exhibit model or 2.5D platinum lightbox */}
          <group ref={spinRef}>
            <Suspense fallback={<PlinthFallback />}>
              {exhibit.media.model ? (
                <GlbExhibitMesh url={exhibit.media.model} isApolloLm={isApolloLm} />
              ) : (
                <LightboxExhibitMesh imageSrc={lightboxImg} />
              )}
            </Suspense>
          </group>
        </>
      )}
    </group>
  );
}

function SilhouetteModel({ url, x, reducedMotion }: { url: string; x: number; reducedMotion: boolean }) {
  const { scene } = useGLTF(url, false, true);
  const spinRef = useRef<THREE.Group>(null);

  const { cloned, scale, offset } = useMemo(() => {
    const copy = scene.clone(true);
    const darkMat = new THREE.MeshStandardMaterial({
      color: "#090D16",
      emissive: "#162442",
      emissiveIntensity: 0.35,
      roughness: 0.4,
      metalness: 0.75,
    });
    copy.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = darkMat;
      }
    });
    const box = new THREE.Box3().setFromObject(copy);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z, 0.001);
    const s = 2.6 / maxDim;
    return {
      cloned: copy,
      scale: s,
      offset: [-center.x * s, -center.y * s, -center.z * s] as [number, number, number],
    };
  }, [scene]);

  useFrame((_, delta) => {
    if (spinRef.current && !reducedMotion) {
      spinRef.current.rotation.y += delta * 0.16;
    }
  });

  return (
    <group ref={spinRef} position={[x, 0, 0]}>
      <primitive object={cloned} scale={scale} position={offset} />
    </group>
  );
}

function BeyondSilhouettes3D({ reducedMotion }: { reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    const p = scrollState.current;
    groupRef.current.visible = p > 21.1 && p < 22.9;
  });

  const offsets = [-6.3, -2.1, 2.1, 6.3];

  return (
    <group ref={groupRef} position={[0, 538.2, -522]} visible={false}>
      <spotLight position={[0, 6, -4]} angle={0.9} penumbra={0.9} intensity={160} distance={28} color="#9DB8FF" />
      {teaserItems.map((item, idx) => (
        <Suspense key={item.catalogNo} fallback={null}>
          <SilhouetteModel url={item.model} x={offsets[idx]} reducedMotion={reducedMotion} />
        </Suspense>
      ))}
    </group>
  );
}

/**
 * Mounts all 12 Moon + Mars exhibit plinths + Hall III silhouettes.
 * Individual plinths cull themselves smoothly when out of range, and preloading starts once in space.
 */
export function ExhibitStage3D({ reducedMotion }: { reducedMotion: boolean }) {
  const exhibitBeats = useMemo(
    () =>
      beats
        .map((b, i) => ({ beat: b, index: i, exhibit: b.exhibitSlug ? exhibitBySlug(b.exhibitSlug) : undefined }))
        .filter((x): x is { beat: (typeof beats)[number]; index: number; exhibit: Exhibit } => !!x.exhibit),
    [],
  );

  // Lazy-preload GLB models gently after mount so Moon/Mars transitions feel instant
  useEffect(() => {
    const urls = new Set<string>();
    exhibitBeats.forEach((x) => {
      if (x.exhibit.media.model) urls.add(x.exhibit.media.model);
    });
    teaserItems.forEach((t) => urls.add(t.model));
    const timer = window.setTimeout(() => {
      urls.forEach((u) => useGLTF.preload(u, false, true));
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [exhibitBeats]);

  return (
    <>
      {exhibitBeats.map(({ exhibit, index }) => (
        <SingleExhibitPlinth
          key={exhibit.slug}
          exhibit={exhibit}
          beatIndex={index}
          reducedMotion={reducedMotion}
        />
      ))}
      <BeyondSilhouettes3D reducedMotion={reducedMotion} />
    </>
  );
}
