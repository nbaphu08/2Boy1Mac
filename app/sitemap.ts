import type { MetadataRoute } from "next";
import { exhibits } from "@/content/exhibits";

const base = "https://spacemuse.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/gallery`, priority: 0.8 },
    { url: `${base}/about`, priority: 0.5 },
    ...exhibits.map((e) => ({ url: `${base}/exhibit/${e.slug}`, priority: 0.7 })),
  ];
}
