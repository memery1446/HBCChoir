"use client";

import { useState } from "react";
import type { Song } from "@/lib/types";
import { useTrackPlayer } from "@/lib/useTrackPlayer";
import PartPlayer from "./PartPlayer";
import MusicPanel, { type Kind } from "./MusicPanel";

const SHEET_DIR = "/sheet-music-images/";

/** The demo page adds a one-line note under the title. Sunday does not. */
type CardSong = Song & { note?: string };

function SongCard({ song }: { song: CardSong }) {
    const player = useTrackPlayer(song.tracks);
    const [view, setView] = useState<Kind | null>(null);
    const [page, setPage] = useState(0);
    const [full, setFull] = useState(false);

    const sheet = song.imageFiles.map((f) => SHEET_DIR + f);
    const lyric = song.lyricSlideImages;
    const images = view === "sheet" ? sheet : view === "lyric" ? lyric : [];

    const open = (k: Kind) => {
        if (view === k) {
            setView(null);
            setFull(false);
        } else {
            setView(k);
            setPage(0);
        }
    };

    const tab = (active: boolean) =>
        "flex-1 basis-48 rounded-lg border px-4 py-3 text-left text-[0.95rem] transition " +
        "disabled:opacity-40 " +
        (active
            ? "border-[var(--ink)] bg-[#f6f8f9]"
            : "border-[var(--rule)] bg-white hover:border-[var(--ink)] hover:bg-[#f6f8f9]");

    return (
        <div className="card mb-5">
            <h2 className="text-xl">{song.title}</h2>
            {song.note ? (
                <p className="mb-4 mt-1 text-[0.9rem] text-[var(--muted)]">{song.note}</p>
            ) : (
                <div className="mb-4" />
            )}

            <PartPlayer player={player} />

            <div className="mt-4 flex flex-wrap gap-2.5">
                <button
                    className={tab(view === "sheet")}
                    disabled={sheet.length === 0}
                    onClick={() => open("sheet")}
                >
                    Sheet music{" "}
                    <span className="text-[var(--muted)]">
                        {sheet.length ? `(${sheet.length} pages)` : "(none posted)"}
                    </span>
                </button>
                <button
                    className={tab(view === "lyric")}
                    disabled={lyric.length === 0}
                    onClick={() => open("lyric")}
                >
                    Lyric slides{" "}
                    <span className="text-[var(--muted)]">
                        {lyric.length ? `(${lyric.length} slides)` : "(none posted)"}
                    </span>
                </button>
            </div>

            {view && (
                <MusicPanel
                    title={song.title}
                    images={images}
                    page={page}
                    setPage={setPage}
                    full={full}
                    setFull={setFull}
                    player={player}
                    onClose={() => setView(null)}
                />
            )}
        </div>
    );
}

export default function SongList({ songs }: { songs: CardSong[] }) {
    return (
        <>
            {songs.map((s) => (
                <SongCard key={s.title} song={s} />
            ))}
        </>
    );
}
