"use client";

import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { getBlackFoilTile, getGoldFoilTile, getLmDescentStageTextures, getLunarFoilEnv } from "./foilTextures";

export const LM_GLB_URL = "/media/models/SM-L-001_apollo_lunar_module.web.glb";

/**
 * Native → metres. The NASA model's octagonal stage is 3.016 units across flats; the real descent
 * stage is 4.2 m across (NSSDCA 1969-059C), so 1 unit = 1.4 m. At this scale the whole model is
 * 7.0 m tall (real LM: 7.04 m) and the footpads span ~9.0 m (real: 9.4 m between opposite pads).
 */
export const LM_SCALE = 1.4;

// Native-model measurements of the octagonal descent stage (pCylinder1002 in the GLB)
const STAGE_APOTHEM = 1.508;
const STAGE_R = STAGE_APOTHEM / Math.cos(Math.PI / 8);
const STAGE_BOTTOM = 1.067;
const STAGE_TOP = 2.423;
const PAD_BOTTOM = 0.1;
const PAD_RADIUS = 2.95; // native distance of the footpad centres from the stage axis

// GLB parts replaced by the procedural body (plain yellow drum + its decals) and the ascent-stage
// interstage struts/fittings that sit on the deck corners
const DROP_PREFIX = ["pCylinder1002", "pPlane1", "pPlane2", "group73", "group74", "pCylinder6", "pCylinder7"];
// Porch handrails rise a little above the deck but belong to the descent stage
const KEEP_TALL_PREFIX = ["pCylinde11", "pCylinder2002"];

/** Recolour the NASA palette strip: cartoon yellows → amber Kapton / anodised gold. */
function recolourPalette(src: THREE.Texture): THREE.Texture {
  const img = src.image as CanvasImageSource & { width: number; height: number };
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, c.width, c.height);
  for (let i = 0; i < d.data.length; i += 4) {
    const r = d.data[i];
    const g = d.data[i + 1];
    const b = d.data[i + 2];
    if (r > 150 && g > 110 && b < 150 && r - b > 60) {
      // yellow / orange → amber gold, keep relative brightness
      const lum = (r + g + b) / 3 / 255;
      d.data[i] = Math.round(140 + lum * 70);
      d.data[i + 1] = Math.round(92 + lum * 50);
      d.data[i + 2] = Math.round(34 + lum * 20);
    } else if (r > 220 && g > 220 && b > 180 && b < r - 15) {
      // pale cream → pale aluminised gold
      d.data[i] = 214;
      d.data[i + 1] = 196;
      d.data[i + 2] = 150;
    }
  }
  ctx.putImageData(d, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.flipY = src.flipY;
  t.colorSpace = src.colorSpace;
  t.magFilter = src.magFilter;
  t.minFilter = src.minFilter;
  t.wrapS = src.wrapS;
  t.wrapT = src.wrapT;
  t.channel = src.channel;
  t.needsUpdate = true;
  return t;
}

/**
 * SM-L-001 / SM-L-004 · Apollo LM descent stage left on the Moon (ascent stage flew away).
 * Uses the NASA 3D Resources LM model for the real landing gear, footpads, ladder and porch,
 * cut at the stage's top deck, with a procedural octagonal stage body in crinkled amber Kapton
 * and black film (AS11-40-5948), an empty top deck, aluminised base heat shield and the
 * ~1 m conical descent-engine skirt underneath.
 */
export function ApolloLmDescentStage({
  groundY,
  heightFn,
  shadows,
}: {
  groundY: number;
  heightFn?: (x: number, z: number) => number;
  shadows: boolean;
}) {
  const { scene } = useGLTF(LM_GLB_URL, false, true);
  const gl = useThree((s) => s.gl);
  const env = useMemo(() => getLunarFoilEnv(gl), [gl]);

  const built = useMemo(() => {
    const root = scene.clone(true);
    root.updateMatrixWorld(true);
    const box = new THREE.Box3();
    const owned: THREE.Material[] = [];
    const ownedTex: THREE.Texture[] = [];
    const remap = new Map<THREE.Material, THREE.Material>();
    const remove: THREE.Object3D[] = [];
    let palette: THREE.Texture | null = null;

    const engineMat = new THREE.MeshStandardMaterial({
      color: "#4A4642",
      roughness: 0.48,
      metalness: 0.78,
      envMap: env,
      envMapIntensity: 0.8,
      side: THREE.DoubleSide,
    });
    const padMat = new THREE.MeshStandardMaterial({
      color: "#A9783A",
      roughness: 0.4,
      metalness: 0.72,
      envMap: env,
      envMapIntensity: 1.0,
    });
    owned.push(engineMat, padMat);

    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      box.setFromObject(mesh);
      const nm = mesh.name;
      const keepTall = KEEP_TALL_PREFIX.some((p) => nm.startsWith(p));
      if (
        DROP_PREFIX.some((p) => nm.startsWith(p)) ||
        box.min.y > STAGE_TOP - 0.03 ||
        (!keepTall && box.max.y > STAGE_TOP + 0.08)
      ) {
        remove.push(mesh);
        return;
      }
      mesh.castShadow = shadows;
      mesh.receiveShadow = shadows;
      if (nm.startsWith("group13_pC_1")) {
        mesh.material = engineMat;
        return;
      }
      if (nm.startsWith("group31_19") || nm.startsWith("group31_20")) {
        mesh.material = padMat;
        return;
      }
      const src = mesh.material as THREE.MeshStandardMaterial;
      let next = remap.get(src);
      if (!next) {
        const m = src.clone() as THREE.MeshStandardMaterial;
        if (src.map && src.map.image && (src.map.image as { width: number }).width <= 256) {
          if (!palette) {
            palette = recolourPalette(src.map);
            ownedTex.push(palette);
          }
          m.map = palette;
        }
        m.metalness = 0.6;
        m.roughness = 0.42;
        m.envMap = env;
        m.envMapIntensity = 0.95;
        remap.set(src, m);
        owned.push(m);
        next = m;
      }
      mesh.material = next;
    });
    remove.forEach((m) => m.parent?.remove(m));
    return { root, owned, ownedTex };
  }, [scene, env, shadows]);

  useEffect(
    () => () => {
      built.owned.forEach((m) => m.dispose());
      built.ownedTex.forEach((t) => t.dispose());
    },
    [built],
  );

  // ── Procedural stage body (native units, scaled with the model) ──
  const body = useMemo(() => {
    const sides = getLmDescentStageTextures();
    const gold = getGoldFoilTile();
    const black = getBlackFoilTile();
    const h = STAGE_TOP - STAGE_BOTTOM;
    const sideGeo = new THREE.CylinderGeometry(STAGE_R, STAGE_R, h, 8, 1, true, -Math.PI / 8);
    const capGeo = new THREE.CircleGeometry(STAGE_R, 8, Math.PI / 8);
    capGeo.rotateX(-Math.PI / 2);
    const bottomGeo = new THREE.CircleGeometry(STAGE_R * 0.995, 8, Math.PI / 8);
    bottomGeo.rotateX(Math.PI / 2);
    const ringGeo = new THREE.RingGeometry(0.36, 0.62, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const discGeo = new THREE.CircleGeometry(0.36, 24);
    discGeo.rotateX(-Math.PI / 2);
    const fittingGeo = new THREE.BoxGeometry(0.16, 0.08, 0.16);
    const sideMat = new THREE.MeshStandardMaterial({
      map: sides.map,
      bumpMap: sides.bumpMap,
      bumpScale: 1.6,
      roughness: 0.4,
      metalness: 0.55,
      envMap: env,
      envMapIntensity: 1.0,
    });
    const deckMat = new THREE.MeshStandardMaterial({
      map: black.map,
      bumpMap: black.bumpMap,
      bumpScale: 1.4,
      roughness: 0.55,
      metalness: 0.45,
      envMap: env,
      envMapIntensity: 0.7,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      map: gold.map,
      bumpMap: gold.bumpMap,
      bumpScale: 1.4,
      roughness: 0.4,
      metalness: 0.6,
      envMap: env,
      envMapIntensity: 1.0,
    });
    const shieldMat = new THREE.MeshStandardMaterial({
      color: "#9C9A94",
      map: black.map,
      bumpMap: black.bumpMap,
      bumpScale: 1.2,
      roughness: 0.5,
      metalness: 0.7,
      envMap: env,
      envMapIntensity: 0.8,
      side: THREE.DoubleSide,
    });
    const fittingMat = new THREE.MeshStandardMaterial({
      color: "#8D9096",
      roughness: 0.38,
      metalness: 0.8,
      envMap: env,
    });
    const plaqueMat = new THREE.MeshStandardMaterial({
      color: "#D9DCE0",
      roughness: 0.22,
      metalness: 0.95,
      envMap: env,
      envMapIntensity: 1.2,
    });
    return {
      h,
      plaqueMat,
      sideGeo,
      capGeo,
      bottomGeo,
      ringGeo,
      discGeo,
      fittingGeo,
      sideMat,
      deckMat,
      goldMat,
      shieldMat,
      fittingMat,
    };
  }, [env]);

  useEffect(
    () => () => {
      [body.sideGeo, body.capGeo, body.bottomGeo, body.ringGeo, body.discGeo, body.fittingGeo].forEach((g) =>
        g.dispose(),
      );
      [body.sideMat, body.deckMat, body.goldMat, body.shieldMat, body.fittingMat, body.plaqueMat].forEach((m) => m.dispose());
    },
    [body],
  );

  // Seat the four footpads on the terrain (average height, sunk ~3 cm into the regolith)
  const baseY = useMemo(() => {
    if (!heightFn) return groundY - PAD_BOTTOM * LM_SCALE - 0.03;
    const r = PAD_RADIUS * LM_SCALE;
    const hs = [heightFn(0, r), heightFn(0, -r), heightFn(r, 0), heightFn(-r, 0)];
    const avg = hs.reduce((a, b) => a + b, 0) / hs.length;
    return groundY + avg - PAD_BOTTOM * LM_SCALE - 0.03;
  }, [groundY, heightFn]);

  const midY = (STAGE_BOTTOM + STAGE_TOP) / 2;
  return (
    <group position={[0, baseY, 0]} scale={LM_SCALE}>
      <primitive object={built.root} />
      <mesh geometry={body.sideGeo} material={body.sideMat} position={[0, midY, 0]} castShadow={shadows} receiveShadow={shadows} />
      {/* Empty top deck: black film, gold blanket ring around the scorched centre, interstage fittings */}
      <mesh geometry={body.capGeo} material={body.deckMat} position={[0, STAGE_TOP, 0]} receiveShadow={shadows} />
      <mesh geometry={body.ringGeo} material={body.goldMat} position={[0, STAGE_TOP + 0.004, 0]} />
      <mesh geometry={body.discGeo} material={body.shieldMat} position={[0, STAGE_TOP + 0.006, 0]} />
      {[
        [1.18, 1.18],
        [-1.18, 1.18],
        [1.18, -1.18],
        [-1.18, -1.18],
      ].map(([x, z], i) => (
        <mesh
          key={i}
          geometry={body.fittingGeo}
          material={body.fittingMat}
          position={[x * 0.92, STAGE_TOP + 0.04, z * 0.92]}
          rotation={[0, Math.PI / 4, 0]}
          castShadow={shadows}
        />
      ))}
      {/* Commemorative plaque (≈23 × 19 cm stainless plate, no text) on the forward strut behind the ladder */}
      <mesh
        geometry={body.fittingGeo}
        material={body.plaqueMat}
        position={[-0.04, 1.2, 2.43]}
        rotation={[-0.45, 0, 0]}
        scale={[1.02, 0.87, 0.06]}
      />
      {/* Aluminised base heat shield */}
      <mesh geometry={body.bottomGeo} material={body.shieldMat} position={[0, STAGE_BOTTOM + 0.002, 0]} />
    </group>
  );
}

