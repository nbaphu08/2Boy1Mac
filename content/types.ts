export type SourceRef = { id: string; title: string; url: string; publisher: string };

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
  statusLabel?: string; // badge text override, e.g. "IMPACT SITE"
  location: { site: string; lat?: number; lon?: number }; // coordinates only where COPY gives them
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
    extra?: { src: string; alt: string; credit: string }[]; // additional Then images (e.g. final selfie)
  };
  sources: SourceRef[];
  verified: boolean;
};

export type Beat = {
  id: string;
  act: "earth" | "ascent" | "halls" | "epilogue";
  rail: "KSC" | "LAUNCH" | "SPACE" | "MOON" | "MARS" | "SILENCE" | "BEYOND";
  duration: number; // seconds (0 = rest frame only)
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
