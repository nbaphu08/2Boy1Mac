// COPY §1 and §7 — global strings.
export const site = {
  title: "SpaceMuse — A museum of the machines we left behind",
  description:
    "An interactive museum of NASA hardware left on the Moon and Mars — from Apollo 11's laser mirror to the Ingenuity helicopter — recreated in 3D from NASA imagery and data, with every fact sourced.",
  wordmark: "SPACEMUSE",
  tagline: "A museum of the machines we left behind — on the Moon and Mars.",
  disclaimer:
    "SpaceMuse is an independent project for the NASA Space Apps Challenge 2026. It is not affiliated with or endorsed by NASA. Images courtesy of NASA and partners; see Sources & Credits.",
  siWatermark: "Illustrative 3D reconstruction · AI-assisted",
  illustrative: "3D reconstructions are illustrative, based on NASA imagery and data.",
  skip: "Skip to the galleries →",
  explore: "Explore exhibit",
  close: "Close (Esc)",
  passport: (n: number) => `Museum Passport · ${n} of 12 stamps collected`,
  certificate: (date: string) => `Certificate of Visit — ${date} — "You have visited every machine in the SpaceMuse collection."`,
  rail: ["KSC", "LAUNCH", "SPACE", "MOON", "MARS", "SILENCE", "BEYOND"],
  reducedMotion: "Motion reduced to match your system settings.",
  // Landing page (/) — hero + "About the gallery" section. Facts reuse verified strings (COPY.md, EXHIBITS.md).
  landing: {
    cta: "Visit gallery",
    scrollHint: "Scroll to learn about the museum ↓",
    eyebrow: "ABOUT THE GALLERY",
    heading: "Twelve machines we left behind — and the stories they still tell.",
    intro: [
      "Between 1967 and 2021, the twelve machines in this collection landed on the Moon and Mars: landers, rovers, a car, instruments and even a helicopter. Today they stand silent where their missions ended.",
      "All but one. A laser reflector left by Apollo 11 in 1969 still answers the lasers we fire at it from Earth.",
    ],
    routeTitle: "YOUR ROUTE",
    route: [
      { name: "Launch", text: "Ride an SLS rocket from Launch Complex 39B into space." },
      { name: "Hall I — The Moon", text: "Five exhibits, from 1967 to 2012. One small world." },
      { name: "Hall II — Mars", text: "Seven machines. Some rolled, one flew, all fell silent." },
      { name: "Hall of Silence", text: "The last time each machine talked to Earth." },
      { name: "Beyond", text: "A glimpse of the ones that kept going." },
    ],
    howTitle: "HOW TO VISIT",
    how: [
      "Scroll to fly from one exhibit to the next.",
      "Open any exhibit for its museum label, Then/Now photographs and sources.",
      "Collect a passport stamp at each of the twelve machines.",
    ],
    secondary: { collection: "Browse the collection", about: "About the project" },
  },
  // Exhibit panel extras: "How did it work?" strip, plot twist, NASA's Eyes link (data in content/exhibits.ts).
  exhibitExtras: {
    how: "HOW DID IT WORK?",
    twist: "PLOT TWIST",
    eyesTitle: "EXPLORE IT YOURSELF",
    eyesNote: "NASA's Eyes on the Solar System is a free 3D app built on real NASA mission data. Opens in a new tab.",
    eyesUrl: (id: string) => `https://eyes.nasa.gov/apps/solar-system/#/${id}`,
  },
  // Story map on /collection. Coordinates come only from content/exhibits.ts (cited NASA/PDS/LROC sources).
  map: {
    eyebrow: "STORY MAP",
    heading: "Where they rest",
    intro: "Each pin marks where a machine landed or came to rest, placed from coordinates published by NASA. Choose a pin to read its story.",
    tabs: { moon: "The Moon", mars: "Mars" },
    regions: { moon: "Near side of the Moon", mars: "Mars, from 60°S to 80°N" },
    legend: { active: "Still active", silent: "Silent", unpinned: "No published position" },
    coordinates: "Coordinates",
    coordSource: "Source",
    notPublished: "Not published",
    landed: "Landed",
    impact: "Impact",
    lastContact: "Last contact",
    young: "FOR YOUNG EXPLORERS",
    open: "Open exhibit →",
    journey: "See it in 3D →",
    unpinned: (name: string, note: string) => `${name} has no pin: ${note.charAt(0).toLowerCase()}${note.slice(1)}.`,
    credit: {
      moon: "Map: NASA Scientific Visualization Studio, CGI Moon Kit (LROC color). Equirectangular; north is up.",
      mars: "Map: NASA/JPL/USGS, Viking MDIM 2.1 color mosaic. Equirectangular; north is up.",
    },
  },
  halls: {
    moon: { name: "HALL I — THE MOON", sub: "Five exhibits, from 1967 to 2012. One small world." },
    mars: { name: "HALL II — MARS", sub: "Seven machines. Some rolled, one flew, all fell silent." },
  },
  about: {
    heading: "About SpaceMuse",
    body: "SpaceMuse treats the machines humanity left on the Moon and Mars as museum objects. Every date and number on this site comes from NASA, JPL, NSSDCA or the Smithsonian, and every exhibit lists its sources. Images come from the NASA Image and Video Library, the Lunar Reconnaissance Orbiter Camera (LROC) and HiRISE.",
    builtFor:
      "NASA Space Apps Challenge 2026 — \"Abandoned but not Forgotten: Storytelling about NASA's Discarded Equipment on the Moon and Mars.\"",
    team: "Team 2Boy1Mac (Vietnam): Nguyễn Bá Phú, Võ Bảo Duy",
    ai: "SpaceMuse was planned and built with the help of AI assistants (Anthropic Claude models and Google Gemini) for research, writing, code and procedural 3D reconstructions. All facts were checked against the primary sources listed below. Every photograph is a real NASA or partner image; the 3D scenes are illustrative reconstructions built in code from NASA dimensions and imagery; no AI-generated image is presented as real (illustrations are labelled \"Artist's concept\"). The audio tour and audio guide narration is AI-generated speech (ElevenLabs) reading our sourced scripts.",
    credits: [
      "NASA Image and Video Library",
      "NASA/GSFC/Arizona State University (LROC)",
      "NASA/JPL-Caltech/University of Arizona (HiRISE)",
      "NASA Scientific Visualization Studio (CGI Moon Kit, Deep Star Maps 2020)",
      "NASA Earth Observatory (Blue Marble)",
      "NASA/JPL/USGS (Viking MDIM 2.1 color mosaic)",
      "NASA 3D Resources",
    ],
  },
};
