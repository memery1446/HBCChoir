"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
    { href: "/", label: "Home" },
    { href: "/sunday", label: "This Sunday's Music" },
    { href: "/solos", label: "Solos / Special Music" },
    { href: "/series", label: "Nehemiah Series" },
    { href: "/demo", label: "Site Demo" },
];

export default function Nav() {
    const path = usePathname();

    return (
        <nav className="flex flex-wrap justify-center gap-2 p-5">
            {LINKS.filter((l) => l.href !== path).map(({ href, label }) => (
                <Link
                    key={href}
                    href={href}
                    className="rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-[0.92rem] text-white no-underline transition hover:bg-white/30"
                >
                    {label}
                </Link>
            ))}
        </nav>
    );
}
