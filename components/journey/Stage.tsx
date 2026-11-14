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

/** The journey starts at beat 1 (`enter`); beat 0 (`hero`) now lives on the landing page at `/`. */
const MIN_BEAT = 1;
const journeyBeats = beats.slice(MIN_BEAT);

const railGroups = beats.reduce<{ rail: Beat["rail"]; items: { beat: Beat; index: number }[] }[]>(
  (groups, beat, index) => {
    if (index < MIN_BEAT) return groups;
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
  const shown = Math.max(beatIndex, MIN_BEAT);
  const pad = String(shown).padStart(2, "0");
  const [passportOpen, setPassportOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const lightweight = useMuseum((s) => s.lightweight);
  const forced = useMuseum((s) => s.reducedMotion || s.webglFailed);
  const isStatic = lightweight || forced;

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-center justify-between gap-2 px-3 py-3 sm:px-10 sm:py-4">
      <div className="pointer-events-auto flex min-w-0 items-center gap-2 whitespace-nowrap rounded-full border border-line/80 bg-surface/65 px-3 py-1.5 backdrop-blur-md sm:gap-3 sm:px-3.5">
        <Link href="/" className="font-display text-xs tracking-widest text-text hover:text-starlight">
          {site.wordmark}
        </Link>
        <span aria-hidden className="text-line">|</span>
        <span className="font-hud text-[10px] text-platinum">
          {pad}/{String(beats.length - 1).padStart(2, "0")}
          <span className="hidden sm:inline"> · {beat.rail}</span>
        </span>
      </div>

      <nav
        aria-label={journey.ui.navLabel}
        className="pointer-events-auto relative flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-line/80 bg-surface/65 px-3 py-1.5 backdrop-blur-md sm:gap-3 sm:px-3.5"
      >
        <button
          type="button"
          onClick={() => setPassportOpen(true)}
          aria-haspopup="dialog"
          aria-label={`Open museum passport, ${visitedCount} of 12 stamps`}
          title="Museum passport"
          className="font-hud cursor-pointer text-[10px] text-mute transition-colors hover:text-text"
        >
          <span aria-hidden className="sm:hidden">&#9733; {visitedCount}/12</span>
          <span className="hidden sm:inline">{journey.ui.stamps(visitedCount)}</span>
        </button>
        <span aria-hidden className="text-line">|</span>
        <button
          type="button"
          onClick={() => useMuseum.getState().setLightweight(!lightweight)}
          aria-pressed={isStatic}
          aria-label={`Lightweight mode: ${isStatic ? "on" : "off"}`}
          disabled={forced}
          title={forced ? "Static mode is on for this device" : "Swap the live 3D scene for still images (faster on weak phones)"}
          className={`font-hud cursor-pointer text-[10px] transition-colors hover:text-text disabled:cursor-default ${isStatic ? "text-starlight" : "text-mute"}`}
        >
          <span aria-hidden className="sm:hidden">{isStatic ? "\u25A3" : "\u25A1"}</span>
          <span className="hidden sm:inline">Lightweight: {isStatic ? "on" : "off"}</span>
        </button>
        <span aria-hidden className="text-line sm:hidden">|</span>
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-haspopup="true"
          aria-label="Menu"
          title="Menu"
          className="font-hud cursor-pointer text-[12px] leading-none text-text sm:hidden"
        >
          &#9776;
        </button>
        {menuOpen ? (
          <div
            className="absolute right-0 top-full mt-2 flex min-w-32 flex-col gap-3 rounded-2xl border border-line/80 bg-surface/95 px-4 py-3 backdrop-blur-md sm:hidden"
            onKeyDown={(e) => {
              if (e.key === "Escape") setMenuOpen(false);
            }}
          >
            <Link href="/collection" className="font-hud text-[11px] text-text hover:text-starlight">
              Collection
            </Link>
            <Link href="/about" className="font-hud text-[11px] text-mute hover:text-text">
              {journey.ui.about}
            </Link>
          </div>
        ) : null}
        <span aria-hidden className="hidden text-line sm:inline">|</span>
        <Link href="/collection" className="font-hud hidden text-[10px] text-text transition-colors hover:text-starlight sm:inline">
          Collection
        </Link>
        <Link href="/about" className="font-hud hidden text-[10px] text-mute transition-colors hover:text-text sm:inline">
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
    const span = maxIdx - MIN_BEAT; // track covers beats MIN_BEAT..maxIdx
    const vh = () => Math.max(window.innerHeight, 1);
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
          if (window.location.hash !== hash && !(nearest === MIN_BEAT && !window.location.hash)) {
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
        applyProgress(MIN_BEAT + self.progress * span, false);
      },
    });

    const scrollTo = (index: number, instant = false) => {
      const top = (Math.max(MIN_BEAT, Math.min(maxIdx, index)) - MIN_BEAT) * vh();
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
      const clampedIdx = Math.max(MIN_BEAT, initialIdx);
      const top = (clampedIdx - MIN_BEAT) * vh();
      if (lenis) lenis.scrollTo(top, { immediate: true });
      else window.scrollTo({ top, behavior: "auto" });
      applyProgress(clampedIdx, true);
    } else {
      const raw = MIN_BEAT + window.scrollY / vh();
      applyProgress(Math.max(MIN_BEAT, Math.min(maxIdx, raw)), true);
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
      const idx = Math.max(MIN_BEAT, Math.min(maxIdx, base + dir));
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

      {/* Subtle museum film grain & edge vignette layered softly over 3D & VAB Portal */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-[2] overflow-hidden">
        <div className="vignette" />
        <div className="grain" />
      </div>

      {/* Lenis + GSAP ScrollTrigger story track (beats 1..23) */}
      <div ref={trackRef} className="pointer-events-none relative z-10 flex flex-col">
        {journeyBeats.map((beat, i) => (
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
