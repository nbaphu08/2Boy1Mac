"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { beats } from "@/content/beats";
import { useMuseum } from "@/lib/store";
import { scrollState, smoothstep } from "@/lib/scroll/progress";
import { CelestialWorlds } from "./CelestialWorlds";
import { ExhibitStage3D } from "./ExhibitStage3D";
import { LaunchComplex } from "./LaunchComplex";
import { SLSRocket } from "./SLSRocket";
import { detectInitialPerfTier, updatePerfFpsMonitor, usePerfBudget } from "./perfTier";
import { sampleTrajectory, type SampledTrajectory } from "./trajectory";

/**
 * Build a true HDR studio + orbital sky environment map for realistic metallic & Kapton reflections.
 * Deferred until the WebGL drawingBuffer has non-zero dimensions so no incomplete-framebuffer or
 * glReadPixels GPU readback error ever fires during initial canvas layout (AG-6 S-6 #2).
 */
function configureAerospaceEnvironment(gl: THREE.WebGLRenderer, scene: THREE.Scene) {
  gl.localClippingEnabled = true;

  const applyEnv = () => {
    const ctx = gl.getContext();
    if (ctx.drawingBufferWidth <= 0 || ctx.drawingBufferHeight <= 0) {
      window.requestAnimationFrame(applyEnv);
      return;
    }

    const pmrem = new THREE.PMREMGenerator(gl);
    pmrem.compileEquirectangularShader();

    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color("#060A14");

    // Upper orbital sky hemisphere
    const skyGeo = new THREE.SphereGeometry(50, 24, 16);
    const skyMat = new THREE.MeshBasicMaterial({ color: "#112042", side: THREE.BackSide });
    envScene.add(new THREE.Mesh(skyGeo, skyMat));

    // HDR Solar Key Reflector (float RGB > 1 for crisp metallic specular glints)
    const sunGeo = new THREE.PlaneGeometry(26, 26);
    const sunMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(5.2, 5.5, 6.2), side: THREE.DoubleSide });
    const sunCard = new THREE.Mesh(sunGeo, sunMat);
    sunCard.position.set(24, 28, 26);
    sunCard.lookAt(0, 0, 0);
    envScene.add(sunCard);

    // Cool Earthshine / Starlight Rim Reflector
    const rimGeo = new THREE.PlaneGeometry(36, 22);
    const rimMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.4, 2.1, 3.8), side: THREE.DoubleSide });
    const rimCard = new THREE.Mesh(rimGeo, rimMat);
    rimCard.position.set(-28, 10, -20);
    rimCard.lookAt(0, 0, 0);
    envScene.add(rimCard);

    // Secondary Zenith Specular Strip
    const topGeo = new THREE.PlaneGeometry(40, 8);
    const topMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 3.0, 4.0), side: THREE.DoubleSide });
    const topStrip = new THREE.Mesh(topGeo, topMat);
    topStrip.position.set(0, 38, 0);
    topStrip.lookAt(0, 0, 0);
    envScene.add(topStrip);

    // Warm Ignition / Pad Horizon Bounce
    const padGeo = new THREE.PlaneGeometry(32, 32);
    const padMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, 0.95, 0.5), side: THREE.DoubleSide });
    const padBounce = new THREE.Mesh(padGeo, padMat);
    padBounce.position.set(0, -32, 10);
    padBounce.lookAt(0, 0, 0);
    envScene.add(padBounce);

    const envTarget = pmrem.fromScene(envScene, 0.035);
    scene.environment = envTarget.texture;
    pmrem.dispose();
    skyGeo.dispose();
    skyMat.dispose();
    sunGeo.dispose();
    sunMat.dispose();
    rimGeo.dispose();
    rimMat.dispose();
    topGeo.dispose();
    topMat.dispose();
    padGeo.dispose();
    padMat.dispose();
  };

  applyEnv();
}

function SceneChoreographer({
  rocketRef,
  reducedMotion,
}: {
  rocketRef: React.RefObject<THREE.Group | null>;
  reducedMotion: boolean;
}) {
  const camera = useThree((s) => s.camera);
  const activeExhibit = useMuseum((s) => s.activeExhibit);
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const rimRef = useRef<THREE.DirectionalLight>(null);
  const ambRef = useRef<THREE.AmbientLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const elapsedRef = useRef(0);

  const traj = useMemo<SampledTrajectory>(
    () => ({
      camPos: new THREE.Vector3(),
      camLook: new THREE.Vector3(),
      rocketPos: new THREE.Vector3(),
      rocketRot: new THREE.Euler(),
      rocketScale: 1,
    }),
    [],
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    updatePerfFpsMonitor(dt);

    if (reducedMotion) {
      scrollState.current = scrollState.target;
      scrollState.velocity = 0;
    } else {
      elapsedRef.current += dt;
      const prev = scrollState.current;
      scrollState.current = THREE.MathUtils.damp(prev, scrollState.target, 8.5, dt);
      scrollState.velocity = (scrollState.current - prev) / Math.max(dt, 0.001);
    }

    const p = scrollState.current;
    sampleTrajectory(p, traj);

    const t = elapsedRef.current;
    // Living breathing drift + subtle acoustic rumble at liftoff (beat 2)
    const breathX = reducedMotion ? 0 : Math.sin(t * 0.42) * 0.12;
    const breathY = reducedMotion ? 0 : Math.cos(t * 0.31) * 0.09;
    const liftoffRumble = reducedMotion
      ? 0
      : smoothstep(1.82, 1.98, p) * (1 - smoothstep(2.25, 2.52, p));
    const shakeX = liftoffRumble * Math.sin(t * 52) * 0.2;
    const shakeY = liftoffRumble * Math.cos(t * 59) * 0.15;

    // Subtle camera micro-orbit while the visitor rests on an exhibit beat (respects reducedMotion -> no orbit)
    const inExhibitRange = smoothstep(7.5, 8.0, p) * (1 - smoothstep(20.1, 20.6, p));
    const isResting = 1 - smoothstep(0.06, 0.38, Math.abs(scrollState.velocity));
    const orbitWeight = reducedMotion ? 0 : inExhibitRange * isResting;

    const dx = traj.camPos.x - traj.camLook.x;
    const dz = traj.camPos.z - traj.camLook.z;
    const orbitAngle = Math.sin(t * 0.36) * 0.14 * orbitWeight;
    const cosA = Math.cos(orbitAngle);
    const sinA = Math.sin(orbitAngle);
    const orbitedX = traj.camLook.x + dx * cosA - dz * sinA;
    const orbitedZ = traj.camLook.z + dx * sinA + dz * cosA;
    const orbitLiftY = Math.cos(t * 0.28) * 0.12 * orbitWeight;

    camera.position.set(
      orbitedX + breathX + shakeX,
      traj.camPos.y + breathY + shakeY + orbitLiftY,
      orbitedZ,
    );
    camera.lookAt(traj.camLook);

    if (rocketRef.current) {
      rocketRef.current.position.copy(traj.rocketPos);
      rocketRef.current.rotation.copy(traj.rocketRot);
      rocketRef.current.scale.setScalar(traj.rocketScale);
      rocketRef.current.visible = p < 20.8 || p > 22.7;
    }

    // Dim global background lights by 60% when ExhibitPanel is open (PLAN §4)
    const dim = activeExhibit ? 0.4 : 1.0;
    if (sunRef.current) {
      sunRef.current.intensity = THREE.MathUtils.damp(sunRef.current.intensity, 3.1 * dim, 6, dt);
    }
    if (rimRef.current) {
      rimRef.current.intensity = THREE.MathUtils.damp(rimRef.current.intensity, 0.85 * dim, 6, dt);
    }
    if (ambRef.current) {
      ambRef.current.intensity = THREE.MathUtils.damp(ambRef.current.intensity, 0.42 * dim, 6, dt);
    }
    if (hemiRef.current) {
      hemiRef.current.intensity = THREE.MathUtils.damp(hemiRef.current.intensity, 0.48 * dim, 6, dt);
    }
  });

  return (
    <>
      <ambientLight ref={ambRef} color="#1A2644" intensity={0.42} />
      <hemisphereLight ref={hemiRef} args={["#ADC8FF", "#0A0E18", 0.48]} />
      <directionalLight ref={sunRef} position={[65, 95, 85]} color="#F5F8FF" intensity={3.1} />
      <directionalLight ref={rimRef} position={[-60, 15, -55]} color="#6E96FF" intensity={0.85} />
    </>
  );
}

/**
 * AG-5: Pre-compiles and warms up all scene materials & shaders once mounted and after
 * lazy GLB preload so fast scrolling across transitions (6->7, 12->13->14, 22->23) has zero stutter.
 */
function MaterialPrewarmer() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    const t1 = window.setTimeout(() => {
      gl.compile(scene, camera);
    }, 350);
    const t2 = window.setTimeout(() => {
      gl.compile(scene, camera);
    }, 1800);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [gl, scene, camera]);

  return null;
}

export default function SpaceScene() {
  const reducedMotion = useMuseum((s) => s.reducedMotion);
  const budget = usePerfBudget();
  const rocketRef = useRef<THREE.Group | null>(null);
  const [isPageHidden, setIsPageHidden] = useState(false);

  // AG-6 S-6 #3: Pause the R3F render loop when document.hidden (0% CPU in background tab)
  useEffect(() => {
    const onVisibilityChange = () => {
      setIsPageHidden(document.hidden);
    };
    onVisibilityChange();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  // AG-7: Support ?poster=<beatId|slug> for clean still poster capture (locks beat & hides DOM UI)
  const [posterBeat] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const posterId = params.get("poster");
    if (!posterId) return null;
    const idx = beats.findIndex((b) => b.id === posterId || b.exhibitSlug === posterId);
    return idx >= 0 ? idx : null;
  });

  useEffect(() => {
    if (posterBeat !== null) {
      scrollState.target = posterBeat;
      scrollState.current = posterBeat;
      scrollState.velocity = 0;
    }
  }, [posterBeat]);

  return (
    <div aria-hidden className={`fixed inset-0 bg-void ${posterBeat !== null ? "z-50" : "z-0"}`}>
      <Canvas
        frameloop={isPageHidden ? "never" : "always"}
        dpr={reducedMotion ? 1 : budget.dpr}
        camera={{ fov: 44, near: 0.25, far: 2600, position: [14, 5.2, 23] }}
        onCreated={({ gl, scene }) => {
          detectInitialPerfTier(gl);
          configureAerospaceEnvironment(gl, scene);
        }}
        gl={{
          antialias: true,
          preserveDrawingBuffer: posterBeat !== null,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.08,
        }}
      >
        <color attach="background" args={["#04060B"]} />
        <SceneChoreographer rocketRef={rocketRef} reducedMotion={reducedMotion} />
        <Suspense fallback={null}>
          <CelestialWorlds reducedMotion={reducedMotion} />
          <LaunchComplex />
          <SLSRocket rocketRef={rocketRef} reducedMotion={reducedMotion} />
          <ExhibitStage3D reducedMotion={reducedMotion} />
          <MaterialPrewarmer />
        </Suspense>
      </Canvas>
    </div>
  );
}
