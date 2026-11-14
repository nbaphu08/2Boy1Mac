"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Component, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { beats, beatIndexById } from "@/content/beats";
import { journey, narration } from "@/content/journey";
import { site } from "@/content/site";
import type { Beat } from "@/content/types";
import {
  registerScroller,
  scrollState,
  scrollToBeat,
  smoothstep,
} from "@/lib/scroll/progress";
import { useMuseum } from "@/lib/store";
import { ExhibitPanel } from "@/components/museum/ExhibitPanel";
import { PassportSheet } from "@/components/museum/PassportSheet";
import { BeatSection } from "./BeatOverlays";
import { StaticPoster } from "./StaticPoster";

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") || c.getContext("webgl");
    if (!gl) return false;
    (gl as WebGLRenderingContext).getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** Catches a WebGL context-creation crash from the canvas and flips the site to static mode. */
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    useMuseum.getState().setWebglFailed(true);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

gsap.registerPlugin(ScrollTrigger);

const SpaceScene = dynamic(() => import("./three/SpaceScene"), {
  ssr: false,
  loading: () => <div aria-hidden className="fixed inset-0 z-0 bg-void" />,
});

const railGroups = beats.reduce<{ rail: Beat["rail"]; items: { beat: Beat; index: number }[] }[]>(
  (groups, beat, index) => {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.rail === beat.rail) lastGroup.items.push({ beat, index });
    else groups.push({ rail: beat.rail, items: [{ beat, index }] });
    return groups;
  },
  [],
);

function TopHudBar() {
  const beatIndex = useMuseum((s) => s.beatIndex);
  const visitedCount = useMuseum((s) => s.visited.length);
  const beat = beats[beatIndex] ?? beats[0];
  const pad = String(beatIndex).padStart(2, "0");
  const [passportOpen, setPassportOpen] = useState(false);
  const lightweight = useMuseum((s) => s.lightweight);
  const forced = useMuseum((s) => s.reducedMotion || s.webglFailed);
  const isStatic = lightweight || forced;

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-center justify-between px-5 py-4 sm:px-10">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-line/80 bg-surface/65 px-3.5 py-1.5 backdrop-blur-md">
        <button
          type="button"
          onClick={() => scrollToBeat(0)}
          className="font-display cursor-pointer text-xs tracking-widest text-text hover:text-starlight"
        >
          {site.wordmark}
        </button>
        <span aria-hidden className="text-line">|</span>
        <span className="font-hud text-[10px] text-platinum">
          {pad} / {String(beats.length - 1).padStart(2, "0")} · {beat.rail}
        </span>
      </div>

      <nav
        aria-label={journey.ui.navLabel}
        className="pointer-events-auto flex items-center gap-3 rounded-full border border-line/80 bg-surface/65 px-3.5 py-1.5 backdrop-blur-md"
      >
        <button
          type="button"
          onClick={() => setPassportOpen(true)}
          aria-haspopup="dialog"
          aria-label={`Open museum passport, ${visitedCount} of 12 stamps`}
          className="font-hud cursor-pointer text-[10px] text-mute transition-colors hover:text-text"
        >
          {journey.ui.stamps(visitedCount)}
        </button>
        <span aria-hidden className="text-line">|</span>
        <button
          type="button"
          onClick={() => useMuseum.getState().setLightweight(!lightweight)}
          aria-pressed={isStatic}
          disabled={forced}
          title={forced ? "Static mode is on for this device" : "Swap the live 3D scene for still images (faster on weak phones)"}
          className={`font-hud cursor-pointer text-[10px] transition-colors hover:text-text disabled:cursor-default ${isStatic ? "text-starlight" : "text-mute"}`}
        >
          Lightweight: {isStatic ? "on" : "off"}
        </button>
        <span aria-hidden className="text-line">|</span>
        <Link href="/gallery" className="font-hud text-[10px] text-text transition-colors hover:text-starlight">
          {journey.ui.gallery}
        </Link>
        <Link href="/about" className="font-hud text-[10px] text-mute transition-colors hover:text-text">
          {journey.ui.about}
        </Link>
      </nav>
      {passportOpen ? <PassportSheet onClose={() => setPassportOpen(false)} /> : null}
    </header>
  );
}

function ProgressRail() {
  const beatIndex = useMuseum((s) => s.beatIndex);
  return (
    <nav
      aria-label={journey.ui.railLabel}
      className="fixed right-2 top-1/2 z-30 flex -translate-y-1/2 flex-col items-end gap-2.5 sm:right-6"
    >
      {railGroups.map((group) => {
        const current = group.items.some((it) => it.index === beatIndex);
        return (
          <div key={group.rail} className="group/rail relative flex items-center">
            <span
              className={`font-hud pointer-events-none absolute right-full mr-2 hidden whitespace-nowrap text-[10px] transition-opacity sm:block ${
                current
                  ? "text-text opacity-100"
                  : "text-mute opacity-0 group-focus-within/rail:opacity-100 group-hover/rail:opacity-100"
              }`}
            >
              {group.rail}
            </span>
            <ul className="flex flex-col items-center">
              {group.items.map(({ beat, index }) => {
                const on = index === beatIndex;
                return (
                  <li key={beat.id}>
                    <button
                      type="button"
                      onClick={() => scrollToBeat(index)}
                      title={beat.title ?? beat.sub ?? beat.id}
                      aria-label={journey.ui.goTo(beat.title ?? beat.sub ?? beat.id)}
                      aria-current={on ? "step" : undefined}
                      className="flex h-4 w-6 cursor-pointer items-center justify-center"
                    >
                      <span
                        className={`block rounded-full transition-all duration-300 ${
                          on
                            ? "h-2 w-2 bg-starlight shadow-[0_0_8px_var(--starlight)]"
                            : index < beatIndex
                              ? "h-1 w-1 bg-platinum"
                              : "h-1 w-1 bg-mute/70"
                        }`}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function ScrollLiveCaption() {
  const beatIndex = useMuseum((s) => s.beatIndex);
  const beat = beats[beatIndex] ?? beats[0];
  return (
    <p aria-live="polite" className="sr-only">
      {[beat.title, narration[beat.id], beat.caption ?? beat.sub].filter(Boolean).join(". ")}
    </p>
  );
}

/**
 * Landing Page VAB Sunrise Backdrop + Scroll-1 Dolly Walk-In Portal (`progress: 0.0 -> 1.0`).
 * - At Beat 0 (`hero`): Displays the VAB sunrise photograph (`hero_vab_sunrise_alt`) full-screen.
 * - On Scroll 1 (`hero` -> `enter`): Smoothly dollies into the VAB campus / High Bay doors and
 *   dissolves through KSC dawn mist directly into the 3D scene where the SLS + Orion stands on Pad LC-39B.
 */
function VabEntrancePortal({ reducedMotion }: { reducedMotion: boolean }) {
  const portalRef = useRef<HTMLDivElement>(null);
  const exteriorRef = useRef<HTMLDivElement>(null);
  const campusRef = useRef<HTMLDivElement>(null);
  const mistVeilRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const portal = portalRef.current;
    const exterior = exteriorRef.current;
    const campus = campusRef.current;
    const mist = mistVeilRef.current;
    if (!portal || !exterior || !campus || !mist) return;

    const updatePortal = () => {
      const p = scrollState.current;
      if (p >= 0.96) {
        if (portal.style.visibility !== "hidden") {
          portal.style.visibility = "hidden";
          portal.style.opacity = "0";
        }
        return;
      }

      if (portal.style.visibility !== "visible") {
        portal.style.visibility = "visible";
        portal.style.opacity = "1";
      }

      // 1. VAB Sunrise Exterior: dollies into the VAB campus corridor & Transfer Aisle
      const extZoom = reducedMotion ? 1 : 1 + smoothstep(0.0, 0.72, p) * 0.78;
      const extOpacity = 1 - smoothstep(0.18, 0.64, p);
      exterior.style.opacity = extOpacity.toFixed(3);
      exterior.style.transform = `scale3d(${extZoom.toFixed(4)}, ${extZoom.toFixed(4)}, 1)`;

      // 2. Inside VAB Campus / Open High Bay Doors: intermediate walk-in portal into the 3D launchpad
      const campusIn = smoothstep(0.1, 0.36, p);
      const campusOut = 1 - smoothstep(0.44, 0.88, p);
      const campusOpacity = campusIn * campusOut;
      const campusZoom = reducedMotion ? 1 : 1.02 + smoothstep(0.1, 0.9, p) * 0.56;
      campus.style.opacity = campusOpacity.toFixed(3);
      campus.style.transform = `scale3d(${campusZoom.toFixed(4)}, ${campusZoom.toFixed(4)}, 1)`;

      // 3. KSC Morning Coastal Mist Veil: bridges the transition into the 3D SLS + Orion on Pad LC-39B
      const mistBell = Math.sin(smoothstep(0.12, 0.92, p) * Math.PI);
      mist.style.opacity = (mistBell * 0.38).toFixed(3);
    };

    updatePortal();
    gsap.ticker.add(updatePortal);
    return () => {
      gsap.ticker.remove(updatePortal);
    };
  }, [reducedMotion]);

  return (
    <div
      ref={portalRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[1] overflow-hidden will-change-[opacity]"
    >
      {/* Layer 2: Inside VAB Campus / Open High Bay Doors (intermediate dolly layer) */}
      <div
        ref={campusRef}
        className="absolute inset-0 origin-[50%_56%] opacity-0 will-change-[transform,opacity]"
      >
        <picture>
          <source
            type="image/avif"
            srcSet="/media/images/enter_vab_doors_open-1280.avif 1280w, /media/images/enter_vab_doors_open-2560.avif 2560w"
            sizes="100vw"
          />
          <source
            type="image/jpeg"
            srcSet="/media/images/enter_vab_doors_open-1280.jpg 1280w, /media/images/enter_vab_doors_open-2560.jpg 2560w"
            sizes="100vw"
          />
          <img
            src="/media/images/enter_vab_doors_open-2560.jpg"
            alt=""
            decoding="async"
            className="h-full w-full object-cover object-center brightness-[0.88] contrast-[1.06]"
          />
        </picture>
      </div>

      {/* Layer 1: VAB Sunrise Hero Theme Image (First image of the landing page) */}
      <div
        ref={exteriorRef}
        className="absolute inset-0 origin-[54%_60%] will-change-[transform,opacity]"
      >
        <picture>
          <source
            type="image/avif"
            srcSet="/media/images/hero_vab_sunrise_alt-1280.avif 1280w, /media/images/hero_vab_sunrise_alt-2560.avif 2560w"
            sizes="100vw"
          />
          <source
            type="image/jpeg"
            srcSet="/media/images/hero_vab_sunrise_alt-1280.jpg 1280w, /media/images/hero_vab_sunrise_alt-2560.jpg 2560w"
            sizes="100vw"
          />
          <img
            src="/media/images/hero_vab_sunrise_alt-2560.jpg"
            alt=""
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover object-center brightness-[0.94] contrast-[1.04]"
          />
        </picture>

        {/* Subtle drifting KSC dawn mist */}
        <div className="fog fog-a" />
        <div className="fog fog-b" />
      </div>

      {/* Layer 3: Atmospheric dawn mist bloom when entering the 3D Launchpad */}
      <div
        ref={mistVeilRef}
        className="absolute inset-0 opacity-0"
        style={{
          background:
            "radial-gradient(circle at 52% 54%, rgba(168, 198, 255, 0.35) 0%, rgba(16, 26, 48, 0.65) 58%, rgba(5, 6, 10, 0.85) 100%)",
        }}
      />
    </div>
  );
}

export default function Stage() {
  const trackRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useMuseum((s) => s.reducedMotion);
  const lightweight = useMuseum((s) => s.lightweight);
  const webglFailed = useMuseum((s) => s.webglFailed);
  const resolved = useMuseum((s) => s.modeResolved);
  const isStatic = reducedMotion || lightweight || webglFailed;

  // Resolve capabilities before first paint so the WebGL canvas never mounts when it should not.
  useLayoutEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const st = useMuseum.getState();
    st.setReducedMotion(mql.matches);
    st.hydrateVisited();
    if (!hasWebGL()) st.setWebglFailed(true);
  }, []);

  // Hydrate visited passport stamps + reduced-motion media query once on mount
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMql = () => useMuseum.getState().setReducedMotion(mql.matches);
    syncMql();
    mql.addEventListener("change", syncMql);
    return () => mql.removeEventListener("change", syncMql);
  }, []);

  // Master Lenis + GSAP ScrollTrigger integration
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const maxIdx = beats.length - 1;
    let hashTimer = 0;

    const lenis = isStatic
      ? null
      : new Lenis({
          lerp: 0.085,
          smoothWheel: true,
          syncTouch: true,
        });

    const onLenisScroll = () => ScrollTrigger.update();
    lenis?.on("scroll", onLenisScroll);

    const tickerRaf = (time: number) => {
      lenis?.raf(time * 1000);
    };
    gsap.ticker.add(tickerRaf);
    gsap.ticker.lagSmoothing(0);

    const applyProgress = (clamped: number, snapCurrent = false) => {
      scrollState.target = clamped;
      if (snapCurrent) scrollState.current = clamped;

      const nearest = Math.round(clamped);
      const store = useMuseum.getState();
      if (store.beatIndex !== nearest) {
        store.setBeat(nearest, beats[nearest].id);
        window.clearTimeout(hashTimer);
        hashTimer = window.setTimeout(() => {
          const hash = `#${beats[nearest].id}`;
          if (window.location.hash !== hash && !(nearest === 0 && !window.location.hash)) {
            window.history.replaceState(window.history.state, "", hash);
          }
        }, 140);
      }
    };

    const masterTrigger = ScrollTrigger.create({
      trigger: track,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        applyProgress(self.progress * maxIdx, false);
      },
    });

    const scrollTo = (index: number, instant = false) => {
      const top = index * Math.max(window.innerHeight, 1);
      if (lenis) {
        lenis.scrollTo(top, {
          immediate: instant || useMuseum.getState().reducedMotion,
          duration: 1.35,
        });
      } else {
        window.scrollTo({
          top,
          behavior: instant || useMuseum.getState().reducedMotion ? "auto" : "smooth",
        });
      }
    };

    registerScroller(scrollTo);

    // Jump immediately to initial URL hash if present (e.g. /#ignition or /#moon-apollo-11)
    const readHash = () => {
      try {
        return beatIndexById(decodeURIComponent(window.location.hash.slice(1)));
      } catch {
        return -1;
      }
    };
    const initialIdx = readHash();
    if (initialIdx >= 0) {
      const top = initialIdx * Math.max(window.innerHeight, 1);
      if (lenis) lenis.scrollTo(top, { immediate: true });
      else window.scrollTo({ top, behavior: "auto" });
      applyProgress(initialIdx, true);
    } else {
      const raw = (window.scrollY / Math.max(window.innerHeight, 1));
      applyProgress(Math.max(0, Math.min(maxIdx, raw)), true);
    }

    const onHashChange = () => {
      const i = readHash();
      if (i >= 0) scrollTo(i);
    };
    window.addEventListener("hashchange", onHashChange);

    // Pause Lenis while ExhibitPanel modal is open
    const unsubStore = useMuseum.subscribe((s, p) => {
      if ((s.activeExhibit !== null) !== (p.activeExhibit !== null)) {
        if (s.activeExhibit !== null) lenis?.stop();
        else lenis?.start();
      }
    });

    // Beat-snapped keys: PageDown/PageUp/Space/Shift+Space jump exactly one beat. Arrows stay native.
    let pending: { idx: number; at: number } | null = null;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      if (useMuseum.getState().activeExhibit !== null) return;
      const t = e.target as HTMLElement | null;
      if (t) {
        if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
        // Space activates focused buttons/links natively.
        if (e.key === " " && /^(BUTTON|A|SUMMARY)$/.test(t.tagName)) return;
      }
      let dir = 0;
      if (e.key === "PageDown" || (e.key === " " && !e.shiftKey)) dir = 1;
      else if (e.key === "PageUp" || (e.key === " " && e.shiftKey)) dir = -1;
      if (!dir) return;
      e.preventDefault();
      const now = performance.now();
      const base =
        pending && now - pending.at < 1600 ? pending.idx : Math.round(scrollState.target);
      const idx = Math.max(0, Math.min(maxIdx, base + dir));
      pending = { idx, at: now };
      scrollTo(idx);
    };
    window.addEventListener("keydown", onKeyDown);

    // Pause the shared GSAP ticker (Lenis, portal, narration, 3D readers) while the tab is hidden.
    const onVisibility = () => {
      if (document.hidden) {
        gsap.ticker.sleep();
        lenis?.stop();
      } else {
        gsap.ticker.wake();
        if (useMuseum.getState().activeExhibit === null) lenis?.start();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    ScrollTrigger.refresh();

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(hashTimer);
      registerScroller(null);
      unsubStore();
      window.removeEventListener("hashchange", onHashChange);
      masterTrigger.kill();
      gsap.ticker.remove(tickerRaf);
      lenis?.off("scroll", onLenisScroll);
      lenis?.destroy();
    };
  }, [isStatic]);

  return (
    <div className="relative min-h-screen w-full bg-void">
      {/* Persistent 60fps 3D Rocket + Spaceflight Background */}
      {isStatic ? (
        <div aria-hidden className="fixed inset-0 z-0 bg-void" />
      ) : resolved ? (
        <SceneBoundary>
          <SpaceScene />
        </SceneBoundary>
      ) : (
        <div aria-hidden className="fixed inset-0 z-0 bg-void" />
      )}

      {/* VAB Sunrise Landing Page Backdrop + Scroll-1 Dolly Portal into 3D Launchpad */}
      {!isStatic ? <VabEntrancePortal reducedMotion={reducedMotion} /> : null}

      {/* Subtle museum film grain & edge vignette layered softly over 3D & VAB Portal */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-[2] overflow-hidden">
        <div className="vignette" />
        <div className="grain" />
      </div>

      {/* Lenis + GSAP ScrollTrigger story track (24 sections = 2400dvh) */}
      <div ref={trackRef} className="pointer-events-none relative z-10 flex flex-col">
        {beats.map((beat, i) => (
          <BeatSection
            key={beat.id}
            beat={beat}
            poster={isStatic ? <StaticPoster beat={beat} eager={i < 2} /> : undefined}
          />
        ))}
      </div>

      <TopHudBar />
      <ProgressRail />
      <ScrollLiveCaption />
      <ExhibitPanel />
    </div>
  );
}
