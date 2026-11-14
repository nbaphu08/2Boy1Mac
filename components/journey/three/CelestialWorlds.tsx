"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { scrollState, smoothstep } from "@/lib/scroll/progress";
import { EXHIBIT_PLINTH_ANCHORS, WORLD_ANCHORS } from "./trajectory";

/** Fresnel atmosphere / rim glow shader for Earth, Moon & Mars limbs. */
function AtmosphereRim({
  radius,
  color,
  intensity = 0.75,
  power = 3.2,
}: {
  radius: number;
  color: string;
  intensity?: number;
  power?: number;
}) {
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(color) },
      uIntensity: { value: intensity },
      uPower: { value: power },
    }),
    [color, intensity, power],
  );

  return (
    <mesh>
      <sphereGeometry args={[radius, 56, 48]} />
      <shaderMaterial
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
        vertexShader={`
          varying vec3 vNormal;
          varying vec3 vViewDir;
          void main() {
            vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
            vNormal = normalize(normalMatrix * normal);
            vViewDir = normalize(-mvPos.xyz);
            gl_Position = projectionMatrix * mvPos;
          }
        `}
        fragmentShader={`
          uniform vec3 uColor;
          uniform float uIntensity;
          uniform float uPower;
          varying vec3 vNormal;
          varying vec3 vViewDir;
          void main() {
            float rim = pow(clamp(0.74 - dot(-vNormal, vViewDir), 0.0, 1.0), uPower);
            gl_FragColor = vec4(uColor * uIntensity, rim);
          }
        `}
      />
    </mesh>
  );
}

const DAWN_ZENITH = new THREE.Color("#071630");
const DAWN_HORIZON = new THREE.Color("#3D374B");
const DAY_ZENITH = new THREE.Color("#0C2858");
const DAY_HORIZON = new THREE.Color("#3262A2");
const HIGH_ZENITH = new THREE.Color("#040712");
const HIGH_HORIZON = new THREE.Color("#0E2044");

/** Dynamic Earth sky dome that clears smoothly into Deep Field space during ascent. */
function AscentSkyDome() {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uZenith: { value: new THREE.Color("#050B1A") },
      uHorizon: { value: new THREE.Color("#252236") },
      uOpacity: { value: 1 },
    }),
    [],
  );

  useFrame(({ camera }) => {
    const p = scrollState.current;
    if (!meshRef.current || !matRef.current) return;
    const opacity = 1 - smoothstep(5.0, 6.6, p);
    meshRef.current.visible = opacity > 0.01;
    if (!meshRef.current.visible) return;

    meshRef.current.position.copy(camera.position);

    const launchDay = smoothstep(1.9, 3.3, p);
    const upperStrat = smoothstep(3.3, 5.2, p);

    matRef.current.uniforms.uZenith.value
      .copy(DAWN_ZENITH)
      .lerp(DAY_ZENITH, launchDay)
      .lerp(HIGH_ZENITH, upperStrat);
    matRef.current.uniforms.uHorizon.value
      .copy(DAWN_HORIZON)
      .lerp(DAY_HORIZON, launchDay)
      .lerp(HIGH_HORIZON, upperStrat);
    matRef.current.uniforms.uOpacity.value = opacity;
  });

  return (
    <mesh ref={meshRef} renderOrder={-10}>
      <sphereGeometry args={[850, 32, 24]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.BackSide}
        vertexShader={`
          varying vec3 vLocalPos;
          void main() {
            vLocalPos = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 uZenith;
          uniform vec3 uHorizon;
          uniform float uOpacity;
          varying vec3 vLocalPos;
          void main() {
            float h = clamp(vLocalPos.y * 1.45 + 0.15, 0.0, 1.0);
            vec3 col = mix(uHorizon, uZenith, pow(h, 0.78));
            gl_FragColor = vec4(col, uOpacity);
          }
        `}
      />
    </mesh>
  );
}

/** 3D twinkling star points + NASA Deep Star Maps equirectangular skybox. */
function SpaceBackdrop({ reducedMotion }: { reducedMotion: boolean }) {
  const starTex = useTexture("/media/textures/starfield_4k.jpg");
  const skyRef = useRef<THREE.Mesh>(null);
  const pointsRef = useRef<THREE.Points>(null);

  const starPositions = useMemo(() => {
    const count = 1100;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const u = ((i * 73) % 1000) / 1000;
      const v = ((i * 197) % 1000) / 1000;
      const theta = u * Math.PI * 2;
      const phi = Math.acos(2 * v - 1);
      const r = 400 + (i % 6) * 60;
      arr[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.cos(phi);
      arr[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return arr;
  }, []);

  useFrame(({ camera, clock }) => {
    if (skyRef.current) {
      skyRef.current.position.copy(camera.position);
      const p = scrollState.current;
      const starVis = smoothstep(2.4, 5.2, p);
      const mat = skyRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.25 + starVis * 0.75;
    }
    if (pointsRef.current) {
      pointsRef.current.position.copy(camera.position);
      if (!reducedMotion) {
        pointsRef.current.rotation.y = clock.elapsedTime * 0.0035;
      }
      const p = scrollState.current;
      const pMat = pointsRef.current.material as THREE.PointsMaterial;
      pMat.opacity = 0.25 + smoothstep(2.2, 4.8, p) * 0.65;
    }
  });

  return (
    <>
      <mesh ref={skyRef} renderOrder={-20}>
        <sphereGeometry args={[1200, 48, 32]} />
        <meshBasicMaterial map={starTex} side={THREE.BackSide} transparent opacity={0.25} depthWrite={false} />
      </mesh>
      <points ref={pointsRef} renderOrder={-15}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={1.6} sizeAttenuation={false} color="#DCE6FF" transparent opacity={0.85} depthWrite={false} />
      </points>
    </>
  );
}

export function CelestialWorlds({ reducedMotion }: { reducedMotion: boolean }) {
  const [earthTex, moonTex, moonBump, marsTex] = useTexture([
    "/media/textures/earth_color_2k.jpg",
    "/media/textures/moon_color_4k.jpg",
    "/media/textures/moon_displacement_2k.png",
    "/media/textures/mars_color_4k.jpg",
  ]);

  const earthRef = useRef<THREE.Group>(null);
  const lunarSkyEarthRef = useRef<THREE.Group>(null);
  const moonRef = useRef<THREE.Group>(null);
  const marsRef = useRef<THREE.Group>(null);
  const finaleRef = useRef<THREE.Group>(null);
  const lunarApproachArcRef = useRef<THREE.Group>(null);
  const transitArcRef = useRef<THREE.Group>(null);

  // Trans-Lunar Injection -> Sea of Tranquility approach trajectory (beats 6.4 -> 8.6)
  const lunarApproachPoints = useMemo(() => {
    const apolloPos = EXHIBIT_PLINTH_ANCHORS["moon-apollo-11"].pos;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(16, 248, -52),
      new THREE.Vector3(6, 298, -124),
      new THREE.Vector3(-8, 344, -172),
      new THREE.Vector3(apolloPos[0], apolloPos[1] + 0.6, apolloPos[2]),
    ]);
    return curve.getPoints(56);
  }, []);

  // Moon -> Mars Hohmann transfer arc (beat 13)
  const transitPoints = useMemo(() => {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-4, 358, -225),
      new THREE.Vector3(24, 425, -305),
      new THREE.Vector3(-6, 475, -395),
    );
    return curve.getPoints(48);
  }, []);

  useFrame((_, delta) => {
    const p = scrollState.current;
    const spin = reducedMotion ? 0 : delta * 0.014;

    if (earthRef.current) {
      earthRef.current.visible = p > 2.3 && p < 9.2;
      earthRef.current.rotation.y += spin * 0.55;
    }
    if (lunarSkyEarthRef.current) {
      // Near-side lunar sites (Apollo 11, Surveyor 3/Apollo 12, Apollo 15, Apollo 17) see Earth in the sky; GRAIL polar site (beat 12) does not
      lunarSkyEarthRef.current.visible = p > 7.5 && p < 11.45;
      lunarSkyEarthRef.current.rotation.y += spin * 0.4;
    }
    if (moonRef.current) {
      moonRef.current.visible = p > 4.8 && p < 16.0;
      moonRef.current.rotation.y += spin * 0.35;
    }
    if (lunarApproachArcRef.current) {
      lunarApproachArcRef.current.visible = p > 6.2 && p < 8.7;
    }
    if (marsRef.current) {
      marsRef.current.visible = p > 11.2 && p < 22.8;
      marsRef.current.rotation.y += spin * 0.65;
    }
    if (transitArcRef.current) {
      transitArcRef.current.visible = p > 12.1 && p < 14.2;
    }
    if (finaleRef.current) {
      finaleRef.current.visible = p > 21.5;
    }
  });

  return (
    <>
      <SpaceBackdrop reducedMotion={reducedMotion} />
      <AscentSkyDome />

      {/* ─── 3D EARTH (Below ascent & visible during edge-of-space / deep-space) ─── */}
      <group ref={earthRef} position={WORLD_ANCHORS.earthCenter} rotation={[0.15, -1.9, 0.1]}>
        <mesh>
          <sphereGeometry args={[WORLD_ANCHORS.earthRadius, 72, 56]} />
          <meshStandardMaterial map={earthTex} roughness={0.68} metalness={0.1} />
        </mesh>
        <AtmosphereRim radius={WORLD_ANCHORS.earthRadius * 1.026} color="#6AA8FF" intensity={0.92} power={3.3} />
      </group>

      {/* ─── TRANS-LUNAR INJECTION & SEA OF TRANQUILITY DESCENT ARC (beats 6.5..8.5) ─── */}
      <group ref={lunarApproachArcRef} visible={false}>
        <Line
          points={lunarApproachPoints}
          color="#9DB8FF"
          lineWidth={1.5}
          dashed
          dashSize={1.8}
          gapSize={1.1}
          transparent
          opacity={0.55}
        />
      </group>

      {/* ─── DISTANT EARTH IN THE LUNAR SKY (Near-side Hall I sites only: beats 8..11, hidden at polar beat 12) ─── */}
      <group ref={lunarSkyEarthRef} position={[-16, 360, -236]} rotation={[0.2, -2.1, 0.1]} visible={false}>
        <mesh>
          <sphereGeometry args={[2.1, 32, 24]} />
          <meshStandardMaterial map={earthTex} roughness={0.65} metalness={0.1} />
        </mesh>
        <AtmosphereRim radius={2.1 * 1.04} color="#6AA8FF" intensity={0.85} power={3.0} />
      </group>

      {/* ─── 3D MOON (Hall I — beats 7..13) ─── */}
      <group ref={moonRef} position={WORLD_ANCHORS.moonCenter} rotation={[0.1, -1.35, 0]}>
        <mesh>
          <sphereGeometry args={[WORLD_ANCHORS.moonRadius, 72, 56]} />
          <meshStandardMaterial
            map={moonTex}
            bumpMap={moonBump}
            bumpScale={0.48}
            roughness={0.92}
            metalness={0.04}
          />
        </mesh>
        <AtmosphereRim radius={WORLD_ANCHORS.moonRadius * 1.022} color="#B9BEC8" intensity={0.32} power={4.2} />
      </group>

      {/* ─── TRANSIT TRAJECTORY ARC (Moon -> Mars, beat 13) ─── */}
      <group ref={transitArcRef} visible={false}>
        <Line
          points={transitPoints}
          color="#9DB8FF"
          lineWidth={1.5}
          dashed
          dashSize={2.4}
          gapSize={1.4}
          transparent
          opacity={0.65}
        />
      </group>

      {/* ─── 3D MARS (Hall II — beats 13..21) ─── */}
      <group ref={marsRef} position={WORLD_ANCHORS.marsCenter} rotation={[0.18, -0.7, 0.06]}>
        <mesh>
          <sphereGeometry args={[WORLD_ANCHORS.marsRadius, 72, 56]} />
          <meshStandardMaterial map={marsTex} roughness={0.86} metalness={0.05} />
        </mesh>
        <AtmosphereRim radius={WORLD_ANCHORS.marsRadius * 1.032} color="#C8603A" intensity={0.68} power={3.8} />
      </group>

      {/* ─── FINALE EARTHRISE (Moon limb + rising blue Earth, beat 23) ─── */}
      <group ref={finaleRef} visible={false}>
        <group position={WORLD_ANCHORS.finaleMoonCenter} rotation={[0.2, -1.6, 0]}>
          <mesh>
            <sphereGeometry args={[26, 56, 42]} />
            <meshStandardMaterial map={moonTex} bumpMap={moonBump} bumpScale={0.4} roughness={0.94} />
          </mesh>
        </group>
        <group position={WORLD_ANCHORS.finaleEarthCenter} rotation={[0.2, -1.2, 0.25]}>
          <mesh>
            <sphereGeometry args={[18, 56, 42]} />
            <meshStandardMaterial map={earthTex} roughness={0.68} metalness={0.1} />
          </mesh>
          <AtmosphereRim radius={18 * 1.035} color="#7EB6FF" intensity={0.95} power={3.0} />
        </group>
      </group>
    </>
  );
}
