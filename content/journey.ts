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
  beyond: { badge: "TEASER · 3D SILHOUETTES" },
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
