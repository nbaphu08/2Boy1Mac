"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { registerBeat } from "@/lib/step";
import { BAR, Credit, Letterbox, Panel, VIDEO_CLS, ensureSrc, metTween, revealLines, useFootagePreload, type SceneProps } from "./common";

/**
 * HUD: event name + MET only (PLAN §3.2: no altitude / velocity numbers).
 * MET is anchored to COPY captions: Max-Q "about 90 seconds", booster sep "about two minutes". ascent-4 shows no clock.
 * `from`/`to` are seconds after T-0. See docs/CHANGE_REQUESTS.md.
 */
const HUD: Record<string, { event: string; met?: [number, number] }> = {
  "ascent-1": { event: "CLEAR THE TOWER", met: [2, 5.5] },
  "ascent-2": { event: "MAX-Q", met: [86.5, 90] },
  "ascent-3": { event: "BOOSTER SEPARATION", met: [116.5, 120] },
  "ascent-4": { event: "EDGE OF SPACE" },
};

export function AscentScene({ beat, index }: SceneProps) {
  const clip = beat.clip!;
  const hud = HUD[beat.id];
  const video = useRef<HTMLVideoElement>(null);
  const hudEl = useRef<HTMLDivElement>(null);
  const met = useRef<HTMLSpanElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const caption = useRef<HTMLParagraphElement>(null);

  useFootagePreload([{ ref: video, clip }], index);

  useEffect(
    () =>
      registerBeat(beat.id, ({ el, beat: b }) => {
        ensureSrc(video.current, clip);
        const undo: (() => void)[] = [];
        const tl = gsap.timeline({ paused: true });
        const D = b.duration;
        const T = D * 0.7;

        tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: "power3.inOut" }, 0);
        tl.fromTo(video.current, { scale: 1.04 }, { scale: 1, duration: D, ease: "power3.inOut" }, 0);
        tl.fromTo(hudEl.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 0.2);
        if (hud?.met) metTween(tl, met.current, hud.met[0], hud.met[1], 0, D);
        if (title.current) revealLines(tl, title.current, T, undo, 1);
        revealLines(tl, caption.current, T + (title.current ? 0.3 : 0), undo);
        if (tl.duration() < D) tl.to({}, { duration: D - tl.duration() });
        return { timeline: tl, video: video.current ?? undefined, cleanup: () => undo.forEach((u) => u()) };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clip],
  );

  return (
    <Panel beat={beat} index={index}>
      <video
        ref={video}
        muted
        playsInline
        preload="none"
        poster={clip.poster}
        aria-hidden
        className={`${VIDEO_CLS} origin-center`}
      />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-void/85 to-transparent" />
      <Letterbox />

      <div
        ref={hudEl}
        className="font-hud absolute left-6 z-10 flex flex-col gap-1 text-[11px] text-platinum sm:left-10"
        style={{ bottom: `calc(${BAR} + 1.25rem)`, opacity: 0, visibility: "hidden" }}
      >
        <span className="text-text">{hud?.event}</span>
        {hud?.met ? <span ref={met}>T+00:00:00</span> : <span>ABOVE 100 KM</span>}
      </div>

      <div
        className="absolute inset-x-0 z-10 px-6 pr-16 sm:left-auto sm:right-16 sm:w-[min(30rem,45vw)] sm:px-0 sm:pr-0"
        style={{ bottom: `calc(${BAR} + 4.5rem)` }}
      >
        {beat.title ? (
          <h2
            ref={title}
            className="font-display mb-4 text-[clamp(1.75rem,5vw,3.5rem)] leading-tight"
            style={{ opacity: 0, visibility: "hidden" }}
          >
            {beat.title}
          </h2>
        ) : null}
        <p ref={caption} className="text-base text-text sm:text-lg" style={{ opacity: 0, visibility: "hidden" }}>
          {beat.caption}
        </p>
      </div>
      <Credit beat={beat} />
    </Panel>
  );
}
