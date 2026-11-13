import { pickSources } from "./sources";

// COPY §5 — The Hall of Silence.
export const silence = {
  title: "THE HALL OF SILENCE",
  intro: "Every machine in this museum once talked to Earth. These are the last times we heard from them.",
  wall: [
    { name: "Viking 1", last: "November 1982" },
    { name: "Mars Pathfinder", last: "27 September 1997" },
    { name: "Phoenix", last: "2 November 2008" },
    { name: "Spirit", last: "22 March 2010" },
    { name: "Opportunity", last: "10 June 2018" },
    { name: "InSight", last: "December 2022", note: "mission retired 21 Dec 2022" },
    { name: "Ingenuity", last: "last flight 18 January 2024" },
    { name: "GRAIL Ebb & Flow", last: "17 December 2012", note: "planned impact" },
    { name: "Surveyor 3", last: "1967" },
    { name: "Apollo 11 reflector", last: "still answering", active: true },
  ] as { name: string; last: string; note?: string; active?: boolean }[],
  numbers: [
    { text: "NASA's catalogue of human-made material on the Moon runs 22 pages — from entire spacecraft to two golf balls.", sourceId: "S1" },
    { text: "About 7,119 kg of hardware on Mars — an independent estimate by Cagri Kilic (WVU), 2022.", sourceId: "S65" },
  ],
  // The COPY clause about "asking future visitors to keep their distance" was not checked against S13,
  // so only the document title/year are stated here (see PROGRESS.md).
  heritage: {
    text: "In 2011, NASA published recommendations to protect and preserve U.S. government lunar artifacts and historic sites. These places are a museum that already exists.",
    sourceId: "S13",
  },
  sources: pickSources(["S1", "S13", "S65"]),
};
