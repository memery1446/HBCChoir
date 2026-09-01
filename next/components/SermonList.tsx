"use client";

import { useState } from "react";

export interface Sermon {
    id: string;
    title: string;
    date?: string;
    scripture?: string;
    note?: string;
}

function SermonCard({
                        sermon,
                        open,
                        onOpen,
                        onClose,
                    }: {
    sermon: Sermon;
    open: boolean;
    onOpen: () => void;
    onClose: () => void;
}) {
    return (
        <div className="card mb-5">
            <h2 className="text-xl">{sermon.title}</h2>

            {(sermon.date || sermon.scripture) && (
                <p className="mt-1 text-[0.9rem] text-[var(--muted)]">
                    {[sermon.date, sermon.scripture].filter(Boolean).join(" · ")}
                </p>
            )}

            {sermon.note && <p className="mt-3 text-[0.96rem]">{sermon.note}</p>}

            {open ? (
                <div className="mt-4">
                    <div
                        className="relative w-full overflow-hidden rounded-lg bg-black"
                        style={{ paddingTop: "56.25%" }}
                    >
                        <iframe
                            className="absolute inset-0 h-full w-full"
                            src={`https://www.youtube-nocookie.com/embed/${sermon.id}?autoplay=1&rel=0`}
                            title={sermon.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                    <button
                        onClick={onClose}
                        className="mt-3 rounded border border-[var(--rule)] px-4 py-2 text-[0.85rem]"
                    >
                        ✕ Close
                    </button>
                </div>
            ) : (
                <button
                    onClick={onOpen}
                    className="mt-4 w-full rounded-lg px-6 py-3.5 text-[1rem] text-white transition"
                    style={{ background: "var(--ink)" }}
                >
                    ▶ Watch
                </button>
            )}
        </div>
    );
}

export default function SermonList({ sermons }: { sermons: Sermon[] }) {
    /* Which sermon is playing. Held here so opening one unmounts any other,
       which stops its audio outright rather than leaving two going. */
    const [playing, setPlaying] = useState<string | null>(null);

    return (
        <>
            {sermons.map((s) => (
                <SermonCard
                    key={s.id}
                    sermon={s}
                    open={playing === s.id}
                    onOpen={() => setPlaying(s.id)}
                    onClose={() => setPlaying(null)}
                />
            ))}
        </>
    );
}
