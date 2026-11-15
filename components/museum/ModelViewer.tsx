"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { site } from "@/content/site";

const Canvas3D = dynamic(() => import("./ModelViewerCanvas"), { ssr: false });

const Q = "(prefers-reduced-motion: reduce)";
function subscribeMotion(cb: () => void) {
  const mql = window.matchMedia(Q);
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
}

/** Lightweight drag-to-rotate viewer. Poster image shows until the canvas mounts; no auto-rotate with reduced motion. */
export function ModelViewer({ url, poster, label }: { url: string; poster: string; label: string }) {
  const reduced = useSyncExternalStore(subscribeMotion, () => window.matchMedia(Q).matches, () => true);

  return (
    <div
      role="group"
      aria-label={`${label} — interactive 3D model. Drag to rotate.`}
      className="relative aspect-[3/2] w-full overflow-hidden rounded-md border border-line bg-void"
      style={{
        backgroundImage: `linear-gradient(rgba(5,6,10,0.55), rgba(5,6,10,0.55)), url(${poster})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Canvas3D url={url} reducedMotion={reduced} />
      <p className="font-hud pointer-events-none absolute bottom-2 left-3 text-[10px] text-platinum">
        Drag to rotate · 3D reconstruction
      </p>
      <p className="font-hud pointer-events-none absolute bottom-2 right-3 text-[10px] text-platinum/60">{site.siWatermark}</p>
    </div>
  );
}
