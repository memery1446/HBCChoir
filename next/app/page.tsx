import Link from "next/link";

const CARDS = [
  {
    href: "/sunday",
    eyebrow: "Every week",
    title: "This Sunday's Music",
    body: "Song order, sheet music, lyric slides, and a rehearsal track for every voice part.",
    primary: true,
    external: false,
  },
  {
    href: "/demo",
    eyebrow: "About this site",
    title: "Site Demo",
    body: "How to use this site to prepare any part",
    primary: false,
    external: false,
  },
  {
    href: "/series",
    eyebrow: "Series",
    title: "Arise and Build",
    body: "A Study Through Nehemiah",
    primary: false,
    external: false,
  },
  {
    href: "/spoken-word",
    eyebrow: "Digging Deeper Into God's Word",
    title: "Spoken Word",
    body: "NOTE: Not live Sunday sermons. These are preaching examples by Mark Emery, MDiv student at Southern Baptist Theological Seminary",
    primary: false,
    external: false,
  },
  {
    href: "/solos",
    eyebrow: "Special music",
    title: "Solos / Special Music",
    body: "Offer a solo or special music. Mark will schedule with you.",
    primary: false,
    external: false,
  },
];

export default function Home() {
  return (
      <>
        <header className="py-12 text-center text-white">
          <p className="eyebrow !text-white/80">
            Harmony Baptist Church &middot; Andalusia, Alabama
          </p>
          <h1
              className="mt-4 text-4xl leading-tight sm:text-5xl"
              style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}
          >
            Music at Harmony
          </h1>
        </header>

        <div className="grid gap-5">
          {CARDS.map((c) => {
            const cls =
                "card block no-underline transition hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(0,0,0,0.28)]";

            const inner = (
                <>
                  <p className="eyebrow">{c.eyebrow}</p>
                  <h2 className={c.primary ? "mt-2 text-2xl" : "mt-2 text-xl"}>
                    {c.title}
                  </h2>
                  <p className="mt-2 text-[0.96rem] text-[var(--muted)]">{c.body}</p>
                  <span className="mt-4 inline-block text-[0.9rem] text-[var(--tenor)]">
                Open &rarr;
              </span>
                </>
            );

            return c.external ? (
                <a key={c.href} href={c.href} className={cls}>
                  {inner}
                </a>
            ) : (
                <Link key={c.href} href={c.href} className={cls}>
                  {inner}
                </Link>
            );
          })}
        </div>
      </>
  );
}
