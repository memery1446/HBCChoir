import fs from "node:fs";
import path from "node:path";
import { buildSong } from "@/lib/songs";
import SongList from "@/components/SongList";

export const metadata = {
    title: "Homecoming Sunday Choir Special | Music at Harmony",
};

interface File {
    intro: string;
    songs: { slug: string; title: string; note: string }[];
}

export default function Homecoming() {
    const data = JSON.parse(
        fs.readFileSync(
            path.join(process.cwd(), "public/content/homecoming.json"),
            "utf8"
        )
    ) as File;

    const songs = data.songs.map((s) => ({
        ...buildSong(s.slug, s.title),
        note: s.note,
    }));

    return (
        <>
            <header className="py-10 text-center text-white">
                <p className="eyebrow !text-white/80">Homecoming Sunday</p>
                <h1
                    className="mt-3 text-3xl leading-tight sm:text-4xl"
                    style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}
                >
                    Choir Special
                </h1>
                <p className="mx-auto mt-4 max-w-[34em] text-white/90">{data.intro}</p>
            </header>

            <SongList songs={songs} />
        </>
    );
}
