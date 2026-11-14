"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { scrollState, smoothstep } from "@/lib/scroll/progress";
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
    const p = scrollState.current;
    // Hide stars during Martian daytime surface beats 14–20 (AG-2b #2)
    const marsDayMask = 1 - smoothstep(13.35, 13.8, p) * (1 - smoothstep(20.2, 20.65, p));

    if (skyRef.current) {
      skyRef.current.position.copy(camera.position);
      const starVis = smoothstep(2.4, 5.2, p);
      const mat = skyRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = (0.25 + starVis * 0.75) * marsDayMask;
      skyRef.current.visible = mat.opacity > 0.01;
    }
    if (pointsRef.current) {
      pointsRef.current.position.copy(camera.position);
      if (!reducedMotion) {
        pointsRef.current.rotation.y = clock.elapsedTime * 0.0035;
      }
      const pMat = pointsRef.current.material as THREE.PointsMaterial;
      pMat.opacity = (0.25 + smoothstep(2.2, 4.8, p) * 0.65) * marsDayMask;
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
      // AG-5 (6->7): Smoothly shrink and recede Earth behind the spacecraft during Trans-Lunar Injection — no hard cuts
      const enterVis = smoothstep(2.2, 2.8, p);
      const tliRecede = smoothstep(5.85, 7.65, p);
      const fadeOut = 1 - smoothstep(7.45, 7.88, p);
      const earthVis = enterVis * fadeOut;
      earthRef.current.visible = earthVis > 0.01;
      if (earthRef.current.visible) {
        const shrinkScale = (1 - tliRecede * 0.84) * Math.min(1, fadeOut * 1.35);
        earthRef.current.scale.setScalar(Math.max(0.08, shrinkScale));
        earthRef.current.position.set(
          WORLD_ANCHORS.earthCenter[0] - tliRecede * 14,
          WORLD_ANCHORS.earthCenter[1] + tliRecede * 240,
          WORLD_ANCHORS.earthCenter[2] - tliRecede * 135,
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
      // Visible during orbital approach (beat 7) and departure (beat 13), hidden while on the lunar surface (beats 8..12) so the sky is black with stars (AG-1b #2)
      const approachVis = smoothstep(4.8, 5.8, p) * (1 - smoothstep(7.2, 7.62, p));
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
