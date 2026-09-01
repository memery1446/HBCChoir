import fs from "node:fs";
import path from "node:path";
import SermonList, { type Sermon } from "@/components/SermonList";

export const metadata = {
    title: "Spoken Word | Music at Harmony",
    description: "Sermons by Mark Emery, Harmony Baptist Church.",
};

interface File {
    intro: string;
    sermons: Sermon[];
}

export default function SpokenWord() {
    const data = JSON.parse(
        fs.readFileSync(
            path.join(process.cwd(), "public/content/spoken-word.json"),
            "utf8"
        )
    ) as File;

    return (
        <>
            <header className="py-10 text-center text-white">
                <p className="eyebrow !text-white/80">Sermons by Mark Emery</p>
                <h1
                    className="mt-3 text-3xl leading-tight sm:text-4xl"
                    style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}
                >
                    Spoken Word
                </h1>
                <p className="mx-auto mt-4 max-w-[34em] text-white/90">{data.intro}</p>
            </header>

            <SermonList sermons={data.sermons} />
        </>
    );
}
