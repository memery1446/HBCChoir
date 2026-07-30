"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Track } from "./types";
import { claim, release } from "./nowPlaying";

export interface Player {
    tracks: Track[];
    index: number;
    track: Track | undefined;
    playing: boolean;
    time: number;
    duration: number;
    volume: number;
    muted: boolean;
    switchTo: (i: number) => void;
    toggle: () => void;
    skip: (s: number) => void;
    seek: (fraction: number) => void;
    changeVolume: (v: number) => void;
    toggleMute: () => void;
}

export function useTrackPlayer(tracks: Track[]): Player {
    const audios = useRef<HTMLAudioElement[]>([]);
    const [index, setIndex] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [time, setTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [muted, setMuted] = useState(false);

    /* Stable across renders, so the one-song-at-a-time registry can compare
       identities. Pauses every part of this song, whichever is active. */
    const pauseSelf = useRef(() => {
        audios.current.forEach((a) => a.pause());
    }).current;

    // Give up the claim when the card unmounts, not on every volume change.
    useEffect(() => () => release(pauseSelf), [pauseSelf]);

    // One element per part. Only the active one preloads fully, so a
    // five-part song does not pull 30MB on a phone.
    useEffect(() => {
        audios.current = tracks.map((t, i) => {
            const a = new Audio(t.src);
            a.preload = i === 0 ? "auto" : "metadata";
            return a;
        });
        setIndex(0);
        setPlaying(false);
        setTime(0);
        setDuration(0);
        return () => {
            audios.current.forEach((a) => {
                a.pause();
                a.removeAttribute("src");
            });
            audios.current = [];
        };
    }, [tracks]);

    useEffect(() => {
        const a = audios.current[index];
        if (!a) return;

        a.volume = volume;
        a.muted = muted;

        const onTime = () => setTime(a.currentTime);
        const onMeta = () => setDuration(a.duration);
        const onPlay = () => {
            claim(pauseSelf);
            setPlaying(true);
        };
        const onPause = () => {
            release(pauseSelf);
            setPlaying(false);
        };
        const onEnded = () => {
            release(pauseSelf);
            setPlaying(false);
            setTime(0);
        };

        a.addEventListener("timeupdate", onTime);
        a.addEventListener("loadedmetadata", onMeta);
        a.addEventListener("play", onPlay);
        a.addEventListener("pause", onPause);
        a.addEventListener("ended", onEnded);

        if (Number.isFinite(a.duration)) setDuration(a.duration);

        return () => {
            a.removeEventListener("timeupdate", onTime);
            a.removeEventListener("loadedmetadata", onMeta);
            a.removeEventListener("play", onPlay);
            a.removeEventListener("pause", onPause);
            a.removeEventListener("ended", onEnded);
        };
    }, [index, volume, muted, pauseSelf]);

    // The signature move: keep the playhead when the voice changes.
    const switchTo = useCallback(
        (next: number) => {
            const from = audios.current[index];
            const to = audios.current[next];
            if (!from || !to || next === index) return;

            const at = from.currentTime;
            const wasPlaying = !from.paused;
            from.pause();
            to.preload = "auto";

            const resume = () => {
                try {
                    to.currentTime = at;
                } catch {
                    /* metadata not ready */
                }
                if (wasPlaying) {
                    claim(pauseSelf);
                    void to.play().catch(() => {});
                }
            };

            if (to.readyState >= 1) resume();
            else to.addEventListener("loadedmetadata", resume, { once: true });

            setIndex(next);
            setTime(at);
        },
        [index, pauseSelf]
    );

    const toggle = useCallback(() => {
        const a = audios.current[index];
        if (!a) return;
        if (a.paused) {
            claim(pauseSelf);
            void a.play().catch(() => {});
        } else {
            a.pause();
        }
    }, [index, pauseSelf]);

    const skip = useCallback(
        (s: number) => {
            const a = audios.current[index];
            if (!a || !Number.isFinite(a.duration)) return;
            a.currentTime = Math.max(0, Math.min(a.currentTime + s, a.duration));
        },
        [index]
    );

    const seek = useCallback(
        (fraction: number) => {
            const a = audios.current[index];
            if (!a || !Number.isFinite(a.duration)) return;
            a.currentTime = Math.max(0, Math.min(1, fraction)) * a.duration;
        },
        [index]
    );

    const changeVolume = useCallback((v: number) => {
        setVolume(v);
        setMuted(v === 0);
    }, []);

    const toggleMute = useCallback(() => setMuted((m) => !m), []);

    return {
        tracks,
        index,
        track: tracks[index],
        playing,
        time,
        duration,
        volume,
        muted,
        switchTo,
        toggle,
        skip,
        seek,
        changeVolume,
        toggleMute,
    };
}

export function fmt(s: number): string {
    if (!Number.isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
}
