export type Exhibit = {
  slug: string;
  catalogNo: string; // 'SM-M-004'
  hall: "moon" | "mars";
  order: number;
  name: string;
  formalName: string;
  type: "lander" | "rover" | "helicopter" | "descent-stage" | "experiment" | "impact-site";
  agency: string;
  status: "silent" | "still-active";
  dates: { launch?: string; landing: string; lastContact?: string; missionEnd?: string }; // ISO 8601
  location: { site: string; lat: number; lon: number };
  stats: { label: string; value: string; sourceId: string }[];
  plaque: string; // <= 60 words
  story: string[];
  discoveries: string[];
  whySilent: string;
  youngExplorer: string;
  curatorNotes?: string;
  vitrine?: { title: string; items: { name: string; text: string; sourceId: string }[] };
  media: {
    model?: string;
    fallbackImage: string;
    then: { src: string; alt: string; credit: string };
    now?: { src: string; alt: string; credit: string };
  };
  sources: { id: string; title: string; url: string; publisher: string }[];
  verified: boolean;
};

export type Beat = {
  id: string;
  act: "earth" | "ascent" | "halls" | "epilogue";
  rail: "KSC" | "LAUNCH" | "SPACE" | "MOON" | "MARS" | "SILENCE" | "BEYOND";
  duration: number; // seconds (0 = rest frame only)
  clip?: { src: string; mobileSrc: string; poster: string; nasaId: string; credit: string };
  exhibitSlug?: string;
  caption?: string;
  sub?: string; // small HUD / label line
  title?: string; // large on-screen title
  hud?: { met?: string; alt?: string; vel?: string; sourceId?: string };
};

export type TeaserItem = {
  catalogNo: string; // 'SM-B-001'
  name: string;
  year: string;
  line: string;
  status: "visited-target" | "still-travelling";
  model: string;
};
