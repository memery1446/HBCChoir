import fs from "node:fs";
import path from "node:path";
import type { Week } from "@/lib/types";
import SongList from "@/components/SongList";

export const metadata = {
    title: "This Sunday's Music | Music at Harmony",
};

function loadWeek(): Week {
    const p = path.join(process.cwd(), "public/content/current.json");
    const week = JSON.parse(fs.readFileSync(p, "utf8")) as Week;
    const abs = (s: string) => (s.startsWith("/") ? s : "/" + s);
    week.songs.forEach((s) => {
        s.tracks.forEach((t) => (t.src = abs(t.src)));
        s.lyricSlideImages = s.lyricSlideImages.map(abs);
    });
    return week;
}

export default function Sunday() {
    const week = loadWeek();
    const [y, m, d] = week.serviceDate.split("-").map(Number);
    const when = new Date(y, m - 1, d).toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    return (
        <>
            <header className="py-10 text-center text-white">
                <p className="eyebrow !text-white/80">This Sunday</p>
                <h1 className="mt-3 text-3xl sm:text-4xl"
                    style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>
                    {when}
                </h1>
                {week.headerNotes.map((n) => (
                    <p key={n} className="mt-2 text-[0.95rem] italic text-white/90">{n}</p>
                ))}
            </header>

            <div className="card mb-6">
                <p className="eyebrow">Service order</p>
                <ol className="mt-3 list-decimal space-y-1 pl-6">
                    {week.order.map((t) => <li key={t}>{t}</li>)}
                </ol>
            </div>

            <SongList songs={week.songs} />
        </>
    );
}
