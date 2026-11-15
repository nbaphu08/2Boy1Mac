"use client";

import { useEffect, useState } from "react";
import { expedition } from "@/content/guide";
import { scrollState } from "@/lib/scroll/progress";
import { useMuseum } from "@/lib/store";

// Shown once per visit, only on the first beat of /journey, until the visitor's first scroll.
let dismissedThisVisit = false;

export function ScrollCue() {
  const [visible, setVisible] = useState(false);
  const [touch, setTouch] = useState(false);
  const reducedMotion = useMuseum((s) => s.reducedMotion);

  useEffect(() => {
    if (dismissedThisVisit) return;

    let raf = 0;
    const hide = () => {
      dismissedThisVisit = true;
      setVisible(false);
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", hide);
      window.removeEventListener("touchmove", hide);
      window.removeEventListener("keydown", onKey);
    };
    const onKey = (e: KeyboardEvent) => {
      if (["PageDown", "PageUp", "ArrowDown", "ArrowUp", " ", "Home", "End"].includes(e.key)) hide();
    };
    const tick = () => {
      // Any movement away from the first beat (scroll, auto tour, map jump) dismisses it for good.
      if (Math.abs(scrollState.current - 1) > 0.03 || Math.abs(scrollState.target - 1) > 0.03) {
        hide();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    const show = window.setTimeout(() => {
      if (dismissedThisVisit || Math.abs(scrollState.current - 1) > 0.03) return;
      setTouch(window.matchMedia("(pointer: coarse)").matches);
      setVisible(true);
      raf = requestAnimationFrame(tick);
    }, 700);

    window.addEventListener("wheel", hide, { passive: true });
    window.addEventListener("touchmove", hide, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(show);
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", hide);
      window.removeEventListener("touchmove", hide);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!visible) return null;
  const label = touch ? expedition.scrollCue.touch : expedition.scrollCue.pointer;
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed left-1/2 top-[21rem] z-30 -translate-x-1/2 sm:top-[5.4rem]"
    >
      <div
        className={`font-hud flex items-center gap-2.5 whitespace-nowrap rounded-full border border-starlight/50 bg-void/70 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-starlight shadow-[0_0_24px_rgba(157,184,255,0.25)] backdrop-blur-md sm:px-5 sm:text-xs ${reducedMotion ? "" : "sm-scroll-cue"}`}
      >
        <span>{label}</span>
        <span aria-hidden className={reducedMotion ? "" : "sm-scroll-cue-arrow"}>
          ↓
        </span>
      </div>
      <style>{`
        @keyframes smCuePulse { 0%,100% { opacity: .45 } 50% { opacity: 1 } }
        @keyframes smCueArrow { 0%,100% { transform: translateY(-2px) } 50% { transform: translateY(3px) } }
        .sm-scroll-cue { animation: smCuePulse 1.6s ease-in-out infinite; }
        .sm-scroll-cue-arrow { display: inline-block; animation: smCueArrow 1.6s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
