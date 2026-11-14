import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };

async function thenImage(src: string): Promise<string | null> {
  try {
    const file = src.replace(/\.avif$/, ".jpg");
    const buf = await readFile(path.join(process.cwd(), "public", file));
    return `data:image/jpeg;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function renderOg(opts: { kicker: string; title: string; sub: string; thenSrc?: string; note?: string }) {
  const img = opts.thenSrc ? await thenImage(opts.thenSrc) : null;
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#04060B", color: "#E8ECF4", position: "relative" }}>
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" width={640} height={630} style={{ position: "absolute", right: 0, top: 0, width: 640, height: 630, objectFit: "cover", opacity: 0.85 }} />
        ) : null}
        <div style={{ position: "absolute", right: 0, top: 0, width: 640, height: 630, background: "linear-gradient(90deg, #04060B 0%, rgba(4,6,11,0.2) 60%, rgba(4,6,11,0.1) 100%)" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, width: 760, height: "100%", position: "relative" }}>
          <div style={{ fontSize: 28, letterSpacing: 10, color: "#C7CDD8", fontWeight: 700 }}>SPACEMUSE</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 26, letterSpacing: 4, color: "#9DB8FF", marginBottom: 18 }}>{opts.kicker}</div>
            <div style={{ fontSize: opts.title.length > 22 ? 68 : 84, fontWeight: 700, lineHeight: 1.05 }}>{opts.title}</div>
            <div style={{ fontSize: 28, color: "#8089A0", marginTop: 24, lineHeight: 1.3 }}>{opts.sub}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {opts.note ? <div style={{ fontSize: 18, color: "#9DB8FF", letterSpacing: 3, marginBottom: 8 }}>{opts.note}</div> : null}
            <div style={{ fontSize: 20, color: "#8089A0", letterSpacing: 2 }}>NASA SPACE APPS CHALLENGE 2026</div>
          </div>
        </div>
      </div>
    ),
    { ...ogSize },
  );
}
