// COPY §1 and §7 — global strings.
export const site = {
  title: "SpaceMuse — A museum of the machines we left behind",
  description:
    "An interactive museum of NASA hardware left on the Moon and Mars — from Apollo 11's laser mirror to the Ingenuity helicopter — told with real NASA footage, images and data.",
  wordmark: "SPACEMUSE",
  tagline: "A museum of the machines we left behind — on the Moon and Mars.",
  disclaimer:
    "SpaceMuse is an independent project for the NASA Space Apps Challenge 2026. It is not affiliated with or endorsed by NASA. Images courtesy of NASA and partners; see Sources & Credits.",
  illustrative: "3D reconstructions are illustrative, based on NASA imagery and data.",
  skip: "Skip to the galleries →",
  explore: "Explore exhibit",
  close: "Close (Esc)",
  passport: (n: number) => `Museum Passport · ${n} of 12 stamps collected`,
  certificate: (date: string) => `Certificate of Visit — ${date} — "You have visited every machine in the SpaceMuse collection."`,
  rail: ["KSC", "LAUNCH", "SPACE", "MOON", "MARS", "SILENCE", "BEYOND"],
  reducedMotion: "Motion reduced to match your system settings.",
  halls: {
    moon: { name: "HALL I — THE MOON", sub: "Five exhibits, from 1967 to 2012. One small world." },
    mars: { name: "HALL II — MARS", sub: "Seven machines. Some rolled, one flew, all fell silent." },
  },
  about: {
    heading: "About SpaceMuse",
    body: "SpaceMuse treats the machines humanity left on the Moon and Mars as museum objects. Every date and number on this site comes from NASA, JPL, NSSDCA or the Smithsonian, and every exhibit lists its sources. Footage and images come from the NASA Image and Video Library, the Lunar Reconnaissance Orbiter Camera (LROC) and HiRISE.",
    builtFor:
      "NASA Space Apps Challenge 2026 — \"Abandoned but not Forgotten: Storytelling about NASA's Discarded Equipment on the Moon and Mars.\"",
    team: "2Boy1Mac",
    ai: "SpaceMuse was planned and built with the help of AI assistants (Anthropic's Claude models) for research, writing and code. All facts were checked against the primary sources listed below. No AI-generated images or footage are used; every image is a real NASA or partner image unless labelled \"Artist's concept\".",
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
