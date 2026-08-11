const SERIES = {
  title: "Arise and Build",
  blurb: "A study through Nehemiah by Mark A. Emery",
  parts: [
    {
      href: "/nehemiah-1",
      part: "Part 1",
      scripture: "Nehemiah 1–2:10",
      title: "A Burden That Will Not Be Silenced",
    },
    {
      href: "/nehemiah-2",
      part: "Part 2",
      scripture: "Nehemiah 2:11–3:32",
      title: "Before the First Stone Is Laid",
    },
    {
      href: "/nehemiah-3",
      part: "Part 3",
      scripture: "Nehemiah 4-5:19",
      title: "Trowel and Sword",
    },
  ],
};

export const metadata = {
  title: "Arise and Build | Music at Harmony",
  description: "A study through the book of Nehemiah.",
};

export default function Series() {
  return (
    <>
      <header className="py-12 text-center text-white">
        <p className="eyebrow !text-white/80">Essay series</p>
        <h1
          className="mt-4 text-4xl leading-tight"
          style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}
        >
          {SERIES.title}
        </h1>
        <p className="mx-auto mt-4 max-w-[32em] text-white/90">{SERIES.blurb}</p>
      </header>

      <div className="grid gap-4">
        {SERIES.parts.map((p) => (
          <a
            key={p.href}
            href={p.href}
            className="card flex items-center gap-5 no-underline transition hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(0,0,0,0.28)]"
          >
            <div className="flex-1">
              <p className="eyebrow">
                {p.part} &middot; {p.scripture}
              </p>
              <h2 className="mt-1.5 text-xl">{p.title}</h2>
            </div>
            <span className="text-2xl text-[var(--tenor)]">&rarr;</span>
          </a>
        ))}
      </div>
    </>
  );
}
