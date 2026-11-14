import type { Beat } from "./types";

// 24 beats, index 0–23, per PLAN §3.2. Text from docs/COPY.md §2.
export const beats: Beat[] = [
  { // 0
    id: "hero", act: "earth", rail: "KSC", duration: 0,
    title: "SPACEMUSE",
    caption: "A museum of the machines we left behind",
    sub: "KENNEDY SPACE CENTER · FLORIDA",
  },
  { // 1
    id: "enter", act: "earth", rail: "KSC", duration: 3.0,
    caption: "Every journey to another world begins here.",
    sub: "SPACE LAUNCH SYSTEM · ORION",
  },
  { // 2
    id: "ignition", act: "earth", rail: "LAUNCH", duration: 7.0,
    title: "LIFTOFF",
    sub: "ARTEMIS II · 1 APR 2026 · 6:35 P.M. EDT",
  },
  { // 3
    id: "ascent-1", act: "ascent", rail: "LAUNCH", duration: 3.5,
    caption: "8.8 million pounds of thrust. Four astronauts on board.",
  },
  { // 4
    id: "ascent-2", act: "ascent", rail: "LAUNCH", duration: 3.5,
    caption: "Max-Q — about 90 seconds in, the moment of greatest aerodynamic stress.",
  },
  { // 5
    id: "ascent-3", act: "ascent", rail: "LAUNCH", duration: 3.5,
    caption: "About two minutes in, the side boosters fall away.",
  },
  { // 6
    id: "ascent-4", act: "ascent", rail: "SPACE", duration: 4.0,
    title: "WELCOME TO SPACE",
    caption: "Above 100 km — a widely used boundary of space.",
  },
  { // 7
    id: "deep-space", act: "halls", rail: "SPACE", duration: 4.0,
    title: "HALL I — THE MOON",
    caption: "Five exhibits, from 1967 to 2012. One small world.",
    sub: "384,400 KM FROM EARTH",
  },
  { // 8
    id: "moon-apollo-11", act: "halls", rail: "MOON", duration: 3.5,
    exhibitSlug: "moon-apollo-11",
    sub: "SM-L-001 · APOLLO 11",
  },
  { // 9
    id: "moon-surveyor-3", act: "halls", rail: "MOON", duration: 3.0,
    exhibitSlug: "moon-surveyor-3",
    sub: "SM-L-002 · SURVEYOR 3",
  },
  { // 10
    id: "moon-apollo-15-lrv", act: "halls", rail: "MOON", duration: 3.0,
    exhibitSlug: "moon-apollo-15-lrv",
    sub: "SM-L-003 · APOLLO 15 LRV",
  },
  { // 11
    id: "moon-apollo-17", act: "halls", rail: "MOON", duration: 3.0,
    exhibitSlug: "moon-apollo-17",
    sub: "SM-L-004 · APOLLO 17",
  },
  { // 12
    id: "moon-grail", act: "halls", rail: "MOON", duration: 3.0,
    exhibitSlug: "moon-grail",
    sub: "SM-L-005 · GRAIL",
  },
  { // 13
    id: "transit", act: "halls", rail: "MARS", duration: 4.0,
    title: "HALL II — MARS",
    caption: "Seven machines. Some rolled, one flew, all fell silent.",
    sub: "7 TO 10 MONTHS OF TRAVEL",
  },
  { // 14
    id: "mars-viking-1", act: "halls", rail: "MARS", duration: 3.5,
    exhibitSlug: "mars-viking-1",
    sub: "SM-M-001 · VIKING 1",
  },
  { // 15
    id: "mars-pathfinder", act: "halls", rail: "MARS", duration: 3.0,
    exhibitSlug: "mars-pathfinder",
    sub: "SM-M-002 · PATHFINDER",
  },
  { // 16
    id: "mars-spirit", act: "halls", rail: "MARS", duration: 3.0,
    exhibitSlug: "mars-spirit",
    sub: "SM-M-003 · SPIRIT",
  },
  { // 17
    id: "mars-opportunity", act: "halls", rail: "MARS", duration: 3.0,
    exhibitSlug: "mars-opportunity",
    sub: "SM-M-004 · OPPORTUNITY",
  },
  { // 18
    id: "mars-phoenix", act: "halls", rail: "MARS", duration: 3.0,
    exhibitSlug: "mars-phoenix",
    sub: "SM-M-005 · PHOENIX",
  },
  { // 19
    id: "mars-insight", act: "halls", rail: "MARS", duration: 3.0,
    exhibitSlug: "mars-insight",
    sub: "SM-M-006 · INSIGHT",
  },
  { // 20
    id: "mars-ingenuity", act: "halls", rail: "MARS", duration: 3.0,
    exhibitSlug: "mars-ingenuity",
    sub: "SM-M-007 · INGENUITY",
  },
  { // 21
    id: "silence", act: "epilogue", rail: "SILENCE", duration: 3.0,
    title: "THE HALL OF SILENCE",
  },
  { // 22
    id: "beyond", act: "epilogue", rail: "BEYOND", duration: 3.5,
    title: "HALL III — BEYOND",
    caption: "The fleet didn't stop at Mars. Some went to other worlds. Some are still leaving.",
    sub: "OPENING SOON",
  },
  { // 23
    id: "finale", act: "epilogue", rail: "BEYOND", duration: 3.0,
    caption: "In April 2026, four astronauts flew around the Moon — farther from Earth than any humans before them. The next crews to land will walk past what we left behind.",
  },
];

export const beatIndexById = (id: string) => beats.findIndex((b) => b.id === id);
