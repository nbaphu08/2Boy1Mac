"use client";

import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { MiniMap } from "@/components/museum/MiniMap";
import { MiniMapSheet } from "@/components/museum/MiniMapSheet";
import { exhibitBySlug } from "@/content/exhibits";
import { expedition } from "@/content/guide";
import { readExpedition, trackerActive } from "@/lib/expedition";
import { scrollState, scrollToBeat } from "@/lib/scroll/progress";

function formatCoords(lat?: number, lon?: number): string | null {
  if (lat === undefined || lon === undefined) return null;
  return `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? "N" : "S"} ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? "E" : "W"}`;
}

/** Target tracker: current target, its real coordinates and a proximity bar. Hidden outside the expedition. */
export function TrackerHud() {
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const bar = barRef.current;
    const status = statusRef.current;
    if (!root || !bar || !status) return;
    let lastSlug: string | null = null;
    const apply = () => {
      const show = trackerActive(scrollState.current);
      if (!show) setSheetOpen(false);
      root.style.opacity = show ? "1" : "0";
      root.style.visibility = show ? "visible" : "hidden";
      if (!show) return;
      const e = readExpedition();
      if (e.targetSlug !== lastSlug) {
        lastSlug = e.targetSlug;
        setSlug(e.targetSlug);
      }
      bar.style.transform = `scaleX(${e.proximity.toFixed(3)})`;
      status.textContent =
        e.phase === "arrived"
          ? expedition.tracker.arrived
          : expedition.tracker.signal;
      status.style.color = e.phase === "arrived" ? "var(--starlight)" : "";
    };
    apply();
    gsap.ticker.add(apply);
    return () => {
      gsap.ticker.remove(apply);
    };
  }, []);

  const ex = slug ? exhibitBySlug(slug) : undefined;
  const coords = ex ? formatCoords(ex.location.lat, ex.location.lon) : null;

  const hall = ex?.hall ?? "moon";
  const T = expedition.minimap;

  return (
    <>
      <div
        ref={rootRef}
        className="pointer-events-none fixed right-12 top-[10.5rem] z-20 w-44 rounded border border-line/70 bg-surface/70 px-2.5 py-2 backdrop-blur-md sm:bottom-5 sm:right-24 sm:top-auto sm:w-[17rem] sm:px-3 sm:py-2.5"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        <div className="hidden sm:block">
          <p className="font-hud mb-1 text-[9px] text-mute">
            {T.title} · {hall === "moon" ? T.moon : T.mars}
          </p>
          <MiniMap
            hall={hall}
            currentSlug={slug}
            onJump={(s) => scrollToBeat(s)}
          />
          <div className="my-2 h-px bg-line/60" />
        </div>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="font-hud pointer-events-auto mb-1.5 min-h-11 w-full cursor-pointer rounded border border-line/80 px-2 text-[10px] text-platinum sm:hidden"
        >
          {T.open}
        </button>
        <div aria-hidden>
          <p className="font-hud hidden text-[9px] text-mute sm:block">
            {expedition.tracker.label}
          </p>
          <p className="font-display truncate text-xs text-text sm:mt-0.5 sm:text-sm">
            {ex?.name ?? ""}
          </p>
          <p className="font-hud text-[9px] text-platinum sm:text-[10px]">
            {coords ?? ex?.location.site ?? ""}
          </p>
          <div className="mt-1.5 h-0.5 w-full overflow-hidden rounded bg-line/60">
            <div
              ref={barRef}
              className="h-full origin-left bg-starlight"
              style={{ transform: "scaleX(0)" }}
            />
          </div>
          <span
            ref={statusRef}
            className="font-hud mt-1 block text-[9px] text-mute"
          >
            {expedition.tracker.signal}
          </span>
        </div>
      </div>
      {sheetOpen && (
        <MiniMapSheet
          hall={hall}
          currentSlug={slug}
          onJump={(s) => scrollToBeat(s)}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </>
  );
}
