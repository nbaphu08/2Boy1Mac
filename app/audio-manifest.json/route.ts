import { readdirSync } from "node:fs";
import { join } from "node:path";

// Built once at build time: which narration files exist in public/media/audio.
// Lets the client skip missing files without a 404 in the console.

export function GET() {
  const list = (...dir: string[]) => {
    try {
      return readdirSync(join(process.cwd(), "public", "media", "audio", ...dir))
        .filter((f) => f.endsWith(".mp3"))
        .map((f) => f.slice(0, -4));
    } catch {
      return []; // folder missing: no audio yet
    }
  };
  // slugs: exhibit clips (audio/<slug>.mp3); tour: audio-tour clips (audio/tour/<beatId>.mp3)
  return Response.json({ slugs: list(), tour: list("tour") });
}
