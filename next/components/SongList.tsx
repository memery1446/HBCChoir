"use client";

import { useState } from "react";
import type { Song } from "@/lib/types";
import { useTrackPlayer } from "@/lib/useTrackPlayer";
import PartPlayer from "./PartPlayer";
import MusicPanel, { type Kind } from "./MusicPanel";

const SHEET_DIR = "/sheet-music-images/";

/** The demo and homecoming pages add a one-line note under the title. */
type CardSong = Song & { note?: string };

function SongCard({
                      song,
                      view,
                      onOpen,
                      onClose,
                      onTouch,
                  }: {
    song: CardSong;
    view: Kind | null;
    onOpen: (k: Kind) => void;
    onClose: () => void;
    onTouch: () => void;
}) {
    const player = useTrackPlayer(song.tracks);
    const [page, setPage] = useState(0);
    const [full, setFull] = useState(false);

    const sheet = song.imageFiles.map((f) => SHEET_DIR + f);
    const lyric = song.lyricSlideImages;
    const images = view === "sheet" ? sheet : view === "lyric" ? lyric : [];

    const toggle = (k: Kind) => {
        if (view === k) {
            setFull(false);
            onClose();
        } else {
            setPage(0);
            onOpen(k);
        }
    };

    const tab = (active: boolean) =>
        "flex-1 basis-48 rounded-lg border px-4 py-3 text-left text-[0.95rem] transition " +
        "disabled:opacity-40 " +
        (active
            ? "border-[var(--ink)] bg-[var(--rule)]/40"
            : "border-[var(--rule)] bg-white hover:border-[var(--ink)] hover:bg-[#f6f8f9]");

    return (
        /* Touching this card at all closes whatever another card had open,
           so a score never sits under a song you are no longer on. */
        <div className="card mb-5" onPointerDown={onTouch}>
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
                    onClick={() => toggle("sheet")}
                >
                    Sheet music{" "}
                    <span className="text-[var(--muted)]">
                        {sheet.length ? `(${sheet.length} pages)` : "(none posted)"}
                    </span>
                </button>
                <button
                    className={tab(view === "lyric")}
                    disabled={lyric.length === 0}
                    onClick={() => toggle("lyric")}
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
                    onClose={() => {
                        setFull(false);
                        onClose();
                    }}
                />
            )}
        </div>
    );
}

export default function SongList({ songs }: { songs: CardSong[] }) {
    /* Which card has a panel open, and which kind. Held here so only one
       panel exists on the page at a time. */
    const [open, setOpen] = useState<{ song: string; kind: Kind } | null>(null);

    return (
        <>
            {songs.map((s) => (
                <SongCard
                    key={s.title}
                    song={s}
                    view={open?.song === s.title ? open.kind : null}
                    onOpen={(kind) => setOpen({ song: s.title, kind })}
                    onClose={() => setOpen(null)}
                    onTouch={() => {
                        // Interacting with a different song closes the open panel.
                        setOpen((o) => (o && o.song !== s.title ? null : o));
                    }}
                />
            ))}
        </>
    );
}
