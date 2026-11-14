import type { Metadata } from "next";
import Stage from "@/components/journey/Stage";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "The journey",
  description: site.description,
  alternates: { canonical: "/journey" },
  openGraph: { title: site.title, description: site.description, url: "/journey" },
};

export default function JourneyPage() {
  return (
    <main>
      <Stage />
    </main>
  );
}
