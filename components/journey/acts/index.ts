import type { ComponentType } from "react";
import { AscentScene } from "./Ascent";
import { EnterScene } from "./Enter";
import { HeroScene } from "./Hero";
import { IgnitionScene } from "./Ignition";
import type { SceneProps } from "./common";

/** beat id → scene component. Beats not listed fall back to the Stage's placeholder panel. */
export const scenes: Record<string, ComponentType<SceneProps>> = {
  hero: HeroScene,
  enter: EnterScene,
  ignition: IgnitionScene,
  "ascent-1": AscentScene,
  "ascent-2": AscentScene,
  "ascent-3": AscentScene,
  "ascent-4": AscentScene,
};
