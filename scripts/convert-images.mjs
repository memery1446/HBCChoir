#!/usr/bin/env node
/**
 * convert-images.mjs
 *
 * Replaces convert-pdfs.js and convert-lyric-pdfs.js, which were the same
 * script twice. Same ImageMagick settings you were already using.
 *
 *   node scripts/convert-images.mjs sheet         sheet-music/       -> sheet-music-images/
 *   node scripts/convert-images.mjs lyric         lyric-slides-pdfs/ -> lyric-slide-images/
 *   node scripts/convert-images.mjs both
 *   node scripts/convert-images.mjs both --dry    show the plan, convert nothing
 *
 * Two changes from the originals:
 *
 *  1. Output is named for the convention: <slug>.<kind>.NN.png, one-based
 *     and zero-padded. No more "-0.png", no more service-position prefix,
 *     no more "Copy of ". Nothing to rename afterwards.
 *
 *  2. Existing images for a slug are deleted before writing. If a song had
 *     15 slides last week and 12 this week, slides 13 to 15 no longer
 *     linger and end up on the projector.
 */

import { execFileSync } from 'node:child_process';
import { readdirSync, existsSync, mkdirSync, mkdtempSync, rmSync, renameSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const JOBS = {
    sheet: { in: 'sheet-music',       out: 'sheet-music-images' },
    lyric: { in: 'lyric-slides-pdfs', out: 'lyric-slide-images' }
};

/* Your existing settings, unchanged. */
const MAGICK_ARGS = [
    '-density', '400',
    '-colorspace', 'sRGB',
    '-background', 'white',
    '-alpha', 'remove',
    '-normalize',
    '-sharpen', '0x0.5',
    '-quality', '98'
];

const argv = process.argv.slice(2);
const DRY  = argv.includes('--dry');
const which = argv.find(a => !a.startsWith('--')) || 'both';
const kinds = which === 'both' ? ['sheet', 'lyric'] : [which];

if (kinds.some(k => !JOBS[k])) {
    console.error('usage: convert-images.mjs [sheet|lyric|both] [--dry]');
    process.exit(1);
}

function slugify(name) {
    return name
        .replace(/^Copy of /i, '')
        .replace(/^\d+[.\-_ ]+/, '')     // strip the weekly service-position prefix
        .replace(/['’]/g, '')
        .replace(/[.\s_]+/g, '-')
        .replace(/[^a-zA-Z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase();
}

function requireTool(cmd, args, hint) {
    try { execFileSync(cmd, args, { stdio: 'pipe' }); }
    catch { console.error(`${cmd} not found. Install with: ${hint}`); process.exit(1); }
}

if (!DRY) {
    requireTool('magick', ['-version'], 'brew install imagemagick');
    requireTool('gs', ['--version'], 'brew install ghostscript');
}

let totalPages = 0, totalBytes = 0;

for (const kind of kinds) {
    const { in: inDir, out: outDir } = JOBS[kind];

    if (!existsSync(inDir)) { console.log(`\n  ${inDir}/ not found, skipping ${kind}\n`); continue; }
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

    const pdfs = readdirSync(inDir).filter(f => f.toLowerCase().endsWith('.pdf'));
    console.log(`\n  ${kind}: ${pdfs.length} PDF${pdfs.length === 1 ? '' : 's'} in ${inDir}/\n`);

    for (const pdf of pdfs) {
        const slug = slugify(path.basename(pdf, path.extname(pdf)));
        if (!slug) { console.log(`  ! could not derive a slug from ${pdf}, skipping`); continue; }

        /* Clear previous output for this slug so stale pages cannot survive. */
        const stale = readdirSync(outDir).filter(f => f.startsWith(`${slug}.${kind}.`));

        if (DRY) {
            console.log(`  ${pdf}\n    -> ${slug}.${kind}.NN.png` +
                (stale.length ? `   (would first remove ${stale.length} existing)` : ''));
            continue;
        }

        stale.forEach(f => rmSync(path.join(outDir, f)));

        const tmp = mkdtempSync(path.join(tmpdir(), 'hbc-'));
        try {
            execFileSync('magick', [
                '-density', '400',
                path.join(inDir, pdf),
                ...MAGICK_ARGS.slice(2),
                path.join(tmp, 'page-%04d.png')
            ], { stdio: 'pipe' });

            const pages = readdirSync(tmp)
                .filter(f => f.endsWith('.png'))
                .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

            pages.forEach((p, i) => {
                const target = path.join(outDir, `${slug}.${kind}.${String(i + 1).padStart(2, '0')}.png`);
                renameSync(path.join(tmp, p), target);
                totalBytes += statSync(target).size;
            });

            totalPages += pages.length;
            console.log(`  ${pdf}\n    -> ${slug}.${kind}.01..${String(pages.length).padStart(2, '0')}.png` +
                (stale.length ? `   (replaced ${stale.length})` : ''));

        } catch (err) {
            console.error(`  ! failed on ${pdf}: ${err.message.split('\n')[0]}`);
        } finally {
            rmSync(tmp, { recursive: true, force: true });
        }
    }
}

if (DRY) console.log('\n  Dry run. Nothing converted.\n');
else console.log(`\n  ${totalPages} pages, ${(totalBytes / 1048576).toFixed(1)}MB\n`);

