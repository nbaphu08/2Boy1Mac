"use client";

import { Suspense, useLayoutEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Box3, Vector3, type Object3D } from "three";

/** Normalises any model to a ~1-unit radius, centred on the origin. */
function Model({ url }: { url: string }) {
  const gltf = useGLTF(url, false, true);
  const { scene, scale, offset } = useMemo(() => {
    const s = gltf.scene.clone(true) as Object3D;
    const box = new Box3().setFromObject(s);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    const radius = Math.max(size.length() / 2, 1e-4);
    return { scene: s, scale: 1 / radius, offset: center };
  }, [gltf.scene]);

  useLayoutEffect(() => {
    scene.traverse((o) => {
      o.frustumCulled = false;
    });
  }, [scene]);

  return (
    <group scale={scale}>
      <primitive object={scene} position={[-offset.x, -offset.y, -offset.z]} />
    </group>
  );
}

const DISTANCE = 3;

export default function ModelViewerCanvas({ url, reducedMotion }: { url: string; reducedMotion: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      frameloop={reducedMotion ? "demand" : "always"}
      camera={{ position: [DISTANCE * 0.8, DISTANCE * 0.35, DISTANCE * 0.8], fov: 35, near: 0.05, far: 50 }}
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.35} color="#9fb0d0" />
      <directionalLight position={[3, 4, 2.5]} intensity={2.4} color="#DCE6FF" />
      <directionalLight position={[-3, -1, -2]} intensity={0.5} color="#6f86b8" />
      <Suspense fallback={null}>
        <Model url={url} />
      </Suspense>
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        minDistance={DISTANCE * 0.5}
        maxDistance={DISTANCE * 2}
        autoRotate={!reducedMotion}
        autoRotateSpeed={0.8}
      />
    </Canvas>
  );
}
