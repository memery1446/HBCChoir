"use client";

import { useState } from "react";
import type { Song } from "@/lib/types";
import { useTrackPlayer } from "@/lib/useTrackPlayer";
import PartPlayer from "./PartPlayer";
import MusicPanel, { type Kind } from "./MusicPanel";

const SHEET_DIR = "/sheet-music-images/";

/** The demo page adds a one-line note under the title. */
type CardSong = Song & { note?: string };

function SongCard({
                      song,
                      view,
                      onOpen,
                      onClose,
                      onTouch,
                      videoOpen,
                      onVideo,
                  }: {
    song: CardSong;
    view: Kind | null;
    onOpen: (k: Kind) => void;
    onClose: () => void;
    onTouch: () => void;
    videoOpen: boolean;
    onVideo: (on: boolean) => void;
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
            ? "border-[var(--ink)] bg-[#f6f8f9]"
            : "border-[var(--rule)] bg-white hover:border-[var(--ink)] hover:bg-[#f6f8f9]");

    return (
        <div className="card mb-5" onPointerDown={onTouch}>
            <h2 className="text-xl">{song.title}</h2>
            {song.note ? (
                <p className="mb-4 mt-1 text-[0.9rem] text-[var(--muted)]">{song.note}</p>
            ) : (
                <div className="mb-4" />
            )}

            {/* A video song carries its own lyrics on screen, so the player
                leads and the sheet music sits underneath as an option. */}
            {song.video ? (
                videoOpen ? (
                    <div>
                        <div
                            className="relative w-full overflow-hidden rounded-lg bg-black"
                            style={{ paddingTop: "56.25%" }}
                        >
                            <iframe
                                className="absolute inset-0 h-full w-full"
                                src={`https://www.youtube-nocookie.com/embed/${song.video}?autoplay=1&rel=0`}
                                title={song.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                        <button
                            onClick={() => onVideo(false)}
                            className="mt-3 rounded border border-[var(--rule)] px-4 py-2 text-[0.85rem]"
                        >
                            ✕ Close video
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => onVideo(true)}
                        className="w-full rounded-lg px-6 py-3.5 text-[1rem] text-white transition"
                        style={{ background: "var(--ink)" }}
                    >
                        ▶ Watch with lyrics
                    </button>
                )
            ) : (
                <PartPlayer player={player} />
            )}

            {(sheet.length > 0 || lyric.length > 0) && (
                <div className="mt-4 flex flex-wrap gap-2.5">
                    {sheet.length > 0 && (
                        <button className={tab(view === "sheet")} onClick={() => toggle("sheet")}>
                            Sheet music{" "}
                            <span className="text-[var(--muted)]">({sheet.length} pages)</span>
                        </button>
                    )}
                    {lyric.length > 0 && (
                        <button className={tab(view === "lyric")} onClick={() => toggle("lyric")}>
                            Lyric slides{" "}
                            <span className="text-[var(--muted)]">({lyric.length} slides)</span>
                        </button>
                    )}
                </div>
            )}

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
    const [open, setOpen] = useState<{ song: string; kind: Kind } | null>(null);
    const [video, setVideo] = useState<string | null>(null);

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
                        setOpen((o) => (o && o.song !== s.title ? null : o));
                    }}
                    videoOpen={video === s.title}
                    onVideo={(on) => setVideo(on ? s.title : null)}
                />
            ))}
        </>
    );
}