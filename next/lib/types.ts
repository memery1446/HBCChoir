export type Group =
    | "soprano" | "harmony" | "harmony2"
    | "alto" | "tenor" | "bass" | "piano";

export interface Track {
    name: string;
    src: string;
    group: Group;
}

export interface Song {
    title: string;
    useImages: boolean;
    imageFiles: string[];
    lyricSlideImages: string[];
    tracks: Track[];
}

export interface Week {
    serviceDate: string;
    headerNotes: string[];
    order: string[];
    songs: Song[];
    allSongsPdf: string | null;
    interludeMp3: string | null;
}
