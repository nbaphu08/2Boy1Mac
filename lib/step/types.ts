import type gsap from "gsap";
import type { Beat } from "@/content/types";

export type BeatContext = {
  beat: Beat;
  index: number;
  /** The beat's full-screen panel (`[data-beat="<id>"]`). The engine makes it visible and stacks it on top before calling the factory. */
  el: HTMLElement;
  /** "play" = forward segment about to play. "rest" = engine will jump the timeline to its end (rewind / warp / hash load / reduced motion). */
  mode: "play" | "rest";
  reducedMotion: boolean;
};

export type BeatSegment = {
  /** A PAUSED timeline. Its end state (progress 1) must be the beat's rest frame. */
  timeline: gsap.core.Timeline;
  /** Optional footage. The engine plays it; the beat rests when the timeline is complete AND the video has ended (or stalled 2.5 s / failed). */
  video?: HTMLVideoElement;
  /** Called when the engine leaves this beat or rebuilds it. */
  cleanup?: () => void;
};

export type BeatFactory = (ctx: BeatContext) => BeatSegment;

export type TransitionKind = "segment" | "rewind" | "warp" | "fade";
