import fs from "node:fs";
import path from "node:path";
import type { Song, Group } from "./types";

/* Order here is button order, and the first entry is what plays by default.
   Full mix leads: press play and you hear the whole choir. The individual
   parts follow for someone learning their own line. */
const PARTS: { part: string; group: Group; name: string }[] = [
    { part: "all",      group: "all",      name: "FULL MIX" },
    { part: "melody",   group: "soprano",  name: "MELODY/SOPRANO" },
    { part: "harmony",  group: "harmony",  name: "HARMONY" },
    { part: "harmony2", group: "harmony2", name: "HARMONY 2" },
    { part: "alto",     group: "alto",     name: "ALTO" },
    { part: "tenor",    group: "tenor",    name: "TENOR" },
    { part: "bass",     group: "bass",     name: "BASS" },
    { part: "piano",    group: "piano",    name: "PIANO" },
    { part: "helper",   group: "helper",   name: "DRONE + METRONOME" },
];

const pub = (...p: string[]) => path.join(process.cwd(), "public", ...p);

const list = (dir: string): string[] => {
    try {
        return fs.readdirSync(pub(dir)).filter((f) => !f.startsWith("."));
    } catch {
        return [];
    }
};

const natural = (a: string, b: string) =>
    a.localeCompare(b, undefined, { numeric: true });

export function buildSong(slug: string, title: string): Song {
    const audio = list("audio");
    const sheet = list("sheet-music-images");
    const lyric = list("lyric-slide-images");

    const tracks = PARTS.flatMap(({ part, group, name }) => {
        const f = `${slug}.${part}.mp3`;
        return audio.includes(f) ? [{ name, src: `/audio/${f}`, group }] : [];
    });

    const imageFiles = sheet
        .filter((f) => f.startsWith(`${slug}.sheet.`))
        .sort(natural);

    const lyricSlideImages = lyric
        .filter((f) => f.startsWith(`${slug}.lyric.`))
        .sort(natural)
        .map((f) => `/lyric-slide-images/${f}`);

    return {
        title,
        useImages: imageFiles.length > 0,
        imageFiles,
        lyricSlideImages,
        tracks,
    };
}
