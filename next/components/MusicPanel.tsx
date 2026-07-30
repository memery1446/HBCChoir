"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Player } from "@/lib/useTrackPlayer";
import PartPlayer from "./PartPlayer";

export type Kind = "sheet" | "lyric";

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 5;
const NUDGE = 1.25;      // one button press
const SWIPE_MIN = 45;
const SWIPE_RATIO = 1.4;
const ZOOM_VIEW = "72vh"; // scroll window once zoomed past the default
const WIDE = 900;         // px viewport width treated as desktop
const FIT_HEIGHT = 0.78;  // share of viewport height a fitted page fills

export default function MusicPanel({
                                       title,
                                       images,
                                       page,
                                       setPage,
                                       full,
                                       setFull,
                                       player,
                                       onClose,
                                   }: {
    title: string;
    images: string[];
    page: number;
    setPage: (n: number) => void;
    full: boolean;
    setFull: (b: boolean) => void;
    player: Player;
    onClose: () => void;
}) {
    const [base, setBase] = useState(1); // fit-to-screen scale, 1 on phones
    const [zoom, setZoom] = useState(1);
    const [drag, setDrag] = useState(0);
    const [grabbing, setGrabbing] = useState(false);

    const scroller = useRef<HTMLDivElement>(null);
    const zoomRef = useRef(1);
    const baseRef = useRef(1);
    const prevZoom = useRef(1);

    zoomRef.current = zoom;
    baseRef.current = base;

    const clamp = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

    /* Fit the page to the viewport on wide screens. A portrait score at full
       container width is roughly 2000px tall on a desktop monitor, which is
       unusable, so the default scale comes from the image's real aspect. */
    const fitToScreen = useCallback((img: HTMLImageElement) => {
        const el = scroller.current;
        if (!el || !img.naturalWidth || !img.naturalHeight) return;

        if (window.innerWidth < WIDE) {
            setBase(1);
            setZoom(1);
            return;
        }
        const aspect = img.naturalWidth / img.naturalHeight;
        const availW = el.clientWidth;
        const availH = window.innerHeight * FIT_HEIGHT;
        const fit = clamp(Math.min(1, (availH * aspect) / availW));
        setBase(fit);
        setZoom(fit);
        prevZoom.current = fit;
    }, []);

    const step = useCallback(
        (d: number) => {
            setPage((page + d + images.length) % images.length);
            setZoom(baseRef.current);
            setDrag(0);
        },
        [page, images.length, setPage]
    );

    const nudge = useCallback(
        (dir: 1 | -1) => setZoom((z) => clamp(dir === 1 ? z * NUDGE : z / NUDGE)),
        []
    );

    const reset = useCallback(() => setZoom(baseRef.current), []);

    /* Keep the middle of the view fixed across a zoom change. */
    useEffect(() => {
        const el = scroller.current;
        if (!el) return;
        const ratio = zoom / prevZoom.current;
        prevZoom.current = zoom;
        if (!Number.isFinite(ratio) || ratio === 1) return;

        requestAnimationFrame(() => {
            el.scrollLeft =
                (el.scrollLeft + el.clientWidth / 2) * ratio - el.clientWidth / 2;
            el.scrollTop =
                (el.scrollTop + el.clientHeight / 2) * ratio - el.clientHeight / 2;
        });
    }, [zoom]);

    /* Native, non-passive listeners so preventDefault works. */
    useEffect(() => {
        const el = scroller.current;
        if (!el) return;

        let pinch: { dist: number; zoom: number } | null = null;
        let pan: { x: number; y: number; sl: number; st: number } | null = null;
        let swipe: { x: number; y: number } | null = null;

        const spread = (t: TouchList) =>
            Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

        const onStart = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                pinch = { dist: spread(e.touches), zoom: zoomRef.current };
                pan = null;
                swipe = null;
                return;
            }
            if (e.touches.length !== 1) return;
            const t = e.touches[0];
            if (zoomRef.current > baseRef.current) {
                pan = { x: t.clientX, y: t.clientY, sl: el.scrollLeft, st: el.scrollTop };
            } else {
                swipe = { x: t.clientX, y: t.clientY };
            }
        };

        const onMove = (e: TouchEvent) => {
            if (pinch && e.touches.length === 2) {
                e.preventDefault();
                const r = spread(e.touches) / pinch.dist;
                setZoom(clamp(pinch.zoom * r));
                return;
            }
            if (pan && e.touches.length === 1) {
                e.preventDefault();
                el.scrollLeft = pan.sl - (e.touches[0].clientX - pan.x);
                el.scrollTop = pan.st - (e.touches[0].clientY - pan.y);
                return;
            }
            if (swipe && e.touches.length === 1) {
                const dx = e.touches[0].clientX - swipe.x;
                const dy = e.touches[0].clientY - swipe.y;
                if (Math.abs(dx) > Math.abs(dy) * SWIPE_RATIO) {
                    e.preventDefault();
                    setDrag(dx);
                }
            }
        };

        const onEnd = (e: TouchEvent) => {
            const wasSwipe = swipe;
            pinch = null;
            pan = null;
            swipe = null;
            setDrag(0);
            if (!wasSwipe || e.changedTouches.length === 0) return;
            const dx = e.changedTouches[0].clientX - wasSwipe.x;
            const dy = e.changedTouches[0].clientY - wasSwipe.y;
            if (Math.abs(dx) < SWIPE_MIN) return;
            if (Math.abs(dx) < Math.abs(dy) * SWIPE_RATIO) return;
            step(dx < 0 ? 1 : -1);
        };

        el.addEventListener("touchstart", onStart, { passive: false });
        el.addEventListener("touchmove", onMove, { passive: false });
        el.addEventListener("touchend", onEnd);
        el.addEventListener("touchcancel", onEnd);
        return () => {
            el.removeEventListener("touchstart", onStart);
            el.removeEventListener("touchmove", onMove);
            el.removeEventListener("touchend", onEnd);
            el.removeEventListener("touchcancel", onEnd);
        };
    }, [step]);

    /* Desktop: grab to pan when zoomed past the default. */
    const onMouseDown = (e: React.MouseEvent) => {
        const el = scroller.current;
        if (!el || zoom <= base) return;
        e.preventDefault();
        setGrabbing(true);
        const sx = e.clientX;
        const sy = e.clientY;
        const sl = el.scrollLeft;
        const st = el.scrollTop;

        const move = (m: MouseEvent) => {
            el.scrollLeft = sl - (m.clientX - sx);
            el.scrollTop = st - (m.clientY - sy);
        };
        const up = () => {
            setGrabbing(false);
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", up);
        };
        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", up);
    };

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") step(1);
            if (e.key === "ArrowLeft") step(-1);
            if (e.key === "+" || e.key === "=") nudge(1);
            if (e.key === "-" || e.key === "_") nudge(-1);
            if (e.key === "0") reset();
            if (e.key === "Escape") {
                if (zoomRef.current !== baseRef.current) reset();
                else if (full) setFull(false);
                else onClose();
            }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [step, nudge, reset, full, setFull, onClose]);

    useEffect(() => {
        document.body.style.overflow = full ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [full]);

    useEffect(() => {
        [page + 1, page - 1].forEach((n) => {
            if (images[n]) {
                const img = new Image();
                img.src = images[n];
            }
        });
    }, [page, images]);

    const zoomed = zoom > base * 1.001;

    const stage = (
        <div
            ref={scroller}
            onMouseDown={onMouseDown}
            style={{
                touchAction: zoomed ? "none" : "pan-y",
                cursor: !zoomed ? undefined : grabbing ? "grabbing" : "grab",
                height: full ? undefined : zoomed ? ZOOM_VIEW : undefined,
            }}
            className={
                (full ? "h-full w-full " : "w-full ") + "score relative overflow-auto"
            }
        >
            <div
                style={{
                    width: `${zoom * 100}%`,
                    margin: zoom < 1 ? "0 auto" : undefined,
                    transform: drag ? `translateX(${drag * 0.35}px)` : undefined,
                    transition: drag ? "none" : "transform 0.18s ease-out",
                }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={images[page]}
                    alt={`${title}, page ${page + 1}`}
                    onLoad={(e) => fitToScreen(e.currentTarget)}
                    onDoubleClick={() => (zoomed ? reset() : nudge(1))}
                    draggable={false}
                    className={
                        "block w-full rounded bg-white " +
                        (full ? "" : "border border-[var(--rule)]")
                    }
                />
            </div>
        </div>
    );

    const btn =
        "rounded border border-[var(--rule)] px-4 py-2 text-[0.85rem] disabled:opacity-40";

    const nav = (
        <div className="flex flex-wrap items-center justify-center gap-2.5 py-2">
            <button onClick={() => step(-1)} className={btn}>
                ◀ Prev
            </button>
            <span className="text-[0.85rem] tabular-nums text-[var(--muted)]">
        {page + 1} / {images.length}
      </span>
            <button onClick={() => step(1)} className={btn}>
                Next ▶
            </button>

            <span className="mx-1 flex items-center gap-1.5">
        <button
            onClick={() => nudge(-1)}
            disabled={zoom <= MIN_ZOOM}
            aria-label="Zoom out"
            className={btn}
        >
          −
        </button>
        <button
            onClick={reset}
            aria-label="Reset zoom"
            className="min-w-[4.5rem] rounded border border-[var(--rule)] px-2 py-2 text-[0.85rem] tabular-nums"
        >
          {Math.round((zoom / base) * 100)}%
        </button>
        <button
            onClick={() => nudge(1)}
            disabled={zoom >= MAX_ZOOM}
            aria-label="Zoom in"
            className={btn}
        >
          +
        </button>
      </span>

            <button
                onClick={() => {
                    setFull(!full);
                    setZoom(base);
                }}
                className={btn}
            >
                {full ? "Exit full screen" : "Full screen"}
            </button>
        </div>
    );

    if (!full) {
        return (
            <div className="mt-3">
                <div className="relative left-1/2 w-[96vw] max-w-[1600px] -translate-x-1/2">
                    {stage}
                    <div className="mt-2 rounded-xl border border-[var(--rule)] bg-white/95">
                        {nav}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[900] flex flex-col bg-[rgba(15,20,25,0.95)] p-3">
            <div className="mb-2 shrink-0 rounded-xl bg-white p-3">
                <div className="mb-2 flex items-baseline justify-between">
                    <h3 className="text-[1.05rem]">{title}</h3>
                    <button
                        onClick={() => setFull(false)}
                        aria-label="Exit full screen"
                        className="text-[0.85rem] text-[var(--muted)]"
                    >
                        ✕ Close
                    </button>
                </div>
                <PartPlayer player={player} sticky={false} />
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex min-h-0 flex-1">{stage}</div>
                <div className="shrink-0 [&_button]:border-white/30 [&_button]:text-white [&_span]:text-white/70">
                    {nav}
                </div>
            </div>
        </div>
    );
}
