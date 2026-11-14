"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { registerBeat } from "@/lib/step";
import { BAR, Credit, Letterbox, Panel, VIDEO_CLS, ensureSrc, metTween, revealLines, useFootagePreload, type SceneProps } from "./common";

const REST_CLIP = {
  src: "/media/footage/ignition-rest.1080.mp4",
  mobileSrc: "/media/footage/ignition-rest.720.mp4",
  poster: "/media/footage/ignition-rest.poster.avif",
};
const T0 = 5.0; // T-0 on the beat timeline (seconds)
const COUNT = ["T-5", "T-4", "T-3", "T-2", "T-1"];

// decaying screen shake, 4 px at T-0 → 0
const SHAKE: [number, number][] = [
  [4, -3], [-4, 2], [3, 3], [-3, -2], [2, -2], [-2, 1], [1, 1], [-1, 0], [0, 0],
];

export function IgnitionScene({ beat, index }: SceneProps) {
  const clip = beat.clip!;
  const main = useRef<HTMLVideoElement>(null);
  const rest = useRef<HTMLVideoElement>(null);
  const shake = useRef<HTMLDivElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  const counts = useRef<(HTMLSpanElement | null)[]>([]);
  const liftoff = useRef<HTMLHeadingElement>(null);
  const sub = useRef<HTMLParagraphElement>(null);
  const met = useRef<HTMLParagraphElement>(null);

  useFootagePreload(
    [
      { ref: main, clip },
      { ref: rest, clip: REST_CLIP },
    ],
    index,
  );

  useEffect(
    () =>
      registerBeat("ignition", ({ el, beat: b, reducedMotion, mode }) => {
        ensureSrc(main.current, clip);
        ensureSrc(rest.current, REST_CLIP);
        const undo: (() => void)[] = [];
        const tl = gsap.timeline({ paused: true });
        const D = b.duration; // 7.0
        const cs = counts.current.filter(Boolean) as HTMLSpanElement[];

        tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: "power3.inOut" }, 0);
        // ambient pad loop underneath until the real footage takes over
        tl.fromTo(rest.current, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.5, ease: "power3.inOut" }, 0.3);
        tl.fromTo(main.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: "power3.inOut" }, 0.3);

        // countdown: one number per real second, T-0 = 5.0 s
        cs.forEach((c, i) => {
          tl.fromTo(c, { autoAlpha: 0, scale: 1.18 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: "expo.out" }, i);
          tl.to(c, { autoAlpha: 0, duration: 0.12 }, i + 0.88);
        });

        // T-0: flash 120 ms, shake, LIFTOFF, MET starts
        tl.fromTo(flash.current, { autoAlpha: 0 }, { autoAlpha: 0.85, duration: 0.02 }, T0);
        tl.to(flash.current, { autoAlpha: 0, duration: 0.1, ease: "power2.out" }, T0 + 0.02);
        const step = 0.06;
        SHAKE.forEach(([x, y], i) => tl.to(shake.current, { x, y, duration: step, ease: "none" }, T0 + i * step));
        revealLines(tl, liftoff.current, T0 + 0.1, undo, 0.8);
        tl.fromTo(sub.current, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: "expo.out" }, T0 + 0.7);
        tl.fromTo(met.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, T0);
        metTween(tl, met.current, 0, D - T0, T0, D - T0);
        if (tl.duration() < D) tl.to({}, { duration: D - tl.duration() });

        // ambient loop only while playing
        if (mode === "play" && !reducedMotion) {
          const r = rest.current;
          if (r) {
            r.loop = true;
            r.muted = true;
            r.currentTime = 0;
            r.play().catch(() => {});
          }
        }
        tl.eventCallback("onComplete", () => rest.current?.pause());
        if (reducedMotion) tl.set(rest.current, { autoAlpha: 0 }, 0.3);

        return {
          timeline: tl,
          video: main.current ?? undefined,
          cleanup: () => {
            rest.current?.pause();
            undo.forEach((u) => u());
          },
        };
      }),
    [clip],
  );

  return (
    <Panel beat={beat} index={index}>
      <div ref={shake} className="absolute -inset-2">
        <video
          ref={rest}
          muted
          loop
          playsInline
          preload="none"
          poster={REST_CLIP.poster}
          aria-hidden
          className={VIDEO_CLS}
        />
        <video
          ref={main}
          muted
          playsInline
          preload="none"
          poster={clip.poster}
          aria-hidden
          className={VIDEO_CLS}
          style={{ opacity: 0, visibility: "hidden" }}
        />
      </div>
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-void/80 to-transparent" />
      <Letterbox />

      {/* countdown */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        {COUNT.map((t, i) => (
          <span
            key={t}
            ref={(n) => {
              counts.current[i] = n;
            }}
            className="font-hud absolute text-[clamp(5rem,22vw,16rem)] font-medium leading-none"
            style={{ color: "var(--ignite)", opacity: 0, visibility: "hidden" }}
          >
            {t}
          </span>
        ))}
      </div>

      <div className="absolute inset-x-0 z-10 px-6 pr-16 sm:px-10 sm:pr-40" style={{ bottom: `calc(${BAR} + 2rem)` }}>
        <p ref={met} className="font-hud mb-3 text-[11px] text-platinum" style={{ opacity: 0, visibility: "hidden" }}>
          T+00:00:00
        </p>
        <h2
          ref={liftoff}
          className="font-display text-[clamp(2.5rem,10vw,8rem)] leading-none"
          style={{ color: "var(--ignite)", opacity: 0, visibility: "hidden" }}
        >
          {beat.title}
        </h2>
        <p ref={sub} className="font-hud mt-4 text-xs text-text" style={{ opacity: 0, visibility: "hidden" }}>
          {beat.sub}
        </p>
      </div>
      <Credit beat={beat} />
      <div ref={flash} aria-hidden className="pointer-events-none absolute inset-0 z-30 bg-spot" style={{ opacity: 0, visibility: "hidden" }} />
    </Panel>
  );
}
