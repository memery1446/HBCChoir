"use client";

import { fmt, type Player } from "@/lib/useTrackPlayer";

export default function PartPlayer({
                                       player,
                                       sticky = true,
                                   }: {
    player: Player;
    sticky?: boolean;
}) {
    const {
        tracks, index, playing, time, duration, volume, muted,
        switchTo, toggle, skip, seek, changeVolume, toggleMute,
    } = player;

    const pct = duration ? (time / duration) * 100 : 0;
    const color = `var(--${tracks[index]?.group ?? "soprano"})`;

    return (
        <div
            className={
                sticky
                    ? "sticky top-2 z-10 rounded-xl bg-white/95 py-1 backdrop-blur"
                    : undefined
            }
        >
            {tracks.length > 1 && (
                <div className="mb-3 flex flex-wrap gap-2">
                    {tracks.map((t, i) => (
                        <button
                            key={t.src + i}
                            onClick={() => switchTo(i)}
                            aria-pressed={i === index}
                            className="flex-1 basis-32 rounded-lg px-3 py-3 text-[0.95rem] text-white transition"
                            style={{
                                background: `var(--${t.group})`,
                                opacity: i === index ? 1 : 0.5,
                                transform: i === index ? "translateY(-2px)" : undefined,
                            }}
                        >
                            {t.name}
                        </button>
                    ))}
                </div>
            )}

            <div className="flex items-center gap-2 rounded-xl border border-[var(--rule)] bg-[#f6f8f9] p-3 sm:gap-3">
                <button
                    onClick={() => skip(-10)}
                    aria-label="Back 10 seconds"
                    className="h-8 w-8 shrink-0 rounded-full bg-[#95a5a6] text-[0.7rem] text-white"
                >
                    10
                </button>

                <button
                    onClick={toggle}
                    aria-label={playing ? "Pause" : "Play"}
                    className="h-12 w-12 shrink-0 rounded-full text-white"
                    style={{ background: "var(--ink)" }}
                >
                    {playing ? "❙❙" : "▶"}
                </button>

                <button
                    onClick={() => skip(10)}
                    aria-label="Forward 10 seconds"
                    className="h-8 w-8 shrink-0 rounded-full bg-[#95a5a6] text-[0.7rem] text-white"
                >
                    10
                </button>

                <div
                    onClick={(e) => {
                        const r = e.currentTarget.getBoundingClientRect();
                        seek((e.clientX - r.left) / r.width);
                    }}
                    className="h-[7px] min-w-0 flex-1 cursor-pointer rounded bg-[#dde3e7]"
                >
                    <div
                        className="h-full rounded"
                        style={{ width: `${pct}%`, background: color }}
                    />
                </div>

                <div className="shrink-0 whitespace-nowrap text-[0.78rem] tabular-nums text-[var(--muted)] sm:text-[0.85rem]">
                    {fmt(time)} / {fmt(duration)}
                </div>

                <button
                    onClick={toggleMute}
                    aria-label={muted ? "Unmute" : "Mute"}
                    className="shrink-0 text-[var(--muted)]"
                >
                    {muted || volume === 0 ? "🔇" : "🔊"}
                </button>

                <input
                    type="range"
                    min={0}
                    max={100}
                    value={muted ? 0 : Math.round(volume * 100)}
                    onChange={(e) => changeVolume(Number(e.target.value) / 100)}
                    aria-label="Volume"
                    className="hidden w-16 shrink-0 sm:block"
                />
            </div>
        </div>
    );
}
