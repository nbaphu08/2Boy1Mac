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
        className={`font-hud flex items-center gap-2.5 whitespace-nowrap text-[12px] uppercase tracking-[0.28em] text-white sm:text-[13px]`}
        style={{ textShadow: "0 1px 10px rgba(4,6,11,0.85), 0 0 2px rgba(4,6,11,0.9)" }}
      >
        <span>{label}</span>
        <span aria-hidden className={reducedMotion ? "" : "sm-scroll-cue-arrow"}>
          ↓
        </span>
      </div>
      <style>{`
        @keyframes smCueArrow { 0%,100% { transform: translateY(-2px) } 50% { transform: translateY(3px) } }
        .sm-scroll-cue-arrow { display: inline-block; animation: smCueArrow 1.6s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
