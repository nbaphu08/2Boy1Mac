import type { TeaserItem } from "./types";
import { pickSources } from "./sources";

// COPY §6 — Hall III teaser. Silhouettes are rendered from the glb (black material + rim light).
export const teaser = {
  title: "HALL III — BEYOND · OPENING SOON",
  line: "The fleet didn't stop at Mars. Some went to other worlds. Some are still leaving.",
  voyagerNote: "On 18 November 2026, Voyager 1 reaches one light-day from Earth.",
  voyagerNoteSource: "S70",
};

export type TeaserEntry = TeaserItem & { target: string; detail: string; sourceId: string };

export const teaserItems: TeaserEntry[] = [
  { catalogNo: "SM-B-001", name: "NEAR Shoemaker", year: "2001", target: "Asteroid Eros", line: "First spacecraft to land on an asteroid", detail: "", status: "visited-target", model: "/media/models/SM-B-001_near_shoemaker.web.glb", sourceId: "S66" },
  { catalogNo: "SM-B-002", name: "MESSENGER", year: "2015", target: "Mercury", line: "Impacted the surface at mission end", detail: "", status: "visited-target", model: "/media/models/SM-B-002_messenger.web.glb", sourceId: "S67" },
  { catalogNo: "SM-B-003", name: "Cassini", year: "2017", target: "Saturn", line: "Grand Finale plunge into the atmosphere", detail: "", status: "visited-target", model: "/media/models/SM-B-003_cassini.web.glb", sourceId: "S68" },
  { catalogNo: "SM-B-004", name: "Voyager 1", year: "1977–", target: "Interstellar space", line: "STILL TRAVELLING", detail: "", status: "still-travelling", model: "/media/models/SM-B-004_voyager.web.glb", sourceId: "S69" },
];

export const teaserSources = pickSources(["S66", "S67", "S68", "S69", "S70"]);
