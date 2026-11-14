"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useMuseum } from "@/lib/store";
import { scrollState, smoothstep } from "@/lib/scroll/progress";
import { CelestialWorlds } from "./CelestialWorlds";
import { ExhibitStage3D } from "./ExhibitStage3D";
import { LaunchComplex } from "./LaunchComplex";
import { SLSRocket } from "./SLSRocket";
import { sampleTrajectory, type SampledTrajectory } from "./trajectory";

/** Build a true HDR studio + orbital sky environment map for realistic metallic & Kapton reflections. */
function configureAerospaceEnvironment(gl: THREE.WebGLRenderer, scene: THREE.Scene) {
  gl.localClippingEnabled = true;

  const pmrem = new THREE.PMREMGenerator(gl);
  pmrem.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color("#060A14");

  // Upper orbital sky hemisphere
  const skyDome = new THREE.Mesh(
    new THREE.SphereGeometry(50, 24, 16),
    new THREE.MeshBasicMaterial({ color: "#112042", side: THREE.BackSide }),
  );
  envScene.add(skyDome);

  // HDR Solar Key Reflector (float RGB > 1 for crisp metallic specular glints)
  const sunCard = new THREE.Mesh(
    new THREE.PlaneGeometry(26, 26),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(5.2, 5.5, 6.2), side: THREE.DoubleSide }),
  );
  sunCard.position.set(24, 28, 26);
  sunCard.lookAt(0, 0, 0);
  envScene.add(sunCard);

  // Cool Earthshine / Starlight Rim Reflector
  const rimCard = new THREE.Mesh(
    new THREE.PlaneGeometry(36, 22),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(1.4, 2.1, 3.8), side: THREE.DoubleSide }),
  );
  rimCard.position.set(-28, 10, -20);
  rimCard.lookAt(0, 0, 0);
  envScene.add(rimCard);

  // Secondary Zenith Specular Strip
  const topStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 8),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 3.0, 4.0), side: THREE.DoubleSide }),
  );
  topStrip.position.set(0, 38, 0);
  topStrip.lookAt(0, 0, 0);
  envScene.add(topStrip);

  // Warm Ignition / Pad Horizon Bounce
  const padBounce = new THREE.Mesh(
    new THREE.PlaneGeometry(32, 32),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, 0.95, 0.5), side: THREE.DoubleSide }),
  );
  padBounce.position.set(0, -32, 10);
  padBounce.lookAt(0, 0, 0);
  envScene.add(padBounce);

  const envTarget = pmrem.fromScene(envScene, 0.035);
  scene.environment = envTarget.texture;
  pmrem.dispose();
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

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    if (reducedMotion) {
      scrollState.current = scrollState.target;
    } else {
      const prev = scrollState.current;
      scrollState.current = THREE.MathUtils.damp(prev, scrollState.target, 8.5, dt);
      scrollState.velocity = (scrollState.current - prev) / Math.max(dt, 0.001);
    }

    const p = scrollState.current;
    sampleTrajectory(p, traj);

    const t = state.clock.elapsedTime;
    // Living breathing drift + subtle acoustic rumble at liftoff (beat 2)
    const breathX = reducedMotion ? 0 : Math.sin(t * 0.42) * 0.12;
    const breathY = reducedMotion ? 0 : Math.cos(t * 0.31) * 0.09;
    const liftoffRumble = reducedMotion
      ? 0
      : smoothstep(1.82, 1.98, p) * (1 - smoothstep(2.25, 2.52, p));
    const shakeX = liftoffRumble * Math.sin(t * 52) * 0.2;
    const shakeY = liftoffRumble * Math.cos(t * 59) * 0.15;

    camera.position.set(
      traj.camPos.x + breathX + shakeX,
      traj.camPos.y + breathY + shakeY,
      traj.camPos.z,
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

export default function SpaceScene() {
  const reducedMotion = useMuseum((s) => s.reducedMotion);
  const rocketRef = useRef<THREE.Group | null>(null);

  return (
    <div aria-hidden className="fixed inset-0 z-0 bg-void">
      <Canvas
        dpr={reducedMotion ? 1 : [1, 1.85]}
        camera={{ fov: 44, near: 0.25, far: 2600, position: [14, 5.2, 23] }}
        onCreated={({ gl, scene }) => {
          configureAerospaceEnvironment(gl, scene);
        }}
        gl={{
          antialias: true,
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
        </Suspense>
      </Canvas>
    </div>
  );
}
