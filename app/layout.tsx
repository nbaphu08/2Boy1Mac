// Built with AI assistance (Claude, Gemini). See AI_DISCLOSURE.md.
import type { Metadata, Viewport } from "next";
import { Archivo, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { site } from "@/content/site";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://spacemuse.vercel.app"),
  title: { default: site.title, template: "%s — SpaceMuse" },
  description: site.description,
  applicationName: "SpaceMuse",
  openGraph: {
    type: "website",
    siteName: "SpaceMuse",
    title: site.title,
    description: site.description,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: site.title, description: site.description },
};

export const viewport: Viewport = { themeColor: "#04060B" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${inter.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-void text-text">
        {children}
        <footer className="font-hud px-6 py-4 text-[11px] leading-relaxed text-mute normal-case tracking-normal">
          {site.disclaimer} {site.illustrative}
        </footer>
      </body>
    </html>
  );
}
