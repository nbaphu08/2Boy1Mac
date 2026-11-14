"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { scrollState, smoothstep } from "@/lib/scroll/progress";
import { usePerfBudget } from "./perfTier";
import { getCloudLayerTexture } from "./rocketTextures";
import { EXHIBIT_PLINTH_ANCHORS, WORLD_ANCHORS, sampleTrajectory } from "./trajectory";

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

const DAWN_ZENITH = new THREE.Color("#102752");
const DAWN_MID = new THREE.Color("#2C3C68");
const DAWN_HORIZON = new THREE.Color("#B86246");
const DAWN_SUN_GLOW = new THREE.Color("#FF9E54");
const DAY_ZENITH = new THREE.Color("#0D2F6E");
const DAY_MID = new THREE.Color("#2358A6");
const DAY_HORIZON = new THREE.Color("#6AA2E0");
const HIGH_ZENITH = new THREE.Color("#040712");
const HIGH_MID = new THREE.Color("#091532");
const HIGH_HORIZON = new THREE.Color("#183568");

/** Dynamic Earth sky dome: 6:35 p.m. EDT KSC sunset dusk -> stratosphere cobalt -> orbital black. */
function AscentSkyDome() {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uZenith: { value: DAWN_ZENITH.clone() },
      uMid: { value: DAWN_MID.clone() },
      uHorizon: { value: DAWN_HORIZON.clone() },
      uSunGlow: { value: DAWN_SUN_GLOW.clone() },
      uSunDir: { value: new THREE.Vector3(-0.82, 0.11, -0.56).normalize() },
      uSunsetStrength: { value: 1 },
      uOpacity: { value: 1 },
    }),
    [],
  );

  useFrame(({ camera }) => {
    const p = scrollState.current;
    if (!meshRef.current || !matRef.current) return;
    const opacity = 1 - smoothstep(5.2, 6.4, p);
    meshRef.current.visible = opacity > 0.01;
    if (!meshRef.current.visible) return;

    meshRef.current.position.copy(camera.position);

    const launchDay = smoothstep(2.05, 3.55, p);
    const upperStrat = smoothstep(3.6, 5.5, p);

    matRef.current.uniforms.uZenith.value
      .copy(DAWN_ZENITH)
      .lerp(DAY_ZENITH, launchDay)
      .lerp(HIGH_ZENITH, upperStrat);
    matRef.current.uniforms.uMid.value
      .copy(DAWN_MID)
      .lerp(DAY_MID, launchDay)
      .lerp(HIGH_MID, upperStrat);
    matRef.current.uniforms.uHorizon.value
      .copy(DAWN_HORIZON)
      .lerp(DAY_HORIZON, launchDay)
      .lerp(HIGH_HORIZON, upperStrat);
    matRef.current.uniforms.uSunsetStrength.value = 1 - smoothstep(1.9, 3.6, p);
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
          uniform vec3 uMid;
          uniform vec3 uHorizon;
          uniform vec3 uSunGlow;
          uniform vec3 uSunDir;
          uniform float uSunsetStrength;
          uniform float uOpacity;
          varying vec3 vLocalPos;
          void main() {
            vec3 dir = normalize(vLocalPos);
            float h = clamp(dir.y, -0.25, 1.0);
            float skyT = clamp((h + 0.04) / 0.85, 0.0, 1.0);

            vec3 lowMix = mix(uHorizon, uMid, smoothstep(0.0, 0.28, skyT));
            vec3 col = mix(lowMix, uZenith, smoothstep(0.22, 0.92, skyT));

            // Western sunset horizon azimuth glow (6:35 p.m. EDT)
            float sunDot = max(dot(dir, uSunDir), 0.0);
            float horizonBand = exp(-abs(dir.y - 0.04) * 6.5);
            float sunsetArc = (pow(sunDot, 2.2) * 0.65 + pow(sunDot, 12.0) * 0.55) * horizonBand;
            col += uSunGlow * sunsetArc * uSunsetStrength * 1.15;

            // Darken cleanly below the sea/land horizon
            float groundFade = smoothstep(-0.18, 0.01, dir.y);
            col = mix(uZenith * 0.35, col, groundFade);

            gl_FragColor = vec4(col, uOpacity);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `}
      />
    </mesh>
  );
}

/**
 * Ascent visual context (beats 2..5): Florida Space Coast shoreline + two parallax cloud decks
 * dropping away below the vehicle before giving way to space black & curved Earth in beat 6.
 */
function AscentCoastAndCloudDeck() {
  const groupRef = useRef<THREE.Group>(null);
  const coastMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const oceanMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const cloudLowMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const cloudHighMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const cloudTex = useMemo(() => getCloudLayerTexture(), []);

  useFrame(() => {
    const p = scrollState.current;
    if (!groupRef.current) return;
    const active = p >= 1.5 && p <= 6.2;
    groupRef.current.visible = active;
    if (!active) return;

    // Fade in once camera pitches up around liftoff / ascent-1, fade out before Earth limb beat 6
    const fadeIn = smoothstep(1.75, 2.55, p);
    const fadeOut = 1 - smoothstep(4.85, 6.0, p);
    const vis = fadeIn * fadeOut;

    const duskTint = 1 - smoothstep(2.1, 3.6, p);
    if (coastMatRef.current) {
      coastMatRef.current.opacity = vis * 0.9;
    }
    if (oceanMatRef.current) {
      oceanMatRef.current.opacity = vis * 0.94;
    }
    if (cloudLowMatRef.current) {
      const cFade = fadeIn * (1 - smoothstep(4.1, 5.2, p));
      cloudLowMatRef.current.opacity = cFade * 0.85;
      cloudLowMatRef.current.color.setRGB(
        0.92 + duskTint * 0.08,
        0.93 - duskTint * 0.14,
        0.98 - duskTint * 0.25,
      );
    }
    if (cloudHighMatRef.current) {
      const c2Fade = smoothstep(2.5, 3.3, p) * (1 - smoothstep(4.9, 5.95, p));
      cloudHighMatRef.current.opacity = c2Fade * 0.72;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Atlantic ocean expanse far below the ascent corridor */}
      <mesh position={[12, -24, -40]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-6}>
        <circleGeometry args={[620, 48]} />
        <meshStandardMaterial
          ref={oceanMatRef}
          color="#0F2A54"
          roughness={0.34}
          metalness={0.22}
          transparent
          opacity={0.9}
        />
      </mesh>
      {/* Florida Space Coast & Banana River coastal shelf silhouette */}
      <mesh position={[-42, -23.4, -36]} rotation={[-Math.PI / 2, 0, -0.32]} renderOrder={-5}>
        <circleGeometry args={[145, 36]} />
        <meshBasicMaterial ref={coastMatRef} color="#17242A" transparent opacity={0.9} />
      </mesh>
      {/* Lower cumulus deck (~y=28): drops away quickly during ascent-1 */}
      <mesh position={[2, 28, -14]} rotation={[-Math.PI / 2, 0, 0.24]} renderOrder={-3}>
        <planeGeometry args={[280, 280]} />
        <meshBasicMaterial
          ref={cloudLowMatRef}
          map={cloudTex}
          color="#EBF1FA"
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* High cirrus / anvil deck (~y=78): drops away during ascent-2 & ascent-3 */}
      <mesh position={[8, 78, -28]} rotation={[-Math.PI / 2, 0, -0.58]} renderOrder={-3}>
        <planeGeometry args={[360, 360]} />
        <meshBasicMaterial
          ref={cloudHighMatRef}
          map={cloudTex}
          color="#DCE8FC"
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

const MARS_ZENITH_NORMAL = new THREE.Color("#4A2618");
const MARS_HORIZON_NORMAL = new THREE.Color("#C98659");
const MARS_NADIR_NORMAL = new THREE.Color("#26120B");
const MARS_ZENITH_STORM = new THREE.Color("#281009");
const MARS_HORIZON_STORM = new THREE.Color("#7E361E");

/**
 * Martian daytime butterscotch/tan sky dome for Hall II surface beats (14–20).
 * Darkens into a reddish-brown dust storm mood on Opportunity (beat 17, AG-2b #2).
 */
function MarsDaytimeSkyDome() {
  const domeRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uZenith: { value: new THREE.Color("#4A2618") },
      uHorizon: { value: new THREE.Color("#C98659") },
      uNadir: { value: new THREE.Color("#26120B") },
      uOpacity: { value: 0.0 },
    }),
    [],
  );

  useFrame(({ camera }) => {
    const p = scrollState.current;
    const vis = smoothstep(13.35, 13.85, p) * (1 - smoothstep(20.15, 20.65, p));
    if (!domeRef.current || !matRef.current) return;
    domeRef.current.visible = vis > 0.01;
    if (!domeRef.current.visible) return;

    domeRef.current.position.copy(camera.position);

    // Opportunity (beat 17) global dust storm darkening
    const storm = smoothstep(16.25, 16.75, p) * (1 - smoothstep(17.25, 17.75, p));
    matRef.current.uniforms.uZenith.value.copy(MARS_ZENITH_NORMAL).lerp(MARS_ZENITH_STORM, storm);
    matRef.current.uniforms.uHorizon.value.copy(MARS_HORIZON_NORMAL).lerp(MARS_HORIZON_STORM, storm);
    matRef.current.uniforms.uNadir.value.copy(MARS_NADIR_NORMAL);
    matRef.current.uniforms.uOpacity.value = vis;
  });

  return (
    <mesh ref={domeRef} renderOrder={-12} visible={false}>
      <sphereGeometry args={[850, 32, 24]} />
      <shaderMaterial
        ref={matRef}
        side={THREE.BackSide}
        transparent
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={`
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 uZenith;
          uniform vec3 uHorizon;
          uniform vec3 uNadir;
          uniform float uOpacity;
          varying vec3 vDir;
          void main() {
            float y = vDir.y;
            vec3 upper = mix(uHorizon, uZenith, clamp(pow(max(0.0, y + 0.12), 0.75), 0.0, 1.0));
            vec3 col = y >= -0.12 ? upper : mix(uHorizon, uNadir, clamp((-y - 0.12) * 2.5, 0.0, 1.0));
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
  const budget = usePerfBudget();
  const count = budget.starCount;
  const skyRef = useRef<THREE.Mesh>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const elapsedRef = useRef(0);

  const starPositions = useMemo(() => {
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
  }, [count]);

  useFrame(({ camera }, delta) => {
    const p = scrollState.current;
    // Hide stars during Martian daytime surface beats 14–20 (AG-2b #2)
    const marsDayMask = 1 - smoothstep(13.35, 13.8, p) * (1 - smoothstep(20.2, 20.65, p));

    if (skyRef.current) {
      skyRef.current.position.copy(camera.position);
      const starVis = smoothstep(3.2, 5.4, p);
      const mat = skyRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = (0.04 + starVis * 0.96) * marsDayMask;
      skyRef.current.visible = mat.opacity > 0.01;
    }
    if (pointsRef.current) {
      pointsRef.current.position.copy(camera.position);
      if (!reducedMotion) {
        elapsedRef.current += Math.min(delta, 0.05);
        pointsRef.current.rotation.y = elapsedRef.current * 0.0035;
      }
      const pMat = pointsRef.current.material as THREE.PointsMaterial;
      pMat.opacity = (0.05 + smoothstep(3.0, 5.2, p) * 0.85) * marsDayMask;
      pointsRef.current.visible = pMat.opacity > 0.01;
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
  const finaleEarthGroupRef = useRef<THREE.Group>(null);
  const finaleMoonGroupRef = useRef<THREE.Group>(null);
  const lunarApproachArcRef = useRef<THREE.Group>(null);
  const transitArcRef = useRef<THREE.Group>(null);
  const transitCruiseDotRef = useRef<THREE.Group>(null);

  const trajTmp = useMemo(
    () => ({
      camPos: new THREE.Vector3(),
      camLook: new THREE.Vector3(),
      rocketPos: new THREE.Vector3(),
      rocketRot: new THREE.Euler(),
      rocketScale: 1,
    }),
    [],
  );

  // Trans-Lunar Injection -> Sea of Tranquility approach trajectory (beats 6.4 -> 8.6)
  const lunarApproachPoints = useMemo(() => {
    const apolloPos = EXHIBIT_PLINTH_ANCHORS["moon-apollo-11"].pos;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(16, 248, -52),
      new THREE.Vector3(6, 298, -124),
      new THREE.Vector3(-4, 326, -158),
      new THREE.Vector3(apolloPos[0], apolloPos[1] + 0.6, apolloPos[2]),
    ]);
    return curve.getPoints(56);
  }, []);

  // Moon -> Mars Hohmann transfer arc + 7 mission tick markers (1976..2021, beat 13, AG-5)
  const { transitCurve, transitPoints, transitTicks } = useMemo(() => {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-4, 372, -196),
      new THREE.Vector3(24, 425, -295),
      new THREE.Vector3(4, 472, -366),
    );
    const pts = curve.getPoints(48);
    // 7 tick markers along the transfer arc corresponding to the 7 Hall II Mars landings (1976..2021)
    const tickFractions = [0.14, 0.26, 0.38, 0.5, 0.62, 0.74, 0.86];
    const ticks = tickFractions.map((u) => {
      const pos = curve.getPoint(u);
      const tan = curve.getTangent(u).normalize();
      const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan);
      const euler = new THREE.Euler().setFromQuaternion(quat);
      return {
        u,
        pos: [pos.x, pos.y, pos.z] as [number, number, number],
        rot: [euler.x, euler.y, euler.z] as [number, number, number],
      };
    });
    return { transitCurve: curve, transitPoints: pts, transitTicks: ticks };
  }, []);

  useFrame((_, delta) => {
    const p = scrollState.current;
    const spin = reducedMotion ? 0 : delta * 0.014;

    if (earthRef.current) {
      // AG-8 / AG-5: Bring curved blue Earth limb smoothly into view in upper ascent (beat 6),
      // then shrink and recede behind Orion during Trans-Lunar Injection (beats 6->7).
      const enterVis = smoothstep(3.3, 4.35, p);
      const ascentLift = smoothstep(3.4, 6.0, p);
      const tliRecede = smoothstep(6.05, 7.65, p);
      const fadeOut = 1 - smoothstep(7.45, 7.88, p);
      const earthVis = enterVis * fadeOut;
      earthRef.current.visible = earthVis > 0.01;
      if (earthRef.current.visible) {
        const ascentScale = 1 + ascentLift * 0.24;
        const shrinkScale = ascentScale * (1 - tliRecede * 0.86) * Math.min(1, fadeOut * 1.35);
        earthRef.current.scale.setScalar(Math.max(0.08, shrinkScale));
        earthRef.current.position.set(
          WORLD_ANCHORS.earthCenter[0] + ascentLift * 10 - tliRecede * 24,
          WORLD_ANCHORS.earthCenter[1] + ascentLift * 94 + tliRecede * 145,
          WORLD_ANCHORS.earthCenter[2] - ascentLift * 124 - tliRecede * 15,
        );
        earthRef.current.rotation.y += spin * 0.55;
      }
    }

    if (lunarSkyEarthRef.current) {
      // Near-side lunar sites (beats 8..11: Apollo 11, Surveyor 3, Apollo 15, Apollo 17) see Earth hanging in the black lunar sky;
      // GRAIL polar impact site (beat 12) does not (AG-1b #2).
      const skyVis = smoothstep(7.45, 7.8, p) * (1 - smoothstep(11.2, 11.55, p));
      lunarSkyEarthRef.current.visible = skyVis > 0.02;
      if (lunarSkyEarthRef.current.visible) {
        sampleTrajectory(p, trajTmp);
        lunarSkyEarthRef.current.position.set(
          trajTmp.camLook.x - 11.8,
          trajTmp.camLook.y + 1.4,
          trajTmp.camLook.z - 15.0,
        );
        lunarSkyEarthRef.current.scale.setScalar(skyVis);
        lunarSkyEarthRef.current.rotation.y += spin * 0.4;
      }
    }

    if (moonRef.current) {
      // Visible during orbital approach (beat 7) and departure (beat 13), hidden during ascent (<= 6.3) and on the lunar surface (beats 8..12)
      const approachVis = smoothstep(6.35, 7.05, p) * (1 - smoothstep(7.2, 7.62, p));
      const departVis = smoothstep(12.38, 12.75, p) * (1 - smoothstep(13.8, 15.0, p));
      const moonVis = Math.max(approachVis, departVis);
      moonRef.current.visible = moonVis > 0.02;
      if (moonRef.current.visible) {
        moonRef.current.scale.setScalar(0.35 + 0.65 * moonVis);
        moonRef.current.rotation.y += spin * 0.35;
      }
    }

    if (lunarApproachArcRef.current) {
      lunarApproachArcRef.current.visible = p > 6.2 && p < 7.75;
    }

    if (marsRef.current) {
      // Visible during Mars orbital approach (beat 13) and departure (beat 21), hidden while on the Martian surface dioramas (beats 14..20)
      const approachVis = smoothstep(11.5, 12.6, p) * (1 - smoothstep(13.25, 13.68, p));
      const departVis = smoothstep(20.35, 20.75, p) * (1 - smoothstep(21.6, 22.4, p));
      const marsVis = Math.max(approachVis, departVis);
      marsRef.current.visible = marsVis > 0.02;
      if (marsRef.current.visible) {
        marsRef.current.scale.setScalar(0.35 + 0.65 * marsVis);
        marsRef.current.rotation.y += spin * 0.65;
      }
    }

    if (transitArcRef.current) {
      transitArcRef.current.visible = p > 12.15 && p < 13.82;
      if (transitArcRef.current.visible && transitCruiseDotRef.current) {
        const cruiseU = Math.min(0.96, Math.max(0.04, smoothstep(12.25, 13.68, p)));
        const pt = transitCurve.getPoint(cruiseU);
        transitCruiseDotRef.current.position.copy(pt);
      }
    }
    if (finaleRef.current) {
      const finaleVis = smoothstep(22.15, 22.65, p);
      finaleRef.current.visible = finaleVis > 0.01;
      if (finaleRef.current.visible) {
        const riseT = smoothstep(22.2, 23.0, p);
        if (finaleEarthGroupRef.current) {
          // Earth slowly rises over the cratered lunar limb as the visitor arrives at Beat 23
          finaleEarthGroupRef.current.position.set(
            WORLD_ANCHORS.finaleEarthCenter[0],
            WORLD_ANCHORS.finaleEarthCenter[1] - (1 - riseT) * 9.5,
            WORLD_ANCHORS.finaleEarthCenter[2],
          );
          finaleEarthGroupRef.current.rotation.y += spin * 0.45;
        }
        if (finaleMoonGroupRef.current) {
          finaleMoonGroupRef.current.rotation.y += spin * 0.12;
        }
      }
    }
  });

  return (
    <>
      <SpaceBackdrop reducedMotion={reducedMotion} />
      <AscentSkyDome />
      <AscentCoastAndCloudDeck />
      <MarsDaytimeSkyDome />

      {/* ─── 3D EARTH (Below ascent & visible during edge-of-space / deep-space) ─── */}
      <group ref={earthRef} position={WORLD_ANCHORS.earthCenter} rotation={[0.15, -1.9, 0.1]}>
        <mesh>
          <sphereGeometry args={[WORLD_ANCHORS.earthRadius, 72, 56]} />
          <meshStandardMaterial map={earthTex} roughness={0.68} metalness={0.1} />
        </mesh>
        <AtmosphereRim radius={WORLD_ANCHORS.earthRadius * 1.026} color="#6AA8FF" intensity={0.92} power={3.3} />
      </group>

      {/* ─── TRANS-LUNAR INJECTION & SEA OF TRANQUILITY DESCENT ARC (beats 6.5..7.7) ─── */}
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
      <group ref={lunarSkyEarthRef} rotation={[0.2, -2.1, 0.1]} visible={false}>
        <mesh>
          <sphereGeometry args={[1.35, 32, 24]} />
          <meshStandardMaterial
            map={earthTex}
            emissiveMap={earthTex}
            emissive="#7EB0FF"
            emissiveIntensity={0.62}
            roughness={0.6}
            metalness={0.1}
          />
        </mesh>
        <AtmosphereRim radius={1.35 * 1.055} color="#6AA8FF" intensity={0.95} power={2.8} />
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

      {/* ─── TRANSIT TRAJECTORY ARC + 7 MISSION TICK MARKERS (Moon -> Mars, beat 13, AG-5) ─── */}
      <group ref={transitArcRef} visible={false}>
        <Line
          points={transitPoints}
          color="#9DB8FF"
          lineWidth={1.6}
          dashed
          dashSize={2.2}
          gapSize={1.2}
          transparent
          opacity={0.68}
        />
        {/* 7 subtle orbital tick markers along the Moon->Mars arc (1976..2021) */}
        {transitTicks.map((tick, idx) => (
          <group key={idx} position={tick.pos} rotation={tick.rot}>
            <mesh>
              <ringGeometry args={[0.52, 0.68, 24]} />
              <meshBasicMaterial
                color={idx >= 4 ? "#C8603A" : "#9DB8FF"}
                transparent
                opacity={0.72}
                side={THREE.DoubleSide}
              />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.18, 12, 10]} />
              <meshBasicMaterial color="#DCE6FF" transparent opacity={0.9} />
            </mesh>
          </group>
        ))}
        {/* Live interplanetary cruise position pulse gliding along the transfer arc */}
        <group ref={transitCruiseDotRef}>
          <mesh>
            <sphereGeometry args={[0.34, 16, 12]} />
            <meshBasicMaterial color="#9DB8FF" toneMapped={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.95, 16, 12]} />
            <meshBasicMaterial
              color="#9DB8FF"
              transparent
              opacity={0.38}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      </group>

      {/* ─── 3D MARS (Hall II — beats 13..21) ─── */}
      <group ref={marsRef} position={WORLD_ANCHORS.marsCenter} rotation={[0.18, -0.7, 0.06]}>
        <mesh>
          <sphereGeometry args={[WORLD_ANCHORS.marsRadius, 72, 56]} />
          <meshStandardMaterial map={marsTex} roughness={0.86} metalness={0.05} />
        </mesh>
        <AtmosphereRim radius={WORLD_ANCHORS.marsRadius * 1.032} color="#C8603A" intensity={0.68} power={3.8} />
      </group>

      {/* ─── FINALE EARTHRISE (Artemis Era Earthrise: cratered Moon limb + rising blue Earth, beat 23) ─── */}
      <group ref={finaleRef} visible={false}>
        {/* Grazing solar key light across the lunar horizon limb & rising Earth */}
        <directionalLight position={[-45, 595, -590]} intensity={3.2} color="#FFF5E4" />
        <pointLight position={[-18, 575, -610]} intensity={140} distance={160} color="#88B8FF" />

        {/* Foreground Lunar Limb sweeping across the lower-right horizon */}
        <group ref={finaleMoonGroupRef} position={[8, 535.5, -566]} rotation={[0.25, -1.55, 0.12]}>
          <mesh>
            <sphereGeometry args={[28.5, 72, 56]} />
            <meshStandardMaterial
              map={moonTex}
              bumpMap={moonBump}
              bumpScale={0.62}
              roughness={0.93}
              metalness={0.04}
            />
          </mesh>
          <AtmosphereRim radius={28.5 * 1.015} color="#C7CDD8" intensity={0.28} power={4.8} />
        </group>

        {/* Luminous Blue Earth rising above the lunar horizon */}
        <group
          ref={finaleEarthGroupRef}
          position={WORLD_ANCHORS.finaleEarthCenter}
          rotation={[0.18, -1.25, 0.22]}
        >
          <mesh>
            <sphereGeometry args={[18.5, 72, 56]} />
            <meshStandardMaterial
              map={earthTex}
              emissiveMap={earthTex}
              emissive="#4A84E8"
              emissiveIntensity={0.44}
              roughness={0.62}
              metalness={0.12}
            />
          </mesh>
          <AtmosphereRim radius={18.5 * 1.04} color="#7EB6FF" intensity={1.15} power={2.8} />
        </group>
      </group>
    </>
  );
}
