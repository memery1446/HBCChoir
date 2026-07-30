"use client";

import { useState } from "react";

const EMAIL = "memery1446@gmail.com";

export default function Solos() {
    const [name, setName] = useState("");
    const [contact, setContact] = useState("");
    const [offering, setOffering] = useState("");
    const [notes, setNotes] = useState("");

    const ready = name.trim() !== "" && offering.trim() !== "";

    const send = () => {
        const body = [
            `Name: ${name}`,
            `Best way to reach me: ${contact}`,
            "",
            "What I'd like to offer:",
            offering,
            "",
            notes.trim() ? `Anything else:\n${notes}` : "",
        ]
            .join("\n")
            .trim();

        window.location.href =
            `mailto:${EMAIL}` +
            `?subject=${encodeURIComponent("Special Music Offering")}` +
            `&body=${encodeURIComponent(body)}`;
    };

    const field =
        "mt-1.5 w-full rounded-lg border border-[var(--rule)] bg-white px-3 py-2.5 " +
        "text-[1rem] outline-none focus:border-[var(--tenor)]";

    return (
        <>
            <header className="py-10 text-center text-white">
                <p className="eyebrow !text-white/80">Special music</p>
                <h1
                    className="mt-3 text-3xl sm:text-4xl"
                    style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}
                >
                    Solos &amp; Special Music
                </h1>
            </header>

            <div className="card">
                <p>
                    If you feel led to offer a solo or special music, fill out the form below
                    and Mark will schedule with you.
                </p>
                <p className="mt-3 italic text-[var(--muted)]">
                    Thank you for offering your talents to the glory of God!
                </p>

                <div className="mt-7 space-y-5">
                    <label className="block">
                        <span className="eyebrow">Your name</span>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={field}
                            autoComplete="name"
                        />
                    </label>

                    <label className="block">
                        <span className="eyebrow">Best way to reach you</span>
                        <input
                            value={contact}
                            onChange={(e) => setContact(e.target.value)}
                            placeholder="Phone or email"
                            className={field}
                        />
                    </label>

                    <label className="block">
                        <span className="eyebrow">What you&rsquo;d like to offer</span>
                        <textarea
                            value={offering}
                            onChange={(e) => setOffering(e.target.value)}
                            rows={3}
                            placeholder="Song title, and whether you'd sing or play"
                            className={field}
                        />
                    </label>

                    <label className="block">
                        <span className="eyebrow">Anything else</span>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            placeholder="Accompaniment needs, or anything Mark should know"
                            className={field}
                        />
                    </label>

                    <button
                        onClick={send}
                        disabled={!ready}
                        className="w-full rounded-lg px-6 py-3.5 text-[1rem] text-white transition disabled:opacity-40"
                        style={{ background: "var(--ink)" }}
                    >
                        Send to Mark
                    </button>

                    <p className="text-[0.85rem] text-[var(--muted)]">
                        This opens your email app with the message ready. You&rsquo;ll still need
                        to press send. Or write directly to{" "}
                        <a href={`mailto:${EMAIL}`} className="text-[var(--tenor)]">
                            {EMAIL}
                        </a>
                        .
                    </p>
                </div>
            </div>
        </>
    );
}
