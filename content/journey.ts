// Single source for every user-visible string in the journey overlays and HUD.
// Components read from here only. Numbers/dates must trace to docs/COPY.md or docs/EXHIBITS.md.

export type AscentHud = { event: string; met: string; sys: string; thrust: string };

export const journey = {
  hero: {
    location: "VEHICLE ASSEMBLY BUILDING · HIGH BAY 3",
    admission: "ADMISSION FREE · EST. VISIT 10 MIN",
    scrollHint: "Scroll to enter VAB & launchpad ↓",
  },
  enter: {
    location: "PAD LC-39B · SLS BLOCK 1 ON MOBILE LAUNCHER",
  },
  ignition: {
    event: "MAIN ENGINE START · ROFI SPARK IGNITION",
    telemetryTitle: "PROPULSION TELEMETRY",
    core: "CORE: 4× RS-25 · LIQUID HYDROGEN / LIQUID OXYGEN",
    boosters: "BOOSTERS: 2× 5-SEG RSRMV SOLID",
  },
  ascent: {
    "ascent-1": {
      event: "CLEAR THE TOWER",
      met: "LIFTOFF",
      sys: "4× RS-25 + 2× RSRMV ACTIVE",
      thrust: "39.1 MN · 8.8 MILLION LB THRUST · PITCH & ROLL PROGRAM",
    },
    "ascent-2": {
      event: "MAX-Q · SUPERSONIC",
      met: "ABOUT 90 SECONDS",
      sys: "PEAK AERODYNAMIC STRESS",
      thrust: "CORE THROTTLE BUCKET · PEAK AERODYNAMIC PRESSURE",
    },
    "ascent-3": {
      event: "BOOSTER SEPARATION",
      met: "ABOUT 2 MINUTES",
      sys: "BOOSTER SEPARATION MOTORS FIRE",
      thrust: "SRB JETTISON · CORE STAGE CONTINUES",
    },
    "ascent-4": {
      event: "EDGE OF SPACE",
      met: "ABOVE 100 KM",
      sys: "ESM FAIRING & LAS JETTISON",
      thrust: "ORION MPCV EXPOSED TO VACUUM",
    },
  } as Record<string, AscentHud>,
  hall: {
    // Moon hall title beat (deep-space). TRANS-LUNAR INJECTION dropped: no separate transit-to-Moon label exists.
    "deep-space": "SOLAR ARRAYS DEPLOYED",
    transit: "INTERPLANETARY CRUISE · 7 TO 10 MONTHS",
  } as Record<string, string>,
  exhibit: {
    hallMoon: "HALL I · THE MOON",
    hallMars: "HALL II · MARS",
    stillActive: "STILL ACTIVE",
    silent: "SILENT",
    stamp: "◉ Stamp collected",
  },
  silence: { eyebrow: "EPILOGUE" },
  beyond: { badge: "TEASER · 3D SILHOUETTES", hint: "Hover or focus a silhouette", soon: "OPENING SOON" },
  finale: {
    eyebrow: "ARTEMIS ERA EARTHRISE · 6 APR 2026",
    revisit: "Revisit the galleries →",
    sources: "Sources & Credits",
    back: "Back to launchpad ↑",
  },
  ui: {
    stamps: (n: number) => `${n}/12 STAMPS`,
    gallery: "Gallery",
    about: "About",
    navLabel: "Museum navigation",
    railLabel: "Mission progress",
    goTo: (name: string) => `Go to ${name}`,
  },
} as const;

// O-2 narration layer (Opus). One "audio-guide" line per beat, shown when the camera settles.
// Every factual claim is sourced in docs/STORY.md (S# → docs/COPY.md Sources).
// GRAIL beat: DOM button + label for the AG-10 simulation (illustrative, time-compressed).
export const grailSim = {
  replay: "Replay simulation",
  note: "Simulation · time compressed · gravity map: NASA/ARC-MIT/JPL-Caltech/GSFC",
};

export const narration: Record<string, string> = {
  hero: "Every machine in this museum began as a promise made on this coast.",
  enter: "Inside, a rocket taller than most buildings waits for the people it will carry.",
  ignition: "1 April 2026, 6:35 p.m. Four astronauts are about to fly farther than anyone before them.",
  "ascent-1": "8.8 million pounds of thrust lift the rocket off Launch Complex 39B.",
  "ascent-2": "About ninety seconds in, the air pushes back harder than at any other moment.",
  "ascent-3": "About two minutes up, the twin boosters fall away. Their work is done.",
  "ascent-4": "Above 100 kilometers, the sky is black. Behind us, the whole blue planet.",
  "deep-space": "The Moon averages 384,400 kilometers away. People last walked there in 1972.",
  "moon-apollo-11": "July 1969. Two people walked here. One instrument they left behind still answers our lasers.",
  "moon-surveyor-3": "A robot landed here in 1967. Two and a half years later, astronauts came to visit it.",
  "moon-apollo-15-lrv": "The first car on another world, parked so Earth could watch its crew leave.",
  "moon-apollo-17": "December 1972. The last footprints on the Moon — still visible from orbit.",
  "moon-grail": "Twin spacecraft mapped the Moon's gravity, then flew into this mountain on purpose.",
  transit: "Where we could not yet go ourselves, we sent machines. Mars is seven to ten months away.",
  "mars-viking-1": "July 1976. The first American spacecraft on Mars photographed its own foot.",
  "mars-pathfinder": "It bounced in on airbags. Its little rover was planned to work for a week; it lasted 83 days.",
  "mars-spirit": "Stuck in soft sand at a place called Troy, Spirit kept doing science where it stood.",
  "mars-opportunity": "Built for 90 days. It drove 45.16 kilometers over more than 14 years.",
  "mars-phoenix": "It touched water ice and watched snow fall — then the polar winter came.",
  "mars-insight": "It never moved. It listened, and felt 1,319 marsquakes.",
  "mars-ingenuity": "Built to try five flights. It flew seventy-two.",
  silence: "Every machine here once talked to Earth. These are the last times we heard them.",
  beyond: "Some kept going. Voyager 1 is still talking to us from interstellar space.",
  finale: "In April 2026, four astronauts flew around the Moon. The next crews will walk past what we left.",
};

export const transitTimeline = [
  { year: 1976, name: "Viking 1" },
  { year: 1997, name: "Pathfinder" },
  { year: 2004, name: "Spirit & Opportunity" },
  { year: 2008, name: "Phoenix" },
  { year: 2018, name: "InSight" },
  { year: 2021, name: "Ingenuity" },
];
