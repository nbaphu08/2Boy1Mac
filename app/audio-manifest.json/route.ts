import { readdirSync } from "node:fs";
import { join } from "node:path";

// Built once at build time: which narration files exist in public/media/audio.
// Lets the client skip missing files without a 404 in the console.

export function GET() {
  let slugs: string[] = [];
  try {
    slugs = readdirSync(join(process.cwd(), "public", "media", "audio"))
      .filter((f) => f.endsWith(".mp3"))
      .map((f) => f.slice(0, -4));
  } catch {
    /* folder missing: no audio yet */
  }
  return Response.json({ slugs });
}
