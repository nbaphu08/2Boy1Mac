import { renderOg, ogSize } from "@/lib/og";
import { site } from "@/content/site";

export const alt = "SpaceMuse — A museum of the machines we left behind";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return renderOg({
    kicker: "THE MOON · MARS",
    title: "A museum of the machines we left behind",
    sub: site.tagline,
    thenSrc: "/media/thennow/SM-L-001_then_as11-40-5948-1600.jpg",
  });
}
