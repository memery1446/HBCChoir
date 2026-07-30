import type { Metadata } from "next";
import Nav from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Music at Harmony",
  description:
      "Weekly music, part-by-part rehearsal recordings, and essays from Harmony Baptist Church, Andalusia, Alabama.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
      <html lang="en">
      <body>
      <Nav />
      <main className="mx-auto max-w-[860px] px-5 pb-20">{children}</main>
      <footer className="pb-10 text-center text-[0.85rem] text-white/80">
          Built and maintained by Mark A. Emery for Harmony Baptist Church &middot; Andalusia, Alabama
      </footer>
      </body>
      </html>
  );
}
