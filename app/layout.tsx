import type { Metadata, Viewport } from "next";
import { Archivo, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

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
  title: "SpaceMuse — A museum of the machines we left behind",
  description:
    "An interactive museum of NASA hardware left on the Moon and Mars — from Apollo 11's laser mirror to the Ingenuity helicopter — told with real NASA footage, images and data.",
};

export const viewport: Viewport = { themeColor: "#04060B" };

const DISCLAIMER =
  "SpaceMuse is an independent project for the NASA Space Apps Challenge 2026. It is not affiliated with or endorsed by NASA. Images and footage courtesy of NASA and partners; see Sources & Credits.";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${inter.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-void text-text">
        {children}
        <footer className="font-hud px-6 py-4 text-[11px] leading-relaxed text-mute normal-case tracking-normal">
          {DISCLAIMER}
        </footer>
      </body>
    </html>
  );
}
