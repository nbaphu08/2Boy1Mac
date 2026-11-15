// "Expedition" layer (Opus, v5): written for a first-time visitor who knows nothing about the challenge.
// Every factual claim comes from docs/EXHIBITS.md / docs/COPY.md or the NASA catalogue cited below.

export const expedition = {
  // Shown once at the start of /journey (beat `enter`), above the HUD card.
  briefing: {
    eyebrow: "YOUR MISSION",
    title: "Find the machines we left behind",
    body: [
      "Since 1967, NASA has landed machines on the Moon and Mars. When their work was done, none of them came home.",
      "NASA's own catalogue of what is on the Moon says the first step in preserving these artifacts is establishing exactly what is there and where it is. That is your mission: find twelve of them.",
    ],
    honesty:
      "This voyage is imagined. Artemis II flew around the Moon in April 2026 without landing, and no person has yet been to Mars. Every machine you will find is real, and so is every fact.",
    source: "NASA History Program Office, Catalogue of Manmade Material on the Moon (2012)",
    read: "Read briefing",
    hide: "Hide briefing",
  },

  // Audio guide (AI-generated narration of the sourced scripts in docs/AUDIO_SCRIPTS.md).
  audio: {
    label: "AUDIO GUIDE",
    play: "Play audio guide",
    pause: "Pause audio guide",
    starting: "Starting in 2 s…",
    tapToListen: "Paused — tap to listen",
    autoOn: "Audio guide: on",
    autoOff: "Audio guide: off",
    autoHint: "Toggle automatic audio guide",
    region: "Audio guide player",
  },

  // Audio tour (one short AI-narrated clip per beat on /journey; same on/off preference as the audio guide).
  tour: {
    on: "Audio tour on",
    off: "Audio tour off",
    start: "Start audio tour",
    replay: "Replay this clip",
  },

  // Field log (replaces "passport" wording in the HUD).
  fieldLog: (n: number) => `FIELD LOG · ${n} OF 12 FOUND`,
  fieldLogShort: (n: number) => `${n}/12 FOUND`,
  found: "FOUND",

  // Target tracker HUD while flying low between sites (no invented distances: use a proximity bar + the real coordinates).
  tracker: {
    label: "TRACKING TARGET",
    signal: "SIGNAL",
    arrived: "TARGET IN SIGHT",
  },

  // Orbit map beats.
  moonMap: {
    label: "LUNAR ORBIT · FIVE TARGETS BELOW",
    descent: "DESCENDING TO THE SEA OF TRANQUILITY",
    touchdown: "TOUCHDOWN · SEA OF TRANQUILITY",
  },
  marsMap: {
    label: "MARS ORBIT · SEVEN TARGETS BELOW",
    entry: "ATMOSPHERIC ENTRY · HEAT SHIELD FIRST",
    touchdown: "TOUCHDOWN · CHRYSE PLANITIA",
  },

  // Exhibit card headings — the four questions a newcomer actually asks.
  questions: {
    what: "WHAT IS IT?",
    did: "WHAT DID IT DO?",
    why: "WHY IS IT STILL HERE?",
    now: "WHAT IS LEFT TODAY?",
  },
};

// Plain-language answers per exhibit. `did` and `now` reuse each exhibit's existing plaque / Then-Now captions.
const ONE_WAY_MARS =
  "No spacecraft has ever come back from Mars. Every machine sent there was built for a one-way trip.";

export const guide: Record<string, { what: string; why: string }> = {
  "moon-apollo-11": {
    what: "The bottom half of Eagle, the first crewed lunar lander, and a laser mirror placed beside it.",
    why: "Only Eagle's top half flew back to orbit. The bottom half served as its launch pad, so it had to stay.",
  },
  "moon-surveyor-3": {
    what: "A robot lander, sent to test the ground before astronauts arrived.",
    why: "Robot landers of the 1960s had no rocket to return. It was built for a one-way trip.",
  },
  "moon-apollo-15-lrv": {
    what: "An electric car built for the Moon: the first car on another world.",
    why: "Only the lander's small top half flew home, with no room for a car. The crew parked it for good.",
  },
  "moon-apollo-17": {
    what: "The base of the last crewed lander on the Moon, with its rover and experiments.",
    why: "Like every Apollo landing, only the crew cabin flew home. Everything else stayed, including the last footprints.",
  },
  "moon-grail": {
    what: "Two small craters made by twin spacecraft, Ebb and Flow, that mapped the Moon's gravity.",
    why: "When their mission ended in December 2012, NASA steered them into this mountain on purpose. What is left is scattered inside the craters.",
  },
  "mars-viking-1": {
    what: "The first American spacecraft to land on Mars.",
    why: ONE_WAY_MARS,
  },
  "mars-pathfinder": {
    what: "A lander that bounced down on airbags, and Sojourner, NASA's first Mars rover.",
    why: ONE_WAY_MARS,
  },
  "mars-spirit": {
    what: "A six-wheeled robot geologist, about the size of a golf cart.",
    why: `${ONE_WAY_MARS} Spirit ended up trapped in soft sand at a place called Troy.`,
  },
  "mars-opportunity": {
    what: "Spirit's identical twin rover, on the other side of Mars.",
    why: ONE_WAY_MARS,
  },
  "mars-phoenix": {
    what: "A lander that dug into the frozen ground of Mars's far north.",
    why: `${ONE_WAY_MARS} Phoenix was never designed to survive the polar winter.`,
  },
  "mars-insight": {
    what: "A lander that sat still and listened for marsquakes.",
    why: `${ONE_WAY_MARS} Dust slowly covered its solar panels until it ran out of power.`,
  },
  "mars-ingenuity": {
    what: "A small helicopter: the first aircraft to make a powered, controlled flight on another planet.",
    why: ONE_WAY_MARS,
  },
};

// Narration overrides for the new story (replace the same keys in `narration` in journey.ts).
export const narrationV5: Record<string, string> = {
  enter: "Your ride: a rocket taller than most buildings. Your mission: find what we left behind.",
  "deep-space": "Below us, five places where machines were left on the Moon. We land at the first.",
  transit: "Mars is seven to ten months away. Seven more machines are waiting there.",
};
