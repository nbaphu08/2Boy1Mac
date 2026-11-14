"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { registerBeat } from "@/lib/step";
import { BAR, Credit, Letterbox, Panel, VIDEO_CLS, ensureSrc, revealLines, useFootagePreload, type SceneProps } from "./common";

export function EnterScene({ beat, index }: SceneProps) {
  const clip = beat.clip!;
  const video = useRef<HTMLVideoElement>(null);
  const still = useRef<HTMLDivElement>(null);
  const edge = useRef<HTMLDivElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const bot = useRef<HTMLDivElement>(null);
  const caption = useRef<HTMLParagraphElement>(null);
  const chip = useRef<HTMLParagraphElement>(null);

  useFootagePreload([{ ref: video, clip }], index);

  useEffect(
    () =>
      registerBeat("enter", ({ el, beat: b, reducedMotion }) => {
        ensureSrc(video.current, clip);
        const undo: (() => void)[] = [];
        const tl = gsap.timeline({ paused: true });
        const D = b.duration; // 3.0

        tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: "power3.inOut" }, 0);
        // letterbox slides in
        tl.fromTo([top.current, bot.current], { scaleY: 0 }, { scaleY: 1, duration: 0.8, ease: "power3.inOut" }, 0);
        // dolly through the open doors (still), edge blur grows, then crossfade to the footage
        tl.fromTo(still.current, { scale: 1 }, { scale: 1.45, duration: D * 0.6, ease: "power3.inOut" }, 0);
        tl.fromTo(edge.current, { opacity: 0 }, { opacity: 1, duration: D * 0.5, ease: "power3.inOut" }, 0);
        tl.fromTo(video.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.9, ease: "power3.inOut" }, D * 0.4);
        tl.to(still.current, { autoAlpha: 0, duration: 0.9, ease: "power3.inOut" }, D * 0.4);
        tl.to(edge.current, { opacity: 0, duration: 0.9 }, D * 0.5);
        // text after ~70% of the camera motion
        revealLines(tl, caption.current, D * 0.7, undo);
        tl.fromTo(chip.current, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: "expo.out" }, D * 0.7 + 0.25);
        if (reducedMotion) tl.set(video.current, { autoAlpha: 0 }, 0).set(still.current, { autoAlpha: 1, scale: 1 }, 0);
        return { timeline: tl, video: video.current ?? undefined, cleanup: () => undo.forEach((u) => u()) };
      }),
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
        className={VIDEO_CLS}
        style={{ opacity: 0, visibility: "hidden" }}
      />
      <div ref={still} className="absolute inset-0 origin-center will-change-transform">
        <picture>
          <source media="(max-width: 768px)" srcSet="/media/images/enter_vab_doors_open-1280.avif" type="image/avif" />
          <source media="(max-width: 768px)" srcSet="/media/images/enter_vab_doors_open-1280.jpg" type="image/jpeg" />
          <source srcSet="/media/images/enter_vab_doors_open-2560.avif" type="image/avif" />
          <img
            src="/media/images/enter_vab_doors_open-2560.jpg"
            alt="The open doors of the Vehicle Assembly Building"
            decoding="async"
            className="h-full w-full object-cover"
          />
        </picture>
      </div>
      <div
        ref={edge}
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0"
        style={{
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          maskImage: "radial-gradient(ellipse at center, transparent 40%, #000 95%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, transparent 40%, #000 95%)",
        }}
      />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-void/80 to-transparent" />
      <Letterbox topRef={top} botRef={bot} />

      <div className="absolute inset-x-0 z-10 px-6 pr-16 sm:px-10 sm:pr-40" style={{ bottom: `calc(${BAR} + 2rem)` }}>
        <p ref={chip} className="font-hud mb-3 text-[11px] text-platinum" style={{ opacity: 0, visibility: "hidden" }}>
          {beat.sub}
        </p>
        <p
          ref={caption}
          className="font-display max-w-3xl text-[clamp(1.5rem,4.5vw,3.25rem)] leading-tight"
          style={{ opacity: 0, visibility: "hidden" }}
        >
          {beat.caption}
        </p>
      </div>
      <Credit beat={beat} />
    </Panel>
  );
}
