"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState, smoothstep } from "@/lib/scroll/progress";
import { WORLD_ANCHORS } from "./trajectory";

const TOWER_BAYS = [0.6, 1.9, 3.2, 4.5, 5.8, 7.1, 8.4, 9.7, 11.0, 12.3];
const MAST_COORDS: [number, number][] = [
  [-12.5, -10.5],
  [12.5, -10.5],
  [0, 14.5],
];

const FLOODLIGHT_BEAMS: { pos: [number, number, number]; rot: [number, number, number]; color: string }[] = [
  { pos: [7.5, 0.4, 7.5], rot: [-0.55, 0.58, 0.35], color: "#DCE6FF" },
  { pos: [-7.8, 0.4, 7.8], rot: [-0.55, -0.58, -0.35], color: "#9DB8FF" },
  { pos: [8.2, 0.4, -6.8], rot: [0.52, -0.62, 0.35], color: "#DCE6FF" },
  { pos: [-8.2, 0.4, -6.8], rot: [0.52, 0.62, -0.35], color: "#9DB8FF" },
];

export function LaunchComplex() {
  const groupRef = useRef<THREE.Group>(null);
  const crewArmRef = useRef<THREE.Group>(null);
  const osmArmRef = useRef<THREE.Group>(null);
  const icpsArmRef = useRef<THREE.Group>(null);
  const intertankArmRef = useRef<THREE.Group>(null);
  const beaconRefs = useRef<(THREE.Mesh | null)[]>([]);

  // Procedural steel deck plate bump texture
  const deckBump = useMemo(() => {
    const S = 256;
    const canvas = document.createElement("canvas");
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, S, S);
    ctx.strokeStyle = "#484848";
    ctx.lineWidth = 2;
    for (let i = 0; i < S; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, S);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(S, i);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 6);
    return tex;
  }, []);

  useFrame(({ clock }) => {
    const p = scrollState.current;
    if (groupRef.current) {
      groupRef.current.visible = p < 4.4;
    }
    if (p >= 4.4) return;

    // Swing arms retract smoothly before T-0 (progress 1.4 -> 1.92)
    const retract = smoothstep(1.4, 1.92, p);
    if (crewArmRef.current) crewArmRef.current.rotation.y = retract * 1.18;
    if (osmArmRef.current) osmArmRef.current.rotation.y = retract * 0.95;
    if (icpsArmRef.current) icpsArmRef.current.rotation.y = retract * 1.05;
    if (intertankArmRef.current) intertankArmRef.current.rotation.y = retract * 0.88;

    // Subtle aviation beacon pulse on lightning towers
    const pulse = 0.55 + 0.45 * Math.sin(clock.elapsedTime * 3.2);
    beaconRefs.current.forEach((b) => {
      if (b) {
        const mat = b.material as THREE.MeshBasicMaterial;
        mat.opacity = pulse;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {/* ─── LC-39B PAD APRON, CRAWLERWAY & FLAME TRENCH ─── */}
      <group position={WORLD_ANCHORS.pad}>
        {/* Octagonal concrete pad perimeter apron */}
        <mesh position={[0, -0.95, 0]}>
          <cylinderGeometry args={[52, 60, 1.3, 48]} />
          <meshStandardMaterial
            color="#0B101A"
            bumpMap={deckBump}
            bumpScale={0.04}
            roughness={0.88}
            metalness={0.14}
          />
        </mesh>

        {/* Dual Crawlerway tracks leading toward VAB */}
        {[-2.4, 2.4].map((tx) => (
          <mesh key={tx} position={[tx - 8, -0.28, -22]} rotation={[0, 0.52, 0]}>
            <boxGeometry args={[2.6, 0.08, 42]} />
            <meshStandardMaterial color="#171E2E" roughness={0.92} metalness={0.08} />
          </mesh>
        ))}

        {/* Concrete Flame Trench Walls & Angled Flame Deflector Wedge */}
        <mesh position={[-3.8, -0.1, 0]}>
          <boxGeometry args={[2.2, 0.9, 14]} />
          <meshStandardMaterial color="#1D2536" roughness={0.82} metalness={0.2} />
        </mesh>
        <mesh position={[3.8, -0.1, 0]}>
          <boxGeometry args={[2.2, 0.9, 14]} />
          <meshStandardMaterial color="#1D2536" roughness={0.82} metalness={0.2} />
        </mesh>
        {/* Angled steel/refractory flame deflector under the rocket nozzles */}
        <mesh position={[0, -0.22, 0]} rotation={[0.45, 0, 0]}>
          <boxGeometry args={[4.8, 0.65, 3.6]} />
          <meshStandardMaterial color="#2E3648" roughness={0.65} metalness={0.45} />
        </mesh>

        {/* ─── MOBILE LAUNCHER PLATFORM (MLP) TWO-STORY DECK ─── */}
        <group position={[0, 0.18, 0]}>
          {/* Main steel deck platform */}
          <mesh position={[-0.8, 0, 0]}>
            <boxGeometry args={[8.6, 0.42, 9.4]} />
            <meshStandardMaterial
              color="#2A3346"
              bumpMap={deckBump}
              bumpScale={0.025}
              roughness={0.52}
              metalness={0.62}
            />
          </mesh>
          {/* 6 Mount Pedestals supporting the MLP */}
          {[
            [-3.8, -3.6],
            [2.4, -3.6],
            [-3.8, 0],
            [2.4, 0],
            [-3.8, 3.6],
            [2.4, 3.6],
          ].map(([px, pz], pi) => (
            <mesh key={pi} position={[px, -0.42, pz]}>
              <cylinderGeometry args={[0.24, 0.28, 0.65, 12]} />
              <meshStandardMaterial color="#3E485E" roughness={0.48} metalness={0.7} />
            </mesh>
          ))}

          {/* Blast deck coaming ring & SRB hold-down posts */}
          <mesh position={[0, 0.24, 0]}>
            <boxGeometry args={[3.4, 0.14, 3.2]} />
            <meshStandardMaterial color="#19202E" roughness={0.65} metalness={0.5} />
          </mesh>

          {/* 2 Tail Service Masts (TSMs) flanking the Core Stage aft section */}
          {[-1, 1].map((side) => (
            <group key={side} position={[side * 1.62, 0.55, 0.55]}>
              <mesh>
                <boxGeometry args={[0.46, 0.88, 0.68]} />
                <meshStandardMaterial color="#D4DBE8" roughness={0.38} metalness={0.45} />
              </mesh>
              {/* Cryogenic umbilical shroud */}
              <mesh position={[-side * 0.28, 0.12, -0.18]} rotation={[0, 0, side * 0.35]}>
                <cylinderGeometry args={[0.09, 0.12, 0.55, 12]} />
                <meshStandardMaterial color="#7C879E" roughness={0.35} metalness={0.75} />
              </mesh>
            </group>
          ))}
        </group>

        {/* ─── MOBILE LAUNCHER UMBILICAL TOWER (ML-1, x = -3.45) ─── */}
        <group position={[-3.45, 0.38, 0]}>
          {/* 4 Heavy Corner Steel H-Columns */}
          {[
            [-0.92, -0.92],
            [0.92, -0.92],
            [-0.92, 0.92],
            [0.92, 0.92],
          ].map(([cx, cz], i) => (
            <mesh key={i} position={[cx, 6.85, cz]}>
              <boxGeometry args={[0.16, 13.7, 0.16]} />
              <meshStandardMaterial color="#68738A" roughness={0.42} metalness={0.72} />
            </mesh>
          ))}

          {/* Central Elevator & Utility Core Shaft */}
          <mesh position={[-0.18, 6.8, 0]}>
            <boxGeometry args={[0.72, 13.5, 0.78]} />
            <meshStandardMaterial color="#273042" roughness={0.55} metalness={0.58} />
          </mesh>

          {/* 10 Structural Bay Decks + Diagonal X-Bracing Trusses on All 4 Faces */}
          {TOWER_BAYS.map((by, idx) => (
            <group key={idx} position={[0, by, 0]}>
              {/* Floor deck grating */}
              <mesh>
                <boxGeometry args={[1.96, 0.1, 1.96]} />
                <meshStandardMaterial color="#4B556B" roughness={0.5} metalness={0.65} />
              </mesh>
              {/* Safety perimeter handrail */}
              <mesh position={[0, 0.18, 0]}>
                <boxGeometry args={[2.0, 0.03, 2.0]} />
                <meshStandardMaterial color="#8A95AB" roughness={0.4} metalness={0.7} />
              </mesh>

              {/* Diagonal truss braces on +Z and -Z faces */}
              {[-0.92, 0.92].map((fz) => (
                <group key={fz} position={[0, 0.65, fz]}>
                  <mesh rotation={[0, 0, 0.62]}>
                    <boxGeometry args={[0.055, 2.25, 0.055]} />
                    <meshStandardMaterial color="#58637A" roughness={0.45} metalness={0.68} />
                  </mesh>
                  <mesh rotation={[0, 0, -0.62]}>
                    <boxGeometry args={[0.055, 2.25, 0.055]} />
                    <meshStandardMaterial color="#58637A" roughness={0.45} metalness={0.68} />
                  </mesh>
                </group>
              ))}

              {/* Diagonal truss braces on +X and -X faces */}
              {[-0.92, 0.92].map((fx) => (
                <group key={fx} position={[fx, 0.65, 0]}>
                  <mesh rotation={[0.62, 0, 0]}>
                    <boxGeometry args={[0.055, 2.25, 0.055]} />
                    <meshStandardMaterial color="#58637A" roughness={0.45} metalness={0.68} />
                  </mesh>
                  <mesh rotation={[-0.62, 0, 0]}>
                    <boxGeometry args={[0.055, 2.25, 0.055]} />
                    <meshStandardMaterial color="#58637A" roughness={0.45} metalness={0.68} />
                  </mesh>
                </group>
              ))}
            </group>
          ))}

          {/* Tower Crown Platform + Hammerhead Jib Crane + Upper Fiberglass Mast */}
          <mesh position={[0, 13.75, 0]}>
            <boxGeometry args={[2.25, 0.32, 2.25]} />
            <meshStandardMaterial color="#78839B" roughness={0.4} metalness={0.7} />
          </mesh>
          <mesh position={[0.95, 14.22, 0]} rotation={[0, 0, -0.08]}>
            <boxGeometry args={[2.8, 0.18, 0.32]} />
            <meshStandardMaterial color="#C8603A" roughness={0.45} metalness={0.5} />
          </mesh>
          <mesh position={[-0.3, 14.95, 0]}>
            <cylinderGeometry args={[0.04, 0.11, 2.1, 12]} />
            <meshStandardMaterial color="#EAEFF7" roughness={0.35} metalness={0.3} />
          </mesh>

          {/* 1. Crew Access Arm (CAA) + White Room Cab (Orion Crew Module level y = 11.15) */}
          <group ref={crewArmRef} position={[0.92, 11.15, 0.15]}>
            {/* Enclosed walkway truss */}
            <mesh position={[1.08, 0, 0]}>
              <boxGeometry args={[2.15, 0.34, 0.38]} />
              <meshStandardMaterial color="#E2E7F0" roughness={0.38} metalness={0.4} />
            </mesh>
            {/* White Room environmental seal cab */}
            <mesh position={[2.22, 0.02, -0.08]}>
              <boxGeometry args={[0.42, 0.48, 0.52]} />
              <meshStandardMaterial color="#F2F5FA" roughness={0.32} metalness={0.3} />
            </mesh>
          </group>

          {/* 2. Orion Service Module Umbilical Arm (OSMU, y = 10.1) */}
          <group ref={osmArmRef} position={[0.92, 10.1, -0.18]}>
            <mesh position={[0.98, 0, 0]}>
              <boxGeometry args={[1.95, 0.18, 0.24]} />
              <meshStandardMaterial color="#8A95AA" roughness={0.42} metalness={0.65} />
            </mesh>
          </group>

          {/* 3. ICPS Cryogenic Umbilical Arm (y = 9.15) */}
          <group ref={icpsArmRef} position={[0.92, 9.15, 0.12]}>
            <mesh position={[0.96, 0, 0]}>
              <boxGeometry args={[1.92, 0.2, 0.26]} />
              <meshStandardMaterial color="#7C879C" roughness={0.45} metalness={0.65} />
            </mesh>
          </group>

          {/* 4. Core Stage Intertank & Forward Skirt Umbilicals (y = 6.1 & 7.6) */}
          <group ref={intertankArmRef} position={[0.92, 6.1, -0.1]}>
            <mesh position={[0.92, 0, 0]}>
              <boxGeometry args={[1.85, 0.22, 0.28]} />
              <meshStandardMaterial color="#6D788E" roughness={0.48} metalness={0.68} />
            </mesh>
            <mesh position={[0.92, 1.5, 0.15]}>
              <boxGeometry args={[1.82, 0.16, 0.2]} />
              <meshStandardMaterial color="#7E89A0" roughness={0.45} metalness={0.65} />
            </mesh>
          </group>
        </group>

        {/* ─── SOUND SUPPRESSION WATER TOWER & DELUGE PIPING (x = 9.5, z = -7.5) ─── */}
        <group position={[9.5, 0, -7.5]}>
          {/* Elevated spherical/conical water tank */}
          <mesh position={[0, 7.6, 0]}>
            <sphereGeometry args={[1.45, 24, 20]} />
            <meshStandardMaterial color="#DCE2EE" roughness={0.38} metalness={0.45} />
          </mesh>
          {/* Central riser column */}
          <mesh position={[0, 3.8, 0]}>
            <cylinderGeometry args={[0.38, 0.48, 7.2, 16]} />
            <meshStandardMaterial color="#B8C2D4" roughness={0.45} metalness={0.55} />
          </mesh>
          {/* 6 perimeter legs */}
          {[0, 1, 2, 3, 4, 5].map((li) => {
            const a = (li * Math.PI) / 3;
            return (
              <mesh
                key={li}
                position={[Math.cos(a) * 1.15, 3.6, Math.sin(a) * 1.15]}
                rotation={[-Math.sin(a) * 0.08, 0, Math.cos(a) * 0.08]}
              >
                <cylinderGeometry args={[0.07, 0.09, 7.3, 8]} />
                <meshStandardMaterial color="#8E99AE" roughness={0.5} metalness={0.6} />
              </mesh>
            );
          })}
          {/* Main water deluge supply pipe leading to MLP */}
          <mesh position={[-4.5, 0.32, 3.6]} rotation={[0, 0.65, Math.PI / 2]}>
            <cylinderGeometry args={[0.18, 0.18, 10.5, 12]} />
            <meshStandardMaterial color="#6F7A90" roughness={0.45} metalness={0.65} />
          </mesh>
        </group>

        {/* ─── LH2 CRYOGENIC STORAGE SPHERE (x = -13.5, z = 7.5) ─── */}
        <group position={[-13.5, 0, 7.5]}>
          <mesh position={[0, 1.9, 0]}>
            <sphereGeometry args={[1.65, 24, 20]} />
            <meshStandardMaterial color="#E2E7F2" roughness={0.32} metalness={0.58} />
          </mesh>
          {[0, 1, 2, 3].map((si) => {
            const a = (si * Math.PI) / 2 + Math.PI / 4;
            return (
              <mesh key={si} position={[Math.cos(a) * 1.2, 0.9, Math.sin(a) * 1.2]}>
                <cylinderGeometry args={[0.08, 0.1, 1.9, 8]} />
                <meshStandardMaterial color="#68738A" roughness={0.5} metalness={0.6} />
              </mesh>
            );
          })}
        </group>

        {/* ─── 3 LIGHTNING PROTECTION TOWERS + AVIATION BEACONS ─── */}
        {MAST_COORDS.map(([mx, mz], i) => (
          <group key={i} position={[mx, 0, mz]}>
            {/* Steel mast base + fiberglass upper insulator */}
            <mesh position={[0, 7.2, 0]}>
              <cylinderGeometry args={[0.14, 0.34, 14.4, 12]} />
              <meshStandardMaterial color="#505A70" roughness={0.5} metalness={0.68} />
            </mesh>
            <mesh position={[0, 16.4, 0]}>
              <cylinderGeometry args={[0.05, 0.14, 4.2, 10]} />
              <meshStandardMaterial color="#DCE2EE" roughness={0.38} metalness={0.35} />
            </mesh>
            {/* Pulsing aviation warning beacon */}
            <mesh
              ref={(el) => {
                beaconRefs.current[i] = el;
              }}
              position={[0, 18.6, 0]}
            >
              <sphereGeometry args={[0.16, 10, 10]} />
              <meshBasicMaterial color="#FF6A3D" transparent opacity={0.9} />
            </mesh>
          </group>
        ))}

        {/* ─── VOLUMETRIC PAD FLOODLIGHT BEAMS & SPOTLIGHTS ─── */}
        {FLOODLIGHT_BEAMS.map((b, bi) => (
          <group key={bi} position={b.pos} rotation={b.rot}>
            <mesh position={[0, 6.2, 0]}>
              <coneGeometry args={[2.8, 12.4, 20, 1, true]} />
              <meshBasicMaterial
                color={b.color}
                transparent
                opacity={0.045}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        ))}

        <spotLight
          position={[9, 4.5, 11]}
          angle={0.58}
          penumbra={0.85}
          intensity={185}
          distance={65}
          color="#DCE6FF"
        />
        <spotLight
          position={[-9, 3.8, 10]}
          angle={0.58}
          penumbra={0.85}
          intensity={135}
          distance={65}
          color="#9DB8FF"
        />
      </group>

      {/* ─── VEHICLE ASSEMBLY BUILDING (VAB) ARCHITECTURAL COMPLEX & CAMPUS CORRIDOR ─── */}
      <group position={WORLD_ANCHORS.vab}>
        {/* Main High Bay structure — bright KSC light-gray insulated aluminum panels */}
        <mesh position={[0, 14.5, 0]}>
          <boxGeometry args={[27, 29, 23]} />
          <meshStandardMaterial color="#C8D0DC" roughness={0.68} metalness={0.22} />
        </mesh>

        {/* Dark anthracite side High Bay door towers (matching VAB sunrise photo left/center/right bays) */}
        {[-10.2, -3.4, 3.4, 10.2].map((vx) => (
          <mesh key={vx} position={[vx, 14.5, 11.55]}>
            <boxGeometry args={[1.65, 28.9, 0.24]} />
            <meshStandardMaterial color="#1B2230" roughness={0.8} metalness={0.25} />
          </mesh>
        ))}

        {/* Dark vertical High Bay door slots on left/west wall */}
        {[-5.5, 4.5].map((vz) => (
          <mesh key={vz} position={[-13.55, 14.5, vz]}>
            <boxGeometry args={[0.25, 27.5, 4.2]} />
            <meshStandardMaterial color="#151C28" roughness={0.82} metalness={0.25} />
          </mesh>
        ))}

        {/* Iconic US Flag painted on the VAB Left High Bay facade */}
        <group position={[-6.8, 19.2, 11.64]}>
          {/* Flag white backing */}
          <mesh>
            <planeGeometry args={[4.2, 7.8]} />
            <meshBasicMaterial color="#E8EEF6" />
          </mesh>
          {/* 7 Red vertical stripes */}
          {[-1.8, -1.2, -0.6, 0, 0.6, 1.2, 1.8].map((sx, si) => (
            <mesh key={si} position={[sx, 0, 0.01]}>
              <planeGeometry args={[0.32, 7.8]} />
              <meshBasicMaterial color="#B31942" />
            </mesh>
          ))}
          {/* Blue star canton (upper-left) */}
          <mesh position={[-0.95, 1.95, 0.02]}>
            <planeGeometry args={[2.1, 3.8]} />
            <meshBasicMaterial color="#0A3161" />
          </mesh>
        </group>

        {/* Iconic Blue Circular Insignia on the VAB Right High Bay facade */}
        <group position={[6.8, 17.5, 11.64]}>
          <mesh>
            <circleGeometry args={[1.85, 28]} />
            <meshBasicMaterial color="#0B3D91" />
          </mesh>
          <mesh position={[0, 0.1, 0.01]} rotation={[0, 0, -0.35]}>
            <planeGeometry args={[3.4, 0.28]} />
            <meshBasicMaterial color="#FC3D21" />
          </mesh>
        </group>

        {/* Stepped Low Bay & Transfer Aisle wing (front-right in VAB sunrise photo) */}
        <mesh position={[17.5, 7.2, 3.5]}>
          <boxGeometry args={[14, 14.4, 18]} />
          <meshStandardMaterial color="#BFC8D6" roughness={0.72} metalness={0.2} />
        </mesh>
        {/* Dark lower trim of Low Bay */}
        <mesh position={[17.5, 3.2, 12.55]}>
          <boxGeometry args={[14.1, 6.4, 0.2]} />
          <meshStandardMaterial color="#1E2533" roughness={0.8} metalness={0.22} />
        </mesh>
        {/* Artemis Program vertical banner on Low Bay front facade */}
        <group position={[20.5, 8.2, 12.66]}>
          <mesh>
            <planeGeometry args={[3.2, 5.2]} />
            <meshBasicMaterial color="#EEF3FA" />
          </mesh>
          <mesh position={[0, 0.3, 0.01]}>
            <coneGeometry args={[0.95, 2.4, 3]} />
            <meshBasicMaterial color="#0B3D91" />
          </mesh>
          <mesh position={[0, -0.2, 0.02]} rotation={[0, 0, 0.25]}>
            <planeGeometry args={[2.2, 0.22]} />
            <meshBasicMaterial color="#E03C31" />
          </mesh>
        </group>

        {/* Illuminated High Bay 3 Rollout Door Slit + Horizontal Gantry Levels */}
        <mesh position={[0, 11.8, 11.62]}>
          <planeGeometry args={[4.6, 22.5]} />
          <meshBasicMaterial color="#9DB8FF" transparent opacity={0.22} />
        </mesh>
        {[4, 8, 12, 16, 20].map((gy) => (
          <mesh key={gy} position={[0, gy, 11.65]}>
            <boxGeometry args={[4.6, 0.18, 0.1]} />
            <meshBasicMaterial color="#161D2B" />
          </mesh>
        ))}

        {/* KSC Campus Approach Roadway & Dawn Light Poles leading from VAB toward LC-39B */}
        {[16, 24, 32, 40].map((rz, ri) => (
          <group key={ri} position={[12 + ri * 1.8, 0, rz]}>
            <mesh position={[0, 2.2, 0]}>
              <cylinderGeometry args={[0.05, 0.08, 4.4, 8]} />
              <meshStandardMaterial color="#2A3346" roughness={0.5} metalness={0.7} />
            </mesh>
            <mesh position={[0.35, 4.35, 0]}>
              <sphereGeometry args={[0.14, 8, 8]} />
              <meshBasicMaterial color="#FFCC88" />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
