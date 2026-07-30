import fs from "node:fs";
import path from "node:path";
import { buildSong } from "@/lib/songs";
import SongList from "@/components/SongList";

export const metadata = {
    title: "About This Site | Music at Harmony",
    description:
        "Weekly part-by-part rehearsal recordings for the Harmony Baptist Church choir.",
};

interface DemoFile {
    intro: string;
    songs: { slug: string; title: string; note: string }[];
}

export default function Demo() {
    const demo = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), "public/content/demo.json"), "utf8")
    ) as DemoFile;

    const songs = demo.songs.map((s) => ({
        ...buildSong(s.slug, s.title),
        note: s.note,
    }));

    return (
        <>
            <header className="py-10 text-center text-white">
                <p className="eyebrow !text-white/80">About this site</p>
                <h1
                    className="mt-3 text-3xl leading-tight sm:text-4xl"
                    style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}
                >
                    Isolating harmony parts makes it easy for any interested person to become a vital part of our choir.
                </h1>
                <p className="mx-auto mt-4 max-w-[34em] text-white/90">{demo.intro}</p>
            </header>

            <div className="card mb-6">
                <p className="eyebrow">How to listen</p>
                <p className="mt-3">
                    To understand how this site works, start a song then switch parts as it plays. The
                    recording will keep its place, so you hear the different vocal harmony parts.
                </p>
                <p className="mt-3">
                    Sheet music and lyric slides open below each player without stopping the
                    audio, so reading and listening at the same time is optional and easy.
                </p>
            </div>

            <SongList songs={songs} />

            <div className="card">
                <p className="eyebrow">Why it matters</p>
                <p className="mt-3">
                    Some read music and some do not. Others cannot make every rehearsal. This site makes it easy to prepare for
                    Sunday morning on the drive home from work, at the computer with headphones, or out and about on the phone.
                </p>
                <p className="mt-3">
                    Not every song is in four parts. Unison and melody-driven songs are
                    posted the way we sing them. Each section gets what it actually sings.
                </p>
            </div>
        </>
    );
}
